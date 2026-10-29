/**
 * Tests for make-program-notes.mjs and check-order.mjs. Run:
 *   node --test .claude/skills/jho-program-notes/make-program-notes.test.mjs
 *
 * The integration tests build both PDFs into a scratch folder with the real booklet, then run
 * the real checker on them. They need Chromium (jho-render) and poppler (pdfinfo, pdftotext, pdftoppm).
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, copyFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { countSpreads, buildProgramNotes, WEB_NAME, PRINT_NAME } from './make-program-notes.mjs';
import { markerKey, alignedMad, parseArgs } from './check-order.mjs';

const execFileP = promisify(execFile);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const CHECK = path.join(HERE, 'check-order.mjs');

/** Run check-order; resolves {code, stdout, stderr} instead of throwing on exit 1. */
async function check(args, cwd = HERE) {
  try {
    const { stdout, stderr } = await execFileP(process.execPath, [CHECK, ...args], { cwd });
    return { code: 0, stdout, stderr };
  } catch (err) {
    return { code: err.code, stdout: err.stdout, stderr: err.stderr };
  }
}

describe('countSpreads(): a spread is a section whose class list has the token "page"', () => {
  test('counts plain, multi-class and single-quoted spreads', () => {
    const html = [
      '<section class="page">', "<section class='page cover'>", '<section id="x" class="landing page">',
    ].join('\n');
    assert.equal(countSpreads(html), 3);
  });

  test('does not count other classes that only contain the letters', () => {
    // Why: the old exact-attribute match missed "page cover" and miscounted "pages".
    const html = '<section class="pages">x</section><section class="subpage">y</section><div class="page"></div>';
    assert.equal(countSpreads(html), 0);
  });

  test('the real booklet has 6 spreads', async () => {
    const { readFile } = await import('node:fs/promises');
    const src = await readFile(path.join(HERE, '..', '..', '..', 'design-system', 'uploads',
      'Jackson Heights Orchestra Branding', 'JHO Program Booklet.html'), 'utf8');
    assert.equal(countSpreads(src), 6);
  });
});

describe('check-order helpers', () => {
  test('markerKey ignores case and whitespace, so the default matches the booklet cover line', () => {
    // Why: the booklet text is split across lines; the old constant was written without spaces.
    assert.equal(markerKey('Beautification Group presents'), 'beautificationgrouppresents');
    assert.equal(markerKey('  Our\n Mission '), 'ourmission');
  });

  test('alignedMad: the same leaf one pixel off scores near zero, a different page scores high', () => {
    // Why: at 33 dpi the right half starts at 181.5 px, so an exact comparison failed on a correct file.
    const w = 12; const h = 12;
    const page = (f) => {
      const d = new Uint8Array(w * h * 3);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) d.fill(f(x, y), (y * w + x) * 3, (y * w + x) * 3 + 3);
      return { w, h, data: d };
    };
    const a = page((x, y) => (x * 7 + y * 13) % 256);
    const shifted = page((x, y) => ((x + 1) * 7 + (y + 1) * 13) % 256);
    const other = page((x, y) => ((x * x + 5 * y) * 31) % 256);
    assert.ok(alignedMad(a, shifted) < 0.5, `shifted leaf scored ${alignedMad(a, shifted)}`);
    assert.ok(alignedMad(a, other) > 20, `different page scored only ${alignedMad(a, other)}`);
  });

  test('parseArgs reads --key value pairs for the file and marker options', () => {
    const a = parseArgs(['--web', '/x/-web.pdf', '--cover-marker', 'Some Cover', '--mission-marker', 'Our Story']);
    assert.equal(a.web, '/x/-web.pdf');
    assert.equal(a['cover-marker'], 'Some Cover');
    assert.equal(a['mission-marker'], 'Our Story');
  });
});

describe('build + check, end to end on the real booklet', () => {
  let scratch;
  let out;
  before(async () => {
    scratch = await mkdtemp(path.join(os.tmpdir(), 'jho-notes-test-'));
    out = path.join(scratch, 'out');
    await buildProgramNotes({ out });
  });
  after(async () => {
    await rm(scratch, { recursive: true, force: true });
  });

  test('the checker passes at the default 30 dpi', async () => {
    const r = await check(['--web', path.join(out, WEB_NAME), '--print', path.join(out, PRINT_NAME)]);
    assert.equal(r.code, 0, r.stderr || r.stdout);
  });

  test('the checker passes at a dpi where the page width is not a whole number of pixels (33)', async () => {
    // Why: 5.5 in x 33 dpi = 181.5 px. The web raster and the print half rounded differently, so the
    // checker threw "raster size mismatch" on a correct file.
    const r = await check(['--web', path.join(out, WEB_NAME), '--print', path.join(out, PRINT_NAME), '--dpi', '33']);
    assert.equal(r.code, 0, r.stderr || r.stdout);
  });

  test('a wrong cover marker fails the web check loudly (the option is really used)', async () => {
    const r = await check(['--web', path.join(out, WEB_NAME), '--cover-marker', 'Not On This Page']);
    assert.equal(r.code, 1);
    assert.match(r.stderr, /web page 1: text says it is page unknown/);
  });

  test('a web file path that begins with a dash is read as a file, not as a poppler option', async () => {
    // Why: a guard, not a reproduced bug. Poppler accepted "-web.pdf" in testing, but a path that
    // starts with "-" is an option for any tool that parses flags, so check-order passes an absolute path.
    await copyFile(path.join(out, WEB_NAME), path.join(scratch, '-web.pdf'));
    const r = await check(['--web', '-web.pdf', '--print', path.join(out, PRINT_NAME)], scratch);
    assert.equal(r.code, 0, r.stderr || r.stdout);
  });
});
