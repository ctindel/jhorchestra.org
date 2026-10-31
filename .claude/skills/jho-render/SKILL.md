---
name: jho-render
description: Render an HTML page (for example a JHO design-system template) to PNG and/or PDF with Playwright and Chromium. Waits for the DC runtime, x-import components, fonts and images before capture, and fails loudly if the artwork would be wrong.
---

# jho-render

Renders a page to PNG (optionally hi-res via `scale`) and/or a single-page PDF at an exact size.
Used by `jho-concert-poster`, usable directly for any HTML.

## Setup (one time)

Playwright is a dev dependency local to this skill, not the repo root.

```bash
cd "$(git rev-parse --show-toplevel)/.claude/skills/jho-render"
npm install                 # playwright 1.64.1 (listed in package.json)
npx playwright install chromium
```

Check the browser with `node -e "import('playwright').then(async m=>{const b=await m.chromium.launch();console.log(b.version());await b.close()})"`.
Run the tests with `node --test .claude/skills/jho-render/render.test.mjs` from the repo root.

## CLI

```bash
cd "$(git rev-parse --show-toplevel)"
node .claude/skills/jho-render/render.mjs \
  --html design-system/templates/concert-poster/ConcertPoster.dc.html \
  --root design-system \
  --preset poster-letter --selector .jho-sheet \
  --png /path/to/example.png --pdf /path/to/example.pdf
```

| Flag | Meaning |
| --- | --- |
| `--html <file>` | Page to render. Required. |
| `--root <dir>` | Directory served as site root (default: the HTML file's directory). Use `design-system` for templates so `../../assets/...` and `../../_ds_bundle.js` resolve. The file must be inside root. |
| `--preset` | `poster-letter` (8.5x11 in = 816x1056 CSS px, default PNG scale 3 = 2448x3168 / 288 dpi), `ig-square` (1080x1080, scale 1), `ig-story` (1080x1920, scale 1). |
| `--size WxH` | Custom size, e.g. `816x1056` or `8.5inx11in` (px, in, mm, cm). Scale defaults to 1. |
| `--scale N` | deviceScaleFactor for PNG. Overrides the preset default. |
| `--selector <css>` | Capture only this element (PNG). Use `.jho-sheet` for JHO posters so the desk background and shadow are excluded. |
| `--png <file>` / `--pdf <file>` | At least one is required. PDF must be exactly 1 page at the requested size. |
| `--timeout <ms>` | Default 60000. Whole-page settle limit. |
| `--no-dc` | Skip the design-system runtime wait (no `window.React` needed). For plain HTML such as the program booklet. |

Output: JSON to stdout with the PNG pixel size and the PDF page count and size. Exit code 1 with a message on any failure.

## Library

```js
import { renderPage, PRESETS, parseLength } from '/abs/path/.claude/skills/jho-render/render.mjs';

await renderPage({
  root: '/abs/path/design-system',
  pagePath: '/templates/concert-poster/ConcertPoster.dc.html', // path under root
  html: undefined,               // optional in-memory replacement for pagePath
  width: 816, height: 1056,      // output size in CSS px
  viewport: { width: 896, height: 1136 },
  scale: 3,
  selector: '.jho-sheet',
  png: '/abs/path/x.png', pdf: '/abs/path/x.pdf',
  assertions: async (page) => [], // return strings to fail the render
});
```

`html` lets a caller serve a filled copy of a template at its real URL, so relative assets still
resolve and nothing is written into `design-system/`.

`dc` (default `true`) controls the first readiness check. `--no-dc` on the CLI is the same as `dc: false`. Pass `dc: false` for plain HTML that does not
use the design-system runtime (no `window.React`), such as `jho-program-notes`. The other checks still
apply. Templates never need it.

## What "ready" means (the wait contract)

The page is served with `domcontentloaded`, then the render waits, polled every 100 ms, until all of these hold:

1. `document.readyState === 'complete'` (stylesheets, `@import` chains and font requests are done).
2. `window.__dcContentKeyed` is true and `window.React` exists (the DC runtime booted). Skipped with `dc: false`.
3. No `.sc-placeholder` / `.sc-placeholder-error` elements remain.
4. Every `<img>` and every CSS `background-image: url(...)` has an intrinsic size (`complete` and `naturalWidth > 0`).
   `loading="lazy"` images are switched to eager first, so offscreen images load.
5. `document.fonts.status === 'loaded'`.
6. The DOM has been quiet (no mutations) for 400 ms.

Each image or background has its own limit, `imageTimeoutMs` (default 10000). One still without a size after that
fails the render and names its URL. That covers a stalled response, a broken file, and a lazy image that never loads.

After that, the render fails loudly (no partial output) if:

- a request goes to a host outside the egress allowlist (see below),
- a page error is thrown,
- the DC runtime logs `x-import: FAILED`,
- an `<x-import>` mounted empty,
- a `FontFace` is in `error` state,
- `Playfair Display 900` or `Inter 600` is not loaded (the wordmark and body type), unless `requireFonts` is set,
- an `assertions` callback returns a problem (for example the IG overflow check),
- the PDF is not 1 page or not the requested size (pdfinfo, poppler).

Other console errors and failed requests are returned in `warnings`, not treated as fatal.
The result lists every host requested in `hosts`.

## Serving and egress (security rules)

- **Only files under `root` are served.** Paths with a dot-prefixed segment (`/.env`, `/.git/...`) get 404.
  A path that leaves `root` after `..` is resolved gets 404, and so does a symlink whose real target is outside
  `root` (checked with `realpath`). A page can be served from memory (`html`) at its own `pagePath`; nothing else is.
- **Egress allowlist.** Every request the page makes goes through `egressVerdict()`:
  - `127.0.0.1` and `localhost` (our own server, any port);
  - the three pinned runtime files the templates load from unpkg, exact URLs only:
    `react@18.3.1/umd/react.production.min.js`, `react-dom@18.3.1/umd/react-dom.production.min.js`,
    `@babel/standalone@7.29.0/babel.min.js`;
  - `fonts.googleapis.com` and `fonts.gstatic.com` over https.

  Anything else is aborted and the render fails, naming the URL. The posters, IG pages and booklet
  request only these hosts (checked by logging `hosts` on each render).

## Requirements and quirks

- **Network is required.** The DC runtime loads React 18.3.1 from `unpkg.com` (SRI-pinned), and
  `styles.css` loads fonts from `fonts.googleapis.com`. Both are on the allowlist. Offline, the render fails with
  "required font not loaded" or "page did not settle". It never silently falls back to a system font.
- **Viewport matters for posters.** The poster desk is a flex row with 40 px padding. A viewport
  narrower than 896 px flex-shrinks the 816 px sheet (a 1x test captured 736 px wide). The
  `poster-letter` preset therefore uses viewport 896x1136, which is the template's own `$preview` size.
- **Serving.** Files are served over `http://127.0.0.1` with a random port, not `file://`. Under
  `file://` the DC runtime logs `Fetch API cannot load file:///...`. Over HTTP that error does not occur.
- **PDF** uses print media and the templates' `@media print` rules. Fonts come out embedded (Type 3).
- **Raster sizing** is 96 CSS px per inch, so 3x = 288 dpi for an 8.5x11 sheet.
- pdfinfo missing means the PDF page count is not verified. The result then carries a warning.

## Not in scope here

- Templates for Instagram square/story do not exist as standalone `.dc.html` files yet. The
  design-system IG tiles are React components in `ui_kits/print_social/Social.jsx`, so only the
  preset sizes are provided.
- `jho-render` does no data filling. Concert data is handled by `jho-concert-poster`.
