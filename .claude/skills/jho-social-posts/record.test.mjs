/**
 * Tests for record.mjs (candidate, none and confirm). Run:
 *   node --test .claude/skills/jho-social-posts/record.test.mjs
 *
 * Every write goes to a COPY of the registry snapshot in tests/fixtures, in a scratch folder. The live
 * handles.json is hashed at the start and the end, and the test fails if it changed.
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { copyFile, mkdir, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { applyRecord } from './record.mjs';
import { validateRegistry } from './make-social.mjs';
import { stableJson } from './safe-io.mjs';
import { todayInNewYork } from '../jho-concert-poster/make-poster.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LIVE = path.join(HERE, 'handles.json');
const SNAP = path.join(HERE, 'tests', 'fixtures', 'registry-2026-12-09.json');
const SCRATCH = path.join(HERE, '.scratch-test-record');
const RECORD = path.join(HERE, 'record.mjs');
const execFileP = promisify(execFile);
const TODAY = '2026-10-31';
const sha = async (f) => createHash('sha256').update(await readFile(f)).digest('hex');
const LIVE_HASH_BEFORE = await sha(LIVE);
const SNAP_TEXT = await readFile(SNAP, 'utf8');
const base = () => JSON.parse(SNAP_TEXT);

let seq = 0;
/** A fresh copy of the snapshot for one CLI test, so no test depends on another's write. */
async function freshCopy() {
  const file = path.join(SCRATCH, `copy-${seq++}.json`);
  await copyFile(SNAP, file);
  return file;
}
async function record(args) {
  try {
    const { stdout, stderr } = await execFileP(process.execPath, [RECORD, ...args], { cwd: HERE });
    return { code: 0, stdout, stderr };
  } catch (err) {
    return { code: err.code, stdout: err.stdout, stderr: err.stderr };
  }
}
const readJson = async (f) => JSON.parse(await readFile(f, 'utf8'));

before(async () => { await mkdir(SCRATCH, { recursive: true }); });
after(async () => {
  await rm(SCRATCH, { recursive: true, force: true });
  assert.equal(await sha(LIVE), LIVE_HASH_BEFORE, 'the live handles.json must not be modified by tests');
});

describe('applyRecord (pure)', () => {
  test('a candidate stores the handle, the source, the confidence and status candidate', () => {
    const r = applyRecord(base(), { key: 'Alex Wen', field: 'facebook', set: 'candidate', handle: '@alexwenmusic',
      source: 'https://www.facebook.com/alexwenmusic', confidence: 'medium', note: 'name and role match the bio', today: TODAY });
    assert.deepEqual(r['Alex Wen'].platforms.facebook, {
      status: 'candidate', handle: '@alexwenmusic', source: 'https://www.facebook.com/alexwenmusic', confidence: 'medium', note: 'name and role match the bio',
    });
  });

  test('a candidate needs an https URL or a repo: path, and a valid confidence', () => {
    assert.throws(() => applyRecord(base(), { key: 'Alex Wen', field: 'facebook', set: 'candidate', handle: '@alexwenmusic', source: 'http://x.example', today: TODAY }), /https/);
    assert.throws(() => applyRecord(base(), { key: 'Alex Wen', field: 'facebook', set: 'candidate', handle: '@alexwenmusic', source: 'https://x.example', confidence: 'maybe', today: TODAY }), /confidence/);
  });

  test('a candidate may not take --source user-provided: a research proposal needs a URL or a repo file', () => {
    // Why: "user-provided" is the source for what the user said. A proposal from research must point at
    // where it was found, so a reviewer can check it.
    assert.throws(() => applyRecord(base(), { key: 'Alex Wen', field: 'facebook', set: 'candidate', handle: '@alexwenmusic', source: 'user-provided', today: TODAY }), /https URL or repo:/);
  });

  test('a candidate repo: source must be an existing file inside the repo', () => {
    const ok = applyRecord(base(), { key: 'Jackson Heights Orchestra', field: 'facebook', set: 'candidate', handle: '@JacksonHeightsOrchestra',
      source: 'repo:content/en/contact.md', confidence: 'high', today: TODAY });
    assert.equal(ok['Jackson Heights Orchestra'].platforms.facebook.source, 'repo:content/en/contact.md');
    assert.throws(() => applyRecord(base(), { key: 'Alex Wen', field: 'facebook', set: 'candidate', handle: '@alexwenmusic', source: 'repo:content/en/no-such-page.md', today: TODAY }), /does not exist/);
    assert.throws(() => applyRecord(base(), { key: 'Alex Wen', field: 'facebook', set: 'candidate', handle: '@alexwenmusic', source: 'repo:../../../../etc/hosts', today: TODAY }), /outside the repo|\.\./);
  });

  test('confirm needs --expect, the exact value the user was shown', () => {
    const cand = applyRecord(base(), { key: 'Jackson Heights Orchestra', field: 'facebook', set: 'candidate', handle: '@JacksonHeightsOrchestra',
      source: 'repo:content/en/contact.md', confidence: 'high', today: TODAY });
    assert.throws(() => applyRecord(cand, { key: 'Jackson Heights Orchestra', field: 'facebook', confirm: true, today: TODAY }), /--expect/);
  });

  test('confirm refuses when --expect differs from the candidate, and the registry is not changed', () => {
    const cand = applyRecord(base(), { key: 'Jackson Heights Orchestra', field: 'facebook', set: 'candidate', handle: '@JacksonHeightsOrchestra',
      source: 'repo:content/en/contact.md', confidence: 'high', today: TODAY });
    const before = JSON.stringify(cand);
    assert.throws(() => applyRecord(cand, { key: 'Jackson Heights Orchestra', field: 'facebook', confirm: true, expect: '@JacksonHeightsOrchestra2', today: TODAY }), /does not match/);
    assert.equal(JSON.stringify(cand), before);
  });

  test('confirm turns a candidate into verified, records the confirmed value and date, and keeps the source', () => {
    const cand = applyRecord(base(), { key: 'Jackson Heights Orchestra', field: 'facebook', set: 'candidate', handle: '@JacksonHeightsOrchestra',
      source: 'repo:content/en/contact.md', confidence: 'high', today: TODAY });
    const ok = applyRecord(cand, { key: 'Jackson Heights Orchestra', field: 'facebook', confirm: true, expect: '@JacksonHeightsOrchestra', today: TODAY });
    const slot = ok['Jackson Heights Orchestra'].platforms.facebook;
    assert.equal(slot.status, 'verified');
    assert.equal(slot.verified_on, TODAY);
    assert.equal(slot.confirmed_value, '@JacksonHeightsOrchestra');
    assert.equal(slot.confirmed_on, TODAY);
    assert.equal(slot.source, 'repo:content/en/contact.md');
  });

  test('confirm refuses anything that is not a candidate: nothing is verified without a candidate first', () => {
    assert.throws(() => applyRecord(base(), { key: 'Catalina Cruz', field: 'instagram', confirm: true, expect: '@x', today: TODAY }), /only a candidate can be confirmed/);
  });

  test('none needs --source user-provided: a https source is refused, because "no account" is the user\'s word', () => {
    assert.throws(() => applyRecord(base(), { key: 'Wenqi Li', field: 'x', set: 'none', source: 'https://x.example/none', today: TODAY }), /user-provided/);
    assert.throws(() => applyRecord(base(), { key: 'Wenqi Li', field: 'x', set: 'none', today: TODAY }), /source/);
  });

  test('none records a confirmed no-account with user-provided', () => {
    const r = applyRecord(base(), { key: 'Wenqi Li', field: 'x', set: 'none', source: 'user-provided', today: TODAY });
    assert.equal(r['Wenqi Li'].platforms.x.status, 'none');
    assert.equal(r['Wenqi Li'].platforms.x.handle, undefined);
  });

  test('none over a verified slot is refused unless --overwrite is given (the user confirmed the handle; a re-run must not drop it)', () => {
    // Alex Wen's Instagram is verified in the snapshot.
    assert.throws(() => applyRecord(base(), { key: 'Alex Wen', field: 'instagram', set: 'none', source: 'user-provided', today: TODAY }), /verified.*--overwrite/);
    const r = applyRecord(base(), { key: 'Alex Wen', field: 'instagram', set: 'none', source: 'user-provided', overwrite: true, today: TODAY });
    assert.equal(r['Alex Wen'].platforms.instagram.status, 'none');
  });

  test('a candidate over a verified slot is refused unless --overwrite is given', () => {
    assert.throws(() => applyRecord(base(), { key: 'Alex Wen', field: 'instagram', set: 'candidate', handle: '@alexwn2', source: 'https://example.org/a', confidence: 'low', today: TODAY }), /verified/);
    const r = applyRecord(base(), { key: 'Alex Wen', field: 'instagram', set: 'candidate', handle: '@alexwn2', source: 'https://example.org/a', confidence: 'low', overwrite: true, today: TODAY });
    assert.equal(r['Alex Wen'].platforms.instagram.status, 'candidate');
  });

  test('address and maps_url are venue fields with the same status model; a person cannot take them', () => {
    const r = applyRecord(base(), { key: 'Trinity Lutheran Church', type: 'venue', field: 'maps_url', set: 'candidate',
      value: 'https://maps.app.goo.gl/AAAA', source: 'https://example.org/church', confidence: 'high', today: TODAY });
    assert.equal(r['Trinity Lutheran Church'].maps_url.status, 'candidate');
    assert.throws(() => applyRecord(base(), { key: 'Alex Wen', field: 'address', set: 'candidate', value: '1 Main St, Queens, NY', source: 'https://example.org/a', today: TODAY }), /only for venues/);
  });

  test('--handle is refused for a venue field and --value for a platform (no field is silently ignored)', () => {
    assert.throws(() => applyRecord(base(), { key: 'Blessed Sacrament Church', field: 'maps_url', set: 'candidate', handle: '@x', value: 'https://maps.app.goo.gl/A', source: 'https://example.org/c', today: TODAY }), /--handle.*platform/);
    assert.throws(() => applyRecord(base(), { key: 'Alex Wen', field: 'instagram', set: 'candidate', value: 'https://x.example', handle: '@alexwn2', source: 'https://example.org/a', today: TODAY }), /--value.*venue/);
  });

  test('a new key needs a type; the type is person, org or venue', () => {
    assert.throws(() => applyRecord(base(), { key: 'New Choir', field: 'instagram', set: 'candidate', handle: '@newchoir', source: 'https://x.example', today: TODAY }), /--type/);
    assert.throws(() => applyRecord(base(), { key: 'New Choir', type: 'club', field: 'instagram', set: 'candidate', handle: '@newchoir', source: 'https://x.example', today: TODAY }), /person, org or venue/);
    const r = applyRecord(base(), { key: 'New Choir', type: 'org', field: 'instagram', set: 'candidate', handle: '@newchoir', source: 'https://x.example', confidence: 'low', today: TODAY });
    assert.equal(r['New Choir'].type, 'org');
    assert.equal(r['New Choir'].name, 'New Choir');
  });

  test('reserved keys "__proto__", "constructor" and "prototype" are refused, and no prototype is changed', () => {
    for (const key of ['__proto__', 'constructor', 'prototype']) {
      assert.throws(() => applyRecord(base(), { key, type: 'person', field: 'instagram', set: 'candidate', handle: '@abc', source: 'https://x.example', today: TODAY }), /reserved/, key);
    }
    const r = applyRecord(base(), { key: 'New Person', type: 'person', field: 'instagram', set: 'candidate', handle: '@newperson', source: 'https://x.example', today: TODAY });
    assert.equal(Object.getPrototypeOf(r), Object.prototype);
  });

  test('a note over 200 characters, or with a newline or control character, is refused', () => {
    const rec = (note) => applyRecord(base(), { key: 'Alex Wen', field: 'facebook', set: 'candidate', handle: '@alexwnfb', source: 'https://x.example', note, today: TODAY });
    assert.doesNotThrow(() => rec('a'.repeat(200)));
    assert.throws(() => rec('a'.repeat(201)), /200/);
    assert.throws(() => rec('first line\nsecond line'), /note/);
    assert.throws(() => rec('bell\u0007'), /note/);
  });

  test('every result still validates, and the input object is not mutated', () => {
    const input = base();
    const snapshot = JSON.stringify(input);
    const r = applyRecord(input, { key: 'Alex Wen', field: 'facebook', set: 'candidate', handle: '@alexwenmusic', source: 'https://www.facebook.com/alexwenmusic', confidence: 'high', today: TODAY });
    validateRegistry(r, { today: TODAY });
    assert.equal(JSON.stringify(input), snapshot);
  });
});

describe('record CLI on a copy of the snapshot', () => {
  test('candidate, then --confirm with --expect, then the copy has verified; the live file is untouched', async () => {
    const file = await freshCopy();
    const c = await record(['--file', file, '--key', 'Catalina Cruz', '--field', 'instagram', '--set', 'candidate', '--handle', '@catalinacruzny',
      '--source', 'https://example.test/cruz-profile', '--confidence', 'medium']);
    assert.equal(c.code, 0, c.stderr);
    assert.equal((await readJson(file))['Catalina Cruz'].platforms.instagram.status, 'candidate');

    const k = await record(['--file', file, '--confirm', 'Catalina Cruz:instagram', '--expect', '@catalinacruzny']);
    assert.equal(k.code, 0, k.stderr);
    const slot = (await readJson(file))['Catalina Cruz'].platforms.instagram;
    assert.equal(slot.status, 'verified');
    assert.equal(slot.verified_on, todayInNewYork(), 'verified_on is the venue-zone date of the confirmation');
    assert.equal(slot.confirmed_value, '@catalinacruzny');
  });

  test('--confirm without --expect exits 1 and the copy is unchanged', async () => {
    const file = await freshCopy();
    const cand = await record(['--file', file, '--key', 'Catalina Cruz', '--field', 'instagram', '--set', 'candidate', '--handle', '@catalinacruzny',
      '--source', 'https://example.test/cruz-profile']);
    assert.equal(cand.code, 0, cand.stderr);
    const before = await readFile(file, 'utf8');
    const r = await record(['--file', file, '--confirm', 'Catalina Cruz:instagram']);
    assert.equal(r.code, 1);
    assert.match(r.stderr, /--expect/);
    assert.equal(await readFile(file, 'utf8'), before);
  });

  test('--confirm with a different --expect exits 1 and nothing is verified', async () => {
    const file = await freshCopy();
    await record(['--file', file, '--key', 'Catalina Cruz', '--field', 'instagram', '--set', 'candidate', '--handle', '@catalinacruzny',
      '--source', 'https://example.test/cruz-profile']);
    const r = await record(['--file', file, '--confirm', 'Catalina Cruz:instagram', '--expect', '@catalinacruz']);
    assert.equal(r.code, 1);
    assert.match(r.stderr, /does not match/);
    assert.equal((await readJson(file))['Catalina Cruz'].platforms.instagram.status, 'candidate');
  });

  test('a bad record exits 1 and leaves the copy as it was', async () => {
    const file = await freshCopy();
    const before = await readFile(file, 'utf8');
    // Alex Wen's Instagram is verified, so this uses a new org to reach the handle check.
    const r = await record(['--file', file, '--key', 'Nobody Choir', '--type', 'org', '--field', 'x', '--set', 'candidate', '--handle', 'nohandle', '--source', 'https://x.example']);
    assert.equal(r.code, 1);
    assert.match(r.stderr, /handle/);
    assert.equal(await readFile(file, 'utf8'), before);
  });

  test('an unknown flag exits 1 (a typo such as --expct is never ignored)', async () => {
    const file = await freshCopy();
    const before = await readFile(file, 'utf8');
    const r = await record(['--file', file, '--confirm', 'Alex Wen:instagram', '--expct', '@alexwn']);
    assert.equal(r.code, 1);
    assert.match(r.stderr, /unknown flag --expct/);
    assert.equal(await readFile(file, 'utf8'), before);
  });

  test('--set none without user-provided exits 1; with it, the copy records none', async () => {
    const file = await freshCopy();
    const bad = await record(['--file', file, '--key', 'Wenqi Li', '--field', 'x', '--set', 'none', '--source', 'https://x.example/none']);
    assert.equal(bad.code, 1);
    const ok = await record(['--file', file, '--key', 'Wenqi Li', '--field', 'x', '--set', 'none', '--source', 'user-provided']);
    assert.equal(ok.code, 0, ok.stderr);
    assert.equal((await readJson(file))['Wenqi Li'].platforms.x.status, 'none');
  });

  test('--set none over a verified handle exits 1 and names --overwrite; with --overwrite it replaces', async () => {
    const file = await freshCopy();
    const refused = await record(['--file', file, '--key', 'Alex Wen', '--field', 'instagram', '--set', 'none', '--source', 'user-provided']);
    assert.equal(refused.code, 1);
    assert.match(refused.stderr, /--overwrite/);
    assert.equal((await readJson(file))['Alex Wen'].platforms.instagram.status, 'verified');
    const done = await record(['--file', file, '--key', 'Alex Wen', '--field', 'instagram', '--set', 'none', '--source', 'user-provided', '--overwrite']);
    assert.equal(done.code, 0, done.stderr);
    assert.equal((await readJson(file))['Alex Wen'].platforms.instagram.status, 'none');
  });

  test('--key __proto__ exits 1, and the copy does not change', async () => {
    const file = await freshCopy();
    const before = await readFile(file, 'utf8');
    const r = await record(['--file', file, '--key', '__proto__', '--type', 'person', '--field', 'instagram', '--set', 'candidate', '--handle', '@abcde', '--source', 'https://x.example']);
    assert.equal(r.code, 1);
    assert.match(r.stderr, /reserved/);
    assert.equal(await readFile(file, 'utf8'), before);
  });

  test('a note with a newline exits 1 from the CLI as well', async () => {
    const file = await freshCopy();
    const r = await record(['--file', file, '--key', 'Alex Wen', '--field', 'facebook', '--set', 'candidate', '--handle', '@alexwnfb', '--source', 'https://x.example', '--note', 'one\ntwo']);
    assert.equal(r.code, 1);
    assert.match(r.stderr, /note/);
  });

  test('the write is atomic: no temp file is left behind, and the file is canonical JSON afterwards', async () => {
    const file = await freshCopy();
    const r = await record(['--file', file, '--key', 'Wenqi Li', '--field', 'x', '--set', 'none', '--source', 'user-provided']);
    assert.equal(r.code, 0, r.stderr);
    const names = await readdir(SCRATCH);
    assert.ok(!names.some((n) => n.endsWith('.tmp')), names.join(', '));
    const text = await readFile(file, 'utf8');
    assert.equal(text, stableJson(JSON.parse(text)), 'the file is written in the stable format');
  });

  test('a --file that is a symlink is refused and its target is left alone', async () => {
    const victim = path.join(SCRATCH, 'victim-registry.json');
    await writeFile(victim, SNAP_TEXT);
    const link = path.join(SCRATCH, 'linked-registry.json');
    await rm(link, { force: true });
    await symlink(victim, link);
    const r = await record(['--file', link, '--key', 'Wenqi Li', '--field', 'x', '--set', 'none', '--source', 'user-provided']);
    assert.equal(r.code, 1);
    assert.match(r.stderr, /symlink/);
    assert.equal(await readFile(victim, 'utf8'), SNAP_TEXT);
  });

  test('the CLI runs through a symlinked path and does its work (no silent exit 0)', async () => {
    const file = await freshCopy();
    const link = path.join(SCRATCH, 'record-link.mjs');
    await rm(link, { force: true });
    await symlink(RECORD, link);
    await execFileP(process.execPath, [link, '--file', file, '--key', 'Wenqi Li', '--field', 'x', '--set', 'none', '--source', 'user-provided']);
    assert.equal((await readJson(file))['Wenqi Li'].platforms.x.status, 'none');
  });
});
