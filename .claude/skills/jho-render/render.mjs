#!/usr/bin/env node
/**
 * jho-render — render an HTML page to PNG and/or PDF with Playwright (Chromium).
 *
 * Library:
 *   import { renderPage, PRESETS, parseLength } from '<skill dir>/render.mjs';
 *   await renderPage({ root, pagePath, html?, width, height, scale, selector, png, pdf });
 *
 * CLI:
 *   node render.mjs --html <file.html> [--root <dir>] [--preset poster-letter|ig-square|ig-story]
 *                   [--size 816x1056 | 8.5inx11in] [--scale 3] [--selector .jho-sheet]
 *                   [--png out.png] [--pdf out.pdf] [--timeout 60000] [--no-dc]
 *
 * The page is served over http://127.0.0.1 from --root (default: the HTML file's
 * directory) so relative asset paths and fetch() behave as they do on a real site.
 * Only files under --root are served, never dot-prefixed paths, never through a symlink
 * that leaves --root. Requests to hosts outside the egress allowlist are aborted and fail the render.
 * Readiness is awaited before capture; see SKILL.md for the contract.
 */
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { mkdir, stat, open, realpath, rm, readFile, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { chromium } from 'playwright';

const execFileP = promisify(execFile);

/**
 * Preset sizes in CSS px (96 px = 1 in). `scale` is the default deviceScaleFactor.
 * `viewport` is the browser window used for layout. It must be wider than the
 * artwork: the JHO poster desk is a flex row with 40 px padding, so a viewport
 * narrower than 816 + 80 px flex-shrinks the 8.5in sheet (it captured at 736 px).
 * 896x1136 is the poster template's own $preview size.
 */
export const PRESETS = {
  'poster-letter': { width: 816, height: 1056, scale: 3, viewport: { width: 896, height: 1136 } },
  'ig-square': { width: 1080, height: 1080, scale: 1 },
  'ig-story': { width: 1080, height: 1920, scale: 1 },
};

const MIME = {
  '.html': 'text/html; charset=utf-8', '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.jsx': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff',
};

/**
 * Parse a length into CSS px. Accepts plain numbers (px), "816px", "8.5in",
 * "210mm", "2.5cm".
 * @param {string|number} v
 * @returns {number}
 */
export function parseLength(v) {
  if (typeof v === 'number') return v;
  const m = /^\s*([\d.]+)\s*(px|in|mm|cm)?\s*$/i.exec(String(v));
  if (!m) throw new Error(`Bad length "${v}" (use px, in, mm or cm)`);
  const n = Number(m[1]);
  switch ((m[2] || 'px').toLowerCase()) {
    case 'in': return n * 96;
    case 'mm': return (n * 96) / 25.4;
    case 'cm': return (n * 96) / 2.54;
    default: return n;
  }
}

/** True if p is dir or inside it. Both must be real, absolute paths. */
function isInside(dir, p) {
  return p === dir || p.startsWith(dir + path.sep);
}

/**
 * Map a decoded request path to a real file under realRoot, or null. Refused: any dot-prefixed
 * segment (.env, .git), any path that leaves the root once ".." is resolved, and any symlink whose
 * real target is outside the root (checked after realpath, so a link cannot be used as a way out).
 * @param {string} realRoot absolute real path of the site root
 * @param {string} rel      decoded URL path, starting with "/"
 * @returns {Promise<string|null>}
 */
export async function resolveServedFile(realRoot, rel) {
  if (rel.split('/').some((seg) => seg.startsWith('.'))) return null;
  const lexical = path.resolve(realRoot, '.' + rel);
  if (!isInside(realRoot, lexical)) return null;
  let real;
  try {
    real = await realpath(lexical);
  } catch {
    return null;
  }
  if (!isInside(realRoot, real)) return null;
  return (await stat(real)).isFile() ? real : null;
}

/**
 * Serve `root` on 127.0.0.1; optionally substitute the body of one page path.
 * @returns {Promise<{origin: string, close: () => Promise<void>}>}
 */
export async function serve(root, pagePath, htmlOverride) {
  const realRoot = await realpath(root);
  const server = createServer(async (req, res) => {
    try {
      const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (htmlOverride !== undefined && rel === pagePath) {
        res.writeHead(200, { 'content-type': MIME['.html'], 'cache-control': 'no-store' });
        res.end(htmlOverride);
        return;
      }
      const file = await resolveServedFile(realRoot, rel);
      if (!file) { res.writeHead(404).end('not found'); return; }
      res.writeHead(200, {
        'content-type': MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream',
        'cache-control': 'no-store',
      });
      createReadStream(file).pipe(res);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return {
    origin: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

/**
 * Exact files the design-system runtime loads (each template folder's support.js). Nothing else on unpkg.
 * The dev builds and every other unpkg path are refused.
 */
const UNPKG_ALLOWED = new Set([
  'https://unpkg.com/react@18.3.1/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone@7.29.0/babel.min.js',
]);
/** Google Fonts: the stylesheet host and its font-file host. */
const FONT_HOSTS = new Set(['fonts.googleapis.com', 'fonts.gstatic.com']);

/**
 * Whether a request may be made while rendering. Allowed: loopback (our own server, any port),
 * the three pinned runtime files from unpkg, and Google Fonts over https. Everything else is refused,
 * so a template cannot quietly load third-party code or send data out.
 * @param {string} rawUrl
 * @returns {{ok: boolean, reason: string}}
 */
export function egressVerdict(rawUrl) {
  let u;
  try {
    u = new URL(rawUrl);
  } catch {
    return { ok: false, reason: `blocked: unparseable URL ${String(rawUrl).slice(0, 120)}` };
  }
  if (u.protocol === 'http:' && (u.hostname === '127.0.0.1' || u.hostname === 'localhost')) {
    return { ok: true, reason: 'loopback' };
  }
  if (u.protocol === 'https:' && UNPKG_ALLOWED.has(u.href)) return { ok: true, reason: 'pinned runtime' };
  if (u.protocol === 'https:' && FONT_HOSTS.has(u.hostname)) return { ok: true, reason: 'google fonts' };
  return { ok: false, reason: `blocked: ${u.href.slice(0, 160)} is not on the egress allowlist` };
}

/**
 * Installed once per page: the quiet-DOM timer. Runs in the page.
 */
function installQuietObserver() {
  if (window.__jhoSettle) return;
  window.__jhoSettle = { last: performance.now() };
  new MutationObserver(() => { window.__jhoSettle.last = performance.now(); })
    .observe(document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true });
}

/**
 * One poll of the page's readiness. Runs in the page. Lazy images are switched to eager so they
 * load instead of waiting for a scroll that never comes. CSS background-image URLs are preloaded
 * with new Image() and tracked the same way as <img>.
 */
function readinessSnapshot(dc) {
  for (const img of document.images) if (img.loading === 'lazy') img.loading = 'eager';
  const shortLabel = (s) => (s.length > 120 ? `${s.slice(0, 120)}...` : s);
  const assets = [...document.images].map((img, i) => ({
    key: `img#${i}`,
    label: `<img ${shortLabel(img.currentSrc || img.src || '(no src)')}>`,
    ready: img.complete && img.naturalWidth > 0,
  }));
  const bgUrls = new Set();
  for (const el of document.querySelectorAll('*')) {
    const bg = getComputedStyle(el).backgroundImage;
    if (!bg || bg === 'none') continue;
    for (const m of bg.matchAll(/url\((?:"([^"]*)"|'([^']*)'|([^)]*))\)/g)) bgUrls.add(m[1] ?? m[2] ?? m[3]);
  }
  window.__jhoBg ??= new Map();
  for (const u of bgUrls) {
    if (!window.__jhoBg.has(u)) {
      const im = new Image();
      im.src = u;
      window.__jhoBg.set(u, im);
    }
    const im = window.__jhoBg.get(u);
    assets.push({ key: `bg:${u}`, label: `CSS background-image ${shortLabel(u)}`, ready: im.complete && im.naturalWidth > 0 });
  }
  return {
    assets,
    loaded: document.readyState === 'complete',
    booted: !dc || (window.__dcContentKeyed === true && !!window.React),
    react: !!window.React,
    placeholders: document.querySelectorAll('.sc-placeholder, .sc-placeholder-error').length,
    streaming: document.documentElement.classList.contains('sc-dc-streaming'),
    fonts: document.fonts.status,
    quietFor: performance.now() - window.__jhoSettle.last,
  };
}

/**
 * Wait for: DC runtime booted, no placeholders, every image and CSS background image with an
 * intrinsic size, fonts loaded, DOM quiet. Each asset has its own limit (imageTimeoutMs). An
 * asset still without a size after that, or any request blocked by the egress allowlist, fails
 * the render and names the URL.
 * @param {import('playwright').Page} page
 * @param {{timeoutMs: number, imageTimeoutMs: number, dc: boolean, blocked: () => string[]}} o
 */
async function waitUntilSettled(page, { timeoutMs, imageTimeoutMs, dc, blocked }) {
  await page.evaluate(installQuietObserver);
  const started = Date.now();
  const pendingSince = new Map();
  for (;;) {
    const bad = blocked();
    if (bad.length) {
      throw new Error(`egress: request blocked, host not on the allowlist: ${bad.map((u) => u.slice(0, 160)).join(', ')}`);
    }
    const s = await page.evaluate(readinessSnapshot, dc);
    const now = Date.now();
    const pending = [];
    for (const a of s.assets) {
      if (a.ready) continue;
      pending.push(a.label);
      if (!pendingSince.has(a.key)) pendingSince.set(a.key, now);
      if (now - pendingSince.get(a.key) > imageTimeoutMs) {
        throw new Error(`${a.label} did not get an intrinsic size within ${imageTimeoutMs} ms ` +
          '(lazy, stalled, broken, or an SVG with no width/height/viewBox)');
      }
    }
    const pendingKeys = new Set(s.assets.filter((a) => !a.ready).map((a) => a.key));
    for (const k of [...pendingSince.keys()]) if (!pendingKeys.has(k)) pendingSince.delete(k);
    const ready = s.loaded && s.booted && s.placeholders === 0 && !s.streaming && s.fonts === 'loaded'
      && pending.length === 0 && s.quietFor > 400;
    if (ready) return;
    if (now - started > timeoutMs) {
      throw new Error(`page did not settle within ${timeoutMs} ms: ${JSON.stringify({
        loaded: s.loaded, placeholders: s.placeholders, booted: s.booted, react: s.react, fonts: s.fonts, pending,
      })}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

/** Fail loud on anything that would make the artwork silently wrong. */
async function checkPage(page, requireFonts) {
  const s = await page.evaluate(() => ({
    faces: [...document.fonts].map((f) => ({ family: f.family, weight: f.weight, status: f.status })),
    xHosts: [...document.querySelectorAll('.sc-host-x')].map((h) => ({ kids: h.childElementCount, text: h.textContent.trim().length })),
  }));
  const problems = [];
  for (const f of s.faces.filter((f) => f.status === 'error')) {
    problems.push(`font failed to load: ${f.family} ${f.weight}`);
  }
  for (const want of requireFonts) {
    const ok = s.faces.some((f) => f.status === 'loaded' && f.family.includes(want.family) && String(f.weight).includes(String(want.weight)));
    if (!ok) problems.push(`required font not loaded: ${want.family} ${want.weight} (is Google Fonts reachable?)`);
  }
  for (const h of s.xHosts) {
    if (h.kids === 0 && h.text === 0) problems.push('an <x-import> component mounted empty');
  }
  return problems;
}

/** PNG pixel size from the IHDR chunk. */
async function pngSize(file) {
  const fh = await open(file, 'r');
  try {
    const buf = Buffer.alloc(24);
    await fh.read(buf, 0, 24, 0);
    if (buf.toString('ascii', 1, 4) !== 'PNG') throw new Error(`${file} is not a PNG`);
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  } finally {
    await fh.close();
  }
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const CRC_TABLE = Uint32Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

/** CRC-32 (IEEE, as PNG chunks use). */
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * Tag a PNG with a physical resolution: write one pHYs chunk (unit = metre) before the first IDAT,
 * replacing any pHYs already there. Every other byte is copied as it was, so the pixels (IDAT) are
 * untouched. The input is checked (signature, chunk lengths, each chunk's CRC) and refused if malformed.
 * @param {Buffer} png  PNG file contents
 * @param {number} dpi  Resolution in dots per inch (288 = 11339 pixels per metre)
 * @returns {Buffer} the tagged PNG
 */
export function withPngDpi(png, dpi) {
  if (!Number.isFinite(dpi) || dpi <= 0) throw new Error(`withPngDpi: dpi must be a positive number, got ${dpi}`);
  if (!png.subarray(0, 8).equals(PNG_SIGNATURE)) throw new Error('withPngDpi: input is not a PNG (bad signature)');
  const ppm = Math.round(dpi / 0.0254);
  const body = Buffer.alloc(9);
  body.writeUInt32BE(ppm, 0);
  body.writeUInt32BE(ppm, 4);
  body[8] = 1; // unit: metre
  const type = Buffer.from('pHYs', 'latin1');
  const phys = Buffer.alloc(21);
  phys.writeUInt32BE(9, 0);
  type.copy(phys, 4);
  body.copy(phys, 8);
  phys.writeUInt32BE(crc32(phys.subarray(4, 17)), 17);

  const parts = [PNG_SIGNATURE];
  let wroteIdat = false;
  let pos = 8;
  while (pos < png.length) {
    if (pos + 12 > png.length) throw new Error('withPngDpi: truncated chunk header');
    const len = png.readUInt32BE(pos);
    const end = pos + 12 + len;
    if (end > png.length) throw new Error(`withPngDpi: chunk at byte ${pos} runs past the end of the file`);
    const chunkType = png.toString('latin1', pos + 4, pos + 8);
    if (crc32(png.subarray(pos + 4, pos + 8 + len)) !== png.readUInt32BE(pos + 8 + len)) {
      throw new Error(`withPngDpi: CRC mismatch in ${chunkType} chunk at byte ${pos}`);
    }
    pos = end;
    if (chunkType === 'pHYs') continue;
    if (chunkType === 'IDAT' && !wroteIdat) {
      parts.push(phys);
      wroteIdat = true;
    }
    parts.push(png.subarray(end - 12 - len, end));
  }
  if (!wroteIdat) throw new Error('withPngDpi: no IDAT chunk');
  return Buffer.concat(parts);
}

/** Page count and first-page size via poppler's pdfinfo (null if not installed). */
async function pdfInfo(file) {
  try {
    const { stdout } = await execFileP('pdfinfo', [file]);
    const pages = Number(/^Pages:\s+(\d+)/m.exec(stdout)?.[1]);
    const size = /^Page size:\s+([\d.]+) x ([\d.]+) pts/m.exec(stdout);
    return { pages, widthPt: size ? Number(size[1]) : null, heightPt: size ? Number(size[2]) : null };
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

/**
 * Render one page. Throws on any problem; returns a summary object.
 * @param {object} o
 * @param {string} o.root        Absolute directory served as site root.
 * @param {string} o.pagePath    Path of the page under root, e.g. "/templates/x/X.dc.html".
 * @param {string} [o.html]      Optional replacement body for pagePath (in-memory fill).
 * @param {number} o.width       Output width in CSS px (PDF page width; PNG when no selector).
 * @param {number} o.height      Output height in CSS px.
 * @param {{width:number,height:number}} [o.viewport] Browser viewport (default: width x height).
 * @param {number} [o.scale=1]   deviceScaleFactor for PNG (3 = 288 dpi on a 96 px/in page).
 * @param {string} [o.selector]  Capture only this element (default: whole viewport).
 * @param {string} [o.png]       Absolute output path for PNG.
 * @param {number} [o.pngDpi]    Write a pHYs resolution tag of this many dpi into the PNG (see withPngDpi).
 *        Unset = no tag, the file is exactly what Chromium wrote. Needs png. The caller derives it from
 *        the pixel size over the physical size (the poster passes 816 * scale / 8.5).
 * @param {string} [o.pdf]       Absolute output path for PDF (single page, exact size).
 * @param {Array<{family:string,weight:number}>} [o.requireFonts] Fonts that must have loaded.
 * @param {(page: import('playwright').Page) => Promise<string[]>} [o.assertions]
 *        Extra page checks; returned strings are treated as failures.
 * @param {number} [o.timeoutMs=60000]  Whole-page settle limit.
 * @param {number} [o.imageTimeoutMs=10000]  Per-asset limit: an <img> or CSS background-image that has
 *        no intrinsic size after this long fails the render, named.
 * @param {boolean} [o.dc=true]  Wait for the DC runtime (window.React, __dcContentKeyed). Pass false for
 *        plain HTML that does not use the design-system runtime (e.g. the program booklet).
 * @returns {Promise<{warnings: string[], hosts: string[], png: object|null, pdf: object|null}>}
 *        hosts: every host the page requested (all allowed, or the render would have failed).
 */
export async function renderPage(o) {
  const {
    root, pagePath, html, width, height, scale = 1, selector, png, pdf, viewport,
    requireFonts = [{ family: 'Playfair Display', weight: 900 }, { family: 'Inter', weight: 600 }],
    assertions, timeoutMs = 60000, imageTimeoutMs = 10000, dc = true, pngDpi,
  } = o;
  if (!png && !pdf) throw new Error('renderPage: give png and/or pdf');
  if (pngDpi !== undefined && !png) throw new Error('renderPage: pngDpi tags the PNG, so it needs png');
  if (!pagePath.startsWith('/')) throw new Error(`pagePath must start with "/": ${pagePath}`);

  const warnings = [];
  const srv = await serve(path.resolve(root), pagePath, html);
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: viewport ?? { width: Math.round(width), height: Math.round(height) },
      deviceScaleFactor: scale,
    });
    const egressBlocked = [];
    const hosts = new Set();
    await context.route('**/*', async (route) => {
      const url = route.request().url();
      const v = egressVerdict(url);
      if (v.ok) {
        hosts.add(new URL(url).host);
        await route.continue();
      } else {
        egressBlocked.push(url);
        await route.abort('blockedbyclient');
      }
    });
    const page = await context.newPage();
    const pageErrors = [];
    const xImportFailures = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));
    page.on('console', (m) => {
      const t = m.text();
      if (m.type() === 'error' && /x-import: FAILED/.test(t)) xImportFailures.push(t);
      else if (m.type() === 'error' || m.type() === 'warning') warnings.push(`[console.${m.type()}] ${t.slice(0, 200)}`);
    });
    page.on('requestfailed', (r) => warnings.push(`[request failed] ${r.url().slice(0, 120)} ${r.failure()?.errorText ?? ''}`));

    // domcontentloaded here, and readyState "complete" (the load event: stylesheets, @import chains and
    // font requests done) is awaited in waitUntilSettled. Waiting for load inside goto would let one
    // stalled image block for the whole page timeout, with no name.
    const resp = await page.goto(srv.origin + pagePath, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
    if (!resp || !resp.ok()) throw new Error(`HTTP ${resp?.status()} loading ${pagePath}`);
    await waitUntilSettled(page, { timeoutMs, imageTimeoutMs, dc, blocked: () => egressBlocked });
    await page.evaluate(() => document.fonts.ready);

    const problems = await checkPage(page, requireFonts);
    if (pageErrors.length) problems.push(...pageErrors.map((e) => `pageerror: ${e}`));
    if (xImportFailures.length) problems.push(...xImportFailures);
    if (assertions) problems.push(...(await assertions(page)));
    if (problems.length) throw new Error('render checks failed:\n  - ' + problems.join('\n  - '));

    const out = { warnings, hosts: [...hosts].sort(), png: null, pdf: null };
    // Outputs written from here on are removed if a request was blocked late (after the settle check).
    const written = [];
    const failIfBlocked = async () => {
      if (!egressBlocked.length) return;
      await Promise.all(written.map((f) => rm(f, { force: true })));
      throw new Error(`egress: request blocked, host not on the allowlist: ${egressBlocked.map((u) => u.slice(0, 160)).join(', ')}`);
    };

    if (png) {
      await mkdir(path.dirname(png), { recursive: true });
      if (selector) {
        const loc = page.locator(selector).first();
        if ((await loc.count()) === 0) throw new Error(`selector not found: ${selector}`);
        await loc.screenshot({ path: png, type: 'png', animations: 'disabled', caret: 'hide' });
      } else {
        await page.screenshot({ path: png, type: 'png', animations: 'disabled', caret: 'hide' });
      }
      if (pngDpi !== undefined) await writeFile(png, withPngDpi(await readFile(png), pngDpi));
      written.push(png);
      out.png = { path: png, ...(await pngSize(png)), scale, ...(pngDpi !== undefined ? { dpi: pngDpi } : {}) };
    }

    if (pdf) {
      await mkdir(path.dirname(pdf), { recursive: true });
      await page.pdf({
        path: pdf,
        width: `${Math.round(width)}px`,
        height: `${Math.round(height)}px`,
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        preferCSSPageSize: false,
      });
      written.push(pdf);
      await failIfBlocked();
      const info = await pdfInfo(pdf);
      if (info === null) {
        warnings.push('pdfinfo not installed (poppler); PDF page count and size were NOT verified');
        out.pdf = { path: pdf, pages: null };
      } else {
        const wantPt = (width * 72) / 96;
        const hPt = (height * 72) / 96;
        if (info.pages !== 1) throw new Error(`PDF has ${info.pages} pages; expected 1 (overflow?)`);
        if (Math.abs(info.widthPt - wantPt) > 1 || Math.abs(info.heightPt - hPt) > 1) {
          throw new Error(`PDF page is ${info.widthPt}x${info.heightPt} pt; expected ${wantPt.toFixed(2)}x${hPt.toFixed(2)}`);
        }
        out.pdf = { path: pdf, ...info };
      }
    }
    await failIfBlocked();
    return out;
  } finally {
    await browser.close();
    await srv.close();
  }
}

// ---------------------------------------------------------------- CLI

/** Flags that take no value. */
const BOOLEAN_FLAGS = new Set(['no-dc']);

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) throw new Error(`unexpected argument: ${a}`);
    const key = a.slice(2);
    if (BOOLEAN_FLAGS.has(key)) {
      args[key] = true;
      continue;
    }
    const val = argv[i + 1];
    if (val === undefined || val.startsWith('--')) throw new Error(`--${key} needs a value`);
    args[key] = val;
    i++;
  }
  return args;
}

/**
 * Translate CLI argv into renderPage options. Validates the paths (the file must be under --root).
 * @param {string[]} argv
 * @returns {Promise<object>} options for renderPage
 */
export async function cliOptions(argv) {
  const a = parseArgs(argv);
  if (!a.html) throw new Error('--html <file> is required');
  const htmlAbs = path.resolve(a.html);
  await stat(htmlAbs); // throws ENOENT with a clear path
  const root = path.resolve(a.root ?? path.dirname(htmlAbs));
  const rel = path.relative(root, htmlAbs);
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`${htmlAbs} is outside --root ${root}`);

  let width; let height; let scale; let viewport;
  if (a.preset) {
    const p = PRESETS[a.preset];
    if (!p) throw new Error(`unknown preset "${a.preset}" (have: ${Object.keys(PRESETS).join(', ')})`);
    ({ width, height, scale, viewport } = p);
  } else if (a.size) {
    const [w, h] = a.size.split('x');
    if (!h) throw new Error('--size must look like 816x1056 or 8.5inx11in');
    width = parseLength(w); height = parseLength(h); scale = 1;
  } else {
    throw new Error('give --preset or --size');
  }
  if (a.scale) scale = Number(a.scale);
  if (!a.png && !a.pdf) throw new Error('give --png and/or --pdf');

  return {
    root,
    pagePath: '/' + rel.split(path.sep).join('/'),
    width, height, scale, viewport,
    selector: a.selector,
    png: a.png && path.resolve(a.png),
    pdf: a.pdf && path.resolve(a.pdf),
    timeoutMs: a.timeout ? Number(a.timeout) : 60000,
    dc: !a['no-dc'],
  };
}

async function cli(argv) {
  const result = await renderPage(await cliOptions(argv));
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  cli(process.argv.slice(2)).catch((err) => {
    console.error(`jho-render: ${err.message}`);
    process.exit(1);
  });
}
