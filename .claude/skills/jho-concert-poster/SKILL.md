---
name: jho-concert-poster
description: Build a Jackson Heights Orchestra concert poster (PNG + PDF) from concert data. Picks the Solo, Duo or Trio template by people count and the color, print or bw style, fills it, and renders to pr/<YYYYMMDD>_Concert/. Use for any JHO concert poster request.
---

# jho-concert-poster

Turns a concert JSON into a finished 8.5x11 poster. Most layouts come from the design-system
templates. Where a layout has been rebuilt for the skill, it comes from a skill-owned template
under `templates/` instead. Today that is Duo online (color); see "Skill-owned templates".

```bash
cd "$(git rev-parse --show-toplevel)"
node .claude/skills/jho-concert-poster/make-poster.mjs \
  --data <concert.json> --style color|print|bw [--out <dir>] [--scale 3] [--allow-past]
```

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
6. **Repertoire**: 1 to 4 works, each with composer and work title. A premiere tag is only added
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

- `JHO_<iso>_Poster-<Solo|Duo|Trio>_<Online|Print-Color|Print-BW>.png` at 2448x3168 (288 dpi)
- `JHO_<iso>_Poster-<...>.pdf`, one page, 8.5x11 in, vector type, fonts embedded

Rendering goes through `../jho-render/render.mjs`, so the wait and failure rules in that skill apply.

## Choosing the template

| Input | Template |
| --- | --- |
| `people.length` = 1 (conductor only) | **Solo** |
| `people.length` = 2 (conductor + 1 soloist) | **Duo** |
| `people.length` = 3 (conductor + 2 soloists) | **Trio** |
| `--style color` | Online (web/social). Folder `concert-poster[-duo|-trio]`, **except Duo, which is the skill-owned `templates/duo-online/`** |
| `--style print` | Print-Color (commercial print, white ground). Folder `...-print` |
| `--style bw` | Print-BW (newsprint, all #000). Folder `...-bw` |

Routing is one table, `SKILL_TEMPLATES` in `skill-templates.mjs`, keyed by `"<Variant>/<style>"`.
A pair listed there uses the skill-owned template; every other pair uses the design-system folder
above. Today the table holds only `Duo/color`.

More than 3 people is an error (no template exists). The template is checked after rendering: the
desk's `data-finish` must match the style, or the render fails.

## Concert data (`concert.json`)

See `concert.2026-05-20.json` in this folder for the real May 2026 concert. It is also the fill
baseline.

| Field | Example | Notes |
| --- | --- | --- |
| `title` | `100 Years of Trinity Lutheran` | Headline, 32px Playfair 800 in Tandoor. Wraps to 2 lines in Trio. In the skill-owned Duo online template it is 31px and the part from the first ` & ` on is italic (`Masks <em>& Revelations</em>`), as in the Dec 2026 reference. A title with no ` & ` is set upright. |
| `blurb` | `A centennial concert for the church on 37th Street.` | Italic subline |
| `dayname`, `date` | `Wednesday`, `May 20` | Rendered as `Wednesday · May 20`. Optional: derived from `iso` if absent; validated if present |
| `time`, `doors` | `7:30 PM`, `Doors 7:00 PM` | |
| `venue`, `address` | `Trinity Lutheran Church`, `31-18 37th St, Astoria (parking available)` | |
| `iso` | `2026-05-20` | Used in file names. YYYY-MM-DD |
| `works` | 1 to 4 of `{composer, work, tag?}` | `tag` is optional. Without it the row shows no tag. See "Works per template" |
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

Used for a layout the skill owns. `templates/duo-online/ConcertPosterDuoOnline.dc.html` is the Duo
online (color) poster, rebuilt from the approved Dec 2026 reference (`20261210_JHO_Concert_Poster_Display.png`).
The design-system is not modified: the template reuses the design-system runtime
(`templates/concert-poster-duo/support.js` and `ds-base.js`), the Wordmark and MosaicRule components,
fonts, photos and logos by relative path.

- **Fill model.** Every value is a `[[slot]]` token (`title_html`, `blurb`, `when`, `time_line`,
  `venue`, `address`, `conductor_*`, `soloist_*`). The works are the rows between the
  `<!--works-->` and `<!--/works-->` markers, one row per work. `skill-templates.mjs` escapes every
  value; the only markup it builds itself is the italic title part and the tag chip. A slot the
  template lacks, a slot with no value, or any unfilled slot throws.
- **Check.** `--check-baseline` fills the template with `concert.2026-12-09.json` and checks that
  every slot is filled, no placeholder survives, the reference text is present (the italic
  "& Revelations", "Wednesday · December 9", "Artistic Director", the violin soloist, the works), and
  "December 10" does not appear. A token template has no byte-identity to keep, so this is the check.
- **Serving.** The template is served from memory at `/jho-concert-poster/duo-online/...` with the
  design-system folder as site root, so `../../` reaches the design-system root. Opening the file
  directly from disk will not resolve its assets.
- **Extending.** To rebuild Solo or Trio: add a template folder under `templates/`, a
  `SKILL_TEMPLATES` entry, and a values function in `skill-templates.mjs`. The routing and the
  `--check-baseline` fill check are generic over the table.
- **Comments in the template must not contain `[[`.** The fill replaces every occurrence, so a slot
  name written in a comment would be filled too. The header lists slot names without brackets.

## Limits

- Text slots are fixed to the template. Works are 1 to 4 (see below). You cannot add a soloist to
  Solo or change the layout. Those need a template edit in `design-system/`.
- The works list is generated from the template's own row markup (three rows, the middle one with
  the tag). `--check-baseline` proves the generated rows reproduce the May rows exactly.

## Works per template

`MAX_WORKS` in `make-poster.mjs` is 4 for Solo, Duo and Trio. Measured in Chromium at 816x1056,
for color, print and bw. The number is the free space from the last work row to the footer divider
(positive is inside the box):

| Template | 3 works | 4 works | 5 works |
| --- | --- | --- | --- |
| Solo | 55 px | 16 px | -62 px (overflows) |
| Duo | 71 px | 38 px | -10 px (overflows) |
| Trio | 71 px | 38 px | -10 px (overflows) |

Five works overflow Duo and Trio into the footer divider and Solo badly, so 5 is rejected.
The skill-owned Duo online template (above) is laid out differently: with 4 works the last work's
ink ends at y 914 and the footer rule is at y 944, about 30px free. Re-measure it if its layout changes.
- Long titles can wrap (the Trio title already wraps to two lines). Check the PNG.
- Portrait photos must be 1:1 friendly. Template frames use `object-fit: cover`, so landscape shots are cropped.
- The BW output swaps photos for `assets/photos/bw/` only through the template's own CSS filter
  (`[data-finish="print-bw"] .jho-photo img`). It does not use the baked `bw/` PNG copies. Check the
  BW PNG for photo quality and greyscale.

## Known template quirks (found during verification)

- The design-system `ConcertPosterDuo` print and bw templates label the second person as **Composer**
  (Michael A. Lee, the May premiere composer). Set `people[1].role` to what you want shown. The
  skill-owned Duo online template shows the soloist's instrument as given, so this does not apply to color.
- The Trio title wraps to two lines under the 2-column programme (seen in the rendered trio PNG). The layout still fits the sheet.
- `design-system/ui_kits/print_social/Poster.jsx` CONCERT has `admission: 'Free admission'` (lowercase). The locked copy in `design-system/CLAUDE.md` is "Free Admission". The templates use the locked copy. The kit's data is not used by these templates.
- The solo template shows Alex Wen only (conductor). Good. The duo and trio templates show Alex Wen as conductor too.

## Verified

Tests: `node --test .claude/skills/jho-concert-poster/*.test.mjs` (no rendering). Use the explicit glob:
on Node 24, `node --test <directory>` fails with "Cannot find module". The suite runs 79 tests: date
(New York today), the default `pr/<YYYYMMDD>_Concert/` folder and its date checks, time, works, photos (case, symlinks, canonical path), roster, `esc` (astral
characters), `$` and `[[slot]]` text in user values, the design-system uniqueness check and substitution
test (eight templates), Duo online routing, the skill template's fill check and loud-failure path,
and the `--scale` and `--out` argument checks. The `--out` and photo symlink tests create fixtures under
`.claude/skills/jho-concert-poster/` and remove them afterwards.

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

## Output

Files are written to `<repo>/pr/<YYYYMMDD>_Concert/` (the concert's date, or the `--out` folder). Do not commit
them. `pr/` is in the root `.gitignore`.
