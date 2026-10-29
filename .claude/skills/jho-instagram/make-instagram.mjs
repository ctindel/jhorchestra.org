#!/usr/bin/env node
/**
 * jho-instagram — render the five Instagram graphics the design system defines
 * (design-system/ui_kits/print_social/Social.jsx) from a concert JSON.
 *
 *   IG-Concert              1:1  (kit artboard 700x700 CSS px)  -> 1080x1080
 *   IG-Brand                1:1  (season card, reversed)        -> 1080x1080
 *   Story-Concert           9:16 (kit artboard 340 wide)        -> 1080x1920
 *   Story-Artist-Spotlight  9:16                                -> 1080x1920
 *   Story-Season            9:16                                -> 1080x1920
 *
 * CLI:
 *   node .claude/skills/jho-instagram/make-instagram.mjs --data <concert.json> [--out <dir>] [--allow-past]
 *   --out defaults to <repo>/out and must resolve inside the repo, not inside design-system/.
 *   --allow-past is needed only for a concert whose date has already passed.
 *
 * Each graphic is written as a standalone .html (into --out, which must be inside the repo)
 * and rendered to .png through ../jho-render/render.mjs. The HTML references the design system
 * by relative path (../design-system/...), so it opens in a browser from its out/ folder.
 *
 * The kit's React components are ported to DC markup (the same runtime the posters use) so the
 * shared jho-render wait contract applies. Wordmark and MosaicRule are real design-system
 * components mounted with x-import; portraits and the QR helper are mirrored from the kit.
 */
import { mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPage } from '../jho-render/render.mjs';
import { esc, validateConcert, resolvePeople, loadRoster } from '../jho-concert-poster/make-poster.mjs';

const SKILL_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(SKILL_DIR, '../../..');
const DS_ROOT = path.join(REPO, 'design-system');
const NS = 'JacksonHeightsOrchestraDesignSystem_6e3e82';

/* Fixed copy from design-system/CLAUDE.md. Never taken from the concert JSON. */
const PRESENTS = 'The Jackson Heights Beautification Group Presents';
const ADMISSION = 'Free Admission';
const SUGGESTED = '$20 Suggested Donation';

/*
 * Season copy, verbatim from Social.jsx. The concert JSON has one concert, so these
 * lists are not derived from it. NOTE: the two kit lists disagree with each other
 * (see SKILL.md "Known quirks").
 */
const BRAND_SEASON = [
  ['Dec 9', 'Wed · 2026', 'Season Opener', 'Queens · 7:30 PM'],
  ['Mar 7 & 10', '2027', 'Winter Concert', 'Mar 7 Manhattan · Mar 10 Queens'],
  ['May 19', 'Wed · 2027', 'Spring Concert', 'Queens · 7:30 PM'],
  ['Jul 11', 'Sun · 2027', 'Summer Pops', 'Travers Park · Outdoor · 6pm'],
];
const STORY_SEASON = [
  ['May 20', '2026', '100 Years of Trinity Lutheran', 'Astoria'],
  ['Jul 05', '2026', 'Summer Pops', 'Travers Park'],
  ['Dec 09', '2026', 'Winter Dreams', 'East Elmhurst'],
  ['Mar 17', '2027', 'Spring in Forest Hills', 'Forest Hills'],
];

/* Artboards: CSS px from the kit, rendered at deviceScaleFactor = outW / cssW. */
const SQUARE = { cssW: 700, cssH: 700, outW: 1080, outH: 1080 };
const STORY = { cssW: 340, cssH: (1920 * 340) / 1080, outW: 1080, outH: 1920 }; // 604.44; kit uses 604

const UNITLESS = new Set(['lineHeight', 'fontWeight', 'opacity', 'flex', 'flexShrink', 'flexGrow', 'zIndex', 'order', 'zoom']);

/**
 * Serialise a React-style style object to a CSS declaration string. Numbers get px
 * unless the property is unitless, matching React's inline-style rules so the kit's
 * objects port across unchanged.
 * @param {Record<string, string|number|boolean|null|undefined>} obj
 * @returns {string}
 */
export function css(obj) {
  return Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => {
      const prop = k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
      const val = typeof v === 'number' && !UNITLESS.has(k) ? `${v}px` : String(v);
      if (val.includes('"')) throw new Error(`style value may not contain a double quote: ${val}`);
      return `${prop}:${val}`;
    })
    .join(';');
}

/** Wordmark: design-system component, live Playfair 900 type. Layout goes on the wrapper, appearance via props. */
function wordmark({ color, height, align }) {
  return `<x-import component-from-global-scope="${NS}.Wordmark" color="${color}" height="${height}"${
    align ? ` align="${align}"` : ''}></x-import>`;
}

/** MosaicRule: design-system component. Margins go on a wrapper div (x-import drops them). */
function mosaic(variant) {
  return `<x-import component-from-global-scope="${NS}.MosaicRule" variant="${variant}"></x-import>`;
}

/** Portrait, mirrored from components/content/Portrait.jsx (square frame, cover). Style overrides are merged last. */
function portrait(p, dsp, { size, layout = 'inline', style = {} }) {
  const stacked = layout === 'stacked';
  const nameSize = Math.max(15, Math.round(size * (stacked ? 0.13 : 0.16)));
  const roleSize = stacked ? 10 : 9;
  return `<span style="${css({ display: 'flex', alignItems: 'center', gap: stacked ? 10 : 12,
      flexDirection: stacked ? 'column' : 'row', ...style })}">`
    + `<span style="${css({ width: size, height: size, borderRadius: 'var(--jho-radius-xs)', overflow: 'hidden',
        flexShrink: 0, display: 'block' })}">`
    + `<img src="${esc(`${dsp}/${p.photo}`)}" alt="${esc(p.name)}" style="${css({ width: '100%', height: '100%',
        objectFit: 'cover', display: 'block' })}">`
    + `</span>`
    + `<span style="${css({ display: 'flex', flexDirection: 'column', textAlign: stacked ? 'center' : 'left' })}">`
    + `<span style="${css({ fontFamily: 'var(--jho-font-display)', fontWeight: 700, fontSize: nameSize,
        lineHeight: 1.15, whiteSpace: 'nowrap', color: 'var(--jho-ink)' })}">${esc(p.name)}</span>`
    + `<span style="${css({ fontFamily: 'var(--jho-font-text)', fontWeight: 600, fontSize: roleSize,
        letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: 3, color: 'var(--jho-tandoor)' })}">${esc(p.role)}</span>`
    + `</span></span>`;
}

/** Donate QR, mirrored from DonateQR in ui_kits/print_social/Poster.jsx (online finish). */
function donateQR(dsp, { dark = false, size }) {
  const file = dark ? 'donate-on-ink' : 'donate-on-paper';
  return `<div style="${css({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 })}">`
    + `<img src="${esc(`${dsp}/assets/qr/${file}.png`)}" alt="Scan to donate" style="${css({ width: size, height: size,
        display: 'block', imageRendering: 'pixelated' })}">`
    + `<div style="${css({ fontFamily: 'var(--jho-font-text)', fontWeight: 700, fontSize: '8.9px', letterSpacing: '0.2em',
        textTransform: 'uppercase', whiteSpace: 'nowrap', color: dark ? 'rgba(250,246,238,0.8)' : 'var(--jho-muted)' })}">Donate →</div>`
    + `</div>`;
}

/**
 * Artboard shell: the element jho-render captures (.ig-artboard). It is laid out in kit CSS px and
 * zoomed to the output size, then captured at device scale 1. Capture rounds the box up to whole
 * CSS px, so a device-scale factor of 1080/340 gave 1922px tall, not 1920. zoom gives exact sizes.
 *
 * borderRadius and boxShadow are forced to 0/none for the export. The kit's tile radius and shadow
 * are for showing the tile on a page. In a PNG the radius exposes the page ground and the shadow
 * tints the notches (measured: paper and grey-tinted corner pixels). A post must be a full rectangle.
 */
function artboard(geo, css_, inner) {
  return `<div class="ig-artboard" style="${css({ width: geo.cssW, height: geo.cssH, zoom: geo.outW / geo.cssW,
    ...css_, borderRadius: 0, boxShadow: 'none' })}">${inner}</div>`;
}

/* ───────────────────────── IG 1:1 — concert announcement ───────────────────────── */
function igConcert(c, dsp) {
  const inner = `
<div>
  <div style="${css({ fontSize: 15, color: 'var(--jho-muted)', lineHeight: 1.3, fontWeight: 600, marginBottom: 14,
      textTransform: 'uppercase', letterSpacing: '0.23em', whiteSpace: 'nowrap' })}">${esc(PRESENTS)}</div>
  <div style="${css({ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center' })}">
    <div style="${css({ display: 'flex', justifyContent: 'center' })}">${wordmark({ color: 'subway', height: 190, align: 'center' })}</div>
    ${portrait(c.people[0], dsp, { size: 145, layout: 'stacked', style: { height: 190, justifyContent: 'space-between', gap: 0 } })}
  </div>
  <div style="${css({ marginTop: 10 })}">${mosaic('bar')}</div>
</div>
<div style="${css({ display: 'grid', gridTemplateColumns: '1fr auto', gap: 18, alignItems: 'center' })}">
  <div style="${css({ display: 'flex', flexDirection: 'column', gap: 4 })}">
    <div style="${css({ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.22em', color: 'var(--jho-tandoor)',
        fontWeight: 700, lineHeight: 1.5 })}">${esc(c.title)}</div>
    ${c.works.map((w) => `<div style="${css({ display: 'flex', flexDirection: 'column', gap: '1px', paddingTop: 4,
        borderTop: '1px solid rgba(20,26,42,0.12)' })}">
      <strong style="${css({ fontFamily: 'var(--jho-font-display)', fontWeight: 700, fontSize: 17 })}">${esc(w.composer)}</strong>
      <span style="${css({ fontFamily: 'var(--jho-font-display)', fontStyle: 'italic', fontSize: 15,
          color: 'var(--jho-muted)', lineHeight: 1.3 })}">${esc(w.work)}${w.tag ? ` <em style="${css({ fontStyle: 'normal',
          color: 'var(--jho-tandoor)', fontWeight: 600, letterSpacing: '0.02em' })}"> · ${esc(w.tag)}</em>` : ''}</span>
    </div>`).join('')}
  </div>
  <div style="${css({ display: 'flex', flexDirection: 'column', gap: 12, alignSelf: 'center' })}">
    ${portrait(c.people[1], dsp, { size: 145, layout: 'stacked' })}
  </div>
</div>
<div style="${css({ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, paddingTop: 12, borderTop: '2px solid var(--jho-ink)' })}">
  ${[['When', `${c.dayname} · ${c.date}`, c.time], ['Where', c.venue, c.address]].map(([h, a, b]) => `<div>
    <h5 style="${css({ margin: '0 0 4px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.22em',
        color: 'var(--jho-tandoor)', fontWeight: 700 })}">${h}</h5>
    <strong style="${css({ display: 'block', fontFamily: 'var(--jho-font-display)', fontWeight: 800, fontSize: 18,
        letterSpacing: '-0.01em', lineHeight: 1.1 })}">${esc(a)}</strong>
    <p style="${css({ margin: '3px 0 0', fontSize: 11, color: 'var(--jho-muted)', lineHeight: 1.3 })}">${esc(b)}</p>
  </div>`).join('')}
</div>
<div style="${css({ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 20, paddingTop: 10,
    borderTop: '1px solid var(--jho-border)' })}">
  <div style="${css({ fontFamily: 'var(--jho-font-display)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.01em' })}">jhorchestra.org
    <small style="${css({ display: 'block', fontFamily: 'var(--jho-font-text)', fontWeight: 500, fontSize: 11,
        letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--jho-muted)', marginTop: 3 })}">@jhorchestra</small>
  </div>
  ${donateQR(dsp, { size: 58 })}
  <div style="${css({ textAlign: 'right' })}">
    <strong style="${css({ display: 'block', fontFamily: 'var(--jho-font-display)', fontWeight: 800, fontSize: 20,
        letterSpacing: '-0.01em', color: 'var(--jho-tandoor)', lineHeight: 1.1 })}">${ADMISSION}</strong>
    <span style="${css({ display: 'block', fontFamily: 'var(--jho-font-text)', fontWeight: 600, fontSize: 11,
        letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--jho-muted)', marginTop: 3 })}">${SUGGESTED}</span>
  </div>
</div>`;
  return artboard(SQUARE, {
    position: 'relative', overflow: 'hidden', borderRadius: 'var(--jho-radius-xs)', boxShadow: 'var(--jho-shadow-tile)',
    fontFamily: 'var(--jho-font-text)', color: 'var(--jho-ink)', background: 'var(--jho-paper)',
    padding: '26px 40px 22px', display: 'grid', gridTemplateRows: 'auto minmax(0,1fr) auto auto', gap: 10, boxSizing: 'border-box',
  }, inner);
}

/* ───────────────────────── IG 1:1 — brand / season card (reversed) ───────────────────────── */
function igBrand(dsp) {
  const grid = ['tandoor', 'saffron', 'cilantro', 'subway', 'jacaranda', 'hibiscus', 'roosevelt', 'tandoor', 'subway'];
  const inner = `
<div style="${css({ position: 'absolute', top: 0, right: 0, display: 'grid', gridTemplateColumns: '54px 54px 54px',
    gridTemplateRows: '54px 54px 54px', opacity: 0.9 })}">
  ${grid.map((c) => `<div style="${css({ width: 54, height: 54, background: `var(--jho-${c})` })}"></div>`).join('')}
</div>
<div>
  <div style="${css({ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.22em', fontWeight: 600,
      color: 'rgba(250,246,238,0.6)', maxWidth: 400 })}">Community Orchestra · Queens, New York</div>
  <div style="${css({ marginTop: 12 })}">${wordmark({ color: 'tandoor', height: 180, align: 'center' })}</div>
  <div style="${css({ fontFamily: 'var(--jho-font-display)', fontStyle: 'italic', fontSize: 20, lineHeight: 1.35,
      maxWidth: 480, fontWeight: 400, marginTop: 14 })}">An orchestra as many voices — tuned to the rhythm of Jackson Heights.</div>
</div>
<div style="${css({ display: 'flex', flexDirection: 'column', paddingTop: 14, borderTop: '1px solid var(--jho-border-invert)' })}">
  ${BRAND_SEASON.map(([d, meta, t, v], i) => `<div style="${css({ display: 'grid', gridTemplateColumns: '152px 1fr', gap: 16,
      alignItems: 'baseline', padding: '7px 0',
      borderBottom: i < BRAND_SEASON.length - 1 ? '1px solid rgba(250,246,238,0.14)' : 'none' })}">
    <div style="${css({ fontFamily: 'var(--jho-font-display)', fontWeight: 800, fontSize: 19, letterSpacing: '-0.01em',
        color: 'var(--jho-saffron)', lineHeight: 1.1 })}">${esc(d)}
      <span style="${css({ display: 'block', fontFamily: 'var(--jho-font-text)', fontWeight: 600, fontSize: 9,
          letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(250,246,238,0.5)', marginTop: 2 })}">${esc(meta)}</span>
    </div>
    <div style="${css({ fontFamily: 'var(--jho-font-display)', fontWeight: 700, fontSize: 16, lineHeight: 1.2 })}">${esc(t)}
      <span style="${css({ display: 'block', fontFamily: 'var(--jho-font-text)', fontWeight: 500, fontSize: 11,
          letterSpacing: '0.04em', color: 'rgba(250,246,238,0.65)', marginTop: 2 })}">${esc(v)}</span>
    </div>
  </div>`).join('')}
</div>
<div style="${css({ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 20, paddingTop: 14,
    borderTop: '1px solid var(--jho-border-invert)' })}">
  <div style="${css({ fontFamily: 'var(--jho-font-display)', fontWeight: 700, fontSize: 18 })}">jhorchestra.org</div>
  ${donateQR(dsp, { dark: true, size: 50 })}
  <div style="${css({ fontSize: 14, color: 'var(--jho-saffron)', fontWeight: 600, textAlign: 'right' })}">@jhorchestra</div>
</div>`;
  return artboard(SQUARE, {
    background: 'var(--jho-ink)', color: 'var(--jho-paper)', padding: '34px 48px', display: 'grid',
    gridTemplateRows: 'auto minmax(0,1fr) auto', position: 'relative', overflow: 'hidden', gap: 20,
    borderRadius: 'var(--jho-radius-xs)', boxShadow: 'var(--jho-shadow-tile)', fontFamily: 'var(--jho-font-text)',
    boxSizing: 'border-box',
  }, inner);
}

/* ───────────────────────── 9:16 stories ───────────────────────── */
const STORY_BASE = {
  borderRadius: 'var(--jho-radius-sm)', overflow: 'hidden', boxShadow: 'var(--jho-shadow-tile)', position: 'relative',
  padding: '36px 28px', display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 16,
  fontFamily: 'var(--jho-font-text)', boxSizing: 'border-box',
};
const PILL = {
  display: 'inline-block', marginTop: 14, fontSize: 11, fontWeight: 700, padding: '9px 16px',
  borderRadius: 'var(--jho-radius-pill)', textTransform: 'uppercase', letterSpacing: '0.15em',
};
const KICKER = { fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.25em', fontWeight: 600 };

/** Shared terms block at the foot of the concert-style stories. */
function storyTerms(whenLine, placeLine) {
  return `<div>
  <div style="${css({ borderTop: '1.5px solid var(--jho-ink)', paddingTop: 10 })}">
    <p style="${css({ margin: 0, fontSize: 12, lineHeight: 1.4 })}">
      <strong style="${css({ fontFamily: 'var(--jho-font-display)', fontWeight: 800, fontSize: 16, display: 'block', marginBottom: 2 })}">${esc(whenLine)}</strong>
      ${placeLine}<br>${ADMISSION}, ${SUGGESTED}
    </p>
  </div>`;
}

function storyConcert(c, dsp) {
  const inner = `
<div>
  <div style="${css({ ...KICKER, color: 'var(--jho-muted)' })}">Next concert</div>
  <div style="${css({ marginTop: 14 })}">${wordmark({ color: 'subway', height: 132 })}</div>
</div>
<div>
  <div style="${css({ fontFamily: 'var(--jho-font-display)', fontStyle: 'italic', fontWeight: 500, fontSize: 22,
      lineHeight: 1.2, letterSpacing: '-0.01em', marginTop: 18 })}">${esc(c.title)}</div>
  <div style="${css({ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 5, paddingTop: 12,
      borderTop: '1px solid rgba(20,26,42,0.2)' })}">
    ${c.works.map((w) => `<div style="${css({ fontFamily: 'var(--jho-font-display)', fontWeight: 700, fontSize: 14, lineHeight: 1.35 })}">
      ${esc(w.composer)} <em style="${css({ fontStyle: 'italic', fontWeight: 400, color: 'var(--jho-muted)' })}">${esc(w.work)}</em>
    </div>`).join('')}
  </div>
</div>
${storyTerms(`${c.dayname} · ${c.date} · ${c.time}`, `${esc(c.venue)} · ${esc(c.address)}`)}
  <span style="${css({ ...PILL, background: 'var(--jho-tandoor)', color: 'var(--jho-paper)' })}">Learn more</span>
</div>`;
  return artboard(STORY, { ...STORY_BASE, background: 'var(--jho-paper)', color: 'var(--jho-ink)' }, inner);
}

/**
 * The premiere is the work tagged "Premiere" (see findPremiere). Its tag is the eyebrow, so the
 * tag text is shown as written and the headline's "premieres" claim only exists when it is tagged.
 */
function storyArtistSpotlight(c, dsp, premiere) {
  const p = c.people[1];
  const inner = `
<div style="${css({ ...KICKER, color: 'var(--jho-muted)' })}">${esc(premiere.tag)}</div>
<div>
  <div style="${css({ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 })}">
    <span style="${css({ width: 88, height: 88, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, display: 'block' })}">
      <img src="${esc(`${dsp}/${p.photo}`)}" alt="${esc(p.name)}" style="${css({ width: '100%', height: '100%',
        objectFit: 'cover', display: 'block' })}">
    </span>
    <span style="${css({ display: 'flex', flexDirection: 'column', gap: 2 })}">
      <strong style="${css({ fontFamily: 'var(--jho-font-display)', fontWeight: 800, fontSize: 22, lineHeight: 1.1,
        letterSpacing: '-0.01em' })}">${esc(p.name)}</strong>
      <span style="${css({ fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase',
        color: 'var(--jho-tandoor)' })}">${esc(p.role)}</span>
    </span>
  </div>
  <div style="${css({ fontFamily: 'var(--jho-font-display)', fontWeight: 900, fontSize: 44, lineHeight: 0.98,
      letterSpacing: '-0.03em' })}">
    A new work, <em style="${css({ fontStyle: 'italic', fontWeight: 500, color: 'var(--jho-tandoor)' })}">${esc(premiere.work)}</em>, premieres ${esc(c.date)}.
  </div>
</div>
${storyTerms(`${c.dayname.slice(0, 3)} · ${c.date} · ${c.time}`, `${esc(c.venue)} · ${esc(c.address)}`)}
  <span style="${css({ ...PILL, background: 'var(--jho-tandoor)', color: 'var(--jho-paper)' })}">Read the notes</span>
</div>`;
  return artboard(STORY, { ...STORY_BASE, background: 'var(--jho-newsprint)', color: 'var(--jho-ink)' }, inner);
}

function storySeason(dsp) {
  const inner = `
<div>
  <div style="${css({ ...KICKER, color: 'rgba(250,246,238,0.6)' })}">Season 26–27</div>
  <div style="${css({ marginTop: 14 })}">${wordmark({ color: 'saffron', height: 132 })}</div>
</div>
<div style="${css({ display: 'flex', flexDirection: 'column', marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--jho-border-invert)' })}">
  ${STORY_SEASON.map(([d, y, t, v], i) => `<div style="${css({ display: 'grid', gridTemplateColumns: '78px 1fr', gap: 10,
      alignItems: 'baseline', padding: '7px 0',
      borderBottom: i < STORY_SEASON.length - 1 ? '1px solid rgba(250,246,238,0.12)' : 'none' })}">
    <div style="${css({ fontFamily: 'var(--jho-font-display)', fontWeight: 800, fontSize: 15, color: 'var(--jho-saffron)', lineHeight: 1.15 })}">${esc(d)}
      <span style="${css({ display: 'block', fontFamily: 'var(--jho-font-text)', fontWeight: 600, fontSize: 8,
        letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(250,246,238,0.45)', marginTop: 1 })}">${esc(y)}</span>
    </div>
    <div style="${css({ fontFamily: 'var(--jho-font-display)', fontWeight: 700, fontSize: 13, lineHeight: 1.2 })}">${esc(t)}
      <span style="${css({ display: 'block', fontFamily: 'var(--jho-font-text)', fontWeight: 500, fontSize: 9,
        color: 'rgba(250,246,238,0.6)', marginTop: 1 })}">${esc(v)}</span>
    </div>
  </div>`).join('')}
</div>
<div>
  <div style="${css({ borderTop: '1.5px solid rgba(250,246,238,0.4)', paddingTop: 10 })}">
    <p style="${css({ margin: 0, fontSize: 12, lineHeight: 1.4, color: 'rgba(250,246,238,0.85)' })}">
      Four concerts. Always free, pay what you can.
    </p>
  </div>
  <span style="${css({ ...PILL, background: 'var(--jho-saffron)', color: 'var(--jho-ink)' })}">See the season</span>
</div>`;
  return artboard(STORY, { ...STORY_BASE, background: 'var(--jho-ink)', color: 'var(--jho-paper)' }, inner);
}

/** Standalone page around one artboard. Asset paths are relative to the page's folder (dsp). */
function page(title, dsp, artboardHtml) {
  const d = esc(dsp);
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="stylesheet" href="${d}/styles.css">
<script src="${d}/_ds_bundle.js"></script>
<script src="${d}/templates/concert-poster/support.js"></script>
<style>html,body{margin:0;background:var(--jho-paper)}</style>
</head>
<body><x-dc>
${artboardHtml}
</x-dc></body></html>
`;
}

/**
 * The first work tagged as a premiere (any tag containing "premiere", any case), or null.
 * The spotlight is built only from this work: position does not decide it.
 * @param {Array<{composer: string, work: string, tag?: string}>} works
 * @returns {{index: number, work: object} | null}
 */
export function findPremiere(works) {
  const index = works.findIndex((w) => typeof w.tag === 'string' && /premiere/i.test(w.tag));
  return index < 0 ? null : { index, work: works[index] };
}

/**
 * The graphics for one concert. Pure: no I/O.
 * Story-Artist-Spotlight is only built when a work carries a Premiere tag. Otherwise it is listed in
 * `skipped` with the reason, so the caller can say so. It is never built with a made-up premiere.
 * @param {object} c validated concert
 * @param {string} dsp design-system path relative to the HTML's folder, e.g. "../design-system"
 * @returns {{graphics: Array<{name: string, ratio: string, cssW: number, cssH: number, outW: number, outH: number, html: string}>,
 *            skipped: Array<{name: string, reason: string}>}}
 */
export function buildGraphics(c, dsp) {
  const sq = (name, body) => ({ name, ratio: '1x1', ...SQUARE, html: page(name, dsp, body) });
  const st = (name, body) => ({ name, ratio: '9x16', ...STORY, html: page(name, dsp, body) });
  const graphics = [
    sq('IG-Concert', igConcert(c, dsp)),
    sq('IG-Brand', igBrand(dsp)),
    st('Story-Concert', storyConcert(c, dsp)),
  ];
  const skipped = [];
  const premiere = findPremiere(c.works);
  if (premiere) {
    graphics.push(st('Story-Artist-Spotlight', storyArtistSpotlight(c, dsp, premiere.work)));
  } else {
    skipped.push({
      name: 'Story-Artist-Spotlight',
      reason: 'no work is tagged "Premiere" in the concert JSON. Add "tag": "Premiere" to the new work to make this story.',
    });
  }
  graphics.push(st('Story-Season', storySeason(dsp)));
  return { graphics, skipped };
}

/** True if p is dir or inside it. Both must be real, absolute paths. */
function isInside(dir, p) {
  return p === dir || p.startsWith(dir + path.sep);
}

/** realpath of the longest existing prefix of p, with the rest appended. Lets --out name a folder that does not exist yet. */
async function realpathLoose(p) {
  const tail = [];
  let cur = p;
  for (;;) {
    try {
      return path.join(await realpath(cur), ...tail.reverse());
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
      const parent = path.dirname(cur);
      if (parent === cur) throw err;
      tail.push(path.basename(cur));
      cur = parent;
    }
  }
}

/**
 * Where the PNG and HTML files go. Must resolve (through any symlink) to a folder inside the repo
 * and not inside design-system/, so generated files never land in the design-system source tree.
 * @param {string|undefined} arg  --out, or undefined for <repo>/out
 * @param {{repo?: string}} [opts]
 * @returns {Promise<string>} the real absolute path
 */
export async function resolveOutDir(arg, { repo = REPO } = {}) {
  const repoReal = await realpath(repo);
  const dsReal = path.join(repoReal, 'design-system');
  const target = await realpathLoose(path.resolve(arg ?? path.join(repo, 'out')));
  if (!isInside(repoReal, target)) {
    throw new Error(`--out must be inside the repo (${repoReal}), got ${target}`);
  }
  if (isInside(dsReal, target)) {
    throw new Error(`--out must not be inside design-system/ (${dsReal}); generated files would land in the design-system source tree`);
  }
  return target;
}

/**
 * Page check, run on every artboard. Text that runs past the artboard, or into the block below
 * it, is clipped or overlaps on a public post with no error. That fails the render instead.
 * @param {import('playwright').Page} page
 * @returns {Promise<string[]>} problems (empty when the content fits)
 */
export async function overflowProblems(page) {
  return page.evaluate(() => {
    const art = document.querySelector('.ig-artboard');
    if (!art) return ['no .ig-artboard element on the page'];
    const problems = [];
    if (art.scrollHeight > art.clientHeight + 1 || art.scrollWidth > art.clientWidth + 1) {
      problems.push(`artboard content overflows its frame (scroll ${art.scrollWidth}x${art.scrollHeight}, frame ${art.clientWidth}x${art.clientHeight})`);
    }
    const bottomOf = (el) => Math.max(el.getBoundingClientRect().bottom,
      ...[...el.querySelectorAll('*')].map((d) => d.getBoundingClientRect().bottom));
    // Blocks in flow, in order. Absolutely positioned decoration (the IG-Brand tile grid) is not a block.
    const blocks = [...art.children].filter((b) => getComputedStyle(b).position !== 'absolute');
    blocks.forEach((b, i) => {
      const next = blocks[i + 1];
      if (!next) return;
      const over = bottomOf(b) - next.getBoundingClientRect().top;
      if (over > 0.5) problems.push(`overflow: block ${i + 1} runs ${Math.round(over)} px into block ${i + 2} (text would overlap or be cut)`);
    });
    return problems;
  });
}

/**
 * Concert JSON to the validated concert the graphics need. Accepts the roster format
 * ("conductor"/"soloists") or explicit people[]. Refuses a concert with fewer than two people.
 * @param {object} raw parsed concert JSON
 * @param {{allowPast?: boolean, today?: string, roster?: object}} [opts]
 * @returns {Promise<object>}
 */
export async function prepareConcert(raw, { allowPast = false, today, roster } = {}) {
  const resolved = await resolvePeople(raw, roster ?? await loadRoster());
  const c = await validateConcert(resolved, { allowPast, today });
  if (c.people.length < 2) {
    throw new Error('the Instagram set needs people[1]: the 1:1 tile and the artist spotlight feature a second artist');
  }
  return c;
}

/**
 * Write each graphic's HTML and PNG into outDir. The PNG is rendered from the page in memory, served
 * at the design-system root (so the server never sees the repo or out/). The HTML written to outDir
 * is the same page with paths relative to outDir, so it opens from there.
 * @param {object} c validated concert (from prepareConcert)
 * @param {string} outDir real path, already checked by resolveOutDir
 * @param {{only?: string[]}} [opts] render only these graphic names (tests)
 * @returns {Promise<{results: object[], skipped: object[]}>}
 */
export async function renderInstagramSet(c, outDir, { only } = {}) {
  await mkdir(outDir, { recursive: true });
  const fileDsp = path.relative(outDir, await realpath(DS_ROOT)).split(path.sep).join('/');
  const inMemory = buildGraphics(c, '.');
  const files = buildGraphics(c, fileDsp);
  const results = [];
  for (const g of inMemory.graphics) {
    if (only && !only.includes(g.name)) continue;
    const base = `JHO_${c.iso}_${g.name}_${g.ratio}`;
    const htmlPath = path.join(outDir, base + '.html');
    const pngPath = path.join(outDir, base + '.png');
    const fileHtml = files.graphics.find((f) => f.name === g.name).html;
    await writeFile(htmlPath, fileHtml, 'utf8');
    const r = await renderPage({
      root: DS_ROOT,
      pagePath: '/' + base + '.html',
      html: g.html,
      width: g.outW,
      height: g.outH,
      viewport: { width: g.outW, height: g.outH },
      scale: 1,
      selector: '.ig-artboard',
      png: pngPath,
      assertions: overflowProblems,
    });
    if (r.png.width !== g.outW || r.png.height !== g.outH) {
      throw new Error(`${base}.png is ${r.png.width}x${r.png.height}, expected ${g.outW}x${g.outH}`);
    }
    results.push({ graphic: g.name, html: htmlPath, png: pngPath, size: `${g.outW}x${g.outH}`, hosts: r.hosts, warnings: r.warnings });
  }
  return { results, skipped: inMemory.skipped };
}

/**
 * CLI argv parser. --allow-past is a flag (no value); every other option takes a value.
 * @param {string[]} argv
 * @returns {Record<string, string|boolean>}
 */
export function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) throw new Error(`unexpected argument: ${a}`);
    if (a === '--allow-past') {
      args.allowPast = true;
      continue;
    }
    const val = argv[i + 1];
    if (val === undefined || val.startsWith('--')) throw new Error(`${a} needs a value`);
    args[a.slice(2)] = val;
    i++;
  }
  return args;
}

async function cli(argv) {
  const a = parseArgs(argv);
  if (!a.data) throw new Error('--data <concert.json> is required (e.g. .claude/skills/jho-concert-poster/concert.2026-12-09.json)');
  const c = await prepareConcert(JSON.parse(await readFile(path.resolve(a.data), 'utf8')), { allowPast: !!a.allowPast });
  const outDir = await resolveOutDir(a.out);
  const { results, skipped } = await renderInstagramSet(c, outDir);
  for (const s of skipped) console.warn(`make-instagram: skipped ${s.name}: ${s.reason}`);
  console.log(JSON.stringify(results, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  cli(process.argv.slice(2)).catch((err) => {
    console.error(`make-instagram: ${err.message}`);
    process.exit(1);
  });
}
