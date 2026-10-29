#!/usr/bin/env node
/**
 * jho-program-notes — build the JHO concert program from the program booklet HTML.
 *
 * Writes two PDFs into <out> (default <repo>/out):
 *   JHO-program-print-letter-landscape.pdf  Fold-and-staple imposition. Each PDF page is one side of one
 *                                           sheet: US Letter landscape, 11 x 8.5 in, two 5.5 x 8.5 in leaves.
 *   JHO-program-web.pdf                     Single pages in reading order, 5.5 x 8.5 in each.
 *
 * CLI:
 *   node make-program-notes.mjs [--source <booklet.html>] [--out <dir>] [--timeout 60000]
 *
 * Pipeline:
 *   1. Each <section class="page"> spread is rendered to a 1-page PDF (11 x 8.5 in) by ../jho-render/render.mjs.
 *      Other spreads are hidden with an injected CSS rule; the source file itself is not modified.
 *   2. Each spread is embedded once with pdf-lib. A leaf is drawn by placing the spread so the wanted half
 *      lands in the target box, with a clip path to that box. Vector content, fonts stay embedded.
 *   3. Leaves are put in physical page order and, for print, padded to a multiple of 4 with blanks and
 *      imposed as sheet sides (see physicalPages / padToMultipleOf4 / sheetSides).
 *
 * Source convention: the first spread is the closed-book cover spread (back cover on the left, front cover
 * on the right), so the leaves in the DOM read [back, front, p2, p3, ... ]. Physical order is therefore
 * [front, p2, ..., last inside page, back]. See SKILL.md.
 */
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PDFDocument, pushGraphicsState, popGraphicsState, rectangle, clip, endPath, rgb,
} from 'pdf-lib';
import { renderPage } from '../jho-render/render.mjs';

const SKILL_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(SKILL_DIR, '../../..');
export const DEFAULT_SOURCE = path.join(
  REPO, 'design-system', 'uploads', 'Jackson Heights Orchestra Branding', 'JHO Program Booklet.html',
);
export const DEFAULT_OUT = path.join(REPO, 'out');

/** Leaf = one booklet page, 5.5 x 8.5 in (528 x 816 CSS px, 396 x 612 pt). */
export const LEAF_PT = { w: 396, h: 612 };
/** Sheet side = one spread, 11 x 8.5 in landscape Letter (1056 x 816 CSS px, 792 x 612 pt). */
export const SHEET_PT = { w: 792, h: 612 };
const SPREAD_PX = { width: 1056, height: 816 };

export const PRINT_NAME = 'JHO-program-print-letter-landscape.pdf';
export const WEB_NAME = 'JHO-program-web.pdf';

/**
 * Physical page order as DOM leaf indices (0-based). Entry i is the leaf printed on physical page i+1.
 * DOM leaves are [back, front, p2, ..., p(n-1)], so physical = [1, 2, ..., n-1, 0].
 * @param {number} leafCount
 * @returns {number[]}
 */
export function physicalPages(leafCount) {
  if (leafCount < 2) throw new Error(`need at least 2 leaves, got ${leafCount}`);
  const pages = Array.from({ length: leafCount - 1 }, (_, i) => i + 1);
  pages.push(0);
  return pages;
}

/**
 * Pad to a multiple of 4 with blank pages (null). Blanks go before the back cover, which stays last.
 * @param {(number|null)[]} pages
 */
export function padToMultipleOf4(pages) {
  const total = Math.ceil(pages.length / 4) * 4;
  const back = pages[pages.length - 1];
  return [...pages.slice(0, -1), ...Array(total - pages.length).fill(null), back];
}

/**
 * Imposition for saddle-stitch on landscape sheets, flipped so the back is upright after a book-style turn.
 * Returns one [left, right] pair per PDF page, in print order: front and back of sheet 1, then sheet 2, etc.
 * With 12 physical pages: sheet 1 front 12|1, back 2|11; sheet 2 front 10|3, back 4|9; sheet 3 front 8|5, back 6|7.
 * @param {(number|null)[]} padded  Length must be a multiple of 4.
 * @returns {Array<[number|null, number|null]>}
 */
export function sheetSides(padded) {
  const P = padded.length;
  if (P % 4 !== 0) throw new Error(`page count ${P} is not a multiple of 4`);
  const sides = [];
  for (let s = 0; s < P / 4; s++) {
    sides.push([padded[P - 1 - 2 * s], padded[2 * s]]);
    sides.push([padded[2 * s + 1], padded[P - 2 - 2 * s]]);
  }
  return sides;
}

/** 1-based physical page number for a DOM leaf index (for reporting). */
function physicalNumber(dom, leafCount) {
  if (dom === null) return 'blank';
  return dom === 0 ? leafCount : dom;
}

/** Fill a leaf-sized box with white paper (used for blank pages). */
function paintWhite(page, x) {
  page.drawRectangle({ x, y: 0, width: LEAF_PT.w, height: LEAF_PT.h, color: rgb(1, 1, 1), borderWidth: 0 });
}

/** Draw DOM leaf `dom` with its box's lower-left corner at (x, 0). The spread is clipped to the box. */
function drawLeaf(page, spreads, dom, x) {
  const spread = spreads[dom >> 1];
  const side = dom & 1; // 0 = left half of the spread, 1 = right half
  page.pushOperators(
    pushGraphicsState(),
    rectangle(x, 0, LEAF_PT.w, LEAF_PT.h),
    clip(),
    endPath(),
  );
  page.drawPage(spread, { x: x - side * LEAF_PT.w, y: 0, width: SHEET_PT.w, height: SHEET_PT.h });
  page.pushOperators(popGraphicsState());
}

/** Google Fonts the booklet uses. A spread that shows text in one of these must have it loaded. */
const GOOGLE_FAMILIES = ['Playfair Display', 'Inter'];

/**
 * Number of spreads in a source: <section> elements whose class list contains the token "page".
 * A token match, so class="page cover" counts and class="pages" or class="subpage" does not.
 * @param {string} html
 * @returns {number}
 */
export function countSpreads(html) {
  let n = 0;
  for (const m of html.matchAll(/<section\b([^>]*)>/gi)) {
    const cls = /\sclass\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(` ${m[1]}`);
    if ((cls?.[1] ?? cls?.[2] ?? '').split(/\s+/).includes('page')) n++;
  }
  return n;
}

/** Fail loud if the source's spread structure is not what the leaf mapping assumes. */
function checkSpreadDom(html) {
  const spreads = countSpreads(html);
  if (spreads < 1) throw new Error('no <section class="page"> spreads found in source');
  if ((html.match(/<\/head>/g) || []).length !== 1) throw new Error('expected exactly one </head> in source');
  return spreads;
}

/** Render each spread to a 1-page PDF. Returns the file paths in spread order. */
async function renderSpreads(source, spreadCount, workDir, timeoutMs) {
  const html = await readFile(source, 'utf8');
  const dir = path.dirname(source);
  const name = path.basename(source);
  const files = [];
  for (let k = 1; k <= spreadCount; k++) {
    const css = `<style>section.page:not(:nth-of-type(${k})){display:none !important}</style>`;
    const file = path.join(workDir, `spread-${String(k).padStart(2, '0')}.pdf`);
    await renderPage({
      root: dir,
      pagePath: '/' + name,
      html: html.replace('</head>', css + '\n</head>'),
      width: SPREAD_PX.width,
      height: SPREAD_PX.height,
      scale: 1,
      dc: false, // plain HTML, no design-system runtime
      timeoutMs,
      pdf: file,
      // requireFonts: [] because a hidden spread uses no fonts and so never loads them. The fonts this
      // spread actually shows are checked below instead.
      requireFonts: [],
      assertions: (page) => page.evaluate((args) => {
        const secs = [...document.querySelectorAll('doc-page > section.page')];
        const visible = secs.filter((s) => getComputedStyle(s).display !== 'none');
        const v = visible[0];
        const problems = [];
        if (secs.length !== args.count) problems.push(`found ${secs.length} spreads, source has ${args.count}`);
        if (visible.length !== 1) problems.push(`expected 1 visible spread, found ${visible.length}`);
        if (v) {
          if (secs.indexOf(v) !== args.k - 1) problems.push(`visible spread is number ${secs.indexOf(v) + 1}, expected ${args.k}`);
          if (v.querySelectorAll(':scope > .leaf').length !== 2) {
            problems.push(`spread ${args.k} does not have exactly 2 .leaf children`);
          }
          const used = new Set();
          for (const el of v.querySelectorAll('*')) {
            if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
            used.add(getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '').trim());
          }
          for (const fam of args.families) {
            if (!used.has(fam)) continue;
            const loaded = [...document.fonts].some((f) => f.family.replace(/["']/g, '') === fam && f.status === 'loaded');
            if (!loaded) problems.push(`spread ${args.k} shows ${fam}, which did not load (Google Fonts unreachable?)`);
          }
        }
        return problems;
      }, { count: spreadCount, k, families: GOOGLE_FAMILIES }),
    });
    files.push(file);
  }
  return files;
}

/** Embed each spread PDF into `doc` once. Returns embedded pages in spread order. */
async function embedSpreads(doc, files) {
  const out = [];
  for (const f of files) {
    const [embedded] = await doc.embedPdf(await readFile(f));
    out.push(embedded);
  }
  return out;
}

/**
 * Build both PDFs. Returns a summary with the page-by-page order.
 * @param {object} o
 * @param {string} [o.source]
 * @param {string} [o.out]
 * @param {number} [o.timeoutMs]
 */
export async function buildProgramNotes({ source = DEFAULT_SOURCE, out = DEFAULT_OUT, timeoutMs = 60000 } = {}) {
  const srcAbs = path.resolve(source);
  await stat(srcAbs); // ENOENT with the path if missing
  const outAbs = path.resolve(out);
  await mkdir(outAbs, { recursive: true });

  const html = await readFile(srcAbs, 'utf8');
  const spreadCount = checkSpreadDom(html);
  const leafCount = spreadCount * 2;
  const title = /<title>([^<]*)<\/title>/.exec(html)?.[1]?.trim() ?? 'Concert Program';

  const workDir = path.join(outAbs, '.program-notes-spreads');
  await rm(workDir, { recursive: true, force: true });
  await mkdir(workDir, { recursive: true });
  const files = await renderSpreads(srcAbs, spreadCount, workDir, timeoutMs);

  // Web: single pages in reading order, no blanks.
  const webOrder = physicalPages(leafCount);
  const web = await PDFDocument.create();
  web.setTitle(title);
  web.setCreator('jho-program-notes');
  const webSpreads = await embedSpreads(web, files);
  for (const dom of webOrder) {
    const page = web.addPage([LEAF_PT.w, LEAF_PT.h]);
    drawLeaf(page, webSpreads, dom, 0);
  }
  const webPath = path.join(outAbs, WEB_NAME);
  await writeFile(webPath, await web.save());

  // Print: blank-padded, imposed, one PDF page per sheet side.
  const padded = padToMultipleOf4(webOrder);
  const sides = sheetSides(padded);
  const print = await PDFDocument.create();
  print.setTitle(`${title} (print imposition)`);
  print.setCreator('jho-program-notes');
  const printSpreads = await embedSpreads(print, files);
  for (const [left, right] of sides) {
    const page = print.addPage([SHEET_PT.w, SHEET_PT.h]);
    if (left !== null) drawLeaf(page, printSpreads, left, 0);
    if (right !== null) drawLeaf(page, printSpreads, right, LEAF_PT.w);
    // The clip edge of a drawn leaf can leave a faint hairline in the neighbouring half. Paint blank halves
    // white last, so a blank page prints as blank paper.
    if (left === null) paintWhite(page, 0);
    if (right === null) paintWhite(page, LEAF_PT.w);
  }
  const printPath = path.join(outAbs, PRINT_NAME);
  await writeFile(printPath, await print.save());

  await rm(workDir, { recursive: true, force: true });

  return {
    source: srcAbs,
    leafCount,
    paddedCount: padded.length,
    blanks: padded.length - leafCount,
    web: { path: webPath, pages: webOrder.length, pageSizePt: [LEAF_PT.w, LEAF_PT.h] },
    print: {
      path: printPath,
      pages: sides.length,
      pageSizePt: [SHEET_PT.w, SHEET_PT.h],
      // Printed pages, as physical page numbers: [left, right] per PDF page.
      sides: sides.map(([l, r]) => [physicalNumber(l, leafCount), physicalNumber(r, leafCount)]),
    },
  };
}

// ---------------------------------------------------------------- CLI

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) throw new Error(`unexpected argument: ${a}`);
    const key = a.slice(2);
    const val = argv[i + 1];
    if (val === undefined || val.startsWith('--')) throw new Error(`--${key} needs a value`);
    args[key] = val;
    i++;
  }
  return args;
}

async function cli(argv) {
  const a = parseArgs(argv);
  const result = await buildProgramNotes({
    source: a.source ?? DEFAULT_SOURCE,
    out: a.out ?? DEFAULT_OUT,
    timeoutMs: a.timeout ? Number(a.timeout) : 60000,
  });
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  cli(process.argv.slice(2)).catch((err) => {
    console.error(`jho-program-notes: ${err.message}`);
    process.exit(1);
  });
}
