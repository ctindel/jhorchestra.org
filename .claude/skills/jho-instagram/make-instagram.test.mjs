/**
 * Tests for make-instagram.mjs. Run: node --test .claude/skills/jho-instagram/make-instagram.test.mjs
 *
 * Each test encodes why the rule matters for a public post. A wrong premiere claim, a stray
 * "undefined" on a story, or a clipped concert list goes out to followers as is.
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, mkdir, realpath, symlink, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  findPremiere, buildGraphics, prepareConcert, resolveOutDir, parseArgs, renderInstagramSet,
} from './make-instagram.mjs';
import { esc } from '../jho-concert-poster/make-poster.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CONCERTS = path.join(HERE, '..', 'jho-concert-poster');
const TODAY = '2026-10-29';

const readJson = async (f) => JSON.parse(await readFile(f, 'utf8'));
const DEC9 = () => readJson(path.join(CONCERTS, 'concert.2026-12-09.json'));
const MAY20 = () => readJson(path.join(CONCERTS, 'concert.2026-05-20.json'));

/** A concert with a tagged premiere at a given index, ASCII-only so the esc() output is predictable. */
const tagged = (index) => ({
  title: 'Masks & Revelations',
  blurb: 'Test.',
  dayname: 'Wednesday',
  date: 'December 9',
  iso: '2026-12-09',
  time: '7:30 PM',
  doors: 'Doors 7:00 PM',
  venue: 'Blessed Sacrament Church',
  address: '34-43 93rd St, Jackson Heights',
  works: [0, 1, 2].map((i) => ({ composer: `Composer ${i}`, work: `Work ${i}`, ...(i === index ? { tag: 'Premiere' } : {}) })),
  conductor: { name: 'Alex Wen' },
  soloists: [{ name: 'Nicholas Pappone', instrument: 'Violin' }],
});

let work;
before(async () => { work = await mkdtemp(path.join(os.tmpdir(), 'jho-ig-test-')); });
after(async () => { await rm(work, { recursive: true, force: true }); });

describe('prepareConcert(): the same path the CLI takes', () => {
  test('the Dec 9 roster-format JSON resolves to people and validates', async () => {
    // Why: the documented example file uses "conductor"/"soloists", not people[]. The CLI used to
    // validate the raw file and fail with "people must have 1 to 3 entries".
    const c = await prepareConcert(await DEC9(), { today: TODAY });
    assert.equal(c.people.length, 2);
    assert.equal(c.people[0].role, 'Artistic Director');
    assert.equal(c.people[1].name, 'Nicholas Pappone');
    assert.equal(c.people[1].role, 'Violin');
  });

  test('a past concert is refused unless --allow-past is given', async () => {
    // Why: posting a May concert as "next" in December is a false public claim.
    await assert.rejects(prepareConcert(await MAY20(), { today: TODAY }), /in the past/);
    const c = await prepareConcert(await MAY20(), { today: TODAY, allowPast: true });
    assert.equal(c.iso, '2026-05-20');
  });
});

describe('parseArgs(): --allow-past is a flag, not a key that takes a value', () => {
  test('a bare --allow-past sets allowPast', () => {
    const a = parseArgs(['--data', 'c.json', '--allow-past']);
    assert.equal(a.data, 'c.json');
    assert.equal(a.allowPast, true);
  });

  test('without it, allowPast is unset', () => {
    assert.equal(parseArgs(['--data', 'c.json']).allowPast, undefined);
  });
});

describe('the premiere is the work tagged Premiere, never works[1] by position', () => {
  test('findPremiere returns null when no work is tagged', () => {
    assert.equal(findPremiere([{ composer: 'A', work: 'B' }]), null);
  });

  test('findPremiere finds a tag at any index, case-insensitively', () => {
    const r = findPremiere([{ composer: 'A', work: 'B' }, { composer: 'C', work: 'D' }, { composer: 'E', work: 'F', tag: 'WORLD PREMIERE' }]);
    assert.equal(r.index, 2);
    assert.equal(r.work.work, 'F');
  });

  test('a concert with no premiere skips Story-Artist-Spotlight with a reason, and claims no premiere', async () => {
    // Why: the old code printed "undefined" or invented a premiere when works[1] had no tag.
    const c = await prepareConcert(await DEC9(), { today: TODAY });
    const { graphics, skipped } = buildGraphics(c, '..');
    assert.deepEqual(skipped.map((s) => s.name), ['Story-Artist-Spotlight']);
    assert.match(skipped[0].reason, /Premiere/);
    assert.deepEqual(graphics.map((g) => g.name), ['IG-Concert', 'IG-Brand', 'Story-Concert']);
    for (const g of graphics) {
      assert.ok(!g.html.includes('undefined'), `${g.name} has "undefined" in it`);
      assert.ok(!/premieres/i.test(g.html), `${g.name} claims a premiere`);
    }
  });

  test('the spotlight uses the tagged work, wherever it sits', async () => {
    const c = await prepareConcert(tagged(2), { today: TODAY, allowPast: true });
    const spot = buildGraphics(c, '..').graphics.find((g) => g.name === 'Story-Artist-Spotlight');
    assert.ok(spot, 'spotlight should be built when a work is tagged');
    assert.match(spot.html, /A new work, <em[^>]*>Work 2<\/em>, premieres December 9\./);
    assert.match(spot.html, />Premiere</, 'eyebrow is the tag text');
    assert.ok(!spot.html.includes('Work 1<'), 'must not feature works[1]');
  });

  test('a one-work concert does not throw', async () => {
    const one = tagged(0);
    one.works = [{ composer: 'Solo', work: 'Only Work' }];
    const c = await prepareConcert(one, { today: TODAY, allowPast: true });
    const { graphics, skipped } = buildGraphics(c, '..');
    assert.ok(graphics.some((g) => g.name === 'IG-Concert'));
    assert.deepEqual(skipped.map((s) => s.name), ['Story-Artist-Spotlight']);
  });

  test('works may carry no tags at all, and the concert tile still lists every work', async () => {
    const c = await prepareConcert(await DEC9(), { today: TODAY });
    const tile = buildGraphics(c, '..').graphics.find((g) => g.name === 'IG-Concert');
    for (const w of c.works) assert.ok(tile.html.includes(esc(w.work)), w.work);
  });
});

describe('buildGraphics(): the directory the HTML points at is escaped', () => {
  test('a quote in the design-system path cannot break out of the href', async () => {
    // Why: dsp is built from the repo path. A quote or < in the path must not inject markup.
    const c = await prepareConcert(await DEC9(), { today: TODAY });
    const tile = buildGraphics(c, 'x"y<z').graphics.find((g) => g.name === 'IG-Concert');
    assert.ok(tile.html.includes('href="x&quot;y&lt;z/styles.css"'), 'stylesheet href must be escaped');
    assert.ok(!tile.html.includes('x"y'), 'raw quote must not appear');
  });
});

describe('resolveOutDir(): --out must be inside the repo and not inside design-system/', () => {
  let repo;
  before(async () => {
    repo = path.join(work, 'repo');
    await mkdir(path.join(repo, 'design-system', 'sub'), { recursive: true });
    await mkdir(path.join(repo, 'elsewhere-src'), { recursive: true });
    await symlink(path.join(repo, 'design-system'), path.join(repo, 'ds-link'));
    await mkdir(path.join(work, 'outside-repo'), { recursive: true });
    await symlink(path.join(work, 'outside-repo'), path.join(repo, 'escape-link'));
  });

  test('the default out/ (inside the repo) is accepted', async () => {
    const dir = await resolveOutDir(undefined, { repo });
    assert.equal(dir, path.join(await realpath(repo), 'out'));
  });

  test('a folder inside design-system/ is refused', async () => {
    // Why: generated PNGs and HTML would land in the design-system source tree.
    await assert.rejects(resolveOutDir(path.join(repo, 'design-system', 'sub'), { repo }), /design-system/);
    await assert.rejects(resolveOutDir(path.join(repo, 'design-system'), { repo }), /design-system/);
  });

  test('a symlink that resolves into design-system/ is refused', async () => {
    await assert.rejects(resolveOutDir(path.join(repo, 'ds-link', 'out'), { repo }), /design-system/);
  });

  test('a folder outside the repo is refused, including through a symlink', async () => {
    await assert.rejects(resolveOutDir(path.join(work, 'outside-repo'), { repo }), /inside the repo/);
    await assert.rejects(resolveOutDir(path.join(repo, 'escape-link', 'x'), { repo }), /inside the repo/);
  });
});

describe('renderInstagramSet(): rendered output, in a real browser', () => {
  test('the Dec 9 set renders its three graphics at the exact sizes, with no overflow', async () => {
    // Why: four works is the largest list the tile and stories must hold. Clipping drops a
    // composer from a public post without any error, so overflow must fail the render.
    const c = await prepareConcert(await DEC9(), { today: TODAY });
    const outDir = path.join(work, 'dec9');
    const { results, skipped } = await renderInstagramSet(c, outDir);
    assert.deepEqual(results.map((r) => r.graphic), ['IG-Concert', 'IG-Brand', 'Story-Concert']);
    assert.deepEqual(skipped.map((s) => s.name), ['Story-Artist-Spotlight']);
    for (const r of results) assert.ok(r.size.includes('x'), r.graphic);
  });

  test('a 4-work concert with long titles fails loudly on IG-Concert (overflow, not a clipped tile)', async () => {
    const long = tagged(0);
    long.works = [0, 1, 2, 3].map((i) => ({
      composer: `Composer With A Very Long Surname Number ${i}`,
      work: `Symphony Number ${i} in a Very Long Title That Keeps Going Across Several Lines of Type`,
    }));
    const c = await prepareConcert(long, { today: TODAY, allowPast: true });
    await assert.rejects(
      renderInstagramSet(c, path.join(work, 'overflow-ig'), { only: ['IG-Concert'] }),
      /overflow/i,
    );
  });

  test('a 4-work concert with long titles fails loudly on Story-Concert too', async () => {
    const long = tagged(0);
    long.works = [0, 1, 2, 3].map((i) => ({
      composer: `Composer With A Very Long Surname Number ${i}`,
      work: `Symphony Number ${i} in a Very Long Title That Keeps Going Across Several Lines of Type`,
    }));
    const c = await prepareConcert(long, { today: TODAY, allowPast: true });
    await assert.rejects(
      renderInstagramSet(c, path.join(work, 'overflow-story'), { only: ['Story-Concert'] }),
      /overflow/i,
    );
  });

  test('a premiere spotlight on the 4-work Dec 9 concert renders at 1080x1920 with no overflow', async () => {
    // Why: a tagged premiere is the one story that makes a new public claim. It used to fail the
    // overflow check (340x608 content in a 340x604 frame), so no premiere could be posted at all.
    const c = await DEC9();
    c.works[0] = { ...c.works[0], tag: 'World Premiere' };
    const prepared = await prepareConcert(c, { today: TODAY });
    const { results } = await renderInstagramSet(prepared, path.join(work, 'premiere-4work'), { only: ['Story-Artist-Spotlight'] });
    assert.deepEqual(results.map((r) => [r.graphic, r.size]), [['Story-Artist-Spotlight', '1080x1920']]);
  });

  test('a premiere spotlight on a 1-work concert renders at 1080x1920 with no overflow', async () => {
    // Why: the spotlight must hold with the shortest work list too, not only the longest.
    const c = await DEC9();
    c.works = [{ ...c.works[0], tag: 'World Premiere' }];
    const prepared = await prepareConcert(c, { today: TODAY });
    const { results } = await renderInstagramSet(prepared, path.join(work, 'premiere-1work'), { only: ['Story-Artist-Spotlight'] });
    assert.deepEqual(results.map((r) => [r.graphic, r.size]), [['Story-Artist-Spotlight', '1080x1920']]);
  });

  test('the premiere spotlight text has no "undefined" and names the tagged work', async () => {
    // Why: a stray "undefined" or a wrong work name on a premiere post is a false public claim.
    const c = await DEC9();
    c.works[0] = { ...c.works[0], tag: 'World Premiere' };
    const prepared = await prepareConcert(c, { today: TODAY });
    const spot = buildGraphics(prepared, '..').graphics.find((g) => g.name === 'Story-Artist-Spotlight');
    assert.ok(!spot.html.includes('undefined'), 'spotlight has "undefined" in it');
    assert.match(spot.html, new RegExp(`A new work, <em[^>]*>${esc('The Magic Flute — Overture')}</em>, premieres December 9\\.`));
    assert.match(spot.html, />World Premiere</, 'eyebrow is the tag text');
  });
});
