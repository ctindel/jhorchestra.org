# UI kit — poster & social

Recreation of the print and social templates from the brand deck (slides 07–09), all
populated with the real May 20, 2026 concert.

| File | Surfaces |
| --- | --- |
| `Poster.jsx` | `PosterA` Big Type · `PosterB` Color Block · `PosterC` Editorial — all 8.5 × 11 at 560 × 725 px (60 px/in) || `Social.jsx` | `IGConcert` and `IGBrand` (1:1, 700 × 700) · `StoryConcert`, `StoryArtistSpotlight`, `StorySeason` (9:16, 340 × 604) |

`index.html` shows all of them; the poster layout switcher and the Layout A masthead switcher are live.

## Layout A artist variants

The **conductor always sits in the masthead** at 156 px beside the wordmark. Additional artists go
beside the **programme**, never in the masthead.

| Variant | Component | Template | Artists |
| --- | --- | --- | --- |
| Solo | `<PosterSolo />` | `templates/concert-poster/` | conductor only |
| Duo | `<PosterDuo />` | `templates/concert-poster-duo/` | + one soloist, 126 px |
| Trio | `<PosterTrio />` | `templates/concert-poster-trio/` | + two soloists, 84 px each |

All three read from `CONCERT.people` — **order it conductor first**, then soloists. `PosterA` takes
`soloists={1|2|3}` (total portrait count) if you'd rather drive it directly.

**Soloist credits sit to the RIGHT of the frame** (`layout="inline"`), not beneath it — that buys
vertical room, so the frames run bigger than a stacked arrangement allows. The trade is horizontal:
the credit text widens the right column, so wherever soloists appear the works list drops to
`size="sm"` to keep composer names off a second line.

**Instagram tiles keep their own artist list.** `IGConcert` slices `CONCERT.people` to the first two
— adding a third artist for the Trio poster must not silently add a third portrait to the 1:1 tile.
Both tiles use `minmax(0,1fr)` on their flexible row so it can actually shrink instead of pushing
content out of the fixed 700 px box.

**The masthead and the programme compete for height.** The conductor is 162 px — deliberately just
under the wordmark's own height, so the *wordmark* sets the masthead height and the programme keeps
its 232 px. Push the conductor past ~170 px and he becomes the tallest thing there, the programme
row shrinks, and the works list collides with the footer. After any size change, re-check
`stack.bottom < footer.top` and `worksColumn.bottom < footer.top` on all three variants.

Both programme columns are **vertically centred** between the hairlines (`align-items:center`), so
the works list and the portraits share a common axis with equal space above and below.

The **wordmark is centred** in its masthead column, not flush left.

Metadata labels read **WHEN / WHERE**, not DATE / VENUE.

### QA checks — Instagram concert square

Two geometry rules that silently break whenever a portrait or the programme grows. Probe them
after **any** change to `IGConcert` (all measurements relative to the 700×700 sheet):

1. **The soloist's photo + name + title must fit between the mosaic bar and the lower hairline.**
   `stack.top >= mosaicBar.bottom && stack.bottom <= metaRow.top`. A portrait's block is roughly
   `size + 45px` of name/title chrome — at 132px that's ~177px inside a 244px band. Anything over
   ~150px overruns the hairline and collides with the WHEN/WHERE row.
2. **The programme column must be optically centred in that band.**
   `|(works.top − row.top) − (row.bottom − works.bottom)| <= 2`. Currently 20px above, 20px below.

Both portraits are deliberately the **same size** (145px) — the conductor in the masthead and the
soloist beside the programme read as a pair, so don't scale one without the other.

3. **The presenter line fills the square's width by tracking, never by justification.**
   `text-align:justify` on a short single line dumps all slack into the five word gaps (~8× a normal
   space) and reads as six disconnected words. Set `letter-spacing` instead — currently 15px at
   0.23em fills 614 of 620px — and keep `white-space:nowrap`. Tracked-out caps is the brand's own
   eyebrow idiom (0.18–0.28em), so this is also the on-system choice.

## Finishes — online vs print

Layout A ships in **three finishes off one artwork**. Every element paints from a CSS custom
property, so a finish is only a token override on the sheet root — there is no forked B&W file to
keep in sync. Edit the poster once and all three follow.

| Finish | Ground | Use |
| --- | --- | --- |
| `online` | Paper `#FAF6EE` | Web, email, social. The default. |
| `print-color` | White `#FFFFFF` | Commercial print. Identical artwork, plain white sheet. |
| `print-bw` | White `#FFFFFF` | Newspaper listings. |

`print-bw` leaves **no grey text anywhere** — `--jho-ink`, `--jho-muted`, `--jho-tandoor` and
`--jho-subway` all collapse to `#000`, so captions, role labels and the presenter line print as
solid black rather than as a halftone screen.

**Imagery is swapped, not filtered.** Every photo, the griffin seal and the donate QR ship as a
color/grey pair, and `print-bw` hides one and shows the other:

| Color | Black & white |
| --- | --- |
| `assets/photos/<name>.jpg` | `assets/photos/bw/<name>.png` |
| `assets/logos/griffin-seal.webp` | `assets/logos/griffin-seal-bw.png` |
| `assets/qr/donate-on-paper.png` | `assets/qr/donate-print-bw.png` (pure `#000` on `#FFF`) |

The grey copies are baked with Rec.709 luminance and 1.06 contrast. This matters: a CSS
`filter` is the least reliable part of a print pipeline, and it was carrying the *entire* B&W
treatment for imagery — if a PDF rasteriser dropped it, a "black and white" newspaper poster would
print full-color photos and a navy-on-cream QR while the type stayed black. Baked pixels can't
fail that way.

**The mosaic bar goes solid black**, not greyscale. Seven grey segments read as a printing fault
rather than a design; one black rule reads as deliberate. It's painted
(`.jho-mosaic > *{background:#000}`), not filtered, so nothing in the B&W finish depends on filter
support surviving export.

```jsx
<PosterDuo finish="print-bw" />
<PosterA soloists={3} finish="print-color" />
```

In the DC templates the same control is the **Finish** tweak (`online | print-color | print-bw`).
There the overrides live in a `<style>` block keyed off `[data-finish]` and need `!important`,
because every value they retarget is authored inline on the element. Two class hooks exist for
values a color rule can't reach: `.jho-tint` (the premiere tag's tinted ground) and `.jho-mosaic`
(the seven-hue bar). **Don't match inline styles with `[style*=…]`** — the DC runtime re-serialises
them through React (`rgba(224, 75, 42, 0.1)`, with spaces), so those selectors silently never fire.

### Nine poster templates

Three artist variants × three outputs, each its own starting point:

| | Color (Online) | Color (Print) | B&W (Newsprint) |
| --- | --- | --- | --- |
| Conductor only | `concert-poster/` | `concert-poster-print/` | `concert-poster-bw/` |
| + one soloist | `concert-poster-duo/` | `concert-poster-duo-print/` | `concert-poster-duo-bw/` |
| + two soloists | `concert-poster-trio/` | `concert-poster-trio-print/` | `concert-poster-trio-bw/` |

All nine are the **same artwork** — the folders differ only in which `finish` the tweak defaults to
(`online`, `print-color`, `print-bw`). Every template keeps the full switcher, so any one can be
previewed as any other; the split exists so the right output is one click from the picker rather
than a tweak someone has to remember.

Pick **Online** for the website, email and social (off-white paper ground, `#FAF6EE`), **Print** for
a commercial printer (identical color artwork on plain white), **B&W** for newspaper listings.

### Print geometry & export resolution

The **templates** are the print deliverable. Their sheet is declared in inches —
`width:8.5in; height:11in` — so it is US Letter *by definition* rather than by a 96dpi
coincidence, and it carries `print-color-adjust:exact` so the grounds, mosaic bar and photos
survive the browser's default "don't waste ink" behaviour. A `@media print` block drops the desk
background, shadow and radius so the sheet prints edge to edge with no furniture.

- **PDF** — export the template directly. Vector type at true 8.5 × 11; this is the format to send
  a commercial printer, and the only one that keeps the wordmark resolution-independent.
  The print rules pin `@page` to `8.5in 11in` at zero margin, zero out `html`/`body`/`.jho-desk`,
  and take `.jho-sheet` **out of flow** — `position:absolute; top:0; left:0` at exactly the page
  size. An in-flow sheet cannot be trusted to land on one page: the desk's centring, the body box
  and sub-pixel rounding each add fractions, and a fraction of a pixel of overflow prints a second
  blank sheet. Pinning removes all of those at once. `print-color-adjust:exact` is forced on
  `*, *::before, *::after` so grounds, mosaic bar, QR and photos survive.
- **Raster** — a 1× capture is 816 × 1056 (96 dpi), which is **too coarse for newsprint**. Capture
  at a multiplier: 2× = 192 dpi, **3× = 288 dpi (2448 × 3168)**, 4× = 384 dpi. Newspapers typically
  ask for 200–300 dpi, so 3× is the safe default.

⚠️ **Never export from the kit preview.** The sheets in `index.html` are 560 × 725 (≈60 dpi) — a
contact sheet for comparing variants side by side, not artwork. It holds the 8.5:11 ratio to within
0.3 px so what you see is accurate, but the pixels aren't there.

### File naming

Rendered files carry their purpose so an online JPEG and a newsprint file can't be confused in a
shared folder or emailed to the wrong vendor:

```
JHO_2026-05-20_Poster-Solo_Online.png
JHO_2026-05-20_Poster-Duo_Print-Color.png
JHO_2026-05-20_Poster-Trio_Print-BW.png
```

`JHO_<iso date>_Poster-<Variant>_<Finish>.<ext>`. Use `window.jhoPosterFileName(variant, finish)`
rather than typing them by hand; the date comes from `CONCERT.iso`.

### Keeping the kit and the print templates in sync

The wordmark is sized as a **fraction of sheet width** (`MARK_RATIO` at the top of `Poster.jsx`),
not in absolute pixels — so this 560px preview and the 816px print templates in
`templates/concert-poster/` and `templates/concert-poster-duo/` render the same proportions.

`MARK_RATIO = 0.1176` → **66px** in the kit, **96px** in the templates. Solo and Duo share one
ratio because they share the masthead. If you change it, update the `font-size` in both templates
(ratio × 816); they are separate files by necessity (standalone print artifacts), so this is the
contract between them.

### Anatomy (all three variants)

```
presenter   centered, uppercase, Inter 600 16px / 0.1em, nowrap — sized to hold one line at 8.5in
masthead    wordmark 88px, CENTERED in its column  |  CONDUCTOR portrait 200px, name + role beneath
mosaic bar  4px
when/where  WHEN: date (Playfair 800 25px) + time (Inter 500 16px/1.3)
            WHERE: venue + address with parenthetical (15.5px/1.3, nowrap)
programme   title, blurb, three works  |  SOLOIST portraits 150px (Duo/Trio), name + instrument
            to the RIGHT of each photo, vertically centered between venue and footer rules
footer      jhorchestra.org + @handle  |  donate QR + "Donate →"  |  admission terms + griffin seal
```

The conductor always sits in the masthead. Additional artists go beside the **programme**, never in
the masthead. Admission terms appear **only in the footer** — the WHERE block carries the venue and
address, nothing about money. The programme never names a soloist beside their work; the portrait
and its caption already identify them.

### Never style an `<x-import>` mount

`x-import` renders the component into a mount element it owns (`div.sc-host-x`) and forwards only
part of a `style` attribute to it. Anything layout-related — `margin`, `flex-shrink`,
`align-items` — is **silently dropped**, with no warning and no console error.

This has bitten twice: the wordmark's `align-items:center` and the mosaic bar's `margin:0 47px`
both looked authored but never applied. The mosaic case was masked because the `height` in the same
declaration *did* survive, so the bar looked right while it bled the full 816px.

Two rules:
1. **Layout goes on a wrapper the template owns** — `<div style="padding:0 47px;flex-shrink:0"><x-import …></x-import></div>`, not on the tag itself.
2. **Appearance goes through a prop** — `align="center"`, `variant="bar"`. If a component needs to
   accept styling from an `x-import` call site, give it a prop; a `style` attribute cannot reach it.

A `class` attribute *does* reach the component root, which is why the `.jho-mosaic` colorway hooks
work. Use classes for state hooks, wrappers for layout, props for appearance.

### Colorways

| | Ground | Sheet | QR | Type |
| --- | --- | --- | --- | --- |
| `online` | Paper `#FAF6EE` | shadow, 2px radius | ink-on-paper | full palette |
| `print-color` | White `#FFFFFF` | no shadow, no radius | black-on-white | full palette |
| `print-bw` | White `#FFFFFF` | no shadow, no radius | black-on-white | **all pure `#000`** |

`print-bw` leaves no Muted grey, Tandoor or Subway anywhere in type — every color collapses to
`#000`, so captions and role labels print solid rather than as a halftone screen. Photos and the
griffin seal take `filter:grayscale(1) contrast(1.08)`. The mosaic rule becomes a **solid 4px black
bar** (its seven segments are hidden, not desaturated — seven greys read as a printing fault rather
than a design).

Pre-desaturated photo copies also exist in `assets/photos/bw/` and `assets/logos/griffin-seal-bw.png`
if a rasteriser ever drops the filter; swap the `src` rather than adding a second layout.

### Donate QR

`assets/qr/donate-*.png` are real scannable QR codes for `https://jhorchestra.org/donate`
(v3, ECC L, 29 modules, 4-module quiet zone). Two colorways — `donate-on-paper.png` (ink modules)
and `donate-on-ink.png` (paper modules) — so contrast holds on either ground. Use the `DonateQR`
helper exported from `Poster.jsx`; never recolor a QR into a brand hue or drop the quiet zone.
Regenerate them if the donate URL changes.

Concert data lives in one `CONCERT` object at the top of `Poster.jsx` and is re-used by the
social templates via `window.JHO_CONCERT` — swap that object to re-skin every piece for the
next concert.

Rendered ground truth for the same concert is in `assets/reference/` (`20260520-poster-color.png`,
`20260520-ig.png`) — check against those if a value looks off. Ticketing copy reads
**"Free Admission" / "$20 Suggested Donation"** in every footer.
