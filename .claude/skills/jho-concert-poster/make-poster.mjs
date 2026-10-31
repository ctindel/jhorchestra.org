#!/usr/bin/env node
/**
 * jho-concert-poster — pick a JHO poster template, fill it with concert data,
 * render PNG + PDF into <repo>/pr/<YYYYMMDD>_Concert/ (from the concert's iso).
 *
 * CLI:
 *   node make-poster.mjs --data <concert.json> --style color|print|bw [--out <dir>] [--scale 3] [--allow-past]
 *   --out replaces the whole destination folder; without it the folder is pr/<YYYYMMDD>_Concert/.
 *   node make-poster.mjs --check-baseline      # design-system templates: every May 2026 snippet occurs exactly once;
 *                                              # skill templates: Dec 2026 fill must be complete
 *
 * Template choice (from people.length): 1 = Solo, 2 = Duo, 3 = Trio.
 * Style: color = Online (web/social), print = Print-Color, bw = Print-BW.
 * Routing: a variant/style listed in skill-templates.mjs SKILL_TEMPLATES (today Duo/color)
 * uses the skill-owned template; every other pair uses the design-system template.
 *
 * The design-system templates are static HTML. The only runtime props are
 * `markSize` and `finish`; the concert text and photos are literal markup. So
 * "filling" is an exact-snippet replacement on the template source: every
 * snippet of the baseline (May 2026) concert must occur exactly once, and the
 * new values are substituted in one pass. A missing or duplicated snippet is an
 * error, never a silent skip.
 *
 * The works list is the one variable-length part. The template has 3 work rows;
 * the row pattern is read from them and the whole block is regenerated for
 * 1..MAX_WORKS[variant] works. The tag is optional per work.
 */
import { readFile, readdir, realpath, lstat, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPage } from '../jho-render/render.mjs';
import { skillTemplateFor, fillSkillTemplate, loadSkillSource, SKILL_TEMPLATES, esc, photoSrc } from './skill-templates.mjs';

// esc lives in skill-templates.mjs (one implementation). Re-exported because jho-instagram imports it from here.
export { esc };

const SKILL_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(SKILL_DIR, '../../..');
const DS_ROOT = path.join(REPO, 'design-system');

const VARIANTS = { 1: 'Solo', 2: 'Duo', 3: 'Trio' };
const STYLES = {
  color: { finish: 'online', label: 'Online', dataFinish: 'online' },
  print: { finish: 'print-color', label: 'Print-Color', dataFinish: 'print-color' },
  bw: { finish: 'print-bw', label: 'Print-BW', dataFinish: 'print-bw' },
};
/** Template folder under design-system/templates per variant and style. */
const FOLDERS = {
  Solo: { color: 'concert-poster', print: 'concert-poster-print', bw: 'concert-poster-bw' },
  Duo: { color: 'concert-poster-duo', print: 'concert-poster-duo-print', bw: 'concert-poster-duo-bw' },
  Trio: { color: 'concert-poster-trio', print: 'concert-poster-trio-print', bw: 'concert-poster-trio-bw' },
};
/**
 * Maximum works per template, so the works column stays inside its grid box
 * (above the footer divider). Measured in Chromium at 816x1056 for color, print
 * and bw. Free space from the column's last row to the grid's bottom edge:
 * Solo 3 = 55px, Solo 4 = 16px, Solo 5 = -62px; Duo and Trio 3 = 71px, 4 = 38px, 5 = -10px.
 * So 4 is the max for all three. See SKILL.md, "Works per template".
 */
export const MAX_WORKS = { Solo: 4, Duo: 4, Trio: 4 };

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];
const TIME_RE = /^(1[0-2]|0?[1-9]):[0-5]\d (AM|PM)$/;
const DOORS_RE = /^Doors (1[0-2]|0?[1-9]):[0-5]\d (AM|PM)$/;

/**
 * Today as YYYY-MM-DD in New York, where the poster's venue is. The machine's own zone is not
 * used, so a laptop set to another zone cannot move the past-date line.
 * @param {Date} [now]
 */
export function todayInNewYork(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

/**
 * Calendar facts for a YYYY-MM-DD string, or null if it is not a real calendar date
 * (2026-02-30 is rejected, 2028-02-29 is accepted).
 * @returns {{weekday: string, month: string, day: number} | null}
 */
export function calendarFacts(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
  if (!m) return null;
  const y = Number(m[1]); const mo = Number(m[2]); const d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return { weekday: WEEKDAYS[dt.getUTCDay()], month: MONTHS[mo - 1], day: d };
}

const DATE_FORMS = [/^(\d{4})-(\d{2})-(\d{2})$/, /^(\d{4})(\d{2})(\d{2})$/];

/**
 * Folder name for a concert date: "2026-12-09" or "20261209" -> "20261209_Concert". Only a real
 * calendar date in one of the two forms passes, and only digits reach the name, so it cannot hold
 * a separator or a "..".
 * @param {unknown} date
 * @returns {string}
 */
export function concertFolder(date) {
  const m = typeof date === 'string' ? DATE_FORMS.map((re) => re.exec(date)).find(Boolean) : undefined;
  if (!m || !calendarFacts(`${m[1]}-${m[2]}-${m[3]}`)) {
    throw new Error(`concert date must be YYYY-MM-DD or YYYYMMDD and a real calendar date, got ${JSON.stringify(date)}`);
  }
  return `${m[1]}${m[2]}${m[3]}_Concert`;
}

/**
 * The default destination for a concert: <repo>/pr/<YYYYMMDD>_Concert. Used when --out is not given.
 * @param {unknown} date
 * @param {{repo?: string}} [opts]
 * @returns {string}
 */
export function concertOutDir(date, { repo = REPO } = {}) {
  return path.join(repo, 'pr', concertFolder(date));
}

/** "Mon D" short form used in messages, e.g. "Dec 9". */
const shortMD = (monthName, day) => `${monthName.slice(0, 3)} ${day}`;

/** Nearest date (within 3 days) to `iso` that falls on `weekday`, as "Wednesday Dec 9". */
function nearestWithWeekday(iso, weekday) {
  const [y, mo, d] = iso.split('-').map(Number);
  const base = Date.UTC(y, mo - 1, d);
  const diff = (WEEKDAYS.indexOf(weekday) - new Date(base).getUTCDay() + 7) % 7;
  const off = diff <= 3 ? diff : diff - 7;
  const dt = new Date(base + off * 864e5);
  return `${weekday} ${shortMD(MONTHS[dt.getUTCMonth()], dt.getUTCDate())}`;
}

/** Date problems for a concert with a well-formed iso. Returns a list of messages. */
function dateProblems(c, { today, allowPast }) {
  const f = calendarFacts(c.iso);
  if (!f) return [`"iso" ${c.iso} is not a real calendar date`];
  const problems = [];
  if (c.dayname !== undefined) {
    if (!WEEKDAYS.includes(c.dayname)) {
      problems.push(`dayname '${c.dayname}' is not a weekday name`);
    } else if (c.dayname !== f.weekday) {
      problems.push(`dayname '${c.dayname}' does not match ${c.iso}, which is a ${f.weekday}. ` +
        `Ask the user which they meant (${nearestWithWeekday(c.iso, c.dayname)} or ` +
        `${f.weekday} ${shortMD(f.month, f.day)}).`);
    }
  }
  if (c.date !== undefined) {
    const want = `${f.month} ${f.day}`;
    if (c.date !== want) {
      problems.push(`date '${c.date}' does not match ${c.iso}, whose month and day are '${want}'. ` +
        `Ask the user which they meant (${c.date} or ${want}).`);
    }
  }
  if (!allowPast && c.iso < today) {
    problems.push(`${c.iso} is in the past (today is ${today}). Pass --allow-past only if this is intentional.`);
  }
  return problems;
}

/** Allowed photo path: ASCII letters, digits, _ - . / and spaces, ending in an image extension. */
const PHOTO_RE = /^[\w.\- /]+\.(jpe?g|png|webp)$/i;

/**
 * Check a photo path under the design-system root. Four checks, in order:
 *  1. the characters and extension (nothing that could break out of an HTML attribute);
 *  2. lexical containment (no "../" that leaves the root);
 *  3. each directory and the file name exist with the exact case, one component at a time
 *     (macOS would find "Photos" for "photos", so the directory listing is compared instead);
 *  4. realpath stays inside the real root (a symlink cannot point out), and the real path
 *     relative to the root equals the input. An alias to a real file is refused, so each photo
 *     has one written path and the duplicate check can compare canonical paths.
 * @param {unknown} photo
 * @param {string} [root] design-system root; a parameter so tests can use a fixture
 * @returns {Promise<{problem: string} | {normalized: string}>}
 */
export async function checkPhotoPath(photo, root = DS_ROOT) {
  if (typeof photo !== 'string' || !PHOTO_RE.test(photo)) {
    return { problem: `photo must be a jpg/png/webp path under design-system/ (letters, digits, _ - . / and spaces): ${photo}` };
  }
  if (!path.resolve(root, photo).startsWith(root + path.sep)) return { problem: `photo is outside design-system/: ${photo}` };
  let dir = root;
  for (const part of photo.split('/')) {
    if (part === '' || part === '.' || part === '..') return { problem: `photo path has an empty, "." or ".." part: ${photo}` };
    const names = await readdir(dir).catch(() => null);
    if (!names || !names.includes(part)) return { problem: `photo file not found (exact name, case-sensitive): ${photo}` };
    dir = path.join(dir, part);
  }
  let realRoot; let real;
  try {
    realRoot = await realpath(root);
    real = await realpath(path.join(root, photo));
  } catch {
    return { problem: `photo file not found (exact name, case-sensitive): ${photo}` };
  }
  if (!(await stat(real)).isFile()) return { problem: `photo is not a file: ${photo}` };
  const normalized = path.relative(realRoot, real).split(path.sep).join('/');
  if (normalized === '..' || normalized.startsWith('../') || path.isAbsolute(normalized)) {
    return { problem: `photo resolves outside design-system/ (a symlink?): ${photo}` };
  }
  if (normalized !== photo) {
    return { problem: `photo must be written exactly as "${normalized}" (got "${photo}"; a symlink or a non-canonical path): ${photo}` };
  }
  return { normalized };
}

/**
 * Validate concert data. Returns the concert with dayname/date derived from iso when
 * they are absent. Throws one error listing every problem.
 * @param {any} c
 * @param {{today?: string, allowPast?: boolean}} [opts] today defaults to the local date
 */
export async function validateConcert(c, { today = todayInNewYork(), allowPast = false } = {}) {
  if (!c || typeof c !== 'object' || Array.isArray(c)) throw new Error('invalid concert data:\n  - concert must be a JSON object');
  const problems = [];
  for (const k of ['title', 'blurb', 'time', 'doors', 'venue', 'address', 'iso']) {
    if (typeof c[k] !== 'string' || !c[k].trim()) problems.push(`"${k}" must be a non-empty string`);
  }
  for (const k of ['dayname', 'date']) {
    if (c[k] !== undefined && (typeof c[k] !== 'string' || !c[k].trim())) problems.push(`"${k}", if given, must be a non-empty string`);
  }
  if (typeof c.time === 'string' && c.time.trim() && !TIME_RE.test(c.time)) {
    problems.push(`"time" must look like "7:30 PM", got "${c.time}"`);
  }
  if (typeof c.doors === 'string' && c.doors.trim() && !DOORS_RE.test(c.doors)) {
    problems.push(`"doors" must look like "Doors 7:00 PM", got "${c.doors}"`);
  }

  const nPeople = Array.isArray(c.people) ? c.people.length : 0;
  const variant = VARIANTS[nPeople];
  const maxWorks = variant ? MAX_WORKS[variant] : Math.max(...Object.values(MAX_WORKS));

  let derived = null;
  if (typeof c.iso === 'string') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(c.iso)) {
      problems.push('"iso" must be YYYY-MM-DD');
    } else {
      const dp = dateProblems(c, { today, allowPast });
      problems.push(...dp);
      derived = calendarFacts(c.iso);
    }
  }

  if (!Array.isArray(c.works) || c.works.length < 1 || c.works.length > maxWorks) {
    problems.push(`"works" must have 1 to ${maxWorks} entries${variant ? ` for the ${variant} template` : ''}`);
  } else {
    c.works.forEach((w, i) => {
      if (!w || !w.composer || !w.work) problems.push(`works[${i}] needs "composer" and "work"`);
      if (w && w.tag !== undefined && (typeof w.tag !== 'string' || !w.tag.trim())) {
        problems.push(`works[${i}].tag, if given, must be a non-empty string`);
      }
    });
  }

  if (!Array.isArray(c.people) || nPeople < 1 || nPeople > 3) {
    problems.push('"people" must have 1 (conductor) to 3 (conductor + 2 soloists) entries; conductor first');
  } else {
    const photos = new Set();
    for (const [i, p] of c.people.entries()) {
      if (!p || !p.name || !p.role || !p.photo) {
        problems.push(`people[${i}] needs "name", "role" and "photo"`);
        continue;
      }
      const checked = await checkPhotoPath(p.photo);
      if (checked.problem) {
        problems.push(`people[${i}]: ${checked.problem}`);
        continue;
      }
      if (photos.has(checked.normalized)) problems.push(`people[${i}].photo is used by another person: ${checked.normalized}`);
      photos.add(checked.normalized);
    }
  }

  if (problems.length) throw new Error('invalid concert data:\n  - ' + problems.join('\n  - '));
  return {
    ...c,
    dayname: c.dayname ?? derived.weekday,
    date: c.date ?? `${derived.month} ${derived.day}`,
  };
}

const ROSTER_FILE = path.join(SKILL_DIR, 'roster.json');

/**
 * Standing roster: name -> {title?, photo}. `photo` is a path under design-system/ or null
 * when no headshot exists yet. A concert refers to people by exact roster name.
 * @returns {Promise<Record<string, {title?: string, photo: string | null}>>}
 */
export async function loadRoster(file = ROSTER_FILE) {
  const roster = JSON.parse(await readFile(file, 'utf8'));
  if (!roster || typeof roster !== 'object' || Array.isArray(roster)) throw new Error(`${file} must be a JSON object keyed by name`);
  for (const [name, e] of Object.entries(roster)) {
    if (!e || typeof e !== 'object') throw new Error(`${file}: "${name}" must be an object`);
    if (e.title !== undefined && (typeof e.title !== 'string' || !e.title.trim())) throw new Error(`${file}: "${name}".title must be a non-empty string`);
    if (e.photo !== null && typeof e.photo !== 'string') throw new Error(`${file}: "${name}".photo must be a path or null`);
  }
  return roster;
}

/** Suggested headshot path for a name, e.g. "Wenqi Li" -> "assets/photos/wenqi-li.jpg". */
const suggestedPhoto = (name) => `assets/photos/${name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.jpg`;

/**
 * Turn the roster-style concert format into the explicit people[] the fill uses.
 *   "conductor": {"name": "Alex Wen"}                      title and photo come from the roster
 *   "soloists":  [{"name": "Nicholas Pappone", "instrument": "Violin"}]   instrument is the shown role
 * Each may override with "title" / "photo" (conductor) or "photo" (soloist). A concert that
 * already has people[] is returned unchanged (explicit format, backward compatible).
 * Missing roster facts are a loud error that tells Claude what to ask the user.
 * @returns {Promise<object>} the concert with people[] set
 */
export async function resolvePeople(c, roster) {
  if (c.people !== undefined) {
    if (c.conductor !== undefined || c.soloists !== undefined) throw new Error('give either "people" or "conductor"/"soloists", not both');
    return c;
  }
  if (!c.conductor || typeof c.conductor.name !== 'string') throw new Error('"conductor": {"name": ...} is required (or use "people")');
  const problems = [];
  const people = [];
  const cond = c.conductor;
  const ce = Object.hasOwn(roster, cond.name) ? roster[cond.name] : null;
  if (!ce && (!cond.title || !cond.photo)) {
    problems.push(`conductor "${cond.name}" is not in roster.json. Ask the user for their title and headshot, or add them to roster.json.`);
  }
  const title = cond.title ?? ce?.title;
  const photo = cond.photo ?? ce?.photo;
  if (!title) problems.push(`conductor "${cond.name}" has no title in roster.json. Ask the user for it (for example "Artistic Director").`);
  if (!photo) {
    problems.push(`no photo registered for conductor "${cond.name}". Ask the user to supply a headshot, save it as ` +
      `design-system/${suggestedPhoto(cond.name)}, and add "photo": "${suggestedPhoto(cond.name)}" for "${cond.name}" in roster.json.`);
  }
  people.push({ name: cond.name, role: title, photo });
  if (c.soloists != null && !Array.isArray(c.soloists)) problems.push('"soloists", if given, must be a list');
  for (const s of Array.isArray(c.soloists) ? c.soloists : []) {
    if (!s || typeof s.name !== 'string') { problems.push('each soloist needs a "name"'); continue; }
    const se = Object.hasOwn(roster, s.name) ? roster[s.name] : null;
    if (!s.instrument) problems.push(`soloist "${s.name}" needs an "instrument" (the role shown on the poster). Ask the user.`);
    const sp = s.photo ?? se?.photo;
    if (!sp) {
      problems.push(`no photo for soloist "${s.name}". Ask the user for a headshot path under design-system/ and add it to roster.json for "${s.name}".`);
    }
    people.push({ name: s.name, role: s.instrument, photo: sp });
  }
  if (problems.length) throw new Error('concert people are incomplete:\n  - ' + problems.join('\n  - '));
  return { ...c, people };
}

/**
 * Work row pattern as the templates write it:
 * <div><div COMPOSER-STYLE>Composer</div><div WORK-STYLE><span>Work</span>[<span class="jho-tint" TAG-STYLE>Tag</span>]</div></div>
 */
const WORK_ROW_RE = /<div><div style="([^"]*)">([^<]*)<\/div><div style="([^"]*)"><span>([^<]*)<\/span>(?:<span class="jho-tint" style="([^"]*)">([^<]*)<\/span>)?<\/div><\/div>/g;

/** Markup for one work row, using the style strings learned from the template. */
function workRow(pat, w) {
  const tag = w.tag ? `<span class="jho-tint" style="${pat.tagStyle}">${esc(w.tag)}</span>` : '';
  return `<div><div style="${pat.composerStyle}">${esc(w.composer)}</div>` +
    `<div style="${pat.workStyle}"><span>${esc(w.work)}</span>${tag}</div></div>`;
}

/**
 * Locate the template's three work rows (contiguous) and learn their row pattern.
 * The block must regenerate exactly from the baseline works, so any change to the
 * template's works markup fails here instead of filling the wrong text.
 * @returns {{start: number, end: number, text: string, pat: object}}
 */
export function worksBlock(src, baselineWorks) {
  const rows = [...src.matchAll(WORK_ROW_RE)];
  if (rows.length !== 3) throw new Error(`expected 3 work rows in the template, found ${rows.length}`);
  const tagRow = rows.find((r) => r[5] !== undefined);
  if (!tagRow) throw new Error('no tagged work row in the template to learn the tag style from');
  const pat = { composerStyle: rows[0][1], workStyle: rows[0][3], tagStyle: tagRow[5] };
  const start = rows[0].index;
  const end = rows[2].index + rows[2][0].length;
  const text = src.slice(start, end);
  const expected = baselineWorks.map((w) => workRow(pat, w)).join('\n');
  if (text !== expected) throw new Error('work rows in the template do not match the baseline row pattern (design-system changed?)');
  return { start, end, text, pat };
}

/**
 * Exact-snippet replacements for one concert. `before` is the source snippet in
 * the template (built from `baseline`), `after` the new text. Only people[0..n)
 * are used, where n is the template's variant size. The works list is one block
 * edit, regenerated for any count from 1 to MAX_WORKS.
 */
export function replacementsFor(baseline, next, src) {
  const R = [];
  const add = (before, after, label) => R.push({ before, after, label });
  // Date and time use the literal &middot; entity as the template source does.
  add(`>${esc(baseline.dayname)} &middot; ${esc(baseline.date)}</strong>`,
    `>${esc(next.dayname)} &middot; ${esc(next.date)}</strong>`, 'when');
  add(`>${esc(baseline.time)} &middot; ${esc(baseline.doors)}</p>`,
    `>${esc(next.time)} &middot; ${esc(next.doors)}</p>`, 'time');
  add(`>${esc(baseline.venue)}</strong>`, `>${esc(next.venue)}</strong>`, 'venue');
  add(`>${esc(baseline.address)}</p>`, `>${esc(next.address)}</p>`, 'address');
  add(`>${esc(baseline.title)}</div>`, `>${esc(next.title)}</div>`, 'title');
  add(`>${esc(baseline.blurb)}</div>`, `>${esc(next.blurb)}</div>`, 'blurb');
  const block = worksBlock(src, baseline.works);
  add(block.text, next.works.map((w) => workRow(block.pat, w)).join('\n'), 'works');
  const n = baseline.people.length;
  for (let i = 0; i < n; i++) {
    const b = baseline.people[i]; const x = next.people[i];
    add(`src="../../${photoSrc(b.photo)}"`, `src="../../${photoSrc(x.photo)}"`, `people[${i}].photo`);
    add(`alt="${esc(b.name)}"`, `alt="${esc(x.name)}"`, `people[${i}].alt`);
    add(`>${esc(b.name)}</span>`, `>${esc(x.name)}</span>`, `people[${i}].name`);
    add(`>${esc(b.role)}</span>`, `>${esc(x.role)}</span>`, `people[${i}].role`);
  }
  return R;
}

/**
 * Apply replacements to template source in one pass. Each `before` must occur
 * exactly once in the original source; overlapping matches are an error.
 * @returns {string}
 */
export function applyFill(src, reps) {
  const edits = [];
  const problems = [];
  for (const r of reps) {
    const first = src.indexOf(r.before);
    const count = first === -1 ? 0 : src.split(r.before).length - 1;
    if (count !== 1) {
      problems.push(`${r.label}: snippet found ${count} times (need 1): ${r.before.slice(0, 80)}`);
      continue;
    }
    edits.push({ start: first, end: first + r.before.length, text: r.after, label: r.label });
  }
  if (problems.length) throw new Error('template does not match the fill table:\n  - ' + problems.join('\n  - '));
  edits.sort((a, b) => a.start - b.start);
  for (let i = 1; i < edits.length; i++) {
    if (edits[i].start < edits[i - 1].end) throw new Error(`fill edits overlap: ${edits[i - 1].label} / ${edits[i].label}`);
  }
  let out = ''; let pos = 0;
  for (const e of edits) { out += src.slice(pos, e.start) + e.text; pos = e.end; }
  return out + src.slice(pos);
}

/** Find the template HTML inside a template folder (exactly one *.dc.html). */
async function templateFile(variant, style) {
  const dir = path.join(DS_ROOT, 'templates', FOLDERS[variant][style]);
  const files = (await readdir(dir)).filter((f) => f.endsWith('.dc.html'));
  if (files.length !== 1) throw new Error(`expected one .dc.html in ${dir}, found ${files.length}`);
  return { abs: path.join(dir, files[0]), rel: `/templates/${FOLDERS[variant][style]}/${files[0]}` };
}

/** The May 2026 concert as it is hard-coded in the templates (the fill baseline). */
async function baselineConcert(n) {
  const base = JSON.parse(await readFile(path.join(SKILL_DIR, 'concert.2026-05-20.json'), 'utf8'));
  return { ...base, people: base.people.slice(0, n) };
}

/**
 * Build the filled HTML for a concert and style.
 * @param {any} concert
 * @param {string} style
 * @param {{today?: string, allowPast?: boolean, roster?: object}} [opts] roster defaults to roster.json
 * @returns {Promise<{html: string, variant: string, style: string, pagePath: string, concert: object}>}
 */
export async function buildPoster(concert, style, opts = {}) {
  if (!STYLES[style]) throw new Error(`--style must be one of ${Object.keys(STYLES).join(', ')}`);
  const resolved = await resolvePeople(concert, opts.roster ?? await loadRoster());
  const c = await validateConcert(resolved, opts);
  const variant = VARIANTS[c.people.length];
  const skill = skillTemplateFor(variant, style);
  if (skill) {
    const src = await loadSkillSource(skill);
    return { html: fillSkillTemplate(src, c, { variant }), variant, style, pagePath: skill.pagePath, concert: c };
  }
  const t = await templateFile(variant, style);
  const src = await readFile(t.abs, 'utf8');
  const baseline = await baselineConcert(c.people.length);
  const html = applyFill(src, replacementsFor(baseline, c, src));
  return { html, variant, style, pagePath: t.rel, concert: c };
}

/**
 * Uniqueness check for the design-system templates. Each May 2026 snippet must occur exactly
 * once in the template; applyFill throws otherwise. The check fills the May baseline with
 * itself, so the output cannot differ from the template by construction. It proves the
 * snippets are present and unique, and nothing more. The substitution test in
 * make-poster.test.mjs is the check that can fail: it fills with another concert and checks
 * that no May text survives. Pairs routed to a skill-owned template are not in this check;
 * they get checkSkillTemplates() instead.
 * @returns {Promise<Array<{template: string, uniqueSnippets: true}>>}
 */
export async function checkBaseline() {
  const results = [];
  for (const variant of Object.keys(FOLDERS)) {
    for (const style of Object.keys(STYLES)) {
      if (skillTemplateFor(variant, style)) continue;
      const n = Object.keys(VARIANTS).find((k) => VARIANTS[k] === variant);
      const baseline = await baselineConcert(Number(n));
      const t = await templateFile(variant, style);
      const src = await readFile(t.abs, 'utf8');
      applyFill(src, replacementsFor(baseline, baseline, src));
      results.push({ template: t.rel, uniqueSnippets: true });
    }
  }
  return results;
}

/**
 * Skill-owned templates: fill each with the Dec 2026 reference concert (concert.2026-12-09.json)
 * and check the output. A token-slot template has no byte-identity to keep, so the check is:
 * every slot is filled exactly once, no placeholder is left, and the reference's own text
 * is present (title italic split, the When line, the roster title, the works, the violin
 * role). Also rejects the old date, which would mean a stale value leaked in.
 * @returns {Promise<Array<{template: string, fill: 'ok'}>>}
 */
export async function checkSkillTemplates() {
  const results = [];
  const fixture = JSON.parse(await readFile(path.join(SKILL_DIR, 'concert.2026-12-09.json'), 'utf8'));
  const resolved = await resolvePeople(fixture, await loadRoster());
  const c = await validateConcert(resolved, { allowPast: true });
  for (const [key, entry] of Object.entries(SKILL_TEMPLATES)) {
    const [variant, style] = key.split('/');
    const t = skillTemplateFor(variant, style);
    const src = await loadSkillSource(t);
    const html = fillSkillTemplate(src, c, { variant });
    const want = [
      'Masks <em>&amp; Revelations</em>',
      'Wednesday &middot; December 9',
      '7:30 PM &middot; Doors 7:00 PM',
      '>Artistic Director</span>',
      'Nicholas Pappone',
      'Symphony No. 1',
    ];
    const missing = want.filter((s) => !html.includes(s));
    if (missing.length) throw new Error(`skill template ${t.pagePath} lost fixture text: ${missing.join(' | ')}`);
    if (html.includes('December 10')) throw new Error(`skill template ${t.pagePath} shows December 10`);
    results.push({ template: t.pagePath, fill: 'ok' });
  }
  return results;
}

/**
 * Resolution tag for the poster PNG: pixel width over the physical width. The sheet is 816 CSS px
 * (8.5 in at 96 px/in) rendered at `scale`, so scale 3 gives 2448 px / 8.5 in = 288 dpi, and the tag
 * follows --scale rather than assuming it.
 * @param {number} scale
 * @returns {number} dpi
 */
export function posterPngDpi(scale) {
  return (816 * scale) / 8.5;
}

/** --scale: a finite, positive number. Anything else is an error, not a silent default. */
export function parseScale(v) {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  if (!Number.isFinite(n) || n <= 0) throw new Error(`--scale must be a positive number, got "${v}"`);
  return n;
}

/**
 * Resolve --out to a real directory path. It must be strictly inside the repo and not inside
 * design-system/, checked after symlinks are resolved. The folder need not exist yet: the nearest
 * existing ancestor is resolved through realpath and the rest is appended (it cannot hold symlinks).
 * A ".." segment is refused outright, because "link/../x" means something else once a symlink is
 * resolved than it does after lexical normalisation.
 * @returns {Promise<string>} the resolved absolute path
 */
export async function resolveOutDir(dir, { repo = REPO, dsRoot = DS_ROOT } = {}) {
  if (typeof dir !== 'string' || !dir.trim()) throw new Error('--out must be a folder path');
  if (dir.split(/[\\/]/).includes('..')) throw new Error(`--out must not contain ".." segments: ${dir}`);
  const tail = [];
  let base = path.resolve(dir);
  for (;;) {
    try { await lstat(base); break; } catch {
      const parent = path.dirname(base);
      if (parent === base) throw new Error(`--out has no existing ancestor: ${dir}`);
      tail.unshift(path.basename(base));
      base = parent;
    }
  }
  const real = path.join(await realpath(base), ...tail);
  const realRepo = await realpath(repo);
  const realDs = await realpath(dsRoot);
  const within = (p, root) => p.startsWith(root + path.sep);
  if (real === realRepo || !within(real, realRepo)) {
    throw new Error(`--out must be a folder inside the repo: ${dir} resolves to ${real}`);
  }
  if (real === realDs || within(real, realDs)) {
    throw new Error(`--out must not be inside design-system/: ${dir} resolves to ${real}`);
  }
  return real;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--check-baseline') { args.checkBaseline = true; continue; }
    if (a === '--allow-past') { args.allowPast = true; continue; }
    if (!a.startsWith('--')) throw new Error(`unexpected argument: ${a}`);
    const val = argv[i + 1];
    if (val === undefined || val.startsWith('--')) throw new Error(`${a} needs a value`);
    args[a.slice(2)] = val;
    i++;
  }
  return args;
}

async function cli(argv) {
  const a = parseArgs(argv);
  if (a.checkBaseline) {
    console.log(JSON.stringify({ baseline: await checkBaseline(), skill: await checkSkillTemplates() }, null, 2));
    return;
  }
  if (!a.data || !a.style) throw new Error('--data <concert.json> and --style color|print|bw are required');
  const scale = a.scale === undefined ? 3 : parseScale(a.scale);
  const concert = JSON.parse(await readFile(path.resolve(a.data), 'utf8'));
  const { html, variant, style, pagePath, concert: c } = await buildPoster(concert, a.style, { allowPast: !!a.allowPast });
  const outDir = await resolveOutDir(a.out ?? concertOutDir(c.iso));
  const base = `JHO_${c.iso}_Poster-${variant}_${STYLES[style].label}`;
  const result = await renderPage({
    root: DS_ROOT,
    pagePath,
    html,
    width: 816,
    height: 1056,
    scale,
    pngDpi: posterPngDpi(scale),
    viewport: { width: 896, height: 1136 },
    selector: '.jho-sheet',
    png: path.join(outDir, base + '.png'),
    pdf: path.join(outDir, base + '.pdf'),
    assertions: async (page) => {
      const got = await page.evaluate(() => document.querySelector('.jho-desk')?.dataset.finish);
      const want = STYLES[style].dataFinish;
      return got === want ? [] : [`finish is "${got}", expected "${want}" (wrong template folder?)`];
    },
  });
  console.log(JSON.stringify({ template: pagePath, variant, style, ...result }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  cli(process.argv.slice(2)).catch((err) => {
    console.error(`make-poster: ${err.message}`);
    process.exit(1);
  });
}
