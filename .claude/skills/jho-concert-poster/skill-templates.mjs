/**
 * Skill-owned poster templates. These are layouts the skill owns (under templates/),
 * not design-system templates. A variant/style pair routes here when it is listed in
 * SKILL_TEMPLATES; every other pair still goes through the design-system snippet fill
 * in make-poster.mjs.
 *
 * Fill model: the template carries [[token]] slots for every text and photo value, plus
 * one works block between <!--works--> and <!--/works-->. The row markup inside that block
 * is repeated once per work. Values are escaped here, in code, so no value can be
 * injected as markup except the title's italic "& ..." part and the tag chip, which this
 * module builds itself.
 *
 * Single pass: the template is scanned once for slots before any value exists, and each
 * piece of template text is filled with one replace call. Replacement text is never
 * scanned again, so a value such as "[[venue]]" or "$&" prints exactly as typed.
 *
 * To add a variant: add a template folder, a SKILL_TEMPLATES entry, and a values function
 * in VALUES_FOR_VARIANT. Nothing else in make-poster.mjs changes.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILL_DIR = path.dirname(fileURLToPath(import.meta.url));

/**
 * Routing table. Key is "<Variant>/<style>". `pagePath` is the URL the template is
 * served at under the design-system site root (the template is served from memory, it is
 * never written into design-system/). Its ../../ must reach the design-system root, so the
 * path has exactly two directory levels.
 */
export const SKILL_TEMPLATES = {
  'Solo/color': {
    file: 'templates/solo-online/ConcertPosterSoloOnline.dc.html',
    pagePath: '/jho-concert-poster/solo-online/ConcertPosterSoloOnline.dc.html',
  },
  'Duo/color': {
    file: 'templates/duo-online/ConcertPosterDuoOnline.dc.html',
    pagePath: '/jho-concert-poster/duo-online/ConcertPosterDuoOnline.dc.html',
  },
  'Trio/color': {
    file: 'templates/trio-online/ConcertPosterTrioOnline.dc.html',
    pagePath: '/jho-concert-poster/trio-online/ConcertPosterTrioOnline.dc.html',
  },
};

/** People per variant: conductor plus this many soloists. */
export const PEOPLE_FOR_VARIANT = { Solo: 1, Duo: 2, Trio: 3 };

/** Entry for a variant and style, or null when the design-system template is used. */
export function skillTemplateFor(variant, style) {
  const entry = SKILL_TEMPLATES[`${variant}/${style}`];
  if (!entry) return null;
  return { ...entry, abs: path.join(SKILL_DIR, entry.file) };
}

/**
 * HTML-escape plain text the way the templates' source does (named + numeric entities).
 * Non-ASCII is matched per code point (the u flag), so an astral character such as U+1D11E
 * becomes one entity, not two broken surrogates. Shared with make-poster.mjs and jho-instagram.
 *
 * The design-system runtime evaluates "{{ x }}" in each DOM text node, after the HTML is parsed. So an
 * entity does not help (&#123; is decoded to "{" before the runtime reads it), and a title of
 * "{{ markSize }}" would print the runtime value 93. An empty comment between two braces splits the
 * text node, so no node holds "{{", and the visible text and textContent are unchanged. Comments are
 * not rendered, so the layout is unchanged too.
 *
 * Only text is safe this way. A brace in an attribute value cannot be split, so person names (which
 * also go into alt="...") are refused with a brace in them, in validateConcert. Brackets are not
 * encoded: the fill never re-reads a value, so "[[slot]]" in a value prints as typed.
 */
export function esc(s) {
  return String(s)
    .replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
    .replace(/\{(?=\{)/g, '{<!---->')
    .replace(/[^\x00-\x7F]/gu, (ch) => `&#${ch.codePointAt(0)};`);
}

/**
 * A photo path as written after src="../../". The path has already been validated to
 * [\w.\- /] by make-poster.mjs; encodeURI makes a space safe in a URL, esc covers the rest.
 */
export function photoSrc(photo) {
  return esc(encodeURI(photo));
}

/**
 * Title markup. "Masks & Revelations" sets the part from the first " & " on in italic,
 * as the Dec 2026 reference does. A title with no " & " is set upright in one run.
 */
export function titleHtml(title) {
  const i = title.indexOf(' & ');
  if (i <= 0) return esc(title);
  return `${esc(title.slice(0, i))} <em>${esc(title.slice(i + 1))}</em>`;
}

/** Slots every variant has: the programme text, the When/Where lines and the conductor. */
function commonValues(c) {
  const cond = c.people[0];
  return {
    title_html: titleHtml(c.title),
    blurb: esc(c.blurb),
    when: `${esc(c.dayname)} &middot; ${esc(c.date)}`,
    time_line: `${esc(c.time)} &middot; ${esc(c.doors)}`,
    venue: esc(c.venue),
    address: esc(c.address),
    conductor_name: esc(cond.name),
    conductor_role: esc(cond.role),
    conductor_photo: photoSrc(cond.photo),
  };
}

/** One soloist's caption and photo slots, under `prefix` (for example "soloist" or "soloist_a"). */
function personValues(prefix, p) {
  return {
    [`${prefix}_name`]: esc(p.name),
    [`${prefix}_role`]: esc(p.role),
    [`${prefix}_photo`]: photoSrc(p.photo),
  };
}

/** Slot values for a Solo concert (conductor only). */
export function soloValues(c) {
  return commonValues(c);
}

/** Slot values for a Duo concert (conductor first, then one soloist). */
export function duoValues(c) {
  return { ...commonValues(c), ...personValues('soloist', c.people[1]) };
}

/** Slot values for a Trio concert (conductor, then two soloists). */
export function trioValues(c) {
  return { ...commonValues(c), ...personValues('soloist_a', c.people[1]), ...personValues('soloist_b', c.people[2]) };
}

/** Values builder per variant. A variant with no entry has no skill template fill. */
const VALUES_FOR_VARIANT = { Solo: soloValues, Duo: duoValues, Trio: trioValues };

const WORKS_OPEN = '<!--works-->';
const WORKS_CLOSE = '<!--/works-->';
const SLOT_RE = /\[\[([a-z_]+)\]\]/g;

/** Work-row slots. Each value is built by code from one work, never spliced in as a pattern. */
const WORK_SLOTS = {
  work_composer: (w) => esc(w.composer),
  work_title: (w) => esc(w.work),
  work_tag: (w) => (w.tag ? `<span class="jho-tag">${esc(w.tag)}</span>` : ''),
  // The first work of the second column. Solo lays the works in two CSS columns and breaks before this one, so
  // 3 works read 2 + 1 and 5 read 3 + 2 whatever the heights (column balancing would give 1 + 2 after a tall work).
  work_class: (w, { i, n }) => (i > 0 && i === Math.ceil(n / 2) ? ' jho-col-start' : ''),
};

/**
 * Locate the works block and its row template in the raw source. Throws if the markers
 * are not exactly one pair, or if the row does not hold each work slot exactly once and
 * nothing else.
 * @returns {{start: number, end: number, row: string}}
 */
function worksRegion(src) {
  const start = src.indexOf(WORKS_OPEN);
  const end = src.indexOf(WORKS_CLOSE);
  if (start === -1 || end === -1 || src.indexOf(WORKS_OPEN, start + 1) !== -1 || end < start) {
    throw new Error(`skill template must have exactly one ${WORKS_OPEN} ... ${WORKS_CLOSE} block`);
  }
  const row = src.slice(start + WORKS_OPEN.length, end).trim();
  for (const key of Object.keys(WORK_SLOTS)) {
    const t = `[[${key}]]`;
    if (row.split(t).length !== 2) throw new Error(`works row must contain ${t} exactly once`);
  }
  const extra = [...row.matchAll(SLOT_RE)].map((m) => m[1]).filter((k) => !Object.hasOwn(WORK_SLOTS, k));
  if (extra.length) throw new Error(`works row has unknown slots: ${extra.join(', ')}`);
  return { start, end, row };
}

/** One row per work, each built from the template row in a single replace over the row text. */
function workRows(row, works) {
  return works.map((w, i) => row.replace(SLOT_RE, (_, key) => WORK_SLOTS[key](w, { i, n: works.length })));
}

/**
 * The template with its works block regenerated for `works`. Top-level slots are untouched.
 * @returns {string}
 */
export function fillWorks(src, works) {
  const { start, end, row } = worksRegion(src);
  return src.slice(0, start) + WORKS_OPEN + '\n' + workRows(row, works).join('\n') + '\n' + src.slice(end);
}

/**
 * Fill a skill template. Every [[key]] outside the works block must have a value, every
 * value must have a slot, and the check runs on the raw template before any value is
 * inserted. Then each piece of template is filled in one pass, so user text is never
 * scanned for slots. Throws on a missing or unknown slot.
 * @param {string} src  template source
 * @param {object} c    validated concert with people[] (see make-poster.mjs validateConcert)
 * @param {{variant: string}} o
 * @returns {string}
 */
export function fillSkillTemplate(src, c, { variant }) {
  if (!VALUES_FOR_VARIANT[variant]) throw new Error(`no skill template fill for ${variant}`);
  if (c.people.length !== PEOPLE_FOR_VARIANT[variant]) {
    throw new Error(`${variant} template needs ${PEOPLE_FOR_VARIANT[variant]} people, got ${c.people.length}`);
  }
  const values = VALUES_FOR_VARIANT[variant](c);
  const { start, end, row } = worksRegion(src);
  const outside = src.slice(0, start) + src.slice(end);
  const slots = [...new Set([...outside.matchAll(SLOT_RE)].map((m) => m[1]))];
  const missing = Object.keys(values).filter((k) => !slots.includes(k));
  if (missing.length) throw new Error(`skill template has no slot for: ${missing.join(', ')}`);
  const unknown = slots.filter((k) => !Object.hasOwn(values, k));
  if (unknown.length) throw new Error(`skill template has unknown slots: ${unknown.join(', ')}`);
  const fill = (text) => text.replace(SLOT_RE, (_, key) => values[key]);
  return fill(src.slice(0, start)) + WORKS_OPEN + '\n' + workRows(row, c.works).join('\n') + '\n' + fill(src.slice(end));
}

/** Read a skill template's source. */
export async function loadSkillSource(entry) {
  return readFile(entry.abs, 'utf8');
}
