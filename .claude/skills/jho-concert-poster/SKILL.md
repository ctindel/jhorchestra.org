---
name: jho-concert-poster
description: Build a Jackson Heights Orchestra concert poster (PNG + PDF) from concert data. Picks the Solo, Duo or Trio template by people count and the color, print or bw style, fills it, and renders to pr/<YYYYMMDD>_Concert/. Use for any JHO concert poster request.
---

# jho-concert-poster

Turns a concert JSON into a finished 8.5x11 poster. Most layouts come from the design-system
templates. Where a layout has been rebuilt for the skill, it comes from a skill-owned template
under `templates/` instead. Today that is the online (color) poster for Solo, Duo and Trio; the
print and bw posters still come from the design-system templates and look different. See
"Skill-owned templates".

```bash
cd "$(git rev-parse --show-toplevel)"
node .claude/skills/jho-concert-poster/make-poster.mjs \
  --data <concert.json> [--style color|print|bw[,..]] [--out <dir>] [--scale 3] [--allow-past]
```

**Default run (no `--style`): writes the online poster, the black-and-white print poster AND the website PNG** (5 files),
into `pr/<YYYYMMDD>_Concert/`: `JHO_<iso>_Poster-<Variant>_Online.{pdf,png}`, `JHO_<iso>_Poster-<Variant>_Print-BW.{pdf,png}`
and `JHO_<iso>_Poster-<Variant>_Web.png`. Poster page only; no Instagram squares. Pass `--style` (one value or a
comma list) to build only some. With one style the CLI prints that result object; with the default it prints
`{ "posters": [...] }`. The color poster's entry carries a `web` object (`path`, `width`, `height`, `bytes`).

**Web PNG (`..._Web.png`) is for the Squarespace event page only.** The full poster PNG is 2448x3168 (about 1.4 MB),
too big for a web page. The Web PNG is the same color sheet at 1000 x 1294 px (8.5 x 11 ratio, sRGB, untagged
72 dpi), about 350 KB for the Dec 2026 Duo. It is rendered at a smaller device scale (1000 / 816), not resampled, so
its text is sharp at that size. It is made only from the color (Online) poster: `--style color` writes it, and
`--style print` or `--style bw` does not. Use the PDFs and the hi-res PNGs for print and social. Do not upload the
2448 px PNG to the event page.

**Print-BW is pure black ink on white.** It reuses the design system's own `concert-poster[-duo|-trio]-bw` template, whose
text is already `#000000`. That template drew its rules in `rgba(0,0,0,0.4)` (a grey) and put a 9% grey tint behind tags,
so `make-poster.mjs` (`hardBlackBw`) injects one CSS override into the filled copy: every rule `#000000`, no tint.
`design-system/` is not edited. Photos and the griffin seal keep the template's grayscale treatment (they are
continuous-tone art, not text). Edges of text are antialiased by the rasteriser in the PNG; the PDF is vector with
only `0 0 0` (and white `1 1 1`) colour operators. Note the bw layout is the older design-system layout, not the
online poster's layout (see below).

`--allow-past` is only for rebuilding a poster for a date that has already passed (the May 2026
baseline is one). Without it, a past `iso` is a validation error. "Past" means the date in New York
(the venue's zone), not the machine's zone.

`--scale` must be a finite positive number. `--out` must resolve (after symlinks) to a folder inside
the repo and not inside `design-system/`; a `..` segment is refused. `--out` replaces the whole destination
folder. Without it, the folder is `<repo>/pr/<YYYYMMDD>_Concert/`, where `YYYYMMDD` is the concert's `iso`
with the dashes removed (2026-12-09 -> `pr/20261209_Concert/`). The `iso` is validated first, so an invalid
date writes nothing.

## Intake checklist (ask before building)

When asked for a poster, Claude collects every value below from the user. Never guess a value, and
never reuse the values of an old concert (the May file is a template, not a source of facts). If any
value is missing, ask for it in one message and stop.

1. **Date**: the date, with the weekday, so validation can cross-check it (see Validation).
2. **Time and doors time**: for example `7:30 PM` and `Doors 7:00 PM`.
3. **Venue name** and **venue address** (the address line includes any parking note).
4. **Program title**, for example `Masks & Revelations`.
5. **Program subtitle**, for example `Mystery, celebration, longing, and renewal.`
6. **Repertoire**: 1 to `MAX_WORKS` works (Solo 6, Duo 4, Trio 4), each with composer and work title. A premiere tag is only added
   if the user asks for one.
7. **Conductor**: the name. The title and headshot come from `roster.json`; if the name is not
   there, ask for the title and headshot. The conductor defaults to **Alex Wen** (Artistic Director).
   **Wenqi Li** (Assistant Conductor, headshot registered) conducts only occasionally, usually the
   summer pops concert, so use her only if the user says so. If it is unclear who is conducting, ask.
   Do not infer the conductor from the date or the program.
8. **Soloists**: ask whether there are 0, 1 or 2. For each soloist, ask for the name and the
   instrument (the role shown on the poster). The headshot comes from `roster.json`.

Fixed copy (presenter line, ticketing, donate QR, seal) is not asked for and cannot be changed
from the JSON. It is locked by `design-system/CLAUDE.md`.

## Validation (read this before building)

`make-poster.mjs` checks the concert data before it renders anything, and it reports every problem
in one error. A failed validation exits with status 1 and no files are written.

- **Date.** `iso` must be a real calendar date (`2026-02-30` is rejected). If `dayname` is given it
  must match the real weekday of `iso`. If `date` is given (for example `December 9`) its month and
  day must match `iso`. If either is absent it is derived from `iso`. An `iso` in the past is
  rejected unless `--allow-past` is passed.
- **Time.** `time` looks like `7:30 PM`; `doors` looks like `Doors 7:00 PM`.
- **Works.** 1 to `MAX_WORKS[template]` entries (see "Works per template"). `tag` is optional.
- **People.** Each photo is a file under `design-system/`, written as a plain relative path of ASCII
  letters, digits, `_ - .`, `/` and spaces. Every directory and the file name must match the exact
  case (macOS is case-insensitive, so this is checked explicitly). The path must not be a symlink
  alias, and its real location must stay inside `design-system/`. No two people may share a photo.
- **Roster.** Conductor and soloists resolve from `roster.json` (see "Standing roster"). A missing
  title, instrument or headshot is an error.

**Instruction for Claude: when validation fails, STOP and ask the user which they meant. Never
silently pick one.** For example, if the user says "Wednesday" and `iso` is `2026-12-10` (a
Thursday), the error is:

```
dayname 'Wednesday' does not match 2026-12-10, which is a Thursday. Ask the user which they meant (Wednesday Dec 9 or Thursday Dec 10).
```

Ask the question, quote the error, and wait for the answer. Then fix the JSON to the answer and
run again. Do not pick the weekday, the date, or the year yourself. The same applies to a missing
headshot: ask the user for it and tell them where to put the file, do not use another person's photo.

Run the tests after any change (command in "Verified" below).

## Standing roster (`roster.json`)

`roster.json` keeps each person's title and headshot. A concert names people, so the user only
supplies a name:

```json
{
  "Alex Wen": { "title": "Artistic Director", "photo": "assets/photos/alex-wen.jpg" },
  "Wenqi Li": { "title": "Assistant Conductor", "photo": null }
}
```

- `photo: null` means no headshot is registered yet. A concert that uses that person as conductor
  fails with a message that tells Claude to ask the user for a headshot, where to save it
  (`design-system/assets/photos/wenqi-li.jpg`), and to add it to `roster.json`. Do not invent a
  photo or reuse another person's.
- A soloist's role is the instrument given in the concert JSON, not the roster.
- Soloists need a photo in the roster or an explicit `photo` in the concert JSON, else it fails.

Concert JSON for the roster format (instead of `people[]`):

```json
"conductor": { "name": "Alex Wen" },
"soloists": [ { "name": "Nicholas Pappone", "instrument": "Violin" } ]
```

The conductor entry may override `title` and `photo`; a soloist may override `photo`. A conductor
who is not in the roster needs both `title` and `photo` in the concert JSON. The older `people[]`
format (each `{name, role, photo}`) still works, but the two formats cannot be mixed.

Output (default `<repo>/pr/<YYYYMMDD>_Concert/`, gitignored):

- `JHO_<iso>_Poster-<Solo|Duo|Trio>_<Online|Print-Color|Print-BW>.png` at 2448x3168, tagged 288 dpi in its pHYs chunk (so `sips` and layout tools size it at 8.5x11 in, not 72 dpi). The tag is `816 * scale / 8.5`, so it follows `--scale`.
- `JHO_<iso>_Poster-<...>.pdf` (same name stem as the PNG), one page, 8.5x11 in, vector type, fonts embedded
- `JHO_<iso>_Poster-<Solo|Duo|Trio>_Web.png` (color only): 1000x1294 px, for the event page. See "Web PNG" above. `WEB_WIDTH` in `make-poster.mjs` sets the width.

Rendering goes through `../jho-render/render.mjs`, so the wait and failure rules in that skill apply.

## Choosing the template

| Input | Template |
| --- | --- |
| `people.length` = 1 (conductor only) | **Solo** |
| `people.length` = 2 (conductor + 1 soloist) | **Duo** |
| `people.length` = 3 (conductor + 2 soloists) | **Trio** |
| `--style color` | Online (web/social). **Skill-owned** `templates/solo-online/`, `templates/duo-online/` or `templates/trio-online/`. (The design-system folder `concert-poster[-duo|-trio]` is not used for color any more.) |
| `--style print` | Print-Color (commercial print, white ground). Folder `...-print` |
| `--style bw` | Print-BW (newsprint, all #000). Folder `...-bw` |

Routing is one table, `SKILL_TEMPLATES` in `skill-templates.mjs`, keyed by `"<Variant>/<style>"`.
A pair listed there uses the skill-owned template; every other pair uses the design-system folder
above. Today the table holds `Solo/color`, `Duo/color` and `Trio/color`. So the **print** and **bw**
posters for all three variants still use the design-system templates, which are the older layouts
(a different hero and programme), and they do not match the online poster's look.

More than 3 people is an error (no template exists). The template is checked after rendering: the
desk's `data-finish` must match the style, or the render fails.

## Concert data (`concert.json`)

See `concert.2026-05-20.json` in this folder for the real May 2026 concert. It is also the fill
baseline.

| Field | Example | Notes |
| --- | --- | --- |
| `title` | `100 Years of Trinity Lutheran` | Headline, 32px Playfair 800 in Tandoor. Wraps to as many lines as the layout allows. In the skill-owned Duo online template it is 31px and the part from the first ` & ` on is italic (`Masks <em>& Revelations</em>`), as in the Dec 2026 reference. A title with no ` & ` is set upright. |
| `blurb` | `A centennial concert for the church on 37th Street.` | Italic subline |
| `dayname`, `date` | `Wednesday`, `May 20` | Rendered as `Wednesday · May 20`. Optional: derived from `iso` if absent; validated if present |
| `time`, `doors` | `7:30 PM`, `Doors 7:00 PM` | |
| `venue`, `address` | `Trinity Lutheran Church`, `31-18 37th St, Astoria (parking available)` | |
| `iso` | `2026-05-20` | Used in file names. YYYY-MM-DD |
| `works` | 1 to `MAX_WORKS` (Solo 6, Duo 4, Trio 4) of `{composer, work, tag?}` | `tag` is optional. Without it the row shows no tag. See "Works per template" |
| `conductor`, `soloists` | roster format, see "Standing roster" | Preferred. Names are looked up in `roster.json` |
| `people` | explicit: conductor first, then soloists; each `{name, role, photo}` | Older format, still accepted. Cannot be combined with `conductor`/`soloists`. `photo` is a path under `design-system/` |

Fixed copy, not in the JSON, by the design-system rules in `design-system/CLAUDE.md`:

- Presenter line: **"The Jackson Heights Beautification Group Presents"**
- Ticketing: **"Free Admission"** / **"$20 Suggested Donation"**
- Donate QR, griffin seal, jhorchestra.org / @jhorchestra

Do not put admission or venue-presenter copy in the JSON. The poster never names the venue as presenter.

## How "filling" works (read this before changing templates)

The templates are static HTML. Their only DC props are `markSize` and `finish`. Concert text and
photos are literal markup. The `CONCERT` object in `design-system/ui_kits/print_social/Poster.jsx`
is the React kit's data, not an input to the `.dc.html` templates.

`make-poster.mjs` therefore does an exact-snippet replacement on the template source:

- Each snippet from the May 2026 baseline (`>Alex Wen</span>`, `alt="Alex Wen"`, `>Michael A. Lee</div>`,
  `src="../../assets/photos/…"`, etc.) must occur exactly once in the template. Otherwise the fill throws.
- The entity-escaping matches the source (`&#333;`, `&quot;`, `&middot;`).
- Text values also break every `{{` with an empty comment (`{<!---->{`). The design-system runtime evaluates `{{ x }}`
  in each text node after parsing, so an entity does not help. A person name may not contain a brace at all (it is also
  written into `alt="..."`, which a comment cannot split), and validation refuses it.
- Works-composer and soloist names are separate slots, so a soloist can differ from the premiere composer.
- All replacements are applied in one pass against the original, so a new value cannot match another slot.

Verification of the table has two parts. `node make-poster.mjs --check-baseline` checks uniqueness:
every May 2026 snippet occurs exactly once in each of the eight design-system templates (every pair
except Duo/color). That check fills the May data with itself, so it cannot detect a bad substitution
by itself. The check that can fail is the substitution test in `make-poster.test.mjs`: it fills each
of the eight templates with another concert and asserts that no May text survives and every new text
is present. Run both after any change to a template under `design-system/`. A failure means the
design-system changed and the fill table needs updating. `--check-baseline` also runs the skill-template
check described below.

Skill templates fill in one pass: the template is scanned for slots before any value is inserted, and
replacement text is never scanned again. So a work title like `Ode to $$$` or a blurb that says
`[[venue]]` prints as typed.

## Skill-owned templates (`templates/`, routed by `skill-templates.mjs`)

Used for a layout the skill owns. Three online (color) posters, all in the same language, rebuilt from
the approved Dec 2026 reference (`20261210_JHO_Concert_Poster_Display.png`):

| Variant | Template | Layout |
| --- | --- | --- |
| Solo | `templates/solo-online/ConcertPosterSoloOnline.dc.html` | Conductor only. The programme spans the width; works read down two CSS columns (3 + 2 for five, 3 + 3 for six). |
| Duo | `templates/duo-online/ConcertPosterDuoOnline.dc.html` | Conductor, and one soloist (200px photo) in the right column beside the programme. |
| Trio | `templates/trio-online/ConcertPosterTrioOnline.dc.html` | Conductor, and two soloists stacked in the right column (116px photos, not side by side; caption column 240px at most). |

Every template keeps the same frame: the masthead, the When/Where row, the programme, and the footer.
The design-system is not modified: the templates reuse the design-system runtime
(`templates/concert-poster-duo/support.js` and `ds-base.js`), the Wordmark and MosaicRule components,
fonts, photos and logos by relative path.

- **Fill model.** Every value is a `[[slot]]` token (`title_html`, `blurb`, `when`, `time_line`,
  `venue`, `address`, `conductor_*`; Duo has `soloist_*`; Trio has `soloist_a_*` and `soloist_b_*`).
  The works are the rows between the
  `<!--works-->` and `<!--/works-->` markers, one row per work. Each row has a `[[work_class]]` slot, which the fill
  uses for the Solo column break and leaves empty elsewhere. `skill-templates.mjs` escapes every
  value; the only markup it builds itself is the italic title part and the tag chip. A slot the
  template lacks, a slot with no value, or any unfilled slot throws.
- **Check.** `--check-baseline` fills each of the three templates with the Dec 2026 reference, using
  the people count of its variant (Solo drops the soloist; Trio adds a layout-only second soloist,
  Michael A. Lee with instrument "Cello", that exists in no concert). It checks that every slot is
  filled, no placeholder survives, the reference text is present (the italic "& Revelations",
  "Wednesday · December 9", "Artistic Director", each person's name and role, the works), and
  "December 10" does not appear. A token template has no byte-identity to keep, so this is the check.
- **Serving.** Each template is served from memory at `/jho-concert-poster/<variant>-online/...` with the
  design-system folder as site root, so `../../` reaches the design-system root. Opening the file
  directly from disk will not resolve its assets.
- **Extending.** To add a variant: add a template folder under `templates/`, a `SKILL_TEMPLATES`
  entry, a people count in `PEOPLE_FOR_VARIANT`, a values function in `VALUES_FOR_VARIANT`
  (`skill-templates.mjs`), and a fixture in `skillFixture` (`make-poster.mjs`). Routing and the fill
  check are generic over the table.
- **Layout measured in the DOM, refused at render.** `writePoster` runs `layoutProblems` on the live page for
  every skill-owned poster and refuses a breach (see "Limits"). The Chromium tests call the same functions.
- **Comments in the template must not contain `[[`.** The fill replaces every occurrence, so a slot
  name written in a comment would be filled too. The header lists slot names without brackets.

## Limits

Every limit here is enforced. A count over `MAX_WORKS` fails validation. A text limit is found by Chromium:
`writePoster` measures the rendered poster with `layoutProblems` and writes nothing when a rule breaks. The
message names the element and the number, for example "programme ends at y=954.5, less than 10px above the
footer rule at y=944.0: shorten the title or blurb, or use fewer works". A refused poster leaves no PNG or PDF.
The rules live in `make-poster.mjs` (`LAYOUT`, `layoutInPage`, `layoutProblems`), and the tests use the same functions.

The rules, for the skill-owned online templates:

- The sheet does not overflow.
- Each text element's own box holds its text (title, composer, piece, tag, names, roles, the Where line).
- Text stays between x = 41 and x = 775 (the 47px margin, plus the 6px the approved Where line already uses).
- The programme and each soloist block sit at least 10px below the divider and 10px above the footer rule.
- Programme text stays at least 10px left of the soloist column.
- A soloist name wraps to two lines at most.
- Every text is set in a face that loaded. A fallback face would move every line, so a missing face is named, not measured.

Limits found by measurement. "Reference text" is the Dec 2026 concert: a one-line blurb and short work titles.

- **Works by count** (`MAX_WORKS`): Solo 6, Duo 4, Trio 4. Solo sets 6 as 3 + 3. Duo and Trio overflow the footer rule at 5.
- **Blurb length.** A blurb that wraps to two lines (the test blurb is 146 characters, at 18px in the programme column)
  with 4 works is refused in Duo and Trio: the programme ends 7px above the footer rule. In Solo, a two-line blurb with 5 works is refused.
- **Tagged works whose pieces wrap.** A long piece title with a tag adds lines. Four such works fit in Duo, Trio and Solo
  with the one-line title. In Duo, the same works with a two-line title are refused (the Trio and Solo combination was not measured).
- **Solo, five or six works.** The split is 3 + 2 and 3 + 3 (see "Works per template"). Five works fit with short
  titles and a one-line blurb. A long first-column title, or a two-line blurb, makes the first column too tall and
  it is refused.
- **Trio soloist names.** The caption column is 240px at most, and it grows to fit a shorter name. A name up to about
  18 characters sets on one line: "Alexandra Pappone" measures 215px. A longer name wraps, and the two caption blocks
  then run past the band between the divider and the footer rule, so the poster is refused. "Alexander Pappone-Lee"
  and "Maria Esperanza Vidal-Ortega" are refused in Trio.
- **Duo soloist names.** The caption column is 200px. A long name wraps to two lines and the poster is written
  ("Maria Esperanza Vidal-Ortega" in the Duo test fixture).
- **The Where line.** One line, and it may reach x = 775. The reference venue "Blessed Sacrament Church" already
  reaches x = 774.8, so the margin is used up. "Our Lady of Sorrows Parish Hall" fits. "St. Joseph Hall of the Jackson
  Heights Community" is refused (text to x = 927).
- **Names with a brace** (`{` or `}`) are refused by validation. A name is also written into `alt="..."`, where the
  runtime evaluates `{{ }}` and a comment cannot split it.
- **Photos** are validated as before. Portrait photos work best: the frames crop with `object-fit: cover`.

## Works per template

`MAX_WORKS` is the most that fit with the reference text, measured in Chromium at 816 x 1056 (the sheet at 96 px/in).
"Clear" is the free space between the programme's last line and the footer rule (rule at y = 944; the rule's clearance
is 10px). The Solo split is forced at ceil(n / 2) works in the first column.

| Template | Works that fit | Works that do not | Programme box, reference text | Clear above footer |
| --- | --- | --- | --- | --- |
| Solo | 1 to 6 | none in the count | 1: 662-819; 3 and 4: 615-867; 5 and 6: 568-914 | 125 / 77 / 30 px |
| Duo | 1 to 4 | 5 overflows | 1: 673-808; 3: 603-879; 4: 568-914 | 136 / 65 / 30 px (soloist block ends 871) |
| Trio | 1 to 4 | 5 overflows | 1: 673-808; 3: 603-879; 4: 568-914 | 136 / 65 / 30 px (soloist block ends 924, 20px clear) |

Re-measure after any layout change: `layoutInPage` and `layoutProblems` give the boxes and the verdict, and the
layout matrix in `make-poster.test.mjs` pins which fixtures are written and which are refused.

## Known template quirks

- The design-system `ConcertPosterDuo` print and bw templates label the second person as **Composer**
  (Michael A. Lee, the May premiere composer). Set `people[1].role` to what you want shown. The
  skill-owned Duo online template shows the soloist's instrument as given, so this does not apply to color.
- Titles wrap to as many lines as the layout allows. The Dec 2026 title fits on one line in Duo; a longer title
  wraps, and the render check decides whether the programme still fits.
- `design-system/ui_kits/print_social/Poster.jsx` CONCERT has `admission: 'Free admission'` (lowercase). The locked copy in `design-system/CLAUDE.md` is "Free Admission". The templates use the locked copy. The kit's data is not used by these templates.
- The solo template shows Alex Wen only (conductor). Good. The duo and trio templates show Alex Wen as conductor too.
- **Solo column split.** The works are in two CSS columns with a forced break before the first work of column 2
  (`jho-col-start`, at ceil(n / 2)). So 3 works read 2 + 1, 4 read 2 + 2, 5 read 3 + 2 and 6 read 3 + 3, whatever
  their heights. Column balancing alone was tried first and rejected: after a tall first work it gave 1 + 2.
- **Solo with one work.** The one work sits alone in the left column and the rest of the programme band is empty.
  The type scale is the same as with four works; nothing is added to fill it. Judged acceptable for a single-work
  programme; revisit if it recurs.
- **Trio soloists are stacked, not side by side.** Two columns would need about 400px for the captions and squeeze
  the programme, so each photo is 116px (Duo's is 200px). The caption column is 240px at most (see Limits).
- **A wrapped piece can split "Op." from its number** ("Op." at the end of one line, "43" on the next). The text is
  set as given; the skill does not insert non-breaking spaces.
- The Trio layout fixture adds "Michael A. Lee, Cello" in the baseline check and in the layout tests. It is
  not a fact about any concert; it only gives the template its second soloist.

## Verified

Tests: `node --test .claude/skills/jho-concert-poster/*.test.mjs` (use the glob: on Node 24, `node --test <directory>`
fails with "Cannot find module"). The Chromium tests render each layout fixture once, through the same
`writePoster` path the CLI uses, so the file takes about 45 seconds. They cover: dates; time; works and `MAX_WORKS`;
photos (case, symlinks, canonical path); roster; `esc` (astral characters, and braces: a title of `{{ markSize }}`
shows literally in the rendered sheet); the design-system uniqueness and substitution checks; routing; the skill
fill check and loud-failure paths; the layout matrix (each fixture is written clean or refused with the rule named,
and the expected verdict is listed in the test file); the Solo column order by bounding boxes; the Trio caption
width; the font-face judgement; the CLI entry point run through a symlinked file and a symlinked folder; the CLI
output (288 dpi PNG at 2448x3168, one-page Letter PDF); the Web PNG (1000 x 1294, PNG signature, under 700 KB, color
only); and the `--scale` and `--out` checks.

The Dec 2026 Duo poster is re-rendered after each template change. Its decoded pixels are identical to
`pr/20261209_Concert/JHO_2026-12-09_Poster-Duo_Online.png` (2448x3168, 288 dpi tag).

Duo online (`concert.2026-12-09.json`) was rebuilt to the Dec 2026 reference. Measured against the
reference converted to sRGB (its embedded profile is Adobe RGB (1998)):

- Ink bands match within about 1px for the masthead, wordmark block, rules, When/Where, the title and
  works, the soloist column and the footer. Photos are 200px with 5px corners (the reference's corner
  measures about 5px). The title is 289.6px wide against the reference's 289.1px.
- The mean absolute difference over the 816x1056 sheet is 6.4 (0-255). The rest of the difference is
  text antialiasing and photo resampling, plus the residuals listed below.
- Visible remaining differences: the Donate QR (see below); the wordmark sits about 1-3px differently
  in height (the reference glyphs are a few percent taller while its width matches Wordmark at 93px);
  the reference photos are a touch warmer, which is the color conversion of the reference file.
- The reference's QR is not the design-system's QR. Its module pattern agrees with
  `assets/qr/donate-on-paper.png` on about 79% of cells, so it is not the same code. The skill keeps the
  locked design-system QR and does not substitute one.
- The PDF text reads "Wednesday · December 9" and has no "December 10". The role is in the PDF as
  letter-spaced caps ("A R T I S T I C D I R E C TO R").

Earlier renders from the May 2026 data (solo color, duo bw, trio print) were checked visually in an
earlier session, before the skill-owned template existed.

Solo and Trio online were rebuilt in the Duo language and checked by viewing their renders at every works count the
limit allows (Solo 1 to 6, Duo and Trio 1 to 4) and at the stress cases in "Limits". Solo drops the soloist; Trio adds the
layout-only second soloist.

## Output

Files are written to `<repo>/pr/<YYYYMMDD>_Concert/` (the concert's date, or the `--out` folder). Do not commit
them. `pr/` is in the root `.gitignore`.
