---
name: jho-instagram
description: Render the four Instagram graphics the JHO design system defines (IG 1:1 concert tile, IG 1:1 brand/season card, and the 9:16 stories Concert and Artist Spotlight) from a concert JSON. Writes a standalone HTML and a PNG for each into pr/<YYYYMMDD>_Concert/. Use for any JHO Instagram post or story request.
---

# jho-instagram

Turns a concert JSON into the Instagram set in `design-system/ui_kits/print_social/Social.jsx`.
Nothing beyond those four graphics is produced.

```bash
cd "$(git rev-parse --show-toplevel)"
node .claude/skills/jho-instagram/make-instagram.mjs \
  --data .claude/skills/jho-concert-poster/concert.2026-12-09.json [--out <dir>] [--allow-past]
```

- `--out` defaults to `<repo>/pr/<YYYYMMDD>_Concert/`, from the concert's `iso` (2026-12-09 -> `pr/20261209_Concert/`).
  `--out` replaces that folder. It must resolve (through any symlink) to a folder inside the repo and
  not inside `design-system/`.
- `--allow-past` is needed only when the concert's date has already passed. Without it, a past date is refused.
- The command prints a JSON array, one entry per graphic, with the HTML path, PNG path, pixel size, the
  hosts the render requested, and any warnings. A graphic that is skipped (see the premiere rule below)
  is reported on stderr as `make-instagram: skipped <name>: <reason>`.
- Exit code is 1 on any failure, with a message.
- Tests: `node --test .claude/skills/jho-instagram/make-instagram.test.mjs` (includes browser renders).

## Outputs

Written on every run as `JHO_<iso>_<name>_<ratio>.html` plus `.png`:

| Graphic | Kit component | Artboard (CSS px) | PNG |
| --- | --- | --- | --- |
| `IG-Concert_1x1` | `IGConcert` | 700 x 700 | 1080 x 1080 |
| `IG-Brand_1x1` | `IGBrand` | 700 x 700 | 1080 x 1080 |
| `Story-Concert_9x16` | `StoryConcert` (paper) | 340 x 604.44 | 1080 x 1920 |
| `Story-Artist-Spotlight_9x16` | `StoryArtistSpotlight` (newsprint) | 340 x 604.44 | 1080 x 1920 |

**Story-Artist-Spotlight is conditional.** It is built only when a work has a tag containing "premiere"
(any case). The spotlight uses that work, wherever it is in the list. If no work is tagged, the graphic is
skipped with a console notice, and the other graphics are still written. It is never built with a made-up premiere.

No PDF is produced. Instagram takes raster images, so a PDF would be an artifact nobody uploads.

Rendering goes through `../jho-render/render.mjs` (`renderPage`), so its wait and failure rules apply.
Each PNG is checked against the expected pixel size and the run fails if it is wrong.

## Input (concert JSON)

Same schema as `jho-concert-poster`. Read that skill's SKILL.md for the field table. This skill
uses the same validator (`validateConcert` from `make-poster.mjs`), so the same rules apply:

- `works`: 1 to 4 entries. `tag` is optional on every work. A tag containing "premiere" (any case) marks the
  premiere, which the spotlight uses. Example: `{"composer": "...", "work": "...", "tag": "Premiere"}`.
- Roster format is accepted: `"conductor": {"name": ...}` and `"soloists": [...]`, resolved from `roster.json`
  (the same as jho-concert-poster). Explicit `people[]` also works. The Dec 2026 file is roster format.
- `people`: conductor first. This skill needs **at least 2**, because the 1:1 tile and the
  artist spotlight feature `people[1]`. A solo (1-person) concert is rejected.
- `people[i].photo`: must exist under `design-system/`.
- `iso`: `YYYY-MM-DD`, used in file names.

### What comes from the JSON, and what does not

- From the JSON: title, works (composer, work, tag), people (name, role, photo), dayname, date,
  time, venue, address, iso.
- Fixed copy, from `design-system/CLAUDE.md`, never from the JSON:
  - Presenter line: "The Jackson Heights Beautification Group Presents"
  - "Free Admission" / "$20 Suggested Donation"
  - jhorchestra.org, @jhorchestra, the donate QR
- Season copy, verbatim from `Social.jsx`: the `IGBrand` season list. It is a constant at the top of
  `make-instagram.mjs` (`BRAND_SEASON`). Check it against the current season before posting, and change it
  there if the season has moved. See quirks.
- The `StoryArtistSpotlight` headline is the kit sentence with the JSON filled in:
  "A new work, *premiere.work*, premieres *date*." The eyebrow is the premiere's `tag`, shown as written.

## How it is built (read before changing it)

- **Standalone HTML.** Each file in the output folder is a complete page. It loads `../design-system/styles.css`,
  `_ds_bundle.js` and the DC runtime from `design-system/templates/concert-poster/support.js`, by
  relative path. The runtime is referenced, not copied. Opening the file needs the repo layout and
  a network connection (fonts and React load from the CDN).
- **PNGs are rendered from the same page, served from memory.** The render serves `design-system/` as its
  root with the page's HTML supplied in memory, with paths relative to the design-system root (`./styles.css`).
  The file in the output folder differs only in that prefix (`../design-system/`). The server never sees the repo or the output folder.
- **Overflow check.** Every artboard must fit. A text block that runs past its artboard, or into the block below,
  fails the render (`overflow: block N runs X px into block N+1`). A clipped list would drop a composer from a post
  with no error, so this is loud on purpose. The Dec 2026 four-work tile originally overflowed by about 30 CSS px.
  It was fixed by tightening spacing in `igConcert` only: outer padding 34/26 to 26/22, block gap 12 to 10,
  works column gap 8 to 4, work row top padding 6 to 4, and composer size 18 to 17.

- **Design-system components.** `Wordmark` (live Playfair 900, never an `<img>`) and `MosaicRule`
  are mounted with `<x-import>` from the bundle, with layout on wrapper divs and appearance as
  props, per `design-system/CLAUDE.md`.
- **Mirrored, not imported.** `Portrait` and `DonateQR` are not in the bundle, and `x-import` drops
  layout styles, so both are reproduced in `make-instagram.mjs` with the kit's exact inline
  styles. If `Portrait.jsx` or `DonateQR` (in `ui_kits/print_social/Poster.jsx`) changes, update
  `portrait()` and `donateQR()` by hand.
- **Exact sizes via zoom.** The artboard is laid out in kit CSS px and zoomed to the output size
  (`zoom: 1080/700` or `1080/340`), then captured at device scale 1. Chromium rounds element
  captures up to whole CSS px. A device-scale factor of 1080/340 produced 1922 px tall, not 1920.
- **Export corners.** `border-radius` and `box-shadow` are forced to 0 / none on the artboard.
  The kit's 4-6 px radius and tile shadow let the page ground and the shadow tint the corners
  of the PNG. The kit callers keep their values; only the export is flat.
- **Kit ported, not redesigned.** Style objects are ported from `Social.jsx` one-for-one. Only the
  deliberate changes above, the fixed copy, and the JSON fills differ.

## Known quirks (found while building this)

1. **Story artboard is not exactly 9:16.** The kit's story is 340 x 604, and 340 x 604 is not
   9:16 (604.44 is). The export uses 604.44 so the PNG is exactly 1080 x 1920. The difference is
   0.44 CSS px.
2. **IG-Brand's season text is hard-coded from the design kit.** It is the `BRAND_SEASON` list in
   `make-instagram.mjs`, rendered verbatim, and it does not come from the concert JSON. Check it against
   the current season before posting. If the season has changed, edit `BRAND_SEASON` first.
3. **The concert JSON may be in the past.** `concert.2026-05-20.json` is dated May 20, 2026. Rendering it
   needs `--allow-past`, and `Story-Concert` says "Next concert" either way. Those labels are wrong for
   publishing now. Render from a current concert JSON before posting. `concert.2026-12-09.json` is current.
4. **Admission copy in the kit is lowercase.** `Poster.jsx` and `Social.jsx` carry "Free
   admission" and "$20 suggested donation". The locked copy in `CLAUDE.md` is "Free Admission" /
   "$20 Suggested Donation". This skill uses the locked copy.
5. **`assets/reference/20260520-ig.png` is not a layout reference for `IGConcert`.** It is older
   art that breaks the locked rules. Its wordmark is a multi-colour wide sans, not live Playfair
   900. Its presenter line names the venue ("... and Trinity Lutheran Church Present"). It has a
   griffin seal, a yellow programme block, and a title "Artistic Director" (the JSON says
   "Conductor"). The facts (date, time, venue, works, people) match the JSON. The layout does not.
   `design-system/readme.md` calls that PNG "ground truth", which conflicts with `CLAUDE.md`. This
   skill follows `CLAUDE.md` and `Social.jsx`.
6. **Kit alignment in `IGBrand`.** The wordmark is centred (the kit passes `alignItems: center`).
   The brand's own stacked lockup is flush-left (`Wordmark.jsx`). The kit's choice is kept.
7. **Story venue line.** The kit's `StoryArtistSpotlight` hard-codes "Trinity Lutheran Church,
   Astoria". This skill uses `venue · address` from the JSON, matching `StoryConcert`. The address
   includes "(parking available)".
8. **"Learn more" / "Read the notes" have no arrow.** The readme says forward CTAs take `→`. The
   kit's buttons do not. The kit is kept.
9. **Corner radius is removed from the export** (see How it is built). The kit's tile still has it.

## Verification

Run on 2026-10-29 with `concert.2026-12-09.json` (four works, roster format, no tags):

- Three graphics rendered: IG-Concert, IG-Brand, Story-Concert, at 1080x1080 (x2) and 1080x1920. Story-Artist-Spotlight
  was skipped with the notice, because no work is tagged Premiere. The run wrote three PNGs for this concert.
- IG-Brand was opened and checked. Its season list is the `BRAND_SEASON` copy, unchanged (quirk 2). IG-Concert and
  Story-Concert were rendered in an earlier run and were not re-opened in this pass.
- Premiere path, fixed: a copy of this JSON with works[0] tagged "World Premiere" used to fail the overflow check on
  Story-Artist-Spotlight (artboard scroll 340x608, frame 340x604). The spotlight now uses 28 px top/bottom padding and a
  12 px block gap (was 36 and 16), set in `storyArtistSpotlight` only, so Story-Concert is unchanged. Three browser
  tests cover it (4-work and 1-work premiere renders at 1080x1920, and no "undefined" in the spotlight text).
  The headroom is about 20 CSS px at the Dec 9 title length. A much longer premiere title can still trip the overflow
  check, which fails loudly and does not clip.
- Automated tests cover the premiere rule, the skip notice, `--allow-past`, `--out` containment, escaping of
  the design-system path, and the overflow check (a deliberately overflowing four-work concert must fail).
- Earlier (2026-05-20) renders are in `pr/20260520_Concert/`. They were made before the overflow fix and the premiere rule,
  so re-render them rather than post them.

Not verified: a pixel diff against the kit's own JSX render (`ui_kits/print_social/index.html`);
opening the HTML in a browser other than Chromium; and how Instagram itself crops the 1:1 and 9:16
files in the feed or profile grid.

## Requirements

- Playwright and Chromium, set up by `jho-render` (`npm install` and `npx playwright install
  chromium` in `.claude/skills/jho-render/`).
- Network: the DC runtime loads React 18.3.1 from unpkg (SRI-pinned), and `styles.css` loads
  Playfair, Inter and JetBrains Mono from Google Fonts. Offline, the render fails with
  "required font not loaded" or "page did not settle".

## Output

Files go to `<repo>/pr/<YYYYMMDD>_Concert/` (or the `--out` folder), which is gitignored. Do not commit them.
