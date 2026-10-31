#!/usr/bin/env node
/**
 * jho-social-posts record: write one discovered fact into handles.json, or confirm one.
 *
 *   Record a proposal from research (status candidate). It needs an https URL, or a repo: path that exists:
 *     node record.mjs --key "<key>" --field <facebook|instagram|x|address|maps_url> --set candidate \
 *       (--handle @name | --value <text or https link>) --source <https URL | repo:path> \
 *       [--confidence high|medium|low] [--note "..."] [--type person|org|venue] [--overwrite]
 *   Record a "no account" the user confirmed (status none). The source must be user-provided:
 *     node record.mjs --key "<key>" --field <platform> --set none --source user-provided [--overwrite]
 *   Confirm a candidate (status verified). Run ONLY after the user has said yes to this exact value:
 *     node record.mjs --confirm "<key>:<field>" --expect "<the exact handle or value the user was shown>"
 *
 * --file <path> writes a different registry (tests use a copy; the default is handles.json).
 * A verified slot is not replaced unless --overwrite is given. Every result is validated before it is
 * written. The write is atomic and never goes through a symlink.
 */
import { readFile } from 'node:fs/promises';
import { realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { todayInNewYork } from '../jho-concert-poster/make-poster.mjs';
import { REGISTRY_FILE, validateRegistry, PLATFORMS, FIELDS, FORBIDDEN_KEYS, sourceOk } from './make-social.mjs';
import { writeSafely, stableJson, isEntryPoint } from './safe-io.mjs';

const SKILL_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SKILL_DIR, '..', '..', '..');
const ALL_FIELDS = [...PLATFORMS, ...FIELDS];
const TYPES = ['person', 'org', 'venue'];
const FLAGS = {
  key: 'value', field: 'value', set: 'value', handle: 'value', value: 'value', source: 'value',
  confidence: 'value', note: 'value', type: 'value', file: 'value', expect: 'value',
  overwrite: 'flag', confirm: 'confirm',
};

/** The value a slot holds: the handle for a platform, the value for a venue field. */
const valueOf = (slot, field) => (FIELDS.includes(field) ? slot.value : slot.handle);

function slotOf(entry, field) {
  return FIELDS.includes(field) ? entry[field] : entry.platforms?.[field];
}

/**
 * A repo: source must name a file that exists inside the repo: no ".." segment, no symlink out of the repo,
 * and a file, not a folder. An https source must be a valid https URL.
 * @param {string} src
 * @param {string} root the repo root (tests may pass another)
 */
function checkCandidateSource(src, root) {
  if (src.startsWith('repo:')) {
    const rel = src.slice('repo:'.length);
    if (rel.split(/[\\/]/).includes('..')) throw new Error(`repo: source "${src}" has a ".." segment, which points outside the repo`);
    let real;
    try {
      real = realpathSync(path.resolve(root, rel));
    } catch {
      throw new Error(`repo: source "${src}" does not exist in the repo`);
    }
    const realRoot = realpathSync(root);
    if (!real.startsWith(realRoot + path.sep)) throw new Error(`repo: source "${src}" resolves outside the repo`);
    if (!statSync(real).isFile()) throw new Error(`repo: source "${src}" is not a file`);
    return;
  }
  if (!src.startsWith('https://') || !sourceOk(src)) {
    throw new Error(`a candidate needs --source as an https URL or repo:<path> that exists in the repo (got "${src}")`);
  }
}

/**
 * Pure: the registry after one record. The input is not modified. The result is validated.
 * @param {object} registry
 * @param {{key: string, field: string, set?: 'candidate' | 'none', confirm?: boolean, expect?: string,
 *   handle?: string, value?: string, source?: string, confidence?: string, note?: string, type?: string,
 *   overwrite?: boolean, repoRoot?: string, today: string}} op
 * @returns {object} the new, validated registry
 */
export function applyRecord(registry, op) {
  const r = structuredClone(registry);
  const { key, field, today } = op;
  if (!key || !field) throw new Error('--key and --field are required');
  if (FORBIDDEN_KEYS.includes(key)) throw new Error(`"${key}" is a reserved name and cannot be a registry key`);
  if (!ALL_FIELDS.includes(field)) throw new Error(`--field must be one of ${ALL_FIELDS.join(', ')}`);
  const isVenueField = FIELDS.includes(field);
  const shown = isVenueField ? 'value' : 'handle';

  if (op.confirm) {
    const slot = Object.hasOwn(r, key) ? slotOf(r[key], field) : undefined;
    if (!slot || slot.status !== 'candidate') {
      throw new Error(`only a candidate can be confirmed: "${key}" ${field} is ${slot?.status ?? 'absent'}. Record it as a candidate first.`);
    }
    const candidate = valueOf(slot, field);
    if (op.expect === undefined) {
      throw new Error(`--confirm needs --expect "<the exact ${shown} the user was shown>". The candidate is "${candidate}".`);
    }
    if (op.expect !== candidate) {
      throw new Error(`--expect "${op.expect}" does not match the candidate "${candidate}" for "${key}" ${field}. ` +
        'Confirm only the value the user was shown. If it is different, record it as a new candidate first.');
    }
    slot.status = 'verified';
    slot.verified_on = today;
    slot.confirmed_value = candidate;
    slot.confirmed_on = today;
    return validateRegistry(r, { today });
  }

  if (op.set !== 'candidate' && op.set !== 'none') throw new Error('--set must be candidate or none (or use --confirm)');
  if (op.set === 'candidate') {
    if (op.source === undefined) throw new Error('--set candidate needs --source (an https URL or repo:<path>)');
    if (op.source === 'user-provided') {
      throw new Error('a candidate needs --source as an https URL or repo:<path> that exists in the repo. ' +
        '"user-provided" is for what the user has said; ask the user for the page where the account is listed.');
    }
    checkCandidateSource(op.source, op.repoRoot ?? REPO_ROOT);
    if (isVenueField && op.handle !== undefined) throw new Error(`--handle is for a platform; ${field} takes --value`);
    if (!isVenueField && op.value !== undefined) throw new Error(`--value is for a venue field (address, maps_url); ${field} takes --handle`);
  }
  if (op.set === 'none') {
    if (op.source !== 'user-provided') throw new Error('--set none needs --source user-provided: a confirmed "no account" comes from the user');
    if (op.handle !== undefined || op.value !== undefined) throw new Error('--set none takes no --handle or --value');
    if (op.confidence !== undefined) throw new Error('--confidence is for a candidate; a "none" is confirmed by the user');
  }

  if (op.type !== undefined && !TYPES.includes(op.type)) throw new Error(`--type must be person, org or venue (got "${op.type}")`);
  if (!Object.hasOwn(r, key)) {
    if (op.type === undefined) throw new Error(`"${key}" is not in handles.json: give --type person, org or venue to create it`);
    r[key] = { name: key, type: op.type, platforms: {} };
  }
  const entry = r[key];
  if (op.type !== undefined && op.type !== entry.type) throw new Error(`"${key}" is a ${entry.type} in handles.json; --type ${op.type} does not match`);
  if (isVenueField && entry.type !== 'venue') throw new Error(`address and maps_url are only for venues; "${key}" is a ${entry.type}`);

  const existing = slotOf(entry, field);
  if (existing?.status === 'verified' && !op.overwrite) {
    throw new Error(`"${key}" ${field} is verified (${valueOf(existing, field)}). Refusing to replace it with ${op.set}. ` +
      'Pass --overwrite only if the user has said so.');
  }
  const body = slotBody(op, field, today);
  if (isVenueField) entry[field] = body;
  else {
    entry.platforms = entry.platforms ?? {};
    entry.platforms[field] = body;
  }
  return validateRegistry(r, { today });
}

/** The stored slot for a candidate or none. Fields that are not given are left out. */
function slotBody(op, field, today) {
  const body = { status: op.set };
  if (op.set === 'candidate') {
    if (FIELDS.includes(field)) body.value = op.value; else body.handle = op.handle;
    if (op.confidence !== undefined) body.confidence = op.confidence;
  } else {
    body.verified_on = today;
  }
  body.source = op.source;
  if (op.note !== undefined) body.note = op.note;
  for (const k of Object.keys(body)) if (body[k] === undefined) delete body[k];
  return body;
}

/**
 * Flags as the other scripts parse them. --confirm takes "<key>:<field>" and is the only flag without its
 * own key; --overwrite takes no value. Every other flag takes one value. An unknown flag is an error.
 */
export function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (!flag.startsWith('--')) throw new Error(`unexpected argument: ${flag}`);
    const name = flag.slice(2);
    if (!Object.hasOwn(FLAGS, name)) throw new Error(`unknown flag --${name} (allowed: ${Object.keys(FLAGS).map((f) => `--${f}`).join(', ')})`);
    if (FLAGS[name] === 'flag') { a[name] = true; continue; }
    const v = argv[i + 1];
    if (name === 'confirm') {
      const m = v === undefined || v.startsWith('--') ? null : /^(.+):([a-z_]+)$/.exec(v);
      if (!m) throw new Error('--confirm takes "<key>:<field>", for example "Alex Wen:facebook"');
      a.key = m[1]; a.field = m[2]; a.confirm = true; i++;
      continue;
    }
    if (v === undefined || v.startsWith('--')) throw new Error(`--${name} needs a value`);
    a[name] = v;
    i++;
  }
  return a;
}

async function cli(argv) {
  const a = parseArgs(argv);
  const file = a.file ? path.resolve(a.file) : REGISTRY_FILE;
  const reg = validateRegistry(JSON.parse(await readFile(file, 'utf8')), { where: path.basename(file) });
  const { file: _file, ...op } = a;
  const next = applyRecord(reg, { ...op, today: todayInNewYork() });
  await writeSafely(file, stableJson(next), { overwrite: true });
  const entry = next[a.key];
  const slot = FIELDS.includes(a.field) ? entry[a.field] : entry.platforms[a.field];
  console.log(JSON.stringify({ file, key: a.key, field: a.field, slot }, null, 2));
}

if (isEntryPoint(import.meta.url)) {
  cli(process.argv.slice(2)).catch((err) => {
    console.error(`record: ${err.message}`);
    process.exit(1);
  });
}
