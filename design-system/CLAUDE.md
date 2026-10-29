# Project rules — Jackson Heights Orchestra Design System

## The wordmark is LIVE TYPE, never an image file

The JHO wordmark is set in **Playfair Display 900**, `letter-spacing: -0.02em`, one color at a time.
This is how the source brand deck sets it (`.logo-stacked` / `.logo-horizontal` in
`uploads/Jackson Heights Orchestra Branding/Jackson Heights Orchestra Branding.html`).

**Never render the wordmark as a `<img>`.** Always use the `Wordmark` component, which sets type.

The PNGs the client originally supplied were set in a **different, lighter, wider didone** — not
Playfair — and have been deleted.

`assets/wordmark/` now holds **correct** artwork, re-exported from live Playfair Display 900
(`stacked-<color>.png`, `horizontal-<color>.png`; transparent; stacked 1374×996, horizontal
3661×300). These exist for **print vendors and external hand-off only** — in this project's own
designs, still set the wordmark as live type via `Wordmark`, which is resolution-independent.

If any other raster wordmark file appears, diff it against Playfair Display 900 before using it.

The only drawn brand artwork in this project is `assets/logos/griffin-seal.webp` (the heritage
griffin seal). That one IS a real image and should be used as such.

## Other locked-in decisions

- Presenter line on all posters/programs/social: **"The Jackson Heights Beautification Group Presents"** — presenter only, never the venue.
- Ticketing copy: **"Free Admission" / "$20 Suggested Donation"**.
- Mosaic geometry: `rule` = 3px tall / 6px gaps (under a wordmark); `bar` = 4px tall / 3px gaps (poster + IG masthead stripe). Don't improvise these.
- Griffin seal minimum size: 56px. It is dense line art and turns to mush below that.

## Styling an `<x-import>` never works

`x-import` owns its mount element and forwards only part of a `style` attribute. `margin`,
`flex-shrink` and `align-items` are dropped silently — no warning, no console error, and a
surviving sibling declaration (e.g. `height`) can make it look like the whole rule applied.

- **Layout** → a wrapper `<div>` the template owns.
- **Appearance** → a component prop (`align`, `variant`, `color`).
- **State hooks** → `class`, which does reach the component root.

Both the poster wordmark's centring and the mosaic bar's gutter inset were lost this way.
