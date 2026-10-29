/**
 * Tests for render.mjs. Run: node --test .claude/skills/jho-render/render.test.mjs
 *
 * Each test encodes why the rule exists. The server must not hand out files outside the
 * site root (a symlink or ../ would leak secrets from the repo). The egress allowlist must
 * stop a page from quietly loading third-party code. Images that never get a size must fail
 * loudly, not hang or print a blank artboard.
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { request, createServer } from 'node:http';
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { serve, egressVerdict, renderPage, cliOptions } from './render.mjs';

/** A real 1x1 PNG. */
const PIXEL = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

let work;
let site;
let outside;
const NO_FONTS = { requireFonts: [], dc: false, timeoutMs: 20000 };

/** GET with the path sent exactly as written (fetch() would normalise ../ and %2e%2e). */
function rawGet(origin, rawPath) {
  const u = new URL(origin);
  return new Promise((resolve, reject) => {
    const req = request({ host: u.hostname, port: u.port, path: rawPath, method: 'GET' }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (d) => { body += d; });
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

before(async () => {
  work = await mkdtemp(path.join(os.tmpdir(), 'jho-render-test-'));
  site = path.join(work, 'site');
  outside = path.join(work, 'outside');
  await mkdir(path.join(site, 'sub'), { recursive: true });
  await mkdir(outside);
  await writeFile(path.join(site, 'page.html'), '<p>hello</p>');
  await writeFile(path.join(site, 'sub', 'a.txt'), 'A');
  await writeFile(path.join(site, '.env'), 'SECRET=dotfile');
  await writeFile(path.join(site, 'sub', '.hidden'), 'DOTDIR');
  await writeFile(path.join(outside, 'secret.txt'), 'OUTSIDE-SECRET');
  await symlink(path.join(outside, 'secret.txt'), path.join(site, 'link.txt'));
  await symlink(outside, path.join(site, 'linkdir'));
  await writeFile(path.join(site, 'pixel.png'), PIXEL);
  await writeFile(path.join(site, 'lazy.html'),
    '<!doctype html><p>lazy</p><img src="pixel.png" loading="lazy" style="position:absolute;top:5000px;left:0">');
  await writeFile(path.join(site, 'bg-missing.html'),
    '<!doctype html><div style="width:50px;height:50px;background-image:url(missing-bg.png)"></div>');
  await writeFile(path.join(site, 'bg-ok.html'),
    '<!doctype html><div style="width:50px;height:50px;background-image:url(pixel.png)"></div>');
  await writeFile(path.join(site, 'egress.html'),
    '<!doctype html><img src="https://evil.example.test/x.png" alt="">');
});

after(async () => {
  await rm(work, { recursive: true, force: true });
});

describe('serve(): only files under the site root', () => {
  test('serves a file under the root', async () => {
    const srv = await serve(site, '/page.html');
    try {
      const r = await rawGet(srv.origin, '/page.html');
      assert.equal(r.status, 200);
      assert.equal(r.body, '<p>hello</p>');
    } finally {
      await srv.close();
    }
  });

  test('refuses an encoded ../ that climbs out of the root', async () => {
    // Why: an encoded traversal reached files next to the root (the rest of the repo).
    const srv = await serve(site, '/page.html');
    try {
      const r = await rawGet(srv.origin, '/%2e%2e/outside/secret.txt');
      assert.notEqual(r.status, 200);
      assert.ok(!r.body.includes('OUTSIDE-SECRET'));
    } finally {
      await srv.close();
    }
  });

  test('refuses dot-prefixed files and folders', async () => {
    // Why: .env, .git and similar must never be served, even inside the root.
    const srv = await serve(site, '/page.html');
    try {
      for (const p of ['/.env', '/sub/.hidden']) {
        const r = await rawGet(srv.origin, p);
        assert.equal(r.status, 404, `${p} must not be served`);
        assert.ok(!/SECRET|DOTDIR/.test(r.body));
      }
    } finally {
      await srv.close();
    }
  });

  test('refuses a symlink whose target is outside the root', async () => {
    // Why: a symlink inside the root must not be a way out of it.
    const srv = await serve(site, '/page.html');
    try {
      const r = await rawGet(srv.origin, '/link.txt');
      assert.equal(r.status, 404);
      assert.ok(!r.body.includes('OUTSIDE-SECRET'));
    } finally {
      await srv.close();
    }
  });

  test('refuses a symlinked folder whose target is outside the root', async () => {
    const srv = await serve(site, '/page.html');
    try {
      const r = await rawGet(srv.origin, '/linkdir/secret.txt');
      assert.equal(r.status, 404);
      assert.ok(!r.body.includes('OUTSIDE-SECRET'));
    } finally {
      await srv.close();
    }
  });

  test('serves the in-memory page override only at its own path', async () => {
    const srv = await serve(site, '/page.html', '<p>override</p>');
    try {
      assert.equal((await rawGet(srv.origin, '/page.html')).body, '<p>override</p>');
      assert.equal((await rawGet(srv.origin, '/sub/a.txt')).body, 'A');
    } finally {
      await srv.close();
    }
  });
});

describe('egressVerdict(): the only hosts a render may reach', () => {
  test('loopback is allowed on any port', () => {
    assert.equal(egressVerdict('http://127.0.0.1:52341/templates/x.html').ok, true);
    assert.equal(egressVerdict('http://localhost:3000/x.css').ok, true);
  });

  test('the three unpkg runtime files the design-system loads are allowed', () => {
    for (const u of [
      'https://unpkg.com/react@18.3.1/umd/react.production.min.js',
      'https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js',
      'https://unpkg.com/@babel/standalone@7.29.0/babel.min.js',
    ]) {
      assert.equal(egressVerdict(u).ok, true, u);
    }
  });

  test('other unpkg files are blocked (the dev builds are not used by any template)', () => {
    assert.equal(egressVerdict('https://unpkg.com/react@18.3.1/umd/react.development.js').ok, false);
    assert.equal(egressVerdict('https://unpkg.com/left-pad@1.0.0/index.js').ok, false);
    assert.equal(egressVerdict('http://unpkg.com/react@18.3.1/umd/react.production.min.js').ok, false,
      'plain http must not be allowed for a CDN script');
  });

  test('Google Fonts CSS and font files are allowed', () => {
    assert.equal(egressVerdict('https://fonts.googleapis.com/css2?family=Inter').ok, true);
    assert.equal(egressVerdict('https://fonts.gstatic.com/s/inter/v1/abc.woff2').ok, true);
  });

  test('look-alike hosts and other schemes are blocked', () => {
    for (const u of [
      'https://unpkg.com.evil.example.test/react@18.3.1/umd/react.production.min.js',
      'https://fonts.googleapis.com.evil.example.test/css2',
      'https://evil.example.test/?fonts.googleapis.com',
      'https://api.example.test/upload',
      'file:///etc/passwd',
    ]) {
      const v = egressVerdict(u);
      assert.equal(v.ok, false, u);
      assert.match(v.reason, /blocked|not allowed/i);
    }
  });
});

describe('cliOptions(): flags map to renderPage options', () => {
  test('--no-dc turns the design-system wait off', async () => {
    const o = await cliOptions(['--html', path.join(site, 'page.html'), '--size', '816x1056', '--png', path.join(work, 'a.png'), '--no-dc']);
    assert.equal(o.dc, false);
  });

  test('dc defaults to true', async () => {
    const o = await cliOptions(['--html', path.join(site, 'page.html'), '--size', '816x1056', '--png', path.join(work, 'a.png')]);
    assert.equal(o.dc, true);
  });

  test('a file outside --root is refused', async () => {
    await assert.rejects(
      cliOptions(['--html', path.join(outside, 'secret.txt'), '--root', site, '--size', '10x10', '--png', path.join(work, 'b.png')]),
      /outside --root/,
    );
  });
});

describe('renderPage(): readiness and egress in a real browser', () => {
  test('a lazy image far below the fold loads instead of hanging', async () => {
    // Why: loading="lazy" offscreen never fetches, so the old wait sat until the overall timeout.
    const out = path.join(work, 'lazy.png');
    const r = await renderPage({ ...NO_FONTS, root: site, pagePath: '/lazy.html', width: 200, height: 200, png: out });
    assert.equal(r.png.width, 200);
  });

  test('an image whose response never arrives fails loudly on the per-image timeout, naming it', async () => {
    // Why: a stalled image never completes. The old wait ran to the page timeout and said only
    // "did not settle", without naming the image. The per-image limit must name it and fail fast.
    const stall = createServer(() => { /* accept and never answer */ });
    await new Promise((resolve) => stall.listen(0, '127.0.0.1', resolve));
    const port = stall.address().port;
    const stallSite = path.join(work, 'stall-site');
    await mkdir(stallSite, { recursive: true });
    await writeFile(path.join(stallSite, 'stall.html'),
      `<!doctype html><img src="http://127.0.0.1:${port}/stalled-photo.jpg" alt="">`);
    const started = Date.now();
    try {
      await assert.rejects(
        renderPage({ ...NO_FONTS, root: stallSite, pagePath: '/stall.html', width: 200, height: 200,
          png: path.join(work, 'stall.png'), imageTimeoutMs: 1500, timeoutMs: 30000 }),
        (err) => /stalled-photo\.jpg/.test(err.message) && /intrinsic size|within/.test(err.message),
      );
      assert.ok(Date.now() - started < 15000, 'must fail on the per-image timeout, not the page timeout');
    } finally {
      stall.closeAllConnections?.();
      await new Promise((resolve) => stall.close(resolve));
    }
  });

  test('a CSS background-image that is missing fails loudly, naming the URL', async () => {
    // Why: a missing background paints nothing and the poster looks fine until someone prints it.
    await assert.rejects(
      renderPage({ ...NO_FONTS, root: site, pagePath: '/bg-missing.html', width: 100, height: 100,
        png: path.join(work, 'bg-missing.png'), imageTimeoutMs: 1500 }),
      /missing-bg\.png/,
    );
  });

  test('a CSS background-image that loads passes', async () => {
    const r = await renderPage({ ...NO_FONTS, root: site, pagePath: '/bg-ok.html', width: 100, height: 100,
      png: path.join(work, 'bg-ok.png') });
    assert.equal(r.png.width, 100);
  });

  test('a request to an unexpected host fails the render and names the URL', async () => {
    // Why: a page that quietly fetches third-party content makes the artwork depend on that host.
    await assert.rejects(
      renderPage({ ...NO_FONTS, root: site, pagePath: '/egress.html', width: 100, height: 100,
        png: path.join(work, 'egress.png'), imageTimeoutMs: 5000 }),
      (err) => /evil\.example\.test/.test(err.message) && /egress/i.test(err.message),
    );
  });

  test('the result lists the hosts that were requested', async () => {
    const r = await renderPage({ ...NO_FONTS, root: site, pagePath: '/bg-ok.html', width: 100, height: 100,
      png: path.join(work, 'hosts.png') });
    assert.ok(Array.isArray(r.hosts));
    assert.ok(r.hosts.some((h) => h.startsWith('127.0.0.1:')));
  });
});
