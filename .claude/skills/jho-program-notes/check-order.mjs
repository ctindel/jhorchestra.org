#!/usr/bin/env node
/**
 * jho-program-notes check — verify the generated PDFs by reading their pages back.
 *
 * CLI:
 *   node check-order.mjs --web <JHO-program-web.pdf> [--print <JHO-program-print-letter-landscape.pdf>] [--dpi 30]
 *                        [--cover-marker "Beautification Group presents"] [--mission-marker "Our Mission"]
 *
 * Web pages are identified from their text: the cover line (--cover-marker, matched ignoring case and
 * whitespace), the mission line (--mission-marker) on the last page, and the folio at the foot of the
 * page. The two markers default to the current booklet's wording.
 *
 * Needs poppler (pdfinfo, pdftotext, pdftoppm): brew install poppler.
 Folio N on physical page p means p = N + 1 (folio 2 is page 3); the page "Welcome" is page 2.
 *
 * Print sides are identified by pixel comparison with the web pages. Each half of each sheet side is
 * rasterized and matched against the rasterized web pages. Text extraction is not used for the print file,
 * because letter-spaced folios come out split. Expected sheet layout for P padded pages (P = 2 x sheet pages):
 *   sheet s front = [P-2s | 2s+1], back = [2s+2 | P-2s-1]  (1-based physical pages)
 * Physical pages beyond the last content leaf are blanks; the back cover is always physical P.
 *
 * Exit code 1 on any mismatch. Prints the sheet map it observed.
 */
import { execFile } from 'node:child_process';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileP = promisify(execFile);

export const COVER_MARKER = 'Beautification Group presents';
/** Largest mean absolute difference (0-255 per channel) at which a printed half counts as a web page. */
const MATCH_MAX = 6;
export const MISSION_MARKER = 'Our Mission';

/**
 * Text used to find a page: lower case, no whitespace, so line breaks and letter spacing in the
 * extracted text do not matter.
 * @param {string} s
 */
export function markerKey(s) {
  return s.replace(/\s+/g, '').toLowerCase();
}

/**
 * Absolute path, so a file name that starts with "-" cannot be read as a poppler option.
 * Used together with "--" before every path argument.
 */
const abs = (file) => path.resolve(file);

/** Page sizes from pdfinfo, one entry per page: [{ w, h }] in pt. */
async function pageSizes(file) {
  const { stdout } = await execFileP('pdfinfo', ['-f', '1', '-l', '100000', '--', abs(file)]);
  const sizes = [...stdout.matchAll(/^Page\s+(\d+) size:\s+([\d.]+) x ([\d.]+) pts/gm)]
    .map((m) => ({ page: Number(m[1]), w: Number(m[2]), h: Number(m[3]) }));
  if (sizes.length === 0) throw new Error(`pdfinfo gave no page sizes for ${file}`);
  return sizes;
}

async function pdfText(file, page, extra = []) {
  const { stdout } = await execFileP('pdftotext', ['-f', String(page), '-l', String(page), ...extra, '--', abs(file), '-']);
  return stdout;
}

/** Identify a web page (1-based index) from its text. Returns the physical page number, or null. */
async function webPageNumber(file, page, total, markers) {
  const full = markerKey(await pdfText(file, page, ['-raw']));
  if (full.includes(markers.cover)) return 1;
  if (full.includes(markers.mission)) return total;
  const foot = (await pdfText(file, page, ['-x', '0', '-y', '560', '-W', '396', '-H', '52', '-layout']))
    .trim().split(/\s+/).pop();
  if (foot === 'Welcome') return 2;
  if (/^\d+$/.test(foot ?? '')) return Number(foot) + 1;
  return null;
}

/** Parse a binary PPM (P6) buffer into { w, h, data }. */
function parsePPM(buf) {
  let pos = 0;
  const token = () => {
    while (/\s/.test(String.fromCharCode(buf[pos]))) pos++;
    let s = '';
    while (!/\s/.test(String.fromCharCode(buf[pos]))) s += String.fromCharCode(buf[pos++]);
    return s;
  };
  if (token() !== 'P6') throw new Error('not a P6 PPM');
  const w = Number(token());
  const h = Number(token());
  token(); // maxval
  pos++; // single whitespace before raster data
  return { w, h, data: buf.subarray(pos, pos + w * h * 3) };
}

/**
 * Mean absolute difference between a printed half and a web page of the same leaf, after the best
 * alignment within one pixel in each direction. At some dpi a leaf starts mid-pixel (5.5 in x 33 dpi =
 * 181.5 px), so the same leaf rasterizes one pixel off. Both rasters are compared over the overlap only.
 * A different page still scores high at every shift.
 * @returns {number}
 */
export function alignedMad(a, b) {
  const cw = Math.min(a.w, b.w) - 2;
  const ch = Math.min(a.h, b.h) - 2;
  if (cw < 1 || ch < 1) throw new Error(`raster too small to compare: ${a.w}x${a.h} vs ${b.w}x${b.h}`);
  let best = Infinity;
  for (let dy = 0; dy <= 2; dy++) {
    for (let dx = 0; dx <= 2; dx++) {
      let sum = 0;
      for (let y = 0; y < ch; y++) {
        for (let x = 0; x < cw; x++) {
          const ia = ((y + 1) * a.w + (x + 1)) * 3;
          const ib = ((y + dy) * b.w + (x + dx)) * 3;
          sum += Math.abs(a.data[ia] - b.data[ib]) + Math.abs(a.data[ia + 1] - b.data[ib + 1]) + Math.abs(a.data[ia + 2] - b.data[ib + 2]);
        }
      }
      best = Math.min(best, sum / (cw * ch * 3));
    }
  }
  return best;
}

/** Pixels of the left or right half of a raster, as a flat array of bytes, row by row. */
function halfOf(img, side) {
  const half = Math.floor(img.w / 2);
  const x0 = side === 'L' ? 0 : img.w - half;
  const out = new Uint8Array(half * img.h * 3);
  let k = 0;
  for (let y = 0; y < img.h; y++) {
    const start = (y * img.w + x0) * 3;
    out.set(img.data.subarray(start, start + half * 3), k);
    k += half * 3;
  }
  return { w: half, h: img.h, data: out };
}

function isBlank(region) {
  for (let i = 0; i < region.data.length; i++) if (region.data[i] < 250) return false;
  return true;
}

async function rasterize(file, dpi, dir, tag) {
  const prefix = path.join(dir, tag);
  await execFileP('pdftoppm', ['-r', String(dpi), '--', abs(file), prefix]);
  const names = (await readdir(dir)).filter((n) => n.startsWith(`${tag}-`) && n.endsWith('.ppm'));
  names.sort((x, y) => Number(x.match(/-(\d+)\.ppm$/)[1]) - Number(y.match(/-(\d+)\.ppm$/)[1]));
  const imgs = [];
  for (const n of names) imgs.push(parsePPM(await readFile(path.join(dir, n))));
  return imgs;
}

/** Expected physical page for each printed half. Returns a web page number, or 'blank'. */
function expectedHalf(p, N, P) {
  if (p === P) return N; // back cover is always the last physical page
  if (p < N) return p;
  return 'blank';
}

async function checkWeb(file, problems, markers) {
  const sizes = await pageSizes(file);
  const N = sizes.length;
  for (const s of sizes) {
    if (Math.abs(s.w - 396) > 0.5 || Math.abs(s.h - 612) > 0.5) problems.push(`web page ${s.page} is ${s.w}x${s.h} pt, want 396x612`);
  }
  const ids = [];
  for (let i = 1; i <= N; i++) ids.push(await webPageNumber(file, i, N, markers));
  ids.forEach((id, i) => {
    if (id !== i + 1) problems.push(`web page ${i + 1}: text says it is page ${id ?? 'unknown'}`);
  });
  return { N, ids };
}

async function checkPrint(file, webImgs, N, problems, dpi) {
  const sizes = await pageSizes(file);
  for (const s of sizes) {
    if (Math.abs(s.w - 792) > 0.5 || Math.abs(s.h - 612) > 0.5) problems.push(`print sheet ${s.page} is ${s.w}x${s.h} pt, want 792x612 (11x8.5 landscape)`);
  }
  const P = sizes.length * 2;
  if (P % 4 !== 0) problems.push(`print has ${P} physical pages, not a multiple of 4`);
  if (P !== Math.ceil(N / 4) * 4) problems.push(`print has ${P} physical pages; ${N} web pages need ${Math.ceil(N / 4) * 4}`);

  const dir = await mkdtemp(path.join(os.tmpdir(), 'jho-check-'));
  try {
    const sheets = await rasterize(file, dpi, dir, 'print');
    const map = [];
    sheets.forEach((img, j) => {
      const s = Math.floor(j / 2);
      const front = j % 2 === 0;
      const phys = front
        ? [P - 2 * s, 2 * s + 1]
        : [2 * s + 2, P - 2 * s - 1];
      const observed = ['L', 'R'].map((side) => {
        const region = halfOf(img, side);
        if (isBlank(region)) return 'blank';
        // A printed half and a web page are one leaf at the same dpi. At dpi where the leaf is not a whole
        // number of pixels (33 dpi: the right half starts at 181.5 px) anti-aliasing differs by up to ~4.5
        // on the right page. A wrong page scores 7.8 or more there. So the identity is the best match, and it
        // must be close (MATCH_MAX) and clearly better than the runner-up (less than half its score).
        const ranked = webImgs.map((w, i) => ({ page: i + 1, mad: alignedMad(region, w) })).sort((x, y) => x.mad - y.mad);
        const best = ranked[0];
        const second = ranked[1];
        if (best.mad > MATCH_MAX || (second && best.mad * 2 > second.mad)) {
          problems.push(`sheet ${s + 1} ${front ? "front" : "back"} side ${side}: no clear web page match (best MAD ${best.mad.toFixed(2)} on page ${best.page}, next ${second ? second.mad.toFixed(2) : 'n/a'})`);
        }
        return best.page;
      });
      const want = phys.map((p) => expectedHalf(p, N, P));
      const sideName = front ? 'front' : 'back';
      observed.forEach((o, k) => {
        if (o !== want[k]) problems.push(`sheet ${s + 1} (${sideName}) ${k === 0 ? "left" : "right"}: physical ${phys[k]} should be ${want[k]}, found ${o}`);
      });
      map.push({ sheet: s + 1, side: sideName, left: observed[0], right: observed[1] });
    });
    return map;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/** --key value pairs, keys as typed without the dashes (e.g. args['cover-marker']). */
export function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) throw new Error(`unexpected argument: ${argv[i]}`);
    if (argv[i + 1] === undefined) throw new Error(`${argv[i]} needs a value`);
    args[argv[i].slice(2)] = argv[i + 1];
    i++;
  }
  return args;
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  if (!a.web) throw new Error('--web <web.pdf> is required (print checks compare against it)');
  const dpi = a.dpi ? Number(a.dpi) : 30;
  const markers = {
    cover: markerKey(a['cover-marker'] ?? COVER_MARKER),
    mission: markerKey(a['mission-marker'] ?? MISSION_MARKER),
  };
  if (!markers.cover || !markers.mission) throw new Error('--cover-marker and --mission-marker must not be empty');
  const problems = [];
  const { N, ids } = await checkWeb(a.web, problems, markers);
  console.log(`web: ${N} pages, page-by-page identity ${ids.join(' ')}`);

  if (a.print) {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'jho-check-web-'));
    try {
      const webImgs = await rasterize(a.web, dpi, dir, 'web');
      const map = await checkPrint(a.print, webImgs, N, problems, dpi);
      console.log('print sheet map (web page numbers per side, left | right):');
      for (const r of map) {
        const f = (v) => (v === 'blank' ? 'blank' : String(v));
        console.log(`  sheet ${r.sheet} ${r.side.padEnd(5)}: ${f(r.left)} | ${f(r.right)}`);
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }

  if (problems.length) {
    console.error(`FAIL (${problems.length}):\n  - ${problems.join('\n  - ')}`);
    process.exit(1);
  }
  console.log('PASS');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(`check-order: ${err.message}`);
    process.exit(1);
  });
}
