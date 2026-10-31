/**
 * Tests for make-social.mjs. Run:
 *   node --test .claude/skills/jho-social-posts/make-social.test.mjs
 *
 * Golden and gate tests use the registry snapshot in tests/fixtures (taken on 2026-10-31), never the
 * live handles.json. Tests that write write to a scratch folder. A hash of the live handles.json is
 * taken at the start and checked at the end, so a test that touched it fails.
 */
import { test, describe, after, before } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import {
  buildSocial, renderMarkdown, ordinal, parseVenueAddress, xLength, joinList, surname,
  loadRegistry, validateRegistry, generatedMapsUrl, writeSocialFile, socialFileName, X_LIMIT,
  thanksRecipients,
} from './make-social.mjs';
import { validateConcert, resolvePeople, loadRoster, concertOutDir, resolveOutDir } from '../jho-concert-poster/make-poster.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..', '..');
const SKILL_CLI = path.join(HERE, 'make-social.mjs');
const FIXTURE = path.join(HERE, 'fixtures', 'concert.2026-12-09.social.json');
const SNAP = path.join(HERE, 'tests', 'fixtures', 'registry-2026-12-09.json');
const LIVE = path.join(HERE, 'handles.json');
const golden = (p) => readFile(path.join(HERE, 'tests', 'fixtures', `golden-2026-12-09.${p}.txt`), 'utf8');
const TODAY = '2026-10-31';
const SCRATCH = path.join(HERE, '.scratch-test-social');
const execFileP = promisify(execFile);
const sha = async (f) => createHash('sha256').update(await readFile(f)).digest('hex');
const LIVE_HASH_BEFORE = await sha(LIVE);

/** Trailing whitespace and the final newline are the only differences the golden test allows. */
const norm = (s) => s.replace(/[ \t]+$/gm, '').replace(/\n+$/, '');
const fixture = async () => JSON.parse(await readFile(FIXTURE, 'utf8'));
/** A fixture copy with `f` applied. */
async function concertWith(f) {
  const c = await fixture();
  f(c);
  return c;
}
const REG = await loadRegistry(SNAP);
/** A registry copy with `f` applied (the snapshot is never touched). */
function registryWith(f) {
  const r = structuredClone(REG);
  f(r);
  return r;
}
/**
 * The Dec 9 X post is 279 of 280 characters, so an optional clause cannot be added to it. For tests
 * that need an optional clause on X to survive, drop the soloist lineup and the parking sentence.
 */
const roomyX = (c) => {
  c.soloists = [];
  c.social.venue_parking = false;
  delete c.social.soloist_blurbs;
  return c;
};
const run = (c, opts = {}) => buildSocial(c, { today: TODAY, registry: REG, ...opts });

async function cli(args) {
  try {
    const { stdout, stderr } = await execFileP(process.execPath, [SKILL_CLI, ...args], { cwd: REPO });
    return { code: 0, stdout, stderr };
  } catch (err) {
    return { code: err.code, stdout: err.stdout, stderr: err.stderr };
  }
}

before(async () => { await mkdir(SCRATCH, { recursive: true }); });
after(async () => {
  await rm(SCRATCH, { recursive: true, force: true });
  assert.equal(await sha(LIVE), LIVE_HASH_BEFORE, 'the live handles.json must not be modified or depended on by tests');
});

describe('golden: the three posts the user posted for 2026-12-09', () => {
  test('facebook, instagram and x match the golden text exactly (trailing whitespace aside)', async () => {
    const r = await run(await fixture());
    assert.equal(norm(r.facebook.text), norm(await golden('facebook')));
    assert.equal(norm(r.instagram.text), norm(await golden('instagram')));
    assert.equal(norm(r.x.text), norm(await golden('x')));
  });

  test('the approved X post fits without dropping any optional clause', async () => {
    const r = await run(await fixture());
    assert.ok(r.x.ok);
    assert.deepEqual(r.x.dropped, []);
    assert.equal(r.x.length, xLength(norm(await golden('x'))));
    assert.ok(r.x.length <= X_LIMIT);
  });

  test('with the user waivers, nothing blocks the drafts', async () => {
    const r = await run(await fixture());
    assert.deepEqual(r.blockers, []);
  });

  test('without the waivers, the same concert is blocked on every plain-name reference in the Facebook post', async () => {
    // Why: the Facebook post names five people and organisations as plain text. Each one needs an
    // answer. The thanks paragraph names two of them (Catalina Cruz and the presenter) and is gated
    // like any other name, because the user has not yet said what that plain name should be.
    const c = await concertWith((c) => { delete c.social.waive; });
    const r = await run(c);
    assert.deepEqual(r.blockers.sort(), [
      'Alex Wen (Facebook) is unknown',
      'Blessed Sacrament Church (Facebook) is unknown',
      'Catalina Cruz (Facebook) is unknown',
      'Jackson Heights Beautification Group (Facebook) is unknown',
      'Nicholas Pappone (Facebook) is unknown',
    ]);
  });

  test('a venue with X "none" is not tagged and does not appear in the checklist', async () => {
    const r = await run(await fixture());
    assert.ok(!r.needs.some((n) => n.includes('Blessed Sacrament Church') && n.includes('X')));
    assert.ok(!r.x.text.includes('@blessedsacramentchurchnyc'));
    assert.ok(r.x.text.includes('at Blessed Sacrament Church ('));
  });

  test('the fixture waives the Dec 9 thanks names it needs, and nothing else is waived', async () => {
    const c = await fixture();
    assert.deepEqual([...c.social.waive].sort(), [
      'Alex Wen:facebook',
      'Blessed Sacrament Church:facebook',
      'Catalina Cruz:facebook',
      'Jackson Heights Beautification Group:facebook',
      'Nicholas Pappone:facebook',
    ]);
  });
});

describe('gate: only verified handles are tagged; candidate, unknown, missing block', () => {
  const alexCandidate = () => registryWith((r) => {
    r['Alex Wen'].platforms.instagram = { status: 'candidate', handle: '@alexwn', source: 'https://example.org/alex', confidence: 'high' };
  });

  test('a candidate is NOT tagged without --draft-anyway: the post has the plain name, and the draft is blocked', async () => {
    // Why: a waived or unconfirmed candidate must never reach a post as a tag.
    const r = await run(await fixture(), { registry: alexCandidate() });
    assert.ok(!r.instagram.text.includes('@alexwn'));
    assert.ok(r.instagram.text.includes('led by Artistic Director Alex Wen and featuring'));
    assert.deepEqual(r.blockers, ['Alex Wen (Instagram) is candidate']);
  });

  test('a candidate IS tagged with --draft-anyway, and the draft still reports it as a blocker', async () => {
    const r = await run(await fixture(), { registry: alexCandidate(), draftAnyway: true });
    assert.ok(r.instagram.text.includes('led by Artistic Director @alexwn and featuring'));
    assert.deepEqual(r.blockers, ['Alex Wen (Instagram) is candidate']);
  });

  test('a waived candidate is a plain name even with --draft-anyway (waiver wins, no handle leaks)', async () => {
    const c = await concertWith((c) => { c.social.waive.push('Alex Wen:instagram'); });
    const plain = await run(c, { registry: alexCandidate() });
    assert.ok(!plain.instagram.text.includes('@alexwn'));
    assert.ok(plain.instagram.text.includes('led by Artistic Director Alex Wen and featuring'));
    const anyway = await run(c, { registry: alexCandidate(), draftAnyway: true });
    assert.ok(!anyway.instagram.text.includes('@alexwn'));
    assert.deepEqual(anyway.blockers, []);
  });

  test('a waived candidate is listed in the checklist as waived, and the text says what the draft uses', async () => {
    const c = await concertWith((c) => { c.social.waive.push('Alex Wen:instagram'); });
    const r = await run(c, { registry: alexCandidate() });
    const item = r.needs.find((n) => n.startsWith('Alex Wen: Instagram candidate'));
    assert.ok(item, r.needs.join('\n'));
    assert.match(item, /Waived in social\.waive: the draft uses the plain name/);
  });

  test('a waived unknown is a plain name and listed as waived', async () => {
    const r = await run(await fixture());
    const fbAlex = r.needs.find((n) => n.startsWith('Alex Wen: Facebook handle?'));
    assert.ok(fbAlex && fbAlex.includes('Waived in social.waive'), fbAlex);
    assert.ok(r.facebook.text.includes('Artistic Director Alex Wen has created'));
  });

  test('an unknown collaborator platform blocks, and the unknown handle is not guessed', async () => {
    const reg = registryWith((r) => {
      r['Mount Vernon Choir'] = { name: 'Mount Vernon Choir', type: 'org', platforms: {
        facebook: { status: 'none', source: 'user-provided', verified_on: TODAY },
        instagram: { status: 'verified', handle: '@mvchoir', source: 'user-provided', verified_on: TODAY },
        x: { status: 'unknown' },
      } };
    });
    const c = roomyX(await fixture());
    c.social.collaborators = ['Mount Vernon Choir'];
    const r = await run(c, { registry: reg });
    assert.deepEqual(r.blockers, ['Mount Vernon Choir (X) is unknown']);
    assert.ok(r.x.text.includes('in collaboration with Mount Vernon Choir at 7:30pm'), 'unknown X handle is named plainly');
    assert.ok(!r.x.text.includes('@mvchoir'), 'the Instagram handle must not leak onto X');
  });

  test('an unregistered venue blocks on its address and maps link (missing, not unknown)', async () => {
    const c = await concertWith((c) => { c.venue = 'Trinity Lutheran Church'; delete c.social.venue_key; delete c.social.waive; });
    const r = await run(c);
    assert.ok(r.blockers.includes('Venue address is missing'));
    assert.ok(r.blockers.includes('Venue maps link is missing'));
  });

  test('a venue whose registry entry has no address field is unknown', async () => {
    const reg = registryWith((r) => { delete r['Blessed Sacrament Church'].address; });
    const r = await run(await fixture(), { registry: reg });
    assert.ok(r.blockers.includes('Venue address is unknown'));
  });

  test('a candidate venue address is not used in the posts without --draft-anyway, and blocks', async () => {
    const reg = registryWith((r) => {
      r['Blessed Sacrament Church'].address = { status: 'candidate', value: '34-43 93rd Street, Jackson Heights, NY 11372', source: 'https://example.org/church', confidence: 'high' };
    });
    const c = await concertWith((c) => { c.address = '34-43 93rd St, Jackson Heights (parking available)'; });
    const r = await run(c, { registry: reg });
    assert.ok(r.facebook.text.includes('(34-43 93rd St, Jackson Heights, NY)'));
    assert.ok(r.blockers.includes('Venue address is candidate'));
    const anyway = await run(c, { registry: reg, draftAnyway: true });
    assert.ok(anyway.facebook.text.includes('(34-43 93rd Street, Jackson Heights, NY)'));
  });

  test('the venue address comes from the registry, not concert.address, and a mismatch is flagged', async () => {
    const c = await concertWith((c) => { c.address = '31-18 37th St, Astoria (parking available)'; });
    const r = await run(c);
    assert.ok(r.facebook.text.includes('(34-43 93rd St, Jackson Heights, NY)'));
    assert.ok(r.needs.some((n) => n.includes('differs from the registry')));
  });

  test('a verified entry older than 180 days before the concert is a non-blocking checklist item', async () => {
    const reg = registryWith((r) => { r['Alex Wen'].platforms.instagram.verified_on = '2026-01-01'; });
    const r = await run(await fixture(), { registry: reg });
    assert.deepEqual(r.blockers, []);
    assert.ok(r.needs.some((n) => n.includes('Alex Wen: Instagram was verified on 2026-01-01') && n.includes('days before the concert')), r.needs.join('\n'));
  });

  test('a verified entry 39 days before the concert gets no age item', async () => {
    const r = await run(await fixture());
    assert.ok(!r.needs.some((n) => n.includes('was verified on')));
  });

  test('a waiver that matches nothing in the draft is a checklist warning (a typo is visible)', async () => {
    const c = await concertWith((c) => { c.social.waive.push('Nobody Here:facebook'); });
    const r = await run(c);
    assert.ok(r.needs.some((n) => /social\.waive "Nobody Here:facebook" matches nothing/.test(n)), r.needs.join('\n'));
    assert.deepEqual(r.blockers, []);
  });
});

describe('thanks recipients are gated on Facebook like any other name', () => {
  test('Catalina Cruz, named in the thanks text, blocks on Facebook unless waived', async () => {
    const c = await concertWith((c) => { c.social.waive = ['Alex Wen:facebook', 'Nicholas Pappone:facebook', 'Blessed Sacrament Church:facebook', 'Jackson Heights Beautification Group:facebook']; });
    const r = await run(c);
    assert.deepEqual(r.blockers, ['Catalina Cruz (Facebook) is unknown']);
    assert.ok(r.facebook.text.includes('office of Assemblywoman Catalina Cruz NY'), 'the thanks text stays verbatim');
  });

  test('a verified Facebook entry for a thanks recipient passes the gate and is not tagged in the verbatim thanks', async () => {
    const reg = registryWith((r) => {
      r['Catalina Cruz'].platforms.facebook = { status: 'verified', handle: '@CatalinaCruzNY', source: 'user-provided', verified_on: TODAY };
    });
    const c = await concertWith((c) => { c.social.waive = ['Alex Wen:facebook', 'Nicholas Pappone:facebook', 'Blessed Sacrament Church:facebook', 'Jackson Heights Beautification Group:facebook']; });
    const r = await run(c, { registry: reg });
    assert.deepEqual(r.blockers, []);
    assert.ok(r.facebook.text.includes('Assemblywoman Catalina Cruz NY to help'));
  });

  test('the presenter, named in the thanks text, is gated on Facebook too', async () => {
    const r = await run(await concertWith((c) => { c.social.waive = ['Alex Wen:facebook', 'Nicholas Pappone:facebook', 'Blessed Sacrament Church:facebook', 'Catalina Cruz:facebook']; }));
    assert.deepEqual(r.blockers, ['Jackson Heights Beautification Group (Facebook) is unknown']);
  });
});

describe('maps link and the Venue section', () => {
  test('generatedMapsUrl percent-encodes the address into the documented search URL', () => {
    assert.equal(generatedMapsUrl('34-43 93rd St, Jackson Heights, NY'),
      'https://www.google.com/maps/search/?api=1&query=34-43%2093rd%20St%2C%20Jackson%20Heights%2C%20NY');
  });

  test('the Venue section shows the registry link for the Dec 9 venue, not a generated one', async () => {
    const r = await run(await fixture());
    const md = renderMarkdown(r);
    assert.ok(md.includes('https://maps.app.goo.gl/mNo2wqXEUkdA6gAq9'));
    assert.ok(!md.includes('generated search link'));
  });

  test('without a registered maps link, the Venue section labels the generated link and the gate blocks it', async () => {
    const reg = registryWith((r) => { delete r['Blessed Sacrament Church'].maps_url; });
    const r = await run(await fixture(), { registry: reg });
    const md = renderMarkdown(r);
    assert.ok(md.includes('generated search link, not a share link'));
    assert.ok(md.includes('https://www.google.com/maps/search/?api=1&query=34-43%2093rd%20St%2C%20Jackson%20Heights%2C%20NY'));
    assert.ok(r.blockers.includes('Venue maps link is unknown'));
  });
});

describe('--draft-anyway banner and the markdown layout', () => {
  test('renderMarkdown puts the UNVERIFIED banner first and lists every blocker when draftAnyway is set', async () => {
    const c = await concertWith((c) => { delete c.social.waive; });
    const r = await run(c);
    const md = renderMarkdown(r, { draftAnyway: true });
    assert.equal(md.split('\n')[0], 'UNVERIFIED — do not post');
    for (const b of r.blockers) assert.ok(md.includes(b));
  });

  test('no banner when nothing blocks, even with draftAnyway', async () => {
    const r = await run(await fixture());
    assert.ok(!renderMarkdown(r, { draftAnyway: true }).includes('UNVERIFIED'));
  });

  test('sections appear in order with the three fenced posts, the X length, and the checklist', async () => {
    const md = renderMarkdown(await run(await fixture()));
    const heads = ['# Social posts: Masks & Revelations', '## Venue', '## Facebook', '## Instagram', '## X (Twitter)', '## Needs your input'];
    let at = -1;
    for (const h of heads) {
      const i = md.indexOf(h);
      assert.ok(i > at, `heading out of order or missing: ${h}`);
      at = i;
    }
    assert.equal(md.split('```text').length - 1, 3);
    assert.match(md, /Length: \d+ of 280/);
    assert.match(md, /- \[ \] /);
  });

  test('a failed X section says NOT DRAFTED and has no post text', async () => {
    const c = await concertWith((c) => { c.works[1] = { composer: 'Amy Beach', work: 'x'.repeat(300), tag: 'World Premiere' }; });
    const r = await run(c);
    const md = renderMarkdown(r);
    const x = md.slice(md.indexOf('## X (Twitter)'), md.indexOf('## Needs your input'));
    assert.ok(x.includes('NOT DRAFTED'));
    assert.ok(!x.includes('```text'));
  });

  test('a post that contains backticks is fenced with a longer fence, so the post cannot close it early', async () => {
    // Why: the thanks text is verbatim user text. A run of three backticks in it must not end the fence.
    const c = await concertWith((c) => { c.social.thanks = 'Thanks to ```js for the code``` and more.'; });
    const r = await run(c);
    const md = renderMarkdown(r);
    assert.ok(md.includes('````text\n' + r.facebook.text + '\n````\n'), md);
    assert.ok(md.includes('```text\n' + r.instagram.text + '\n```\n'), 'a post without backticks keeps the three-backtick fence');
  });
});

describe('soloists: 0, 1, 2 and 3', () => {
  test('conductor only: no soloist clause on any platform', async () => {
    const c = await concertWith((c) => { c.soloists = []; c.social.soloist_blurbs = {}; });
    const r = await run(c);
    assert.equal(r.facebook.text.split('\n')[1],
      'JHO Artistic Director Alex Wen has created a wonderful program including the following repertoire:');
    assert.ok(r.instagram.text.startsWith('Join the @jhbgny and the Jackson Heights Orchestra, led by Artistic Director @alexwn!'));
    assert.ok(r.x.text.endsWith('Led by Artistic Director @alexwn'));
  });

  test('one soloist: FB uses the blurb when given; X and IG use the instrument; no "local NYC" claim without a blurb', async () => {
    const c = await concertWith((c) => { delete c.social.soloist_blurbs; });
    const r = await run(c);
    assert.ok(r.facebook.text.includes('featuring violin soloist Nicholas Pappone and including'));
    assert.ok(!r.facebook.text.includes('local NYC'));
    assert.ok(r.x.text.endsWith('Led by Artistic Director @alexwn and featuring violin soloist @npviolin'));
    const withBlurb = await run(await fixture());
    assert.ok(withBlurb.facebook.text.includes('featuring the local NYC violin soloist Nicholas Pappone and including'));
  });

  test('two soloists: "X and Y" in the Facebook and Instagram lineups; X drops the lineup because the Dec 9 post is already 279 of 280', async () => {
    // Why: the approved X post leaves one character of room. A second soloist cannot fit, so the
    // lineup clause goes and the post says so. The full lineup still runs on Facebook and Instagram.
    const c = await concertWith((c) => {
      c.soloists.push({ name: 'Michael A. Lee', instrument: 'Cello' });
      c.social.soloist_blurbs = {};
    });
    const r = await run(c);
    assert.ok(r.facebook.text.includes('featuring violin soloist Nicholas Pappone and cello soloist Michael A. Lee and including'));
    assert.ok(r.instagram.text.includes('and featuring Violin Soloist @npviolin and Cello Soloist Michael A. Lee!'));
    assert.deepEqual(r.x.dropped, ['lineup']);
    assert.ok(!r.x.text.includes('Led by'));
  });

  test('three soloists are refused: the poster template holds a conductor and two soloists', async () => {
    const c = await concertWith((c) => {
      c.soloists.push({ name: 'Michael A. Lee', instrument: 'Cello' }, { name: 'Wenqi Li', instrument: 'Viola' });
    });
    await assert.rejects(run(c), /1 \(conductor\) to 3/);
  });

  test('a blurb for a name that is not a soloist fails loud', async () => {
    const c = await concertWith((c) => { c.social.soloist_blurbs = { 'Nick Pappone': 'local NYC violin' }; });
    await assert.rejects(run(c), /soloist_blurbs.*Nick Pappone/s);
  });

  test('joinList: two items use "and", three or more use an Oxford comma', () => {
    assert.equal(joinList(['A']), 'A');
    assert.equal(joinList(['A', 'B']), 'A and B');
    assert.equal(joinList(['A', 'B', 'C']), 'A, B, and C');
  });

  test('an instrument keeps its own capitals and is lowercased only when it is plain (FB), and is not title-cased (IG)', async () => {
    // Parking is off so that the longer instrument still leaves room for the X lineup. The lineup is the
    // clause under test; the length rule is tested elsewhere.
    const make = (instrument) => concertWith((c) => { c.soloists[0].instrument = instrument; delete c.social.soloist_blurbs; c.social.venue_parking = false; });
    const om = await run(await make('Ondes Martenot'));
    assert.ok(om.facebook.text.includes('featuring Ondes Martenot soloist Nicholas Pappone'), om.facebook.text);
    assert.ok(om.instagram.text.includes('and featuring Ondes Martenot Soloist @npviolin!'));
    assert.ok(om.x.text.includes('and featuring Ondes Martenot soloist @npviolin'));
    const vg = await run(await make('viola da gamba'));
    assert.ok(vg.facebook.text.includes('featuring viola da gamba soloist Nicholas Pappone'));
    assert.ok(vg.instagram.text.includes('Viola da gamba Soloist @npviolin'), vg.instagram.text);
    assert.ok(!vg.instagram.text.includes('Viola Da Gamba'));
    const violin = await run(await fixture());
    assert.ok(violin.instagram.text.includes('and featuring Violin Soloist @npviolin!'));
  });
});

describe('collaborators', () => {
  const choirReg = () => registryWith((r) => {
    r['Mount Vernon Choir'] = { name: 'Mount Vernon Choir', type: 'org', platforms: {
      facebook: { status: 'none', source: 'user-provided', verified_on: TODAY },
      instagram: { status: 'verified', handle: '@mvchoir', source: 'user-provided', verified_on: TODAY },
      x: { status: 'unknown' },
    } };
  });

  test('one choir tagged on Instagram, unknown on X: IG tags it, X names it plain and asks', async () => {
    const c = roomyX(await fixture());
    c.social.collaborators = ['Mount Vernon Choir'];
    const r = await run(c, { registry: choirReg() });
    assert.ok(r.instagram.text.includes('in collaboration with Mount Vernon Choir @mvchoir, led by'));
    assert.ok(r.x.text.includes('in collaboration with Mount Vernon Choir at 7:30pm'));
    assert.ok(!r.x.text.includes('@mvchoir'));
    assert.ok(r.needs.some((n) => n.startsWith('Mount Vernon Choir: X handle?')));
  });

  test('an unregistered collaborator is named plainly and listed as not in handles.json', async () => {
    const c = await concertWith((c) => { c.social.collaborators = ['Queens Vocal Ensemble']; });
    const r = await run(c);
    assert.ok(r.facebook.text.includes('in collaboration with Queens Vocal Ensemble, 7:30pm'));
    assert.ok(r.needs.some((n) => n.startsWith('Queens Vocal Ensemble is not in handles.json')));
  });

  test('X drops the collaborator clause first when the post is too long, and says so', async () => {
    const goldenLen = xLength(await golden('x'));
    // " in collaboration with " is 23 characters; the name is long enough to push the post past 280.
    const name = 'Harmony '.repeat(Math.ceil((X_LIMIT - goldenLen) / 8) + 4).trim();
    const c = await concertWith((c) => { c.social.collaborators = [name]; });
    const r = await run(c);
    assert.deepEqual(r.x.dropped, ['collab']);
    assert.ok(r.x.ok);
    assert.ok(r.x.length <= X_LIMIT);
    assert.ok(!r.x.text.includes(name));
  });
});

describe('premiere', () => {
  const premiereConcert = (tag = 'World Premiere', work = 'Cognōscent') => concertWith((c) => {
    c.works[1] = { composer: 'Michael A. Lee', work, tag };
  });

  test('a work tagged World Premiere is mentioned in all three posts', async () => {
    const r = await run(await premiereConcert());
    assert.ok(r.facebook.text.includes("including the world premiere of Michael A. Lee's Cognōscent."));
    assert.ok(r.instagram.text.includes("The concert includes the world premiere of Michael A. Lee's Cognōscent."));
    assert.ok(r.x.text.includes("World Premiere: Michael A. Lee's Cognōscent."));
  });

  test('an acronym in the tag stays capitalised: "US Premiere" is "the US premiere", not "the us premiere"', async () => {
    const r = await run(await premiereConcert('US Premiere'));
    assert.ok(r.facebook.text.includes("including the US premiere of Michael A. Lee's Cognōscent."), r.facebook.text);
    assert.ok(r.instagram.text.includes("The concert includes the US premiere of Michael A. Lee's Cognōscent."));
    assert.ok(!/\bus premiere\b/.test(r.facebook.text));
    assert.ok(r.x.text.includes("US Premiere: Michael A. Lee's Cognōscent."));
  });

  test('"NYC Premiere" keeps its acronym in the Facebook sentence too', async () => {
    const r = await run(await premiereConcert('NYC Premiere'));
    assert.ok(r.facebook.text.includes('the NYC premiere of Michael A. Lee'));
  });

  test('a lowercase tag "premiere" does not start an X sentence in lowercase', async () => {
    const r = await run(await premiereConcert('premiere'));
    assert.ok(r.x.text.includes("Premiere: Michael A. Lee's Cognōscent."), r.x.text);
    assert.ok(!/(^| )premiere: /.test(r.x.text));
    assert.ok(r.facebook.text.includes("including the premiere of Michael A. Lee's Cognōscent."));
  });

  test('the tag match is case-insensitive and the wording follows the tag', async () => {
    const r = await run(await premiereConcert('premiere'));
    assert.ok(r.facebook.text.includes("including the premiere of Michael A. Lee's Cognōscent."));
  });

  test('a tag without "premiere" is not a premiere', async () => {
    const c = await concertWith((c) => { c.works[1].tag = 'Commissioned'; });
    const r = await run(c);
    assert.ok(!r.facebook.text.includes('premiere'));
    assert.ok(!r.x.text.toLowerCase().includes('premiere'));
  });

  test('a work title that ends in ! or ? does not produce "!." or "?." before the full stop', async () => {
    const bang = await run(await premiereConcert('World Premiere', 'Cognōscent!'));
    assert.ok(bang.facebook.text.includes("world premiere of Michael A. Lee's Cognōscent."), bang.facebook.text);
    assert.ok(!bang.facebook.text.includes('!.'));
    assert.ok(bang.x.text.includes("Cognōscent."));
    const q = await run(await premiereConcert('World Premiere', 'Why?'));
    assert.ok(q.instagram.text.includes("world premiere of Michael A. Lee's Why."));
    assert.ok(!q.instagram.text.includes('?.'));
  });

  test('a premiere composer is an entity: an unregistered one blocks and is listed', async () => {
    const c = await premiereConcert();
    delete c.social.waive;
    const r = await run(c);
    assert.ok(r.blockers.includes('Michael A. Lee (X) is unknown'));
  });
});

describe('surnames in the Facebook repertoire line', () => {
  test('a compound English name keeps the compound surname: "Ralph Vaughan Williams" is "Vaughan Williams"', () => {
    assert.equal(surname('Ralph Vaughan Williams'), 'Vaughan Williams');
  });

  test('a generational suffix is dropped: "Johann Strauss II" is "Strauss"', () => {
    assert.equal(surname('Johann Strauss II'), 'Strauss');
    assert.equal(surname('Martin Luther King Jr.'), 'King');
  });

  test('a lowercase particle stays with the name: "Manuel de Falla" is "de Falla"', () => {
    assert.equal(surname('Manuel de Falla'), 'de Falla');
  });

  test('a hyphenated surname stays whole, and a plain name is its last token', () => {
    assert.equal(surname('Mendelssohn-Hensel'), 'Mendelssohn-Hensel');
    assert.equal(surname('Amy Beach'), 'Beach');
    assert.equal(surname('Johann Sebastian Bach'), 'Bach');
    assert.equal(surname('Mozart'), 'Mozart');
  });

  test('social.surnames overrides the computed surname on the Facebook repertoire line', async () => {
    const c = await concertWith((c) => { c.works[1].composer = 'Ralph Vaughan Williams'; c.social.surnames = { 'Ralph Vaughan Williams': 'Williams' }; });
    const r = await run(c);
    assert.ok(r.facebook.text.includes('\n2. Williams: Bal Masqué\n'), r.facebook.text);
  });

  test('without an override the compound surname is used on the repertoire line', async () => {
    const c = await concertWith((c) => { c.works[1].composer = 'Ralph Vaughan Williams'; });
    const r = await run(c);
    assert.ok(r.facebook.text.includes('\n2. Vaughan Williams: Bal Masqué\n'));
  });

  test('a surnames override for a composer that is not on the program fails loud', async () => {
    const c = await concertWith((c) => { c.social.surnames = { 'Nobody Known': 'Known' }; });
    await assert.rejects(run(c), /social\.surnames.*Nobody Known/s);
  });

  test('a non-string composer is a clear validation error, not a TypeError', async () => {
    const c = await concertWith((c) => { c.works[1].composer = 42; });
    await assert.rejects(run(c), (err) => {
      assert.ok(!(err instanceof TypeError), `got a TypeError: ${err.message}`);
      assert.match(err.message, /works\[1\]\.composer must be a string/);
      return true;
    });
  });
});

describe('X length and the shortening order', () => {
  test('ordinal suffixes: 1st 2nd 3rd 4th 11th 12th 13th 21st 22nd 23rd 31st', () => {
    const got = [1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 31].map(ordinal);
    assert.deepEqual(got, ['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '23rd', '31st']);
    assert.equal(ordinal(101), '101st');
    assert.equal(ordinal(111), '111th');
  });

  test('a handle counts in full, a URL counts 23, an em dash counts 1, a CJK character counts 2', () => {
    assert.equal(xLength('@JHBGNY'), 7);
    assert.equal(xLength('https://jhorchestra.org/a/very/long/path?with=query&and=more'), 23);
    assert.equal(xLength('see https://x.org'), 4 + 23);
    assert.equal(xLength('—'), 1);
    assert.equal(xLength('日'), 2);
  });

  test('text is NFC-normalised before counting: a decomposed é counts the same as the precomposed one', () => {
    assert.equal(xLength('é'), 1);
    assert.equal(xLength('é'), xLength('é'));
  });

  test('a regional-indicator flag is one emoji (weight 2), not two letters', () => {
    assert.equal(xLength('🇺🇸'), 2);
    assert.equal(xLength('a🇺🇸'), 3);
  });

  test('a ZWJ family sequence is one emoji (weight 2), and a skin-toned emoji is one (weight 2)', () => {
    assert.equal(xLength('👨‍👩‍👧'), 2);
    assert.equal(xLength('👍🏽'), 2);
  });

  test('a longer premiere that cannot fit is a loud X failure: no text, the length, and the other platforms still drafted', async () => {
    const c = await concertWith((c) => { c.works[1] = { composer: 'Amy Beach', work: 'z'.repeat(300), tag: 'World Premiere' }; });
    const r = await run(c);
    assert.equal(r.x.ok, false);
    assert.equal(r.x.text, undefined);
    assert.match(r.x.error, /over the 280 limit/);
    assert.ok(r.x.length > X_LIMIT);
    assert.ok(r.facebook.text.length > 0 && r.instagram.text.length > 0);
  });

  test('parking is the last optional clause to go: it survives when the lineup is dropped', async () => {
    // Why: attendee logistics outrank the lineup on a 280-character post. Calibrated: the long
    // venue name pushes the post over the limit even after the collaborator clause is dropped,
    // so the lineup has to go too, and the parking sentence must still be there.
    const c = await concertWith((c) => {
      c.venue = 'Blessed Sacrament Church of the Immaculate Conception and Saint Ambrose Parish Hall';
      delete c.social.venue_key;
      delete c.social.waive;
      c.social.collaborators = ['Queens Vocal Ensemble of the Northern Boroughs'];
    });
    const r = await run(c);
    assert.ok(r.x.ok, r.x.error);
    assert.deepEqual(r.x.dropped, ['collab', 'lineup']);
    assert.ok(r.x.text.includes('Parking will be available.'));
    assert.ok(!r.x.text.includes('Led by'));
  });
});

describe('venue, address and the venue checklist items', () => {
  test('a venue with X absent (not "none") is in the checklist and blocks', async () => {
    const reg = registryWith((r) => { delete r['Blessed Sacrament Church'].platforms.x; });
    const r = await run(await fixture(), { registry: reg });
    assert.ok(r.needs.some((n) => n.startsWith('Blessed Sacrament Church: X handle?')));
    assert.ok(r.blockers.includes('Blessed Sacrament Church (X) is unknown'));
  });

  test('a venue_key registered under another venue name fails loud', async () => {
    const c = await concertWith((c) => { c.venue = 'Trinity Lutheran Church'; });
    await assert.rejects(run(c), /venue_key.*registered as "Blessed Sacrament Church"/);
  });

  test('parking unset: no parking sentence and a checklist question; false: no sentence, no question', async () => {
    const unset = await concertWith((c) => { delete c.social.venue_parking; });
    const r1 = await run(unset);
    assert.ok(!r1.facebook.text.includes('Parking will be available'));
    assert.ok(r1.needs.some((n) => n.startsWith('Parking:')));
    const no = await concertWith((c) => { c.social.venue_parking = false; });
    const r2 = await run(no);
    assert.ok(!r2.x.text.includes('Parking'));
    assert.ok(!r2.needs.some((n) => n.startsWith('Parking:')));
  });

  test('no thanks paragraph is a checklist question, and the FB post has no thanks line', async () => {
    const c = await concertWith((c) => { delete c.social.thanks; });
    const r = await run(c);
    assert.ok(r.needs.some((n) => n.startsWith('Thanks paragraph:')));
    assert.ok(!r.facebook.text.includes('thankful'));
  });

  test('address parsing: street and city from the posts form, ZIP, state and the parking note stripped', () => {
    assert.deepEqual(parseVenueAddress('34-43 93rd St, Jackson Heights (parking available)'), { street: '34-43 93rd St', city: 'Jackson Heights' });
    assert.deepEqual(parseVenueAddress('34-43 93rd St, Jackson Heights, NY 11372'), { street: '34-43 93rd St', city: 'Jackson Heights' });
    assert.deepEqual(parseVenueAddress('31-18 37th St, Astoria'), { street: '31-18 37th St', city: 'Astoria' });
    assert.throws(() => parseVenueAddress('Trinity Lutheran'), /street, city/);
    assert.throws(() => parseVenueAddress('Main St, Hoboken, NJ'), /street, city/);
  });

  test('address parsing: nested parentheses are removed, and a ZIP+4 is stripped', () => {
    assert.deepEqual(parseVenueAddress('34-43 93rd St (note (the side door)), Jackson Heights (parking)'), { street: '34-43 93rd St', city: 'Jackson Heights' });
    assert.deepEqual(parseVenueAddress('34-43 93rd St, Jackson Heights, NY 11372-2345'), { street: '34-43 93rd St', city: 'Jackson Heights' });
  });

  test('address parsing: an unbalanced parenthesis fails loud rather than guessing', () => {
    assert.throws(() => parseVenueAddress('34-43 93rd St, Jackson Heights (parking'), /street, city/);
    assert.throws(() => parseVenueAddress('34-43 93rd St (a (b), Jackson Heights'), /street, city/);
  });
});

describe('social block and the output of the social fields', () => {
  test('an unknown social key is refused (a typo must not be silently ignored)', async () => {
    const c = await concertWith((c) => { c.social.venue_parkng = true; });
    await assert.rejects(run(c), /social\.venue_parkng is not a known field/);
  });

  test('premiere is not a social key: it comes from works[].tag', async () => {
    const c = await concertWith((c) => { c.social.premiere = true; });
    await assert.rejects(run(c), /"premiere" is not a social field/);
  });

  test('validateConcert and resolvePeople tolerate the social key, which passes through unchanged', async () => {
    const c = await fixture();
    const roster = await loadRoster();
    const resolved = await resolvePeople(c, roster);
    const checked = await validateConcert(resolved, { today: TODAY });
    assert.deepEqual(checked.social, c.social);
  });
});

describe('thanks recipients: detection', () => {
  test('a name after an office title is found, with trailing punctuation and a possessive removed', () => {
    const k = (t) => thanksRecipients(t, {}).map((x) => x.key);
    assert.deepEqual(k('Thanks to Assemblywoman Catalina Cruz.'), ['Catalina Cruz']);
    assert.deepEqual(k("Thanks to Assemblywoman Catalina Cruz's office."), ['Catalina Cruz']);
    assert.deepEqual(k('Thanks to Assemblywoman Catalina Cruz NY to help.'), ['Catalina Cruz']);
  });

  test('Council Member, Council member and Councilmember titles are accepted, with 3-token names', () => {
    const k = (t) => thanksRecipients(t, {}).map((x) => x.key);
    assert.deepEqual(k('Council Member Julia Salazar helped.'), ['Julia Salazar']);
    assert.deepEqual(k('Council member Julia Salazar helped.'), ['Julia Salazar']);
    assert.deepEqual(k('Councilmember Michael A. Lee helped.'), ['Michael A. Lee']);
    assert.deepEqual(k('Council Member Maria Elena Cruz helped.'), ['Maria Elena Cruz']);
  });

  test('a registry name in the text is found; a name that is not in the text is not', () => {
    const found = thanksRecipients('Thanks, Jackson Heights Beautification Group.', REG).map((t) => `${t.key}:${t.via}`);
    assert.deepEqual(found, ['Jackson Heights Beautification Group:registry']);
  });
});

describe('dates and weekday are validated before any text is built', () => {
  test('a dayname that does not match iso is refused by validateConcert', async () => {
    const c = await concertWith((c) => { c.dayname = 'Thursday'; });
    await assert.rejects(run(c), /dayname 'Thursday' does not match 2026-12-09/);
  });

  test('a date that does not match iso is refused', async () => {
    const c = await concertWith((c) => { c.date = 'December 10'; });
    await assert.rejects(run(c), /date 'December 10' does not match 2026-12-09/);
  });
});

describe('registry validation (the same rules record.mjs enforces)', () => {
  const one = (platform, handle, extra = {}) => ({
    X: { name: 'X', type: 'person', platforms: { [platform]: { status: 'verified', handle, source: 'user-provided', verified_on: TODAY, ...extra } } },
  });
  const ok = (r, today = TODAY) => validateRegistry(r, { today });

  test('the snapshot validates with the same rules', () => {
    ok(structuredClone(REG));
  });

  test('X handles: @ then 1 to 15 word characters', () => {
    assert.doesNotThrow(() => ok(one('x', '@alexwn')));
    assert.doesNotThrow(() => ok(one('x', '@' + 'a'.repeat(15))));
    assert.throws(() => ok(one('x', '@' + 'a'.repeat(16))), /handle/);
    assert.throws(() => ok(one('x', '@alex.wen')), /handle/);
    assert.throws(() => ok(one('x', 'alexwn')), /handle/);
  });

  test('Instagram handles: no "..", no trailing dot, 1 to 30 characters, must start with @', () => {
    assert.doesNotThrow(() => ok(one('instagram', '@ok.name')));
    assert.throws(() => ok(one('instagram', '@a..b')), /handle/);
    assert.throws(() => ok(one('instagram', '@trailing.')), /handle/);
    assert.throws(() => ok(one('instagram', '@' + 'a'.repeat(31))), /handle/);
    assert.throws(() => ok(one('instagram', 'alexwn')), /handle/);
  });

  test('Facebook handles: 5 to 50 letters, digits or dots, with an optional @', () => {
    assert.doesNotThrow(() => ok(one('facebook', 'JacksonHeightsOrchestra')));
    assert.doesNotThrow(() => ok(one('facebook', '@JacksonHeightsOrchestra')));
    assert.throws(() => ok(one('facebook', '@abc')), /handle/);
    assert.throws(() => ok(one('facebook', '@bad-name')), /handle/);
  });

  test('maps links: https only, on the allowlist; other hosts and userinfo are refused', () => {
    const maps = (value) => ({ V: { name: 'V', type: 'venue', maps_url: { status: 'verified', value, source: 'user-provided', verified_on: TODAY } } });
    assert.doesNotThrow(() => ok(maps('https://maps.app.goo.gl/mNo2wqXEUkdA6gAq9')));
    assert.doesNotThrow(() => ok(maps('https://www.google.com/maps/search/?api=1&query=x')));
    assert.doesNotThrow(() => ok(maps('https://goo.gl/maps/abc')));
    assert.throws(() => ok(maps('https://evil.example/maps/x')), /maps link/);
    assert.throws(() => ok(maps('https://google.com.evil.example/maps')), /maps link/);
    assert.throws(() => ok(maps('https://www.google.com/search?q=x')), /maps link/);
    assert.throws(() => ok(maps('https://user:pw@maps.app.goo.gl/x')), /maps link/);
    assert.throws(() => ok(maps('http://maps.app.goo.gl/x')), /https/);
  });

  test('venue address: no newline or control character, "@", backtick, "<" or ">"', () => {
    const addr = (value) => ({ V: { name: 'V', type: 'venue', address: { status: 'verified', value, source: 'user-provided', verified_on: TODAY } } });
    assert.doesNotThrow(() => ok(addr('34-43 93rd St, Jackson Heights, NY 11372')));
    assert.throws(() => ok(addr('34-43 93rd St,\nJackson Heights')), /address/);
    assert.throws(() => ok(addr('Church @ 93rd St')), /address/);
    assert.throws(() => ok(addr('`34-43` 93rd St')), /address/);
    assert.throws(() => ok(addr('<b>34-43 93rd St</b>')), /address/);
  });

  test('names and sources: no control characters or backticks; a source is https, user-provided, or a repo path', () => {
    assert.throws(() => ok({ 'Bad`Name': { name: 'Bad`Name', type: 'person', platforms: {} } }), /name|backtick/);
    assert.throws(() => ok({ 'Line\nBreak': { name: 'Line\nBreak', type: 'person', platforms: {} } }), /name|control/);
    const src = (source) => one('x', '@alexwn', { source });
    assert.doesNotThrow(() => ok(src('https://x.example/ok')));
    assert.doesNotThrow(() => ok(src('user-provided')));
    assert.doesNotThrow(() => ok(src('repo:content/en/contact.md')));
    assert.throws(() => ok(src('https://x.example/a b')), /source/);
    assert.throws(() => ok(src('https://x.example/a<b')), /source/);
    assert.throws(() => ok(src('https://x.example/a)')), /source/);
    assert.throws(() => ok(src('repo:../secret')), /source/);
    assert.throws(() => ok(src('repo:/etc/passwd')), /source/);
  });

  test('verified_on is a real calendar date that is not in the future', () => {
    assert.throws(() => ok(one('x', '@alexwn', { verified_on: '2026-02-30' })), /calendar/);
    assert.throws(() => ok(one('x', '@alexwn', { verified_on: '2026-11-01' }), '2026-10-31'), /future/);
    assert.doesNotThrow(() => ok(one('x', '@alexwn', { verified_on: '2026-10-31' }), '2026-10-31'));
  });

  test('note is a string of at most 200 characters with no newline or control character', () => {
    const note = (n) => one('x', '@alexwn', { note: n });
    assert.doesNotThrow(() => ok(note('a'.repeat(200))));
    assert.throws(() => ok(note('a'.repeat(201))), /200/);
    assert.throws(() => ok(note('line one\nline two')), /note/);
    assert.throws(() => ok(note('tab\there')), /note/);
  });

  test('keys "__proto__", "constructor" and "prototype" are reserved and refused', () => {
    for (const key of ['__proto__', 'constructor', 'prototype']) {
      const reg = JSON.parse(`{"${key}": {"name": "x", "type": "person", "platforms": {}}}`);
      assert.throws(() => ok(reg), /reserved/, key);
    }
  });

  test('a confirmed_value must equal the stored value, and confirmed_on must be a date', () => {
    const base = (extra) => one('x', '@alexwn', { confirmed_value: '@alexwn', confirmed_on: TODAY, ...extra });
    assert.doesNotThrow(() => ok(base({})));
    assert.throws(() => ok(base({ confirmed_value: '@other' })), /confirmed_value/);
    assert.throws(() => ok(base({ confirmed_on: 'soon' })), /confirmed_on/);
  });

  test('an address or maps link on a non-venue is refused', () => {
    assert.throws(() => validateRegistry({ P: { name: 'P', type: 'person', address: { status: 'unknown' } } }), /only for venues/);
  });

  test('a handle without @ is refused; candidate needs a source; a link must be https', () => {
    assert.throws(() => validateRegistry({ X: { name: 'X', type: 'person', platforms: { x: { status: 'verified', handle: 'alex', source: 'user-provided', verified_on: TODAY } } } }, { today: TODAY }), /handle/);
    assert.throws(() => validateRegistry({ X: { name: 'X', type: 'person', platforms: { x: { status: 'candidate', handle: '@alex' } } } }, { today: TODAY }), /source/);
    assert.throws(() => validateRegistry({ V: { name: 'V', type: 'venue', maps_url: { status: 'verified', value: 'http://maps.example/x', source: 'user-provided', verified_on: TODAY } } }, { today: TODAY }), /https/);
  });
});

describe('the social block: surnames and waive', () => {
  test('a surnames value must be a non-empty string', async () => {
    const c = await concertWith((c) => { c.social.surnames = { 'Amy Beach': 42 }; });
    await assert.rejects(run(c), /social\.surnames/);
  });

  test('a waive entry with an unknown platform is refused', async () => {
    const c = await concertWith((c) => { c.social.waive = ['Alex Wen:tiktok']; });
    await assert.rejects(run(c), /social\.waive "Alex Wen:tiktok"/);
  });
});

describe('output path confinement and the file write', () => {
  test('the default folder is <repo>/pr/<YYYYMMDD>_Concert and the file name follows the iso', () => {
    assert.equal(concertOutDir('2026-12-09'), path.join(REPO, 'pr', '20261209_Concert'));
    assert.equal(socialFileName('2026-12-09'), 'JHO_2026-12-09_Social-Posts.md');
  });

  test('--out refuses a folder outside the repo, inside design-system/, a ".." path, and a symlink that escapes', async () => {
    await assert.rejects(resolveOutDir(os.tmpdir()), /inside the repo/);
    await assert.rejects(resolveOutDir(path.join(REPO, 'design-system', 'x')), /design-system/);
    await assert.rejects(resolveOutDir('../../../../etc'), /\.\./);
    const escape = path.join(SCRATCH, 'escape');
    await rm(escape, { force: true });
    await symlink(os.tmpdir(), escape);
    await assert.rejects(resolveOutDir(escape), /inside the repo/);
  });

  test('writeSocialFile writes a plain file, and refuses a symlink at the target', async () => {
    const md = renderMarkdown(await run(await fixture()));
    const plain = path.join(SCRATCH, 'plain');
    await mkdir(plain, { recursive: true });
    const file = await writeSocialFile(plain, md, '2026-12-09');
    assert.equal(await readFile(file, 'utf8'), md);
    const victim = path.join(SCRATCH, 'victim.txt');
    await writeFile(victim, 'keep me');
    const dir = path.join(SCRATCH, 'linked');
    await mkdir(dir, { recursive: true });
    await symlink(victim, path.join(dir, 'JHO_2026-12-09_Social-Posts.md'));
    await assert.rejects(writeSocialFile(dir, md, '2026-12-09', { force: true }), /symlink/);
    assert.equal(await readFile(victim, 'utf8'), 'keep me');
  });

  test('an existing hand-edited Social-Posts.md is not overwritten without force', async () => {
    const md = renderMarkdown(await run(await fixture()));
    const dir = path.join(SCRATCH, 'hand-edited');
    await mkdir(dir, { recursive: true });
    const file = path.join(dir, 'JHO_2026-12-09_Social-Posts.md');
    await writeFile(file, 'my edits');
    await assert.rejects(writeSocialFile(dir, md, '2026-12-09'), /--force/);
    assert.equal(await readFile(file, 'utf8'), 'my edits');
    await writeSocialFile(dir, md, '2026-12-09', { force: true });
    assert.equal(await readFile(file, 'utf8'), md);
  });
});

describe('CLI', () => {
  const REG_ARG = ['--registry', SNAP];

  test('--stdout on the fixture exits 0 and prints the Venue section and the Facebook post', async () => {
    const r = await cli(['--data', FIXTURE, '--stdout', ...REG_ARG]);
    assert.equal(r.code, 0, r.stderr);
    assert.ok(r.stdout.includes('## Venue'));
    assert.ok(r.stdout.includes('Mark your calendars for the upcoming Jackson Heights Orchestra concert, 7:30pm'));
  });

  test('blocked drafts are refused: exit 1, nothing on stdout, a message that points to discover.mjs', async () => {
    const c = await concertWith((c) => { delete c.social.waive; });
    const file = path.join(SCRATCH, 'no-waive.json');
    await writeFile(file, JSON.stringify(c));
    const r = await cli(['--data', file, '--stdout', ...REG_ARG]);
    assert.equal(r.code, 1);
    assert.equal(r.stdout, '');
    assert.match(r.stderr, /refused/);
    assert.match(r.stderr, /discover\.mjs/);
  });

  test('--draft-anyway writes the blocked draft with the banner at the top and exits 0', async () => {
    const c = await concertWith((c) => { delete c.social.waive; });
    const file = path.join(SCRATCH, 'no-waive-2.json');
    await writeFile(file, JSON.stringify(c));
    const r = await cli(['--data', file, '--stdout', '--draft-anyway', ...REG_ARG]);
    assert.equal(r.code, 0, r.stderr);
    assert.equal(r.stdout.split('\n')[0], 'UNVERIFIED — do not post');
  });

  test('a mismatched date stops the CLI with the validation message and exit 1', async () => {
    const c = await concertWith((c) => { c.dayname = 'Thursday'; });
    const file = path.join(SCRATCH, 'bad-date.json');
    await writeFile(file, JSON.stringify(c));
    const r = await cli(['--data', file, '--stdout', ...REG_ARG]);
    assert.equal(r.code, 1);
    assert.match(r.stderr, /does not match/);
  });

  test('an unknown flag fails loudly with exit 1 (a typo is never ignored)', async () => {
    const r = await cli(['--data', FIXTURE, '--stdout', '--draft-anyways', ...REG_ARG]);
    assert.equal(r.code, 1);
    assert.match(r.stderr, /unknown flag --draft-anyways/);
    assert.equal(r.stdout, '');
  });

  test('a re-run does not overwrite an existing Social-Posts.md without --force; with --force it does', async () => {
    const out = path.join(SCRATCH, 'rerun');
    await mkdir(out, { recursive: true });
    const first = await cli(['--data', FIXTURE, '--out', out, ...REG_ARG]);
    assert.equal(first.code, 0, first.stderr);
    const file = path.join(out, 'JHO_2026-12-09_Social-Posts.md');
    await writeFile(file, 'hand edited');
    const second = await cli(['--data', FIXTURE, '--out', out, ...REG_ARG]);
    assert.equal(second.code, 1);
    assert.match(second.stderr, /--force/);
    assert.equal(await readFile(file, 'utf8'), 'hand edited');
    const third = await cli(['--data', FIXTURE, '--out', out, '--force', ...REG_ARG]);
    assert.equal(third.code, 0, third.stderr);
    assert.match(await readFile(file, 'utf8'), /# Social posts: Masks & Revelations/);
  });

  test('the CLI runs through a symlinked path and does work (it does not exit 0 silently)', async () => {
    // Why: /tmp is /private/tmp on macOS. A guard that compares unresolved paths does nothing here.
    const link = path.join(SCRATCH, 'make-social-link.mjs');
    await rm(link, { force: true });
    await symlink(SKILL_CLI, link);
    const { stdout } = await execFileP(process.execPath, [link, '--data', FIXTURE, '--stdout', ...REG_ARG], { cwd: REPO });
    assert.ok(stdout.includes('## Venue'), 'a symlinked run must produce the draft');
  });

  test('--registry reads the named copy: a copy that makes Alex Wen a candidate refuses the draft', async () => {
    const copy = path.join(SCRATCH, 'handles-copy.json');
    const reg = structuredClone(REG);
    reg['Alex Wen'].platforms.instagram = { status: 'candidate', handle: '@alexwn', source: 'https://example.org/alex', confidence: 'high' };
    await writeFile(copy, JSON.stringify(reg));
    const r = await cli(['--data', FIXTURE, '--stdout', '--registry', copy]);
    assert.equal(r.code, 1);
    assert.match(r.stderr, /Alex Wen \(Instagram\) is candidate/);
  });
});
