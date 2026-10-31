/**
 * Tests for discover.mjs (the verification worksheet). Run:
 *   node --test .claude/skills/jho-social-posts/discover.test.mjs
 *
 * Reads the registry snapshot in tests/fixtures, never the live handles.json. The live file's hash is
 * checked at the end, so a test that changed it fails.
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdir, readFile, rm, symlink, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { buildWorksheet, thanksRecipients, tableCell } from './discover.mjs';
import { loadRegistry } from './make-social.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..', '..');
const FIXTURE = path.join(HERE, 'fixtures', 'concert.2026-12-09.social.json');
const SNAP = path.join(HERE, 'tests', 'fixtures', 'registry-2026-12-09.json');
const LIVE = path.join(HERE, 'handles.json');
const SCRATCH = path.join(HERE, '.scratch-test-discover');
const DISCOVER = path.join(HERE, 'discover.mjs');
const execFileP = promisify(execFile);
const TODAY = '2026-10-31';
const sha = async (f) => createHash('sha256').update(await readFile(f)).digest('hex');
const LIVE_HASH_BEFORE = await sha(LIVE);

const REG = await loadRegistry(SNAP);
const fixture = async () => JSON.parse(await readFile(FIXTURE, 'utf8'));
const row = (rows, entity, field) => rows.find((r) => r.entity === entity && r.field === field);
const withReg = (f) => { const r = structuredClone(REG); f(r); return r; };

async function cli(args) {
  try {
    const { stdout, stderr } = await execFileP(process.execPath, [DISCOVER, ...args], { cwd: REPO });
    return { code: 0, stdout, stderr };
  } catch (err) {
    return { code: err.code, stdout: err.stdout, stderr: err.stderr };
  }
}

before(() => mkdir(SCRATCH, { recursive: true }));
after(async () => {
  await rm(SCRATCH, { recursive: true, force: true });
  assert.equal(await sha(LIVE), LIVE_HASH_BEFORE, 'the live handles.json must not be modified or depended on by tests');
});

describe('worksheet content', () => {
  test('lists every referenced entity on all three platforms, and the venue address and maps link', async () => {
    const w = await buildWorksheet(await fixture(), { registry: REG, today: TODAY });
    for (const name of ['Alex Wen', 'Nicholas Pappone', 'Blessed Sacrament Church', 'Jackson Heights Beautification Group']) {
      for (const f of ['facebook', 'instagram', 'x']) assert.ok(row(w.rows, name, f), `${name} ${f}`);
    }
    assert.ok(row(w.rows, 'Blessed Sacrament Church', 'address'));
    assert.ok(row(w.rows, 'Blessed Sacrament Church', 'maps_url'));
  });

  test('a verified field needs no confirmation, an unknown one says research first', async () => {
    const w = await buildWorksheet(await fixture(), { registry: REG, today: TODAY });
    assert.equal(row(w.rows, 'Alex Wen', 'instagram').status, 'verified');
    assert.equal(row(w.rows, 'Alex Wen', 'instagram').confirm, 'no (verified)');
    assert.equal(row(w.rows, 'Alex Wen', 'facebook').status, 'unknown');
    assert.equal(row(w.rows, 'Alex Wen', 'facebook').confirm, 'research first');
    assert.equal(row(w.rows, 'Blessed Sacrament Church', 'x').confirm, 'no (none)');
  });

  test('a candidate row shows its proposed value, its source and the confirm question', async () => {
    // Why: the candidate must be visible to the user with where it came from, and must ask for confirmation.
    const reg = withReg((r) => { r['Nicholas Pappone'].platforms.facebook = { status: 'candidate', handle: '@npviolinfb', source: 'https://example.test/npviolin', confidence: 'medium' }; });
    const w = await buildWorksheet(await fixture(), { registry: reg, today: TODAY });
    const r = row(w.rows, 'Nicholas Pappone', 'facebook');
    assert.equal(r.status, 'candidate');
    assert.equal(r.proposed, '@npviolinfb');
    assert.equal(r.source, 'https://example.test/npviolin');
    assert.match(r.confirm, /confirm, correct, or none/);
  });

  test('handles are printed in code spans in the table the user confirms', async () => {
    const reg = withReg((r) => { r['Nicholas Pappone'].platforms.facebook = { status: 'candidate', handle: '@npviolinfb', source: 'https://example.test/npviolin', confidence: 'medium' }; });
    const w = await buildWorksheet(await fixture(), { registry: reg, today: TODAY });
    assert.ok(w.markdown.includes('| `@npviolinfb` | candidate |'), w.markdown);
    assert.ok(w.markdown.includes('| `@npviolin` | verified |'));
  });

  test('an entity the concert does not name gets no row (Jackson Heights Orchestra is not on the Dec 9 bill)', async () => {
    const w = await buildWorksheet(await fixture(), { registry: REG, today: TODAY });
    assert.equal(row(w.rows, 'Jackson Heights Orchestra', 'facebook'), undefined);
  });

  test('a missing entity (not in the registry) is "missing" and is listed', async () => {
    const c = await fixture();
    c.venue = 'Trinity Lutheran Church';
    delete c.social.venue_key;
    const w = await buildWorksheet(c, { registry: REG, today: TODAY });
    assert.equal(row(w.rows, 'Trinity Lutheran Church', 'instagram').status, 'missing');
    assert.equal(row(w.rows, 'Trinity Lutheran Church', 'address').status, 'missing');
  });

  test('the markdown has a header, the status key, and a table whose pipes in cells are escaped', async () => {
    const w = await buildWorksheet(await fixture(), { registry: REG, today: TODAY });
    assert.match(w.markdown, /^# Social verification: Masks & Revelations/m);
    assert.match(w.markdown, /\| Entity \| Role \| Field \| Proposed \| Status \| Source \| Confirm\? \|/);
    assert.ok(w.markdown.includes('Nothing here is posted'));
    const lines = w.markdown.split('\n').filter((l) => l.startsWith('| ') && !l.startsWith('| Entity') && !l.startsWith('| ---'));
    for (const l of lines) assert.equal(l.replace(/\\\|/g, '').split('|').length, 9, l);
  });

  test('a table cell escapes pipes, backticks, angle brackets and square brackets, and drops line breaks', () => {
    const cell = tableCell('a\r\nb|c`d<e>[f]\\g');
    assert.ok(!/[\r\n]/.test(cell));
    assert.ok(cell.includes('\\|'));
    assert.ok(cell.includes('\\`'));
    assert.ok(cell.includes('\\<') && cell.includes('\\>'));
    assert.ok(cell.includes('\\[') && cell.includes('\\]'));
    assert.ok(cell.includes('\\\\g'), 'a backslash is escaped too');
  });

  test('a source with pipes and brackets is escaped in its worksheet cell (it cannot add a column)', async () => {
    const reg = withReg((r) => { r['Nicholas Pappone'].platforms.facebook = { status: 'candidate', handle: '@npviolinfb', source: 'https://x.example/a|b[c]', confidence: 'medium' }; });
    const w = await buildWorksheet(await fixture(), { registry: reg, today: TODAY });
    assert.ok(w.markdown.includes('https://x.example/a\\|b\\[c\\]'), w.markdown);
  });

  test('a venue that is also a collaborator still gets its address and maps rows', async () => {
    // Why: the rows used to be added only when the venue's object was the one stored, so a collaborator
    // with the same name as the venue silently lost them.
    const c = await fixture();
    c.social.collaborators = ['Blessed Sacrament Church'];
    const w = await buildWorksheet(c, { registry: REG, today: TODAY });
    const addr = row(w.rows, 'Blessed Sacrament Church', 'address');
    const maps = row(w.rows, 'Blessed Sacrament Church', 'maps_url');
    assert.ok(addr, 'address row');
    assert.ok(maps, 'maps row');
    assert.match(addr.role, /collaborator/);
    assert.match(addr.role, /venue/);
  });

  test('a thanks recipient is listed once with every role it has', async () => {
    const w = await buildWorksheet(await fixture(), { registry: REG, today: TODAY });
    const cruz = row(w.rows, 'Catalina Cruz', 'instagram');
    assert.ok(cruz, 'Catalina Cruz is named after a title in the thanks text');
    assert.equal(cruz.role, 'thanks recipient');
    assert.equal(w.rows.filter((r) => r.entity === 'Catalina Cruz' && r.field === 'instagram').length, 1);
  });

  test('the worksheet blocks on an unknown thanks recipient the same way the drafts do', async () => {
    const c = await fixture();
    delete c.social.waive;
    const w = await buildWorksheet(c, { registry: REG, today: TODAY });
    assert.ok(w.blockers.includes('Catalina Cruz (Facebook) is unknown'), w.blockers.join('\n'));
  });

  test('discover makes no network calls: its source has no fetch, http, https, net or dns use', async () => {
    // Why: the worksheet is written from data already on disk; web research is Claude's job, not this script's.
    const src = await readFile(DISCOVER, 'utf8');
    for (const banned of ['fetch(', 'node:http', 'node:https', 'node:net', 'node:dns', 'node:tls', 'WebSocket']) {
      assert.ok(!src.includes(banned), `discover.mjs must not use ${banned}`);
    }
  });
});

describe('thanks recipient detection', () => {
  test('a name after an office title is found, with trailing punctuation and a possessive removed', () => {
    const k = (t) => thanksRecipients(t, {}).map((x) => x.key);
    assert.deepEqual(k('Thanks to Assemblywoman Catalina Cruz.'), ['Catalina Cruz']);
    assert.deepEqual(k("Thanks to Assemblywoman Catalina Cruz's office."), ['Catalina Cruz']);
    assert.deepEqual(k('Thanks to Assemblywoman Catalina Cruz NY to help.'), ['Catalina Cruz']);
  });

  test('Council Member and Council member titles are accepted, with 3-token names', () => {
    const k = (t) => thanksRecipients(t, {}).map((x) => x.key);
    assert.deepEqual(k('Council Member Julia Salazar helped.'), ['Julia Salazar']);
    assert.deepEqual(k('Council member Julia Salazar helped.'), ['Julia Salazar']);
    assert.deepEqual(k('Council Member Maria Elena Cruz helped.'), ['Maria Elena Cruz']);
  });

  test('the Dec 9 thanks paragraph gives Catalina Cruz and the presenter', () => {
    return fixture().then((c) => {
      const keys = thanksRecipients(c.social.thanks, REG).map((x) => x.key).sort();
      assert.deepEqual(keys, ['Catalina Cruz', 'Jackson Heights Beautification Group']);
    });
  });
});

describe('CLI', () => {
  test('--stdout prints the worksheet and writes no file (the --out folder is checked, not the default)', async () => {
    // Why: without --out this test could pass because the default folder was never checked. With --out
    // pointing at a folder we can inspect, a --stdout that wrote a file would fail the test.
    const file = path.join(SCRATCH, 'concert-stdout.json');
    await writeFile(file, JSON.stringify(await fixture()));
    const out = path.join(SCRATCH, 'stdout-only');
    await mkdir(out, { recursive: true });
    const r = await cli(['--data', file, '--stdout', '--out', out, '--registry', SNAP]);
    assert.equal(r.code, 1, 'stdout and out together are refused');
    const r2 = await cli(['--data', file, '--stdout', '--registry', SNAP]);
    assert.equal(r2.code, 0, r2.stderr);
    assert.ok(r2.stdout.startsWith('# Social verification: Masks & Revelations'));
    await assert.rejects(access(path.join(out, 'JHO_2026-12-09_Social-Verification.md')));
  });

  test('the CLI writes the worksheet into the chosen folder and prints the same markdown', async () => {
    const file = path.join(SCRATCH, 'concert.json');
    await writeFile(file, JSON.stringify(await fixture()));
    const out = path.join(SCRATCH, 'out');
    const r = await cli(['--data', file, '--out', out, '--registry', SNAP]);
    assert.equal(r.code, 0, r.stderr);
    const written = await readFile(path.join(out, 'JHO_2026-12-09_Social-Verification.md'), 'utf8');
    assert.equal(r.stdout, written);
  });

  test('an unknown flag fails loudly with exit 1', async () => {
    const file = path.join(SCRATCH, 'concert-flag.json');
    await writeFile(file, JSON.stringify(await fixture()));
    const r = await cli(['--data', file, '--stdout', '--registy', SNAP]);
    assert.equal(r.code, 1);
    assert.match(r.stderr, /unknown flag --registy/);
  });

  test('the CLI runs through a symlinked path and produces the worksheet', async () => {
    // Why: /tmp is /private/tmp on macOS; a guard that compares unresolved paths exits 0 silently.
    const link = path.join(SCRATCH, 'discover-link.mjs');
    await rm(link, { force: true });
    await symlink(DISCOVER, link);
    const r = await execFileP(process.execPath, [link, '--data', FIXTURE, '--stdout', '--registry', SNAP], { cwd: REPO });
    assert.ok(r.stdout.startsWith('# Social verification'), 'a symlinked run must print the worksheet');
  });

  test('a worksheet file that is a symlink is refused and its target is left alone', async () => {
    const out = path.join(SCRATCH, 'linked-out');
    await mkdir(out, { recursive: true });
    const victim = path.join(SCRATCH, 'victim-worksheet.txt');
    await writeFile(victim, 'keep me');
    await symlink(victim, path.join(out, 'JHO_2026-12-09_Social-Verification.md'));
    const r = await cli(['--data', FIXTURE, '--out', out, '--registry', SNAP]);
    assert.equal(r.code, 1);
    assert.match(r.stderr, /symlink/);
    assert.equal(await readFile(victim, 'utf8'), 'keep me');
  });
});
