/**
 * Tests for safe-io.mjs: the one write helper that make-social, discover and record share, the stable
 * JSON formatter used for handles.json, and the entry-point guard. Run:
 *   node --test .claude/skills/jho-social-posts/safe-io.test.mjs
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdir, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { writeSafely, stableJson } from './safe-io.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SAFE_IO = path.join(HERE, 'safe-io.mjs');
const SCRATCH = path.join(HERE, '.scratch-test-safeio');
const LIVE = path.join(HERE, 'handles.json');
const execFileP = promisify(execFile);
const sha = async (f) => createHash('sha256').update(await readFile(f)).digest('hex');
const LIVE_HASH_BEFORE = await sha(LIVE);

before(() => mkdir(SCRATCH, { recursive: true }));
after(async () => {
  await rm(SCRATCH, { recursive: true, force: true });
  assert.equal(await sha(LIVE), LIVE_HASH_BEFORE, 'the live handles.json must not be modified by tests');
});

describe('writeSafely: temp file, then rename', () => {
  test('writes the exact text and leaves no temp file behind', async () => {
    const dir = path.join(SCRATCH, 'plain');
    await mkdir(dir, { recursive: true });
    const file = path.join(dir, 'out.md');
    await writeSafely(file, 'hello\n');
    assert.equal(await readFile(file, 'utf8'), 'hello\n');
    assert.deepEqual(await readdir(dir), ['out.md']);
  });

  test('refuses an existing file unless overwrite is set, and says how to replace it', async () => {
    // Why: a hand-edited Social-Posts.md must survive a re-run of the draft.
    const dir = path.join(SCRATCH, 'existing');
    await mkdir(dir, { recursive: true });
    const file = path.join(dir, 'JHO.md');
    await writeFile(file, 'hand edited');
    await assert.rejects(writeSafely(file, 'generated'), /--force/);
    assert.equal(await readFile(file, 'utf8'), 'hand edited');
    await writeSafely(file, 'generated', { overwrite: true });
    assert.equal(await readFile(file, 'utf8'), 'generated');
  });

  test('refuses a symlink at the target and does not replace the link', async () => {
    const dir = path.join(SCRATCH, 'linked');
    await mkdir(dir, { recursive: true });
    const victim = path.join(SCRATCH, 'victim-target.txt');
    await writeFile(victim, 'keep me');
    const file = path.join(dir, 'JHO.md');
    await symlink(victim, file);
    await assert.rejects(writeSafely(file, 'new', { overwrite: true }), /symlink/);
    assert.equal(await readFile(victim, 'utf8'), 'keep me');
  });

  test('refuses a symlink planted at the temp path, so the write cannot follow it', async () => {
    const dir = path.join(SCRATCH, 'tmp-linked');
    await mkdir(dir, { recursive: true });
    const victim = path.join(SCRATCH, 'victim-tmp.txt');
    await writeFile(victim, 'keep me too');
    const file = path.join(dir, 'JHO.md');
    await symlink(victim, `${file}.tmp`);
    await assert.rejects(writeSafely(file, 'new', { overwrite: true }), /symlink/);
    assert.equal(await readFile(victim, 'utf8'), 'keep me too');
  });

  test('a stale plain temp file from an earlier crash is replaced, not an error', async () => {
    const dir = path.join(SCRATCH, 'stale');
    await mkdir(dir, { recursive: true });
    const file = path.join(dir, 'JHO.md');
    await writeFile(`${file}.tmp`, 'partial junk');
    await writeSafely(file, 'whole', { overwrite: true });
    assert.equal(await readFile(file, 'utf8'), 'whole');
    assert.deepEqual(await readdir(dir), ['JHO.md']);
  });
});

describe('stableJson: one canonical text per value', () => {
  test('inlines objects whose values are all scalars, expands the rest, and ends with a newline', () => {
    const text = stableJson({ a: { status: 'unknown' }, b: { x: 1, y: { z: 2 } } });
    assert.equal(text, [
      '{',
      '  "a": { "status": "unknown" },',
      '  "b": {',
      '    "x": 1,',
      '    "y": { "z": 2 }',
      '  }',
      '}',
      '',
    ].join('\n'));
  });

  test('is idempotent: formatting the parsed output again gives the same bytes', () => {
    const value = { k: { s: 'verified', n: null, l: [1, 'two'] }, nested: { deep: { deeper: true } }, e: {}, arr: [] };
    const once = stableJson(value);
    assert.equal(stableJson(JSON.parse(once)), once);
  });

  test('keeps the key order it was given', () => {
    assert.equal(stableJson({ z: 1, a: 2 }), '{ "z": 1, "a": 2 }\n');
  });
});

describe('isEntryPoint: the CLI guard compares real paths on both sides', () => {
  const probe = path.join(SCRATCH, 'probe.mjs');
  const other = path.join(SCRATCH, 'other.mjs');
  before(async () => {
    await writeFile(probe, `import { isEntryPoint } from ${JSON.stringify(SAFE_IO)};\nconsole.log(String(isEntryPoint(import.meta.url)));\n`);
    await writeFile(other, `import ${JSON.stringify(probe)};\n`);
  });

  test('true when the file is run directly', async () => {
    const { stdout } = await execFileP(process.execPath, [probe]);
    assert.equal(stdout.trim(), 'true');
  });

  test('true when the file is run through a symlinked path (the /tmp vs /private/tmp case)', async () => {
    // Why: without realpath on both sides a symlinked run exits 0 having done nothing.
    const link = path.join(SCRATCH, 'probe-link.mjs');
    await rm(link, { force: true });
    await symlink(probe, link);
    const { stdout } = await execFileP(process.execPath, [link]);
    assert.equal(stdout.trim(), 'true');
  });

  test('false when the file is only imported by another script', async () => {
    const { stdout } = await execFileP(process.execPath, [other]);
    assert.equal(stdout.trim(), 'false');
  });
});
