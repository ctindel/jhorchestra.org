# Jackson Heights Orchestra — Design System

The brand system for the **Jackson Heights Orchestra (JHO)**, a volunteer community orchestra in Queens, New York. Founded 2013. ~50 musicians drawn from across Queens and Brooklyn, four concerts a year, always free or pay-what-you-can with a $20 suggested donation. 501(c)(3). `jhorchestra.org` · `@jhorchestra`.

The organizing idea: **an orchestra as many voices, tuned to the rhythm of Jackson Heights** — one of the most linguistically diverse places on earth. The brand is a *neighborhood*, not an institution: warm, civic, human, closer to a block in Queens than a concert-hall lobby.

## Sources

Everything here was derived from files the user uploaded, all under `uploads/Jackson Heights Orchestra Branding/`:

| Source | What it gave us |
| --- | --- |
| `Jackson Heights Orchestra Branding.html` | **Primary source.** A 14-slide brand-system deck (deck-stage, 1920×1080) with the logo system, palette, typography, three poster layouts, Instagram square/story templates, and two Squarespace website screens. Every token, component and screen in this system is lifted from it. |
| `assets/logos/*.png`, `assets/logos/horizontal/*.png` | Real exported wordmark PNGs (client-supplied, Playfair Display 900) — stacked 2114×1648 and horizontal 5944×666, six colors each, transparent. |
| `assets/orchestra.jpg`, `alex-wen.jpg`, `michael-lee.jpg` | Real photography (ensemble shot, two soloist headshots). |
| `uploads/jhbg_logo_4000.webp` | The **heritage griffin seal** — fine black line art of a winged griffin over the Queens skyline in a circular rule. Copied in as `assets/logos/griffin-seal.webp`. |
| `JHO Program Booklet.html`, `uploads/*.pdf` | Concert-program artifacts (May 20, 2026 concert). |
| `uploads/20260520_JHO_Poster_Color.png`, `20260520_JHO_IG.png` | Rendered reference art for the current concert, kept in `assets/reference/`. |

⚠️ The `uploads/*.md` files in that folder (`35c153-colors.md`, `831abe-typography.md`, …) are **Elastic's brand documentation** — unrelated reference material that happened to be in the same folder. Nothing from them was used.

No Figma file, no codebase, and no font binaries were provided.

---

## Content fundamentals

**Voice: warm, direct, second person, unshowy.** The orchestra talks like a neighbor who plays viola, not like a marketing department.

- **Person.** "we"/"our" for the orchestra, "you" for the reader. *"everyone who wants to play."* *"when we have them."*
- **Titles are literal.** Concerts are named for what they are or where they are: *100 Years of Trinity Lutheran*, *Spring in Forest Hills*, *Mostly Brahms*, *Summer Pops · Travers Park*. Never *"An Evening of Transcendence."*
- **Honesty over polish.** The site says *"no recording"* and *"no archive yet"* out loud rather than hiding gaps. Money is stated plainly: *"Free admission, $20 suggested donation."*
- **Sentence case everywhere** except eyebrows and buttons, which are ALL CAPS with wide tracking (0.18–0.28em).
- **Headlines end in a period.** *"The primary wordmark."* *"The mosaic palette."* *"Every concert, past & present."* The period is a house tic — it makes a headline feel spoken, not shouted.
- **One italic word per headline**, at most, carrying the idea: *"A neighborhood **chord**, played in Jackson Heights."* *"Seven **voices**, one community."* Italics are Playfair italic and usually take an accent color.
- **No exclamation points** except in genuine welcomes. No emoji. No hype adjectives ("world-class", "unforgettable").
- **Middot as the universal separator** in metadata runs: `Wed · May 20 · 7:30 PM · Astoria`, `Queens, New York · 501(c)(3)`.
- **Composers are surname-first, works in italic**, premieres tagged: `Michael A. Lee — Cognōscent (Premiere)`. Em dash between composer and work.
- **Arrows on forward actions**: `Learn more →`, `All concerts →`, `Help sponsor →`.
- **Never "Reserve" / "Reserve a seat" / "Get tickets"** — admission is free and unticketed, so there is nothing to reserve. Forward CTAs are `Learn more →`, `All concerts →`, `Directions`, `Help sponsor →`.
- **Numerals lead stat blocks** and are set in Playfair 900 at large size: `50+ Musicians`, `4 Concerts a year`, `13 Years`.

---

## Visual foundations

### Color
Seven named "voices", each named for something in the neighborhood — the spices on 74th Street, the subway line overhead, the jacarandas in spring, the hibiscus on a fruit cart.

| Token | Name | Hex | Role |
| --- | --- | --- | --- |
| `--jho-tandoor` | Tandoor | `#E04B2A` | Primary red — CTAs, eyebrows, accent |
| `--jho-saffron` | Saffron | `#F2A93B` | Primary amber — highlight on dark |
| `--jho-cilantro` | Cilantro | `#3A8F6B` | Primary green — highlight on dark |
| `--jho-subway` | Subway | `#2A5D8F` | Primary blue — default wordmark color |
| `--jho-jacaranda` | Jacaranda | `#7D3B8F` | Accent violet — mosaic only |
| `--jho-hibiscus` | Hibiscus | `#D94A6D` | Accent rose — mosaic only |
| `--jho-roosevelt` | Roosevelt | `#0F4C5C` | Accent teal — mosaic only |

Neutrals: **Ink** `#141A2A` (text and dark grounds), **Paper** `#FAF6EE` (page), **Newsprint** `#F3ECDC` (cards, stages), **Muted** `#6A6555` (secondary text). *No pure black and no pure white as a ground* — white appears only in browser chrome and raised list cards; black only as a single-color logo lockup.

**Rules of use (non-negotiable):**
1. **Subway and Tandoor lead every layout.** They are the wordmark color, the headline accent, the dominant CTA.
2. **Cilantro and Saffron carry the brand on dark grounds**, and pop as callout color on light.
3. **Jacaranda, Hibiscus and Roosevelt never appear alone** — only inside the full mosaic rule or accent grid.
4. **The wordmark is always one color at a time.** Never multi-toned, never a rainbow of letters.
5. Full-palette appearances are limited to the **mosaic rule** (a 3–4px seven-segment bar) and the **mosaic grid** (7 equal blocks). That restraint is what keeps the palette from looking like a toy.

### Typography
Two voices only. Both free on Google Fonts and present in Squarespace's native picker — deliberate, because volunteers maintain the site.

- **Playfair Display** — display serif. `900` for the wordmark, hero headlines and big numerals; `700` for card titles; `500 italic` for flourishes and work titles. Tracking is always negative at display size (`-0.02em` to `-0.04em`), line-height 0.9–1.05.
- **Inter** — every word of body copy, UI, captions, and all eyebrows. `400` body, `600` eyebrows, `700` subheads and buttons.
- **JetBrains Mono** — hex codes and specimen metadata only. Never in product surfaces.
- **The eyebrow is the system's connective tissue**: Inter 600, 10–13px, uppercase, `0.18–0.28em` tracking, usually Tandoor on light or Saffron on dark. It appears above nearly every headline.
- Body copy is measured — max-width 480–700px, `1.55` line-height.

### Layout & structure
- **The rule-under-headline pattern**: every deck slide and most site sections open with a headline left, an eyebrow right, and a 1px Ink rule underneath. That hairline is the most-repeated element in the system.
- Grids are honest and rectangular: 2-up and 3-up column splits, no diagonal or overlapping compositions.
- Site sections alternate **Paper → Ink → Paper**; never more than two ground colors in a single view.
- **Alignment is flush-left** with right-aligned metadata; centred type appears only on the editorial poster layout (Layout C).

### Cards, borders, radii
- **Content cards** = Newsprint ground, `12px` radius, **no border, no shadow**.
- **List rows** (concert archive) = white ground, `1px rgba(0,0,0,0.08)` border, `10px` radius, no shadow.
- **Feature cards** = Ink ground, `14px` radius, reversed type.
- **Buttons, tabs and chips are fully pill-shaped** (`999px`) — the one place the system is soft. Media chips on the archive are `4px` rectangles, tinted 10% of their own hue.
- Radii ladder: `4 · 6 · 10 · 12 · 16 · 999`. Printed sheets get `2px` — they're paper.

### Shadows
**Shadows only exist for objects pretending to be physical** — a printed poster, a phone screenshot, a browser mockup. No UI element on a real page carries a shadow; separation is done with the hairline rule or a ground change.
`--jho-shadow-sheet` (poster), `--jho-shadow-tile` (IG tile), `--jho-shadow-browser` (browser chrome).

### Imagery
Real documentary photography of the actual ensemble and soloists — warm, available-light, unstyled, no filter or grain treatment. Portraits are square with a `4–6px` radius (poster/IG) or fully round (story headshots), always `object-fit: cover`. **Where a photo isn't available, the system uses a flat color block or a Subway→Roosevelt gradient tile — never a stock photo and never an illustration.** There is no illustration style in this brand.

### Motion
Almost none, by design — the site is Squarespace and the print pieces are static. Transitions are limited to `120–150ms ease` color/opacity changes on hover. No scroll animations, no parallax, no entrance fades, no bounce easing.

### Interaction states
- **Hover:** muted elements go to full opacity and shift to Tandoor (social icons: `opacity 0.55 → 1`, color → Tandoor). Filled buttons darken slightly; they do not lift or grow.
- **Press:** a `0.98` scale nudge, no color inversion.
- **Active/selected:** filled — the active tab becomes a solid Subway pill with Paper text; the active nav link turns Tandoor.
- **Focus:** rely on the pill outline in the accent color; never remove the default ring without replacing it.

### Transparency & blur
Effectively unused. The only transparency is functional: hairline borders (`rgba(20,26,42,0.15)` on light, `rgba(250,246,238,0.25)` on dark), 10%-tinted chip grounds, and de-emphasized reversed body text at `0.75` alpha. **No frosted glass, no backdrop blur, no protection gradients** — type is placed on solid grounds instead, which is also the stated rule for the logo ("never set on a busy photo").

---

## Iconography

**This brand has almost no iconography, and that is intentional.** Nothing should be added to it.

- **Social icons** — the one real icon set: hand-inlined single-path SVGs on a 24px viewBox, solid fill (`fill: currentColor`), no strokes, for YouTube, Facebook, Instagram and X. They render at 16px inside 24px hit areas at `0.55` opacity, going to full opacity + Tandoor on hover. Reproduced verbatim in `components/media/SocialIcons.jsx` — **copy those paths; do not substitute a CDN icon set.**
- **Unicode glyphs as icons** — the media chips in the concert archive use bare unicode characters, not an icon font: `▦` poster, `⛁` program, `▶` video, `♪` audio, `◉` photos, `✎` notes. The arrow `→` marks forward actions. This is the house "icon system".
- **No icon font, no Lucide/Heroicons/Font Awesome, no PNG icon sprites.** Nothing in the source pulls an icon library, and none has been substituted.
- **No emoji**, anywhere, in any surface.
- **QR codes** — `assets/qr/donate-on-paper.png`, `donate-on-ink.png` and `donate-print-bw.png` (pure black for newsprint; the B&W posters load this file rather than filtering the color one), real scannable codes for the donate link, sitting in the centre of poster and Instagram footers beside a "Donate →" label. Two colorways for contrast; never recolored into a brand hue, never without their quiet zone.
- **The mosaic rule / mosaic grid is the closest thing to a brand ornament** — seven color segments used as a rule under a wordmark or as a grid block. Treat it as the decorative element instead of reaching for an icon.
- The **griffin seal** (`assets/logos/griffin-seal.webp`) is the only other drawn mark in the system. It appears at 56–88 px in poster and program footers. It is line art, not an icon — never scale it below 56 px and never place it on a busy or mid-tone ground.

### Logo
Real exported PNGs live in `assets/logos/` (stacked) and `assets/logos/horizontal/`, in six colorways each: **subway, tandoor, cilantro, saffron, black, white**. Transparent background, ~5900px wide.

- **Primary** = stacked wordmark, three words, one color. Use it 80% of the time.
- **Horizontal** = one-line variant for headers, footers, and tight vertical space.
- Minimum size 48px / 0.75in. Clear space = half the cap-height of the "J" on every side.
- Never reorder colors, skew, apply effects, or set the mark on a busy photo.
- The deck also documents two secondary marks — a **monogram tile** (three colored squares spelling J·H·O) and a **waveform mark** — which exist only as CSS constructions in the source deck, with no exported artwork. Both are reproduced as components (`Monogram`, `WaveformMark`) rather than drawn as new SVG.
- The **griffin seal** is real drawn artwork (`assets/logos/griffin-seal.webp`, 1500 px, transparent): a winged griffin over the Queens skyline inside a circular rule. It is a *seal*, not the logo — it sits quietly in poster and program footers beside the wordmark, never in a masthead, never as a wordmark substitute. Minimum **56 px** — it is dense line art and collapses into a blob below that. **Never reverse it**: inverted, the fine linework breaks apart. On an Ink ground, set the seal on a Paper or Newsprint chip instead. Never redraw or approximate it.

---

## Index

**Root**
- `styles.css` — the single entry point; `@import`s everything below.
- `tokens/` — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `radius-shadow.css`, `motion.css`, `base.css`
- `assets/wordmark/` (wordmark PNGs), `assets/logos/griffin-seal.webp`, `assets/photos/`, `assets/qr/` (donate QR codes), `assets/reference/`
- `thumbnail.html`, `SKILL.md`, `readme.md`

**Foundation cards** — `guidelines/` (Design System tab: groups *Brand*, *Colors*, *Type*, *Spacing*)

**Components** — `components/`
- `core/` — `Button`, `Eyebrow`, `Headline`, `MosaicRule`, `Card`, `Chip`
- `brand/` — `Wordmark`, `Monogram`, `WaveformMark`, `GriffinSeal`
- `content/` — `ConcertRow`, `StatTile`, `WorkListing`, `Portrait`

**Instagram stories (9:16)** — `StoryConcert` (paper), `StoryArtistSpotlight` (newsprint), `StorySeason` (ink), all in `ui_kits/print_social/Social.jsx`
- `media/` — `SocialIcons`

**UI kits**
- `ui_kits/website/` — Squarespace site: home + schedule (`index.html` is the interactive click-through)
- `ui_kits/print_social/` — poster layouts A/B/C (A in Solo / Duo / Trio artist variants), Instagram square, Instagram stories

**Slides** — `slides/` — brand-deck slide templates (cover, concept, spec, summary)

**Templates** — ready-to-edit starting folders consuming projects can copy
- `templates/concert-poster/` — **Concert poster · Solo**: one large portrait, for when a single artist leads
- `templates/concert-poster-duo/` — **Concert poster · Duo**: two stacked portraits with names to the right, for a soloist plus a premiere composer

### Intentional additions
- `Chip` and `Portrait` are lifted out of the poster/archive layouts as reusable primitives; both are present in the source, just not named as components there.
- `Card` generalizes the three card treatments the deck uses (newsprint / ink / accent) into one prop-driven component.

---

## Exporting / using this system elsewhere

Download the whole project as a zip and it works standalone — open any `.html` in a browser.

- **Fonts.** Playfair Display, Inter and JetBrains Mono load from the Google Fonts CDN via
  `tokens/fonts.css`, so an export needs a network connection on first load. To go fully offline,
  download the three families from fonts.google.com, drop the `.woff2` files into `assets/fonts/`,
  and swap the `@import` in `tokens/fonts.css` for local `@font-face` rules. **Playfair Display
  must include weight 900** — that weight IS the wordmark.
- **Wordmark artwork.** `assets/wordmark/` holds transparent PNGs re-exported from live Playfair
  Display 900, both orientations × six colorways (stacked 1404×1047, horizontal 3691×432). The frames carry a
  small transparent margin so round-letter overshoot and the "g" descender in *Heights* are never
  clipped — that margin reads as built-in clear space. Hand these to print vendors. Everything inside this project sets the mark as live type instead, which
  stays sharp at any size.
- **Claude Code.** `SKILL.md` at the root makes the whole folder loadable as an Agent Skill — drop
  it in `.claude/skills/` and invoke it.
- **`CLAUDE.md`** carries the non-negotiable rules (wordmark is live type, presenter line,
  ticketing copy, mosaic geometry, griffin minimum). Keep it with the folder.

## Caveats
- **No font binaries were supplied.** Playfair Display, Inter and JetBrains Mono load from the Google Fonts CDN — which is what the source deck itself does, and matches the Squarespace-native constraint. No substitution was needed.
- **Monogram and waveform marks have no exported artwork**; the components reproduce the deck's CSS construction exactly.
- Ticketing copy on posters reads **"Free Admission" / "$20 Suggested Donation"**, matching the rendered reference art (which words it "Concert is free / $20 suggested donation").
- Poster/IG components are recreations of the deck's templates. The rendered reference art in `assets/reference/` is the ground truth if there's a discrepancy.
