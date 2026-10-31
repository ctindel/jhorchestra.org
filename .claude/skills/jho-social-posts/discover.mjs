#!/usr/bin/env node
/**
 * jho-social-posts discover: list every entity a concert refers to, and what handles.json says about
 * each one on Facebook, Instagram and X and for the venue's address and maps link. Writes the result
 * as a verification worksheet, pr/<YYYYMMDD>_Concert/JHO_<iso>_Social-Verification.md, and prints it.
 *
 * It makes NO network calls. It reads the concert JSON and handles.json only. Web research is done by
 * Claude (SKILL.md, step 2), and what it finds is recorded with record.mjs.
 *
 * CLI:
 *   node discover.mjs --data <concert.json> [--out <dir>] [--registry <file>] [--allow-past]
 *   node discover.mjs --data <concert.json> --stdout [--registry <file>]   (prints the worksheet, writes nothing)
 */
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { validateConcert, resolvePeople, loadRoster, concertOutDir, resolveOutDir } from '../jho-concert-poster/make-poster.mjs';
import {
  loadRegistry, validateRegistry, findEntry, entityFor, platformState, fieldState, buildSocial, thanksRecipients,
  PLATFORMS,
} from './make-social.mjs';
import { writeSafely, isEntryPoint } from './safe-io.mjs';

export { thanksRecipients };

const CONFIRM = {
  verified: 'no (verified)',
  none: 'no (none)',
  candidate: 'confirm, correct, or none?',
};

function rowFor(ent, role, field, state) {
  const status = state.status;
  const proposed = state.handle ?? state.value ?? (status === 'none' ? 'none' : status === 'missing' ? '(not in handles.json)' : '(not found yet)');
  return {
    entity: ent.name,
    role,
    field,
    proposed,
    handle: state.handle ?? null,
    status,
    source: state.source ?? '—',
    confirm: CONFIRM[status] ?? 'research first',
  };
}

/**
 * The worksheet data: one row per (entity, field) for every entity the concert names, plus the venue's
 * address and maps link, and the thanks recipients. Also the gate's current blockers, from buildSocial.
 * @returns {Promise<{title: string, iso: string, rows: object[], blockers: string[] | null, draftError: string | null, markdown: string}>}
 */
export async function buildWorksheet(concert, { registry, roster, today, allowPast = false } = {}) {
  const reg = validateRegistry(registry ?? await loadRegistry(), { today });
  const resolved = await resolvePeople(concert, roster ?? await loadRoster());
  const c = await validateConcert(resolved, { today, allowPast });
  const social = c.social ?? {};

  const entities = new Map();
  const add = (ent, role) => {
    const cur = entities.get(ent.key);
    if (cur) { if (!cur.roles.includes(role)) cur.roles.push(role); return; }
    entities.set(ent.key, { ent, roles: [role] });
  };
  add(entityFor(reg, c.people[0].name), 'conductor');
  for (const p of c.people.slice(1)) add(entityFor(reg, p.name), 'soloist');
  for (const w of c.works) if (w.tag && /premiere/i.test(w.tag)) add(entityFor(reg, w.composer), 'premiere composer');
  for (const r of social.collaborators ?? []) add(entityFor(reg, r), 'collaborator');
  add(entityFor(reg, social.presenter ?? 'Jackson Heights Beautification Group'), 'presenter');
  const venueRef = social.venue_key ?? c.venue;
  const venueEnt = { key: venueRef, name: c.venue, entry: findEntry(reg, venueRef) };
  add(venueEnt, 'venue');
  for (const t of thanksRecipients(social.thanks, reg)) add(entityFor(reg, t.key), 'thanks recipient');

  const rows = [];
  for (const { ent, roles } of entities.values()) {
    const role = roles.join(', ');
    for (const p of PLATFORMS) rows.push(rowFor(ent, role, p, platformState(ent.entry, p)));
    // Compare keys, not objects: a collaborator with the venue's name is stored under the same key.
    if (ent.key === venueEnt.key) {
      rows.push(rowFor(ent, role, 'address', fieldState(ent.entry, 'address')));
      rows.push(rowFor(ent, role, 'maps_url', fieldState(ent.entry, 'maps_url')));
    }
  }

  let blockers = null;
  let draftError = null;
  try {
    blockers = (await buildSocial(concert, { registry: reg, roster, today, allowPast })).blockers;
  } catch (err) {
    draftError = err.message;
  }
  const markdown = renderWorksheet({ title: c.title, iso: c.iso, rows, blockers, draftError });
  return { title: c.title, iso: c.iso, rows, blockers, draftError, markdown };
}

/**
 * One markdown table cell. Line breaks become spaces; a backslash, pipe, backtick, angle bracket or
 * square bracket is escaped, so a value cannot add a column, open a code span or start markup.
 */
export function tableCell(v) {
  return String(v)
    .replace(/[\r\n\p{Zl}\p{Zp}]+/gu, ' ')
    .replace(/[\\|`<>[\]]/g, (ch) => `\\${ch}`);
}

/** A handle in a code span. Handles are validated without backticks or pipes; both are removed here anyway. */
const codeCell = (h) => '`' + String(h).replace(/[\r\n\p{Zl}\p{Zp}`]+/gu, '').replace(/\|/g, '\\|') + '`';

function renderWorksheet({ title, iso, rows, blockers, draftError }) {
  const out = [
    `# Social verification: ${title}`, '',
    `Concert ${iso}. Written by discover.mjs from handles.json and the concert JSON. It makes no network calls, so the proposals are only what is already recorded. Nothing here is posted.`, '',
    'Status: verified (confirmed, or the user supplied it), candidate (proposed, not yet confirmed), none (confirmed no account), unknown (not found yet), missing (not in handles.json).', '',
    '| Entity | Role | Field | Proposed | Status | Source | Confirm? |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...rows.map((r) => {
      const proposed = r.handle !== null ? codeCell(r.handle) : tableCell(r.proposed);
      return `| ${[tableCell(r.entity), tableCell(r.role), tableCell(r.field), proposed, tableCell(r.status), tableCell(r.source), tableCell(r.confirm)].join(' | ')} |`;
    }),
    '',
  ];
  if (draftError) out.push(`Drafts could not be built yet: ${draftError}`, '');
  else if (blockers.length) {
    out.push(`Blocking the drafts now (${blockers.length}):`, ...blockers.map((b) => `- ${b}`), '',
      'To accept an item as it is, add "<key>:<platform>" (for example "Alex Wen:facebook", or "Blessed Sacrament Church:maps_url") to social.waive in the concert JSON. Only do that when the user says so.', '');
  } else out.push('With the social.waive list in the concert JSON, the drafts pass the gate.', '');
  return out.join('\n') + '\n';
}

const FLAGS = { data: 'value', out: 'value', registry: 'value', stdout: 'flag', 'allow-past': 'flag' };

/** Flags as make-social.mjs parses them. An unknown flag is an error. */
export function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) throw new Error(`unexpected argument: ${a}`);
    const name = a.slice(2);
    if (!Object.hasOwn(FLAGS, name)) throw new Error(`unknown flag --${name} (allowed: ${Object.keys(FLAGS).map((f) => `--${f}`).join(', ')})`);
    const key = name.replace(/-(\w)/g, (_, ch) => ch.toUpperCase());
    if (FLAGS[name] === 'flag') { args[key] = true; continue; }
    const v = argv[i + 1];
    if (v === undefined || v.startsWith('--')) throw new Error(`--${name} needs a value`);
    args[key] = v;
    i++;
  }
  return args;
}

async function cli(argv) {
  const a = parseArgs(argv);
  if (!a.data) throw new Error('--data <concert.json> is required');
  if (a.stdout && a.out) throw new Error('use --stdout or --out, not both');
  const concert = JSON.parse(await readFile(path.resolve(a.data), 'utf8'));
  const registry = a.registry ? await loadRegistry(path.resolve(a.registry)) : undefined;
  const w = await buildWorksheet(concert, { registry, allowPast: !!a.allowPast });
  if (a.stdout) {
    process.stdout.write(w.markdown);
    return;
  }
  const outDir = await resolveOutDir(a.out ?? concertOutDir(w.iso));
  await mkdir(outDir, { recursive: true });
  const file = path.join(outDir, `JHO_${w.iso}_Social-Verification.md`);
  await writeSafely(file, w.markdown, { overwrite: true });
  process.stderr.write(`discover: wrote ${file}\n`);
  process.stdout.write(w.markdown);
}

if (isEntryPoint(import.meta.url)) {
  cli(process.argv.slice(2)).catch((err) => {
    console.error(`discover: ${err.message}`);
    process.exit(1);
  });
}
