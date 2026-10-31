#!/usr/bin/env node
/**
 * jho-social-posts: draft the Facebook, Instagram and X announcements for a concert and write them
 * to one markdown file in <repo>/pr/<YYYYMMDD>_Concert/. It drafts only. It never posts, and it
 * never goes to the web: research is Claude's job (see SKILL.md) and discover.mjs only reads files.
 *
 * CLI:
 *   node make-social.mjs --data <concert.json> [--out <dir>] [--registry <file>] [--allow-past]
 *                        [--draft-anyway] [--force]
 *   node make-social.mjs --data <concert.json> --stdout [--registry <file>] [--allow-past] [--draft-anyway]
 *
 * Tags: only a verified handle is tagged. A candidate is tagged only with --draft-anyway, and never when
 * it is waived. Everything else is the plain name.
 *
 * Gate: a draft is refused (exit 1, nothing written) when an entity it names on a platform, or the
 * venue address or maps link it uses, is candidate, unknown or missing in handles.json and is not
 * waived in social.waive. "verified" and "none" pass. --draft-anyway writes the draft anyway with an
 * UNVERIFIED banner at the top. The Facebook thanks paragraph names people too, and they are gated the same way.
 *
 * Exit 1 also when the X post is over 280 after the optional clauses are dropped. The file is still
 * written, with the X section marked NOT DRAFTED, so nothing is cut silently.
 *
 * An existing Social-Posts.md is not overwritten without --force, since it may be hand-edited.
 */
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  validateConcert, resolvePeople, loadRoster, concertOutDir, resolveOutDir, calendarFacts, todayInNewYork,
} from '../jho-concert-poster/make-poster.mjs';
import { writeSafely, isEntryPoint } from './safe-io.mjs';

const SKILL_DIR = path.dirname(fileURLToPath(import.meta.url));
export const REGISTRY_FILE = path.join(SKILL_DIR, 'handles.json');
export const X_LIMIT = 280;
const X_URL_LENGTH = 23;
export const PLATFORMS = ['facebook', 'instagram', 'x'];
export const LABEL = { facebook: 'Facebook', instagram: 'Instagram', x: 'X' };
export const FIELDS = ['address', 'maps_url'];
const FIELD_LABEL = { address: 'Venue address', maps_url: 'Venue maps link' };
const ENTITY_TYPES = ['person', 'org', 'venue'];
const CONFIDENCE = ['high', 'medium', 'low'];
const UNVERIFIED = ['candidate', 'unknown', 'missing'];
const DEFAULT_PRESENTER = 'Jackson Heights Beautification Group';
const SOCIAL_KEYS = ['presenter', 'venue_key', 'venue_city', 'venue_parking', 'thanks', 'collaborators',
  'hashtags', 'soloist_blurbs', 'surnames', 'waive'];
/** Names that would collide with Object.prototype when used as registry keys. */
export const FORBIDDEN_KEYS = ['__proto__', 'constructor', 'prototype'];
const HASHTAG_RE = /^#?[A-Za-z0-9_]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const WAIVE_RE = /^.+:(facebook|instagram|x|address|maps_url)$/;
const NOTE_MAX = 200;
const STALE_DAYS = 180;
/** Control characters, line and paragraph separators, and backticks. Never in a name, value or source. */
const BAD_TEXT = /[\p{Cc}\p{Zl}\p{Zp}`]/u;
/** A venue address also refuses "@", "<" and ">". */
const BAD_ADDRESS = /[\p{Cc}\p{Zl}\p{Zp}@`<>]/u;
/** Characters that may not appear in a URL that is recorded as a source or a link. */
const BAD_URL = /[\s<>)`\p{Cc}]/u;
/** Handle syntax per platform. Facebook accepts a bare page name, and X and Instagram need the "@". */
const HANDLE_RULE = {
  x: /^@\w{1,15}$/,
  instagram: /^@(?!.*\.\.)[A-Za-z0-9_](?:[A-Za-z0-9._]{0,28}[A-Za-z0-9_])?$/,
  facebook: /^@?[A-Za-z0-9.]{5,50}$/,
};
const HANDLE_HINT = {
  x: '"@name", 1 to 15 letters, digits or underscores',
  instagram: '"@name", 1 to 30 letters, digits, dots or underscores, with no ".." and no trailing dot',
  facebook: '"name" or "@name", 5 to 50 letters, digits or dots',
};
/** twitter-text v3 weights: code points in these ranges count 1, everything else counts 2. */
const X_WEIGHT_1 = [[0, 4351], [8192, 8205], [8208, 8223], [8242, 8247]];
const SURNAME_PARTICLES = new Set(['da', 'das', 'de', 'del', 'della', 'dei', 'den', 'der', 'des', 'di', 'do', 'dos', 'du', 'la', 'le', 'van', 'von', 'y']);
/** Multi-word surnames that the particle rule cannot see. social.surnames covers any other case. */
const COMPOUND_SURNAMES = ['Vaughan Williams'];
const SUFFIX_RE = /^(Jr\.?|Sr\.?|II|III|IV)$/;

/* ---------- registry: the status model ---------- */

/**
 * Check a registry object. A platform slot is {status, handle?, source?, verified_on?, confirmed_value?,
 * confirmed_on?, confidence?, note?}; a venue field (address, maps_url) has `value` instead of `handle`.
 * Statuses: verified (confirmed, or the user supplied it), candidate (proposed, not yet confirmed), none
 * (confirmed no account), unknown (not found). Throws one error that lists every problem.
 * @param {object} reg
 * @param {{where?: string, today?: string}} [opts] `today` is YYYY-MM-DD, used for "not in the future"
 * @returns {object} the registry, unchanged
 */
export function validateRegistry(reg, { where = 'handles.json', today = todayInNewYork() } = {}) {
  if (!reg || typeof reg !== 'object' || Array.isArray(reg)) throw new Error(`${where} must be a JSON object keyed by name`);
  const problems = [];
  for (const [key, e] of Object.entries(reg)) {
    const w = `"${key}"`;
    if (FORBIDDEN_KEYS.includes(key)) { problems.push(`${w} is a reserved name and cannot be a registry key`); continue; }
    if (BAD_TEXT.test(key)) problems.push(`${w}: a key must not contain control characters or backticks`);
    if (!e || typeof e !== 'object' || Array.isArray(e)) { problems.push(`${w} must be an object`); continue; }
    if (typeof e.name !== 'string' || !e.name.trim()) problems.push(`${w}.name must be a non-empty string`);
    else if (BAD_TEXT.test(e.name)) problems.push(`${w}.name must not contain control characters or backticks`);
    if (!ENTITY_TYPES.includes(e.type)) problems.push(`${w}.type must be person, org or venue`);
    for (const f of FIELDS) {
      if (e[f] === undefined) continue;
      if (e.type !== 'venue') problems.push(`${w}.${f}: address and maps_url are only for venues`);
      else checkSlot(e[f], `${w}.${f}`, f, problems, today);
    }
    const plats = e.platforms ?? {};
    if (typeof plats !== 'object' || Array.isArray(plats)) { problems.push(`${w}.platforms must be an object`); continue; }
    for (const [p, slot] of Object.entries(plats)) {
      if (!PLATFORMS.includes(p)) problems.push(`${w}.platforms.${p} is not a platform (facebook, instagram, x)`);
      else checkSlot(slot, `${w}.platforms.${p}`, p, problems, today);
    }
  }
  if (problems.length) throw new Error(`invalid ${where}:\n  - ` + problems.join('\n  - '));
  return reg;
}

function checkSlot(s, w, kind, problems, today) {
  if (!s || typeof s !== 'object' || Array.isArray(s)) { problems.push(`${w} must be an object with a status`); return; }
  const isField = FIELDS.includes(kind);
  const allowed = isField ? ['verified', 'candidate', 'unknown'] : ['verified', 'candidate', 'none', 'unknown'];
  if (!allowed.includes(s.status)) { problems.push(`${w}.status must be one of ${allowed.join(', ')}`); return; }
  if (s.note !== undefined) checkNote(s.note, `${w}.note`, problems);
  if (s.confidence !== undefined && !CONFIDENCE.includes(s.confidence)) problems.push(`${w}.confidence must be high, medium or low`);
  if (s.verified_on !== undefined) checkDate(s.verified_on, `${w}.verified_on`, today, problems);
  const valueKey = isField ? 'value' : 'handle';
  const val = s[valueKey];
  if (s.status === 'unknown') {
    if (val !== undefined) problems.push(`${w}: an unknown entry must not carry a ${valueKey}`);
    if (s.source !== undefined) problems.push(`${w}: an unknown entry must not carry a source`);
    return;
  }
  checkSource(s.source, w, problems);
  if (s.confirmed_value !== undefined) {
    if (s.status !== 'verified') problems.push(`${w}: only a verified entry carries confirmed_value`);
    else if (s.confirmed_value !== val) problems.push(`${w}.confirmed_value must equal the stored ${valueKey}`);
  }
  if (s.confirmed_on !== undefined) {
    if (s.status !== 'verified') problems.push(`${w}: only a verified entry carries confirmed_on`);
    else checkDate(s.confirmed_on, `${w}.confirmed_on`, today, problems);
  }
  if (s.status === 'none') {
    if (val !== undefined) problems.push(`${w}: a none entry must not carry a ${valueKey}`);
    return;
  }
  if (s.status === 'verified' && s.verified_on === undefined) problems.push(`${w}.verified_on is required for a verified entry`);
  if (isField) checkField(kind, val, w, problems);
  else if (typeof val !== 'string' || !HANDLE_RULE[kind].test(val)) {
    problems.push(`${w}.handle must be ${HANDLE_HINT[kind]} (got ${JSON.stringify(val)})`);
  }
}

function checkField(kind, val, w, problems) {
  if (kind === 'address') {
    if (typeof val !== 'string' || !val.trim()) problems.push(`${w}.value must be a non-empty string`);
    else if (BAD_ADDRESS.test(val)) problems.push(`${w}.value (the address) must not contain control characters, "@", backticks, "<" or ">"`);
    return;
  }
  if (!isHttps(val)) problems.push(`${w}.value must be an https:// link`);
  else if (!mapsHostOk(val)) problems.push(`${w}.value must be a maps link on maps.app.goo.gl, google.com/maps or goo.gl/maps`);
}

function checkSource(src, w, problems) {
  if (src === undefined) { problems.push(`${w}.source is required`); return; }
  if (!sourceOk(src)) {
    problems.push(`${w}.source must be "user-provided", "repo:<path>" (inside the repo, no ".." segment) or an https:// URL with no spaces, "<", ">" or ")" (got ${JSON.stringify(src)})`);
  }
}

function checkNote(note, label, problems) {
  if (typeof note !== 'string' || [...note].length > NOTE_MAX || /[\p{Cc}\p{Zl}\p{Zp}]/u.test(note)) {
    problems.push(`${label} must be a string of at most ${NOTE_MAX} characters with no line breaks or control characters`);
  }
}

function checkDate(v, label, today, problems) {
  if (typeof v !== 'string' || !DATE_RE.test(v) || !calendarFacts(v)) {
    problems.push(`${label} must be a real calendar date (YYYY-MM-DD)`);
    return;
  }
  if (v > today) problems.push(`${label} is in the future (${v}; today is ${today})`);
}

function parseUrl(v) {
  try { return new URL(v); } catch { return null; }
}
const isHttps = (v) => typeof v === 'string' && /^https:\/\//.test(v) && !BAD_URL.test(v) && parseUrl(v) !== null;

/** maps.app.goo.gl, or google.com / www.google.com / goo.gl with a /maps path. No userinfo, no port. */
function mapsHostOk(v) {
  const u = parseUrl(v);
  if (!u || u.protocol !== 'https:' || u.username || u.password || u.port) return false;
  if (u.hostname === 'maps.app.goo.gl') return true;
  return ['goo.gl', 'google.com', 'www.google.com'].includes(u.hostname)
    && (u.pathname === '/maps' || u.pathname.startsWith('/maps/'));
}

/**
 * A source is "user-provided", "repo:<path>" (a relative path with no ".." segment and no whitespace),
 * or an https:// URL with no whitespace, "<", ">" or ")".
 * @returns {boolean}
 */
export function sourceOk(src) {
  if (typeof src !== 'string') return false;
  if (src === 'user-provided') return true;
  if (src.startsWith('repo:')) {
    const rel = src.slice('repo:'.length);
    return rel.length > 0 && !BAD_URL.test(rel) && !BAD_TEXT.test(rel) && !/^[\\/]/.test(rel)
      && !rel.split(/[\\/]/).includes('..');
  }
  return isHttps(src);
}

/** @returns {Promise<object>} the validated registry from handles.json (or another file) */
export async function loadRegistry(file = REGISTRY_FILE) {
  return validateRegistry(JSON.parse(await readFile(file, 'utf8')), { where: path.basename(file) });
}

/**
 * Registry entry for a key, or for a display name when no key matches. Null when unregistered.
 * @returns {object | null}
 */
export function findEntry(reg, ref) {
  if (Object.hasOwn(reg, ref)) return reg[ref];
  const hits = Object.values(reg).filter((e) => e.name === ref);
  if (hits.length > 1) throw new Error(`"${ref}" matches more than one registry entry; use its key`);
  return hits[0] ?? null;
}

/** Status of one platform for an entry. No entry is "missing"; an entry with no slot is "unknown". */
export function platformState(entry, platform) {
  if (!entry) return { status: 'missing' };
  return Object.hasOwn(entry.platforms ?? {}, platform) ? entry.platforms[platform] : { status: 'unknown' };
}

/** Status of a venue field (address or maps_url) for an entry, with the same missing/unknown rule. */
export function fieldState(entry, field) {
  if (!entry) return { status: 'missing' };
  return Object.hasOwn(entry, field) ? entry[field] : { status: 'unknown' };
}

/** Entity for a name or key: its registry entry (or null) and the name to print. */
export function entityFor(reg, ref) {
  const entry = findEntry(reg, ref);
  return { key: ref, name: entry ? entry.name : ref, entry };
}

/* ---------- pure helpers (exported for the tests) ---------- */

/** 1st 2nd 3rd 4th, 11th 12th 13th, 21st 22nd 23rd, 31st. */
export function ordinal(n) {
  const m100 = n % 100;
  if (m100 >= 11 && m100 <= 13) return `${n}th`;
  return `${n}${({ 1: 'st', 2: 'nd', 3: 'rd' })[n % 10] ?? 'th'}`;
}

/** Oxford-comma list: "A", "A and B", "A, B, and C". */
export function joinList(items) {
  if (items.length <= 2) return items.join(' and ');
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

/**
 * The surname used on the Facebook repertoire line. Generational suffixes (Jr, II) are dropped; a
 * built-in list holds the compound surnames the particle rule cannot see; a lowercase particle
 * ("de", "van") stays with the name after it; a hyphenated name stays whole. Otherwise: the last token.
 * "Amy Beach" -> "Beach", "Manuel de Falla" -> "de Falla", "Ralph Vaughan Williams" -> "Vaughan Williams".
 * Use social.surnames to override any case this does not get right.
 * @param {string} composer
 * @returns {string}
 */
export function surname(composer) {
  const parts = composer.trim().split(/\s+/);
  while (parts.length > 1 && SUFFIX_RE.test(parts[parts.length - 1])) parts.pop();
  if (parts.length === 1) return parts[0];
  const full = parts.join(' ');
  const compound = COMPOUND_SURNAMES.find((c) => full === c || full.endsWith(` ${c}`));
  if (compound) return compound;
  let i = parts.length - 1;
  while (i > 0 && SURNAME_PARTICLES.has(parts[i - 1])) i--;
  return parts.slice(i).join(' ');
}

/** "Masks & Revelations" tags: a word in all capitals (US, NYC) is kept; other words are lowercased. */
export function lowerKind(tag) {
  return tag.split(/\s+/).map((w) => (/^[A-Z]{2,}$/.test(w) ? w : w.toLowerCase())).join(' ');
}

/** An instrument as the posts show it in a running sentence: lowercase, unless it has a capital after its first letter. */
const instrumentText = (s) => (/[A-Z]/.test(s.slice(1)) ? s : s.toLowerCase());
const capFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Length of a post under X's counting, after NFC normalisation. Each URL is 23. A grapheme cluster that
 * is one emoji (a regional-indicator pair, a ZWJ sequence, a skin tone or a variation selector) is 2.
 * Other code points count 1 or 2 by the twitter-text v3 ranges. An @handle counts in full. (From the
 * published config as recalled; not checked against the live service.)
 */
export function xLength(text) {
  const normalized = text.normalize('NFC').replace(/(?:https?:\/\/|www\.)\S+/g, 'u'.repeat(X_URL_LENGTH));
  let n = 0;
  for (const { segment } of new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(normalized)) {
    const cps = [...segment].map((ch) => ch.codePointAt(0));
    if (cps.length > 1 && cps.some(isEmojiJoiner)) n += 2;
    else for (const cp of cps) n += X_WEIGHT_1.some(([lo, hi]) => cp >= lo && cp <= hi) ? 1 : 2;
  }
  return n;
}
const isEmojiJoiner = (cp) => cp === 0x200d || cp === 0xfe0f || (cp >= 0x1f1e6 && cp <= 0x1f1ff) || (cp >= 0x1f3fb && cp <= 0x1f3ff);

/**
 * Street and city from a concert or registry address. "(...)" notes (nested ones too), a ZIP or ZIP+4
 * and a ", NY" are removed. Anything else that is not "street, city" is an error, not a guess.
 * @returns {{street: string, city: string}}
 */
export function parseVenueAddress(address) {
  let s = address;
  let prev;
  do {
    prev = s;
    s = s.replace(/\([^()]*\)/g, ' ');
  } while (s !== prev);
  const bad = () => new Error(`venue address must read "street, city" (a "(...)" note, a ZIP and ", NY" are allowed), got "${address}"`);
  if (/[()]/.test(s)) throw bad();
  s = s.replace(/\s+/g, ' ').trim().replace(/[,\s]+\d{5}(?:-\d{4})?$/, '').replace(/[,\s]+NY$/, '');
  const parts = s.split(',').map((p) => p.trim());
  if (parts.length !== 2 || !parts[0] || !parts[1]) throw bad();
  return { street: parts[0], city: parts[1] };
}

/**
 * The documented search URL. It is NOT a share link: Claude cannot create one. Used only when the
 * registry has no verified maps link (or a candidate that --draft-anyway allows), and labelled as such.
 */
export function generatedMapsUrl(address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export const socialFileName = (iso) => `JHO_${iso}_Social-Posts.md`;

const TITLE_RE = /\b(?:Assemblywoman|Assemblyman|Assembly ?[Mm]ember|Senator|Council ?[Mm]ember|Councilwoman|Councilman|Mayor|Representative|Rep\.)\s+([A-Z][\w'’-]*(?:\s+(?!NY\b)[A-Z][\w'’-]*\.?){0,2})/g;
/** A name as the text gives it: no possessive, and no trailing punctuation. */
const cleanName = (s) => s.replace(/['’]s$/i, '').replace(/[.'’]+$/, '').trim();

/**
 * Names in the thanks paragraph: a name after an office title ("Assemblywoman Catalina Cruz"), and any
 * registry name that appears in the text. Plain-language detection only; Claude checks the rest.
 * @returns {{key: string, via: 'title' | 'registry'}[]}
 */
export function thanksRecipients(thanks, reg) {
  if (!thanks) return [];
  const found = new Map();
  for (const m of thanks.matchAll(TITLE_RE)) {
    const name = cleanName(m[1]);
    if (name && !found.has(name)) found.set(name, 'title');
  }
  for (const e of Object.values(reg)) {
    if (thanks.includes(e.name) && !found.has(e.name)) found.set(e.name, 'registry');
  }
  return [...found].map(([key, via]) => ({ key, via }));
}

/* ---------- social block ---------- */

function checkComposers(c) {
  const problems = c.works.flatMap((w, i) => (typeof w?.composer === 'string' && w.composer.trim()
    ? [] : [`works[${i}].composer must be a string`]));
  if (problems.length) throw new Error('invalid concert data:\n  - ' + problems.join('\n  - '));
}

function readSocial(c) {
  const s = c.social ?? {};
  if (!s || typeof s !== 'object' || Array.isArray(s)) throw new Error('invalid social block:\n  - "social" must be a JSON object');
  const problems = [];
  for (const k of Object.keys(s)) {
    if (k === 'premiere') problems.push('"premiere" is not a social field: a premiere comes from works[].tag ("Premiere" or "World Premiere")');
    else if (!SOCIAL_KEYS.includes(k)) problems.push(`social.${k} is not a known field (allowed: ${SOCIAL_KEYS.join(', ')})`);
  }
  const str = (k) => {
    const v = s[k];
    if (v !== undefined && (typeof v !== 'string' || !v.trim())) problems.push(`social.${k}, if given, must be a non-empty string`);
    return v;
  };
  const strings = (k, re) => {
    const v = s[k];
    if (v === undefined) return [];
    if (!Array.isArray(v) || v.some((x) => typeof x !== 'string' || !x.trim() || (re && !re.test(x)))) {
      problems.push(`social.${k} must be a list of ${re ? 'hashtags (letters, digits, _)' : 'non-empty strings'}`);
      return [];
    }
    return v;
  };
  if (s.venue_parking !== undefined && typeof s.venue_parking !== 'boolean') problems.push('social.venue_parking must be true or false');
  const waive = strings('waive');
  for (const w of waive) if (!WAIVE_RE.test(w)) problems.push(`social.waive "${w}" must be "<key>:<facebook|instagram|x|address|maps_url>"`);
  const blurbs = s.soloist_blurbs ?? {};
  if (typeof blurbs !== 'object' || Array.isArray(blurbs)) problems.push('social.soloist_blurbs must be an object of name: phrase');
  const soloistNames = (c.people ?? []).slice(1).map((p) => p.name);
  for (const [name, phrase] of Object.entries(typeof blurbs === 'object' && blurbs ? blurbs : {})) {
    if (!soloistNames.includes(name)) problems.push(`social.soloist_blurbs has "${name}", which is not a soloist on this concert`);
    if (typeof phrase !== 'string' || !phrase.trim()) problems.push(`social.soloist_blurbs["${name}"] must be a non-empty phrase`);
  }
  const surnames = s.surnames ?? {};
  const composers = c.works.map((w) => w.composer);
  if (typeof surnames !== 'object' || Array.isArray(surnames)) problems.push('social.surnames must be an object of composer: surname');
  else {
    for (const [name, sn] of Object.entries(surnames)) {
      if (!composers.includes(name)) problems.push(`social.surnames has "${name}", which is not a composer on this program`);
      if (typeof sn !== 'string' || !sn.trim() || BAD_TEXT.test(sn)) problems.push(`social.surnames["${name}"] must be a non-empty string with no control characters or backticks`);
    }
  }
  if (problems.length) throw new Error('invalid social block:\n  - ' + problems.join('\n  - '));
  return {
    presenter: str('presenter') ?? DEFAULT_PRESENTER,
    venueKey: str('venue_key'),
    venueCity: str('venue_city'),
    parking: s.venue_parking,
    thanks: str('thanks'),
    collaborators: strings('collaborators'),
    hashtags: strings('hashtags', HASHTAG_RE).map((h) => `#${h.replace(/^#/, '')}`),
    waive,
    blurbs,
    surnames,
  };
}

/* ---------- posts ---------- */

const isPremiere = (w) => w.tag !== undefined && /premiere/i.test(w.tag);

/**
 * Whether a registry slot may be used as a tag or a value in the post. Verified always. A candidate only
 * with --draft-anyway, and never when the item is waived.
 */
const usable = (slot, waiveKey, trust) => slot.status === 'verified'
  || (slot.status === 'candidate' && trust.allowCandidate && !trust.waived.has(waiveKey));

/** The handle as it is written in a post: with an "@" in front. */
const displayHandle = (h) => (h.startsWith('@') ? h : `@${h}`);

/** Records one use of an entity on a platform and returns the handle to tag, or null (plain name). */
function usePlatform(log, ent, platform, trust) {
  const slot = platformState(ent.entry, platform);
  log.push({ ent, field: platform, status: slot.status, slot });
  return usable(slot, `${ent.key}:${platform}`, trust) ? displayHandle(slot.handle) : null;
}

/** Facebook: plain names unless a handle is usable; full sentences; numbered repertoire. */
function buildFacebook(d) {
  const log = [];
  const tag = (e) => usePlatform(log, e, 'facebook', d.trust);
  const plain = (e) => tag(e) ?? e.name;
  const withHandle = (e) => { const h = tag(e); return h ? `${e.name} ${h}` : e.name; };
  const collab = d.collaborators.map(withHandle);
  const premiere = d.premieres.map((p) => `the ${p.kindLower} of ${plain(p.composer)}'s ${p.work}`);
  const soloists = d.soloists.map((s) => `${s.blurb ? `the ${s.blurb}` : instrumentText(s.instrument)} soloist ${plain(s.ent)}`);
  const p1 = 'Mark your calendars for the upcoming Jackson Heights Orchestra concert' +
    (collab.length ? ` in collaboration with ${joinList(collab)}` : '') +
    `, ${d.timeFB}, ${d.whenFB} at ${withHandle(d.venue)} (${d.addrText})` +
    (premiere.length ? `, including ${joinList(premiere)}` : '') + '.' +
    (d.parking === true ? ' Parking will be available.' : '');
  const program = soloists.length ? ` featuring ${joinList(soloists)} and including` : ' including';
  const p2 = `JHO ${d.conductor.role} ${plain(d.conductor.ent)} has created a wonderful program${program} the following repertoire:`;
  const lines = [p1, p2, ...d.works.map((w, i) => `${i + 1}. ${d.surnameOf(w.composer)}: ${w.work}`)];
  if (d.thanks !== undefined) lines.push(d.thanks);
  return { text: lines.join('\n'), log };
}

/** Instagram: handles inline as in the approved post; the venue keeps its name before its handle. */
function buildInstagram(d) {
  const log = [];
  const tag = (e) => usePlatform(log, e, 'instagram', d.trust);
  const plain = (e) => tag(e) ?? e.name;
  const withHandle = (e) => { const h = tag(e); return h ? `${e.name} ${h}` : e.name; };
  const collab = d.collaborators.map(withHandle);
  const soloists = d.soloists.map((s) => `${capFirst(s.instrument)} Soloist ${plain(s.ent)}`);
  const first = `Join the ${plain(d.presenter)} and the Jackson Heights Orchestra` +
    (collab.length ? ` in collaboration with ${joinList(collab)}` : '') +
    `, led by ${d.conductor.role} ${plain(d.conductor.ent)}` +
    (soloists.length ? ` and featuring ${joinList(soloists)}` : '') + '!';
  const second = `The concert will be held at ${withHandle(d.venue)} in ${d.cityIG} on ${d.whenIG} at ${d.timeIG}.`;
  const paras = [first, second];
  if (d.premieres.length) {
    paras.push(`The concert includes ${joinList(d.premieres.map((p) => `the ${p.kindLower} of ${plain(p.composer)}'s ${p.work}`))}.`);
  }
  if (d.hashtags.length) paras.push(d.hashtags.join(' '));
  return { text: paras.join('\n\n'), log };
}

/**
 * X: one short paragraph. Optional clauses, in the order they are dropped when the post is too long:
 * the collaborator clause, then the lineup ("Led by ... and featuring ..."), then the parking sentence.
 * Parking outlasts the lineup because it is what an attendee needs. The premiere and the calendar
 * sentence are required and never dropped. The lineup has no final period, as in the approved post.
 */
function buildX(d, dropped) {
  const log = [];
  const tag = (e) => usePlatform(log, e, 'x', d.trust);
  const plain = (e) => tag(e) ?? e.name;
  const withHandle = (e) => { const h = tag(e); return h ? `${e.name} ${h}` : e.name; };
  const pres = tag(d.presenter);
  const collab = d.collaborators.length && !dropped.has('collab')
    ? ` in collaboration with ${joinList(d.collaborators.map(withHandle))}` : '';
  const parts = [`Mark your calendars for the next ${pres ? `${pres} ` : ''}Jackson Heights Orchestra concert${collab} ` +
    `at ${d.timeFB} on ${d.whenFB} at ${withHandle(d.venue)} (${d.addrText}).`];
  if (d.parking === true && !dropped.has('parking')) parts.push('Parking will be available.');
  for (const p of d.premieres) parts.push(`${p.kind}: ${plain(p.composer)}'s ${p.work}.`);
  if (!dropped.has('lineup')) {
    const soloists = d.soloists.map((s) => `${instrumentText(s.instrument)} soloist ${plain(s.ent)}`);
    parts.push(`Led by ${d.conductor.role} ${plain(d.conductor.ent)}` + (soloists.length ? ` and featuring ${joinList(soloists)}` : ''));
  }
  return { text: parts.join(' '), log };
}

/** Builds X, dropping optional clauses one at a time until it fits. Never truncates. */
function draftX(d) {
  const order = ['collab', 'lineup', 'parking'].filter((k) => (k !== 'collab' || d.collaborators.length > 0)
    && (k !== 'parking' || d.parking === true));
  const dropped = new Set();
  let draft = buildX(d, dropped);
  let length = xLength(draft.text);
  for (const k of order) {
    if (length <= X_LIMIT) break;
    dropped.add(k);
    draft = buildX(d, dropped);
    length = xLength(draft.text);
  }
  const droppedList = order.filter((k) => dropped.has(k));
  if (length > X_LIMIT) {
    const after = droppedList.length ? droppedList.join(', ') : 'no optional clause';
    return {
      ok: false, length, dropped: droppedList, log: draft.log,
      error: `X post is ${length} characters, over the ${X_LIMIT} limit, after dropping ${after}. ` +
        'The date, time, venue, address and any premiere are required and do not fit. ' +
        'Shorten the venue name, the address or the premiere text in the concert JSON, or decide what to cut.',
    };
  }
  return { ok: true, text: draft.text, length, dropped: droppedList, log: draft.log };
}

/* ---------- gate and checklist ---------- */

function blockerText(ent, field, status) {
  if (field === 'address' || field === 'maps_url') return `${FIELD_LABEL[field]} is ${status}`;
  return `${ent.name} (${LABEL[field]}) is ${status}`;
}

function gateFrom(logs, waived) {
  const out = [];
  for (const { ent, field, status } of logs) {
    if (!UNVERIFIED.includes(status) || waived.has(`${ent.key}:${field}`)) continue;
    const text = blockerText(ent, field, status);
    if (!out.includes(text)) out.push(text);
  }
  return out;
}

/** Whole days from one YYYY-MM-DD to another (UTC, so no daylight-saving drift). */
const utcDay = (iso) => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d); };
const daysBetween = (from, to) => Math.round((utcDay(to) - utcDay(from)) / 864e5);

function checklistFrom(logs, extra, { waived, waive, iso }) {
  const items = [];
  const add = (t) => { if (!items.includes(t)) items.push(t); };
  const tail = (ent, field) => (waived.has(`${ent.key}:${field}`)
    ? ' Waived in social.waive: the draft uses the plain name.' : '');
  for (const { ent, status } of logs) {
    if (status === 'missing') {
      add(`${ent.name} is not in handles.json. Ask the user for its type (person, org or venue) and its Facebook, Instagram and X handles, or "none" for each platform without an account. Then record them with record.mjs.`);
    }
  }
  for (const { ent, field, status, slot } of logs) {
    if (status === 'unknown' && PLATFORMS.includes(field)) {
      add(`${ent.name}: ${LABEL[field]} handle? Give the handle, or "none" if there is no ${LABEL[field]} account.${tail(ent, field)}`);
    } else if (status === 'unknown') {
      add(`${ent.name}: ${FIELD_LABEL[field]} is unknown. Give it with its source, or confirm it should stay unset.${tail(ent, field)}`);
    } else if (status === 'candidate' && PLATFORMS.includes(field)) {
      add(`${ent.name}: ${LABEL[field]} candidate ${slot.handle} (source ${slot.source}). Confirm it, correct it, or say "none".${tail(ent, field)}`);
    } else if (status === 'candidate') {
      add(`${ent.name}: ${FIELD_LABEL[field]} candidate (source ${slot.source}). Confirm it, or correct it.${tail(ent, field)}`);
    }
  }
  for (const { ent, field, status, slot } of logs) {
    if (status !== 'verified' || !slot.verified_on) continue;
    const days = daysBetween(slot.verified_on, iso);
    if (days > STALE_DAYS) {
      const label = PLATFORMS.includes(field) ? LABEL[field] : FIELD_LABEL[field];
      add(`${ent.name}: ${label} was verified on ${slot.verified_on}, ${days} days before the concert. Still right? Re-check it before posting.`);
    }
  }
  const used = new Set(logs.map(({ ent, field }) => `${ent.key}:${field}`));
  for (const w of waive) {
    if (!used.has(w)) add(`social.waive "${w}" matches nothing in this draft, so it has no effect. Check the name and the platform.`);
  }
  return [...items, ...extra];
}

/* ---------- the draft ---------- */

/**
 * Build the three drafts, the venue facts, the gate and the checklist. Validation runs first:
 * the registry, resolvePeople, then validateConcert (dates and weekday), then the social block.
 * @param {any} concert the concert JSON (may carry a "social" block)
 * @param {{registry?: object, roster?: object, today?: string, allowPast?: boolean, draftAnyway?: boolean}} [opts]
 * @returns {Promise<object>} the result (see renderMarkdown)
 */
export async function buildSocial(concert, { registry, roster, today, allowPast = false, draftAnyway = false } = {}) {
  if (!concert || typeof concert !== 'object' || Array.isArray(concert)) throw new Error('invalid concert data:\n  - concert must be a JSON object');
  const reg = validateRegistry(registry ?? await loadRegistry(), { today });
  const resolved = await resolvePeople(concert, roster ?? await loadRoster());
  const c = await validateConcert(resolved, { today, allowPast });
  checkComposers(c);
  const s = readSocial(c);
  const trust = { allowCandidate: draftAnyway, waived: new Set(s.waive) };

  const logs = [];
  const venueRef = s.venueKey ?? c.venue;
  const venueEntry = findEntry(reg, venueRef);
  if (s.venueKey !== undefined) {
    if (!venueEntry) throw new Error(`invalid social block:\n  - venue_key "${s.venueKey}" is not in handles.json`);
    if (venueEntry.name !== c.venue) {
      throw new Error(`invalid social block:\n  - venue_key "${s.venueKey}" is registered as "${venueEntry.name}", but concert.venue is "${c.venue}"`);
    }
  }
  const venue = { key: venueRef, name: c.venue, entry: venueEntry };

  const addrSlot = fieldState(venueEntry, 'address');
  const addrUsed = usable(addrSlot, `${venueRef}:address`, trust);
  const usedAddress = addrUsed ? addrSlot.value : c.address;
  const addr = parseVenueAddress(usedAddress);
  const addrText = `${addr.street}, ${addr.city}, NY`;
  const extra = [];
  if (addrUsed && parseVenueAddress(c.address).street !== addr.street) {
    extra.push(`concert.address ("${c.address}") differs from the registry address; the posts use the registry address.`);
  }
  logs.push({ ent: venue, field: 'address', status: addrSlot.status, slot: addrSlot });

  const mapsSlot = fieldState(venueEntry, 'maps_url');
  const mapsUsed = usable(mapsSlot, `${venueRef}:maps_url`, trust);
  const mapsUrl = mapsUsed ? mapsSlot.value : generatedMapsUrl(addrText);
  logs.push({ ent: venue, field: 'maps_url', status: mapsSlot.status, slot: mapsSlot });

  const [, hh, mm, ap] = /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(c.time);
  const f = calendarFacts(c.iso);
  const year = c.iso.slice(0, 4);
  const d = {
    title: c.title,
    summary: `${f.weekday}, ${f.month} ${f.day}, ${year} at ${c.time}, ${c.venue}`,
    timeFB: `${Number(hh)}:${mm}${ap.toLowerCase()}`,
    timeIG: `${Number(hh)}${mm}${ap.toLowerCase()}`,
    whenFB: `${f.weekday}, ${f.month} ${f.day} ${year}`,
    whenIG: `${f.weekday}, ${f.month} ${ordinal(f.day)}, ${year}`,
    addrText,
    cityIG: s.venueCity ?? addr.city,
    venue,
    trust,
    presenter: entityFor(reg, s.presenter),
    conductor: { ent: entityFor(reg, c.people[0].name), role: c.people[0].role },
    soloists: c.people.slice(1).map((p) => ({
      ent: entityFor(reg, p.name),
      instrument: p.role,
      blurb: Object.hasOwn(s.blurbs, p.name) ? s.blurbs[p.name] : undefined,
    })),
    collaborators: s.collaborators.map((r) => entityFor(reg, r)),
    premieres: c.works.filter(isPremiere).map((w) => ({
      kind: capFirst(w.tag.trim()),
      kindLower: lowerKind(w.tag.trim()),
      composer: entityFor(reg, w.composer),
      work: w.work.trim().replace(/[.!?]+$/, ''),
    })),
    surnameOf: (composer) => (Object.hasOwn(s.surnames, composer) ? s.surnames[composer] : surname(composer)),
    parking: s.parking,
    thanks: s.thanks,
    hashtags: s.hashtags,
    works: c.works,
  };

  const fb = buildFacebook(d);
  const ig = buildInstagram(d);
  const x = draftX(d);
  logs.push(...fb.log, ...ig.log, ...x.log);
  // The thanks paragraph is verbatim text, but each name in it is still a person or org the user has to
  // answer for. It is gated on Facebook, where the paragraph is posted.
  for (const t of thanksRecipients(s.thanks, reg)) {
    const ent = entityFor(reg, t.key);
    const slot = platformState(ent.entry, 'facebook');
    logs.push({ ent, field: 'facebook', status: slot.status, slot });
  }

  if (s.parking === undefined) {
    extra.push('Parking: social.venue_parking is not set, so the posts say nothing about parking. Confirm whether there is parking.');
  }
  if (s.thanks === undefined) {
    extra.push('Thanks paragraph: social.thanks is not set, so the Facebook post has no thanks or funding acknowledgement. Confirm whether to add one.');
  }
  if (!x.ok) extra.push(`X: the post is ${x.length} characters, over the ${X_LIMIT} limit. Decide what to shorten; the X section is not drafted.`);

  return {
    title: c.title,
    iso: c.iso,
    summary: d.summary,
    venue: {
      name: c.venue,
      address: { text: addrText, full: usedAddress, status: addrSlot.status, source: addrSlot.source ?? null, value: addrSlot.value ?? null },
      maps: { url: mapsUrl, generated: !mapsUsed, status: mapsSlot.status, source: mapsSlot.source ?? null },
    },
    facebook: { text: fb.text },
    instagram: { text: ig.text },
    x: x.ok
      ? { ok: true, text: x.text, length: x.length, dropped: x.dropped }
      : { ok: false, length: x.length, dropped: x.dropped, error: x.error },
    blockers: gateFrom(logs, trust.waived),
    needs: checklistFrom(logs, extra, { waived: trust.waived, waive: s.waive, iso: c.iso }),
  };
}

/** The markdown file: venue, three posts in fences, the X length, and the checklist. */
export function renderMarkdown(r, { draftAnyway = false } = {}) {
  const out = [];
  if (draftAnyway && r.blockers.length) {
    out.push('UNVERIFIED — do not post', '', 'These items are not verified:');
    for (const b of r.blockers) out.push(`- ${b}`);
    out.push('');
  }
  out.push(`# Social posts: ${r.title}`, '', `${r.summary}.`,
    'Drafted, not posted. Read "Needs your input" before anything goes out.', '');
  const a = r.venue.address;
  out.push('## Venue', '', `- Name: ${r.venue.name}`,
    `- Address in the posts: ${a.text} (full: ${a.full}). Status: ${a.status}${a.source ? `, source ${a.source}` : ''}.`);
  const m = r.venue.maps;
  out.push(m.generated
    ? `- Maps link: ${m.url} (generated search link, not a share link). Status: ${m.status}.`
    : `- Maps link: ${m.url}. Status: ${m.status}, source ${m.source}.`, '');
  out.push('## Facebook', '', fence(r.facebook.text), '');
  out.push('## Instagram', '', fence(r.instagram.text), '');
  out.push('## X (Twitter)', '');
  if (r.x.ok) {
    const dropped = r.x.dropped.length ? ` Dropped to fit: ${r.x.dropped.map(clauseName).join(', ')}.` : '';
    out.push(`Length: ${r.x.length} of ${X_LIMIT} (URLs count 23, @handles count in full).${dropped}`, '', fence(r.x.text), '');
  } else {
    out.push(`NOT DRAFTED: ${r.x.error}`, '');
  }
  out.push('## Needs your input', '');
  if (r.needs.length) for (const n of r.needs) out.push(`- [ ] ${n}`);
  else out.push('Nothing to confirm.');
  return out.join('\n') + '\n';
}

/** A code fence one backtick longer than the longest run of backticks in the text (never shorter than three). */
function fence(t) {
  const longest = Math.max(0, ...[...t.matchAll(/`+/g)].map((m) => m[0].length));
  const f = '`'.repeat(Math.max(3, longest + 1));
  return `${f}text\n${t}\n${f}`;
}
const clauseName = (k) => ({ collab: 'collaborator clause', lineup: 'lineup', parking: 'parking sentence' })[k] ?? k;

/**
 * Write the markdown into outDir. An existing file is not replaced unless `force` (it may be
 * hand-edited). Never writes through a symlink. The folder itself must already be checked (resolveOutDir).
 * @returns {Promise<string>} the file path
 */
export async function writeSocialFile(outDir, md, iso, { force = false } = {}) {
  return writeSafely(path.join(outDir, socialFileName(iso)), md, { overwrite: force });
}

/* ---------- CLI ---------- */

const FLAGS = {
  data: 'value', out: 'value', registry: 'value',
  stdout: 'flag', force: 'flag', 'allow-past': 'flag', 'draft-anyway': 'flag',
};

/** --flag or --key value. Boolean flags take no value. Keys are camelCased. An unknown flag is an error. */
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
  const r = await buildSocial(concert, { registry, allowPast: !!a.allowPast, draftAnyway: !!a.draftAnyway });
  if (r.blockers.length && !a.draftAnyway) {
    throw new Error(`refused: ${r.blockers.length} item(s) are not verified:\n  - ${r.blockers.join('\n  - ')}\n` +
      `Run node .claude/skills/jho-social-posts/discover.mjs --data ${a.data} to write the verification worksheet, ` +
      'verify each item with the user, record the answers with record.mjs, then run this again. ' +
      'Use --draft-anyway only for a draft you know is unverified.');
  }
  const md = renderMarkdown(r, { draftAnyway: !!a.draftAnyway });
  if (r.blockers.length) console.warn(`make-social: UNVERIFIED draft (${r.blockers.length} item(s)); the file says so at the top.`);
  if (a.stdout) {
    process.stdout.write(md);
  } else {
    const outDir = await resolveOutDir(a.out ?? concertOutDir(r.iso));
    await mkdir(outDir, { recursive: true });
    const file = await writeSocialFile(outDir, md, r.iso, { force: !!a.force });
    console.log(JSON.stringify({ file, unverified: r.blockers.length, x: r.x.ok ? `drafted (${r.x.length} of ${X_LIMIT})` : 'NOT DRAFTED', needs: r.needs.length }, null, 2));
  }
  if (!r.x.ok) throw new Error(`X section not drafted: ${r.x.error}`);
}

if (isEntryPoint(import.meta.url)) {
  cli(process.argv.slice(2)).catch((err) => {
    console.error(`make-social: ${err.message}`);
    process.exit(1);
  });
}
