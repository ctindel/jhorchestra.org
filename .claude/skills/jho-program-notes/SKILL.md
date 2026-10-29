---
name: jho-program-notes
description: Build the JHO concert program booklet from design-system/uploads/Jackson Heights Orchestra Branding/JHO Program Booklet.html into two PDFs. A print PDF imposed for fold-and-staple (US Letter landscape sheet sides, blank-padded to a multiple of 4) and a web PDF with single pages in reading order (5.5 x 8.5 in). Use for any request to print, export or post the concert program.
---

# jho-program-notes

Turns the program booklet HTML into two PDFs in `<repo>/out/`:

| File | What it is |
| --- | --- |
| `JHO-program-print-letter-landscape.pdf` | **Print.** Imposed for fold-and-staple. 6 PDF pages = 3 sheets x 2 sides. Each PDF page is US Letter landscape (11 x 8.5 in) holding two 5.5 x 8.5 in leaves. |
| `JHO-program-web.pdf` | **Web.** 12 single pages in reading order (cover first, back cover last), each 5.5 x 8.5 in. |

Both are vector, with fonts embedded. Rendering goes through `../jho-render/render.mjs`, so its
network and font rules apply.

## Booklet facts (from the source and the reference PDFs)

- Source: 6 `<section class="page">` spreads in `<doc-page>`, each spread = 2 leaves. That is **12 leaves**.
- Leaf = **5.5 x 8.5 in** (528 x 816 CSS px). This matches the reference `program-singlepage-mockup.pdf`
  (12 pages, 396 x 612 pt).
- Print sheet = **11 x 8.5 in landscape US Letter**. This matches the reference `program-v14.pdf`
  (6 landscape pages, 792 x 611 pt).
- Physical order (1-based): 1 front cover, 2 Welcome, 3 Program, 4 Overture notes, 5 Cognoscent notes,
  6 Symphony notes, 7 Roster, 8 Giving, 9 Donors, 10 Acknowledgments, 11 Save the Date, 12 back cover.
- Folio on page p is **p - 1** (Program shows `2`, Save the Date shows `10`). Welcome shows the word `Welcome`.
  Covers have no folio.

## Print sheet layout (fold-and-staple)

Physical pages are padded to a multiple of 4 with white blanks. The blanks go before the back cover,
so the back cover stays the last physical page. The source already has 12 pages, so no blanks are added.

Sheet sides, `[left | right]` as physical page numbers (for 12 pages):

| PDF page | Sheet | Side | Left | Right |
| --- | --- | --- | --- | --- |
| 1 | 1 | front | 12 (back cover) | 1 (front cover) |
| 2 | 1 | back | 2 | 11 |
| 3 | 2 | front | 10 | 3 |
| 4 | 2 | back | 4 | 9 |
| 5 | 3 | front | 8 | 5 |
| 6 | 3 | back | 6 | 7 |

General rule for P padded pages, sheet s = 0, 1, ... (P/4 - 1): front `[P-2s | 2s+1]`, back `[2s+2 | P-2s-1]`.

**Paper:** US Letter, **landscape**, 11 x 8.5 in. Print at 100% (no "fit to page" or scaling). Any
paper weight that folds cleanly works. Leaves have white paper and no bleed.

**Duplex:** two-sided printing, **flip on the short edge** (the sheet turns over left-to-right, like a
book page). For landscape sheets the short edges are the left and right edges. Printer dialogs name this
differently (for example "Short-edge binding" in some macOS and Chrome dialogs), so check with a proof:
print sheet 1 two-sided. Hold it landscape with the side showing `12 | 1` facing you, and turn it over
by moving the right edge to the left. The side that now faces you should read `2 | 11` with both pages
upright. If it reads upside down, change the flip setting.

**Fold and staple:** fold each sheet in half along the vertical centre line, nest the sheets
(sheet 1 outermost), and staple 2 or 3 times along the fold.

**Not verified here:** the printed, folded result. The generator and checker verify the PDF, not a
physical print. Run one proof before a full print run.

## Commands

One-time setup (jho-render must be installed first; it is the renderer). Poppler is required for the
checker and for the page count check: `brew install poppler` (macOS) or your system's poppler package.

```bash
cd "$(git rev-parse --show-toplevel)/.claude/skills/jho-render" && npm install && npx playwright install chromium
cd "$(git rev-parse --show-toplevel)/.claude/skills/jho-program-notes" && npm install   # pdf-lib, local to this skill
```

Build both PDFs (default source and output):

```bash
cd "$(git rev-parse --show-toplevel)"
node .claude/skills/jho-program-notes/make-program-notes.mjs
```

Options: `--source <booklet.html>` (default: the booklet in `design-system/uploads/...`), `--out <dir>`
(default `<repo>/out`), `--timeout <ms>` (per spread, default 60000).

It prints JSON with the page counts, sizes and the sheet map. Expect:

```text
"web":   pages 12, 396 x 612 pt
"print": pages 6,  792 x 612 pt, sides [[12,1],[2,11],[10,3],[4,9],[8,5],[6,7]]
```

Check the result (renders both PDFs back to pixels and compares them with the source order):

```bash
node .claude/skills/jho-program-notes/check-order.mjs \
  --web out/JHO-program-web.pdf --print out/JHO-program-print-letter-landscape.pdf [--dpi 30] \
  [--cover-marker "Beautification Group presents"] [--mission-marker "Our Mission"]
```

`--cover-marker` and `--mission-marker` identify the web pages from their text. They are matched ignoring case
and whitespace. The defaults are the current booklet's wording. Change them if the booklet's wording changes. A
wrong marker fails the web check.

Exit 0 and `PASS` mean the order and sizes are right. Exit 1 lists each mismatch. Tests:
`node --test .claude/skills/jho-program-notes/make-program-notes.test.mjs` (builds into a scratch folder).

Quick text check on the web file (the last line is the folio on pages 2-11; the covers have none and
show their footer line instead):

```bash
for p in $(seq 1 12); do printf "p$p: "; pdftotext -f $p -l $p -layout out/JHO-program-web.pdf - | grep -v '^\s*$' | tail -1; done
```

Use `pdfinfo out/JHO-program-print-letter-landscape.pdf` to confirm 6 pages, 792 x 612 pt.

## How it works

1. **Render.** `make-program-notes.mjs` renders each spread to a 1056 x 816 px (11 x 8.5 in) PDF with
   `renderPage` from `jho-render/render.mjs`. It injects a CSS rule that hides the other spreads. The
   source file is not modified. The render waits for a quiet DOM and for the page to load. It fails if the
   visible spread does not have exactly 2 `.leaf` children, or if a font that spread shows (Playfair Display,
   Inter) did not load. Hidden spreads show no fonts, so they are not checked. Spreads are counted by the
   class token `page` (`class="page cover"` counts), not by the exact attribute.
2. **Embed and clip.** Each spread PDF is embedded once with pdf-lib. A leaf is drawn by placing its spread
   so the wanted half lands in the target box, with a clip path to that box. Text and vectors stay vector.
3. **Order.** The source's first spread is the closed-book cover spread (back cover left, front cover
   right), so the DOM reads `[back, front, p2, ...]`. Physical order is therefore `[front, p2, ..., back]`.
4. **Impose.** Physical pages are blank-padded to a multiple of 4 and laid out as sheet sides (the table above).
5. **Web.** The same leaves are written as single 5.5 x 8.5 in pages in reading order, with no blanks.

## Verification

`check-order.mjs` checks the output PDFs without trusting the generator's arithmetic:

- **Web:** each page's text is read with pdftotext. "Beautification Group presents" must be on page 1,
  "Our Mission" on the last page, and each folio must equal page - 1 (`Welcome` is page 2).
- **Print:** each half of each sheet side is rasterized at 30 dpi and compared, pixel for pixel, with the
  rasterized web pages. Blank halves are detected as white. Each half must match the expected page, and
  every PDF page must be 792 x 612 pt.

Text is used only for the web file. For the print file, pdftotext folio extraction is unreliable (see
quirks), so it is not used there.

## Quirks and requirements

- **Network is required**, as for jho-render. The booklet loads Playfair Display and Inter from Google Fonts.
  If they do not load the render fails. It never falls back to a system font. Only `fonts.googleapis.com`
  and `fonts.gstatic.com` are requested, both on the jho-render egress allowlist.
- **Odd dpi.** At a dpi where a leaf is not a whole number of pixels (33 dpi: 5.5 in = 181.5 px), the right-hand
  half is anti-aliased differently. The checker compares each half with up to one pixel of shift and requires the
  best match to be close (mean difference 6 or less) and clearly better than the runner-up (less than half of it).
  At 30 and 33 dpi the program passes. Other dpi values are untested.
- **QR code is a placeholder.** The giving page's `.qr` is a striped CSS pattern, not a scannable code.
  Both PDFs carry it. Replace it with a real QR for `jhorchestra.org/donate` before printing. The checker
  cannot detect this.
- **Fonts are embedded as Type 3** (Chromium's PDF output, same as jho-render). Most print shops accept
  this, but ask if a vendor requires TrueType or CFF.
- **`dc: false` in jho-render.** The booklet is plain HTML with no design-system runtime, so the usual
  wait for `window.React` never completes. This skill passes `dc: false` to `renderPage`. That option was
  added to `jho-render/render.mjs` (default `true`, so other callers are unchanged).
- **Wording drift from the reference PDFs.** `program-v14.pdf` says "through its live performances" in the
  mission text. The source says "through live performance". The source is treated as authoritative. Re-check
  any text before printing.
- **pdftotext folio extraction on print halves is unreliable.** Letter-spaced folios come out split (folio 10
  reads as `1 02`), and footers overlap the folio strip. This is why the checker uses pixels for print.
- **Padding is only exercised by a synthetic input.** The real source has 12 pages, so no blanks are added.
  The blank path was tested with a 10-leaf copy of the source in a scratch folder. Physical 10 and 11
  are blank, and the back cover stays at physical 12. The sheet map was `sheet 1 front 10 | 1`,
  `sheet 1 back 2 | blank`, `sheet 2 front blank | 3`, `sheet 2 back 4 | 9`, and the checker passed.
- **Hairline fix.** A drawn leaf's clip edge can leave a faint 1-px line in the neighbouring half. Blank
  halves are therefore painted white last. This was found by pixel measurement during testing.
- **The reference PDFs are not generated by this skill.** `program-v14.pdf` was made on macOS (Quartz) and
  is not a source for this build. It is used only to confirm the page and sheet sizes.

## Files

- `make-program-notes.mjs` builds both PDFs. Exports `physicalPages`, `padToMultipleOf4`, `sheetSides`,
  `buildProgramNotes` for reuse.
- `check-order.mjs` checks the web and print PDFs.
- `package.json`, `package-lock.json`, `node_modules/` (pdf-lib only; `node_modules` is git-ignored).
