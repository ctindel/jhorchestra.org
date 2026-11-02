/**
 * Tests for make-poster.mjs. Run: node --test .claude/skills/jho-concert-poster/
 *
 * Each test encodes why the rule exists: a wrong weekday or a wrong month/day
 * prints a wrong date on a public poster, so validation must refuse it rather
 * than pick one.
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { readFile, mkdir, symlink, writeFile, rm, realpath } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateConcert, buildPoster, checkBaseline, checkSkillTemplates, calendarFacts, MAX_WORKS, loadRoster, resolvePeople, esc } from './make-poster.mjs';
import { skillTemplateFor, fillSkillTemplate, loadSkillSource, titleHtml } from './skill-templates.mjs';
import { renderPage } from '../jho-render/render.mjs';
// Helpers added with the review fixes. Namespace import so a missing export fails only its own test.
import * as mp from './make-poster.mjs';
import * as sk from './skill-templates.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../..');
/** Scratch fixtures (symlinks, fake design-system root). Created before the run, removed after. */
const FIX = path.join(HERE, `.fixtures-${process.pid}`);
const DS_FIX = path.join(FIX, 'ds');

before(async () => {
  await mkdir(path.join(DS_FIX, 'assets', 'photos'), { recursive: true });
  await mkdir(path.join(FIX, 'outside'), { recursive: true });
  await writeFile(path.join(DS_FIX, 'assets', 'photos', 'real.jpg'), 'x');
  await writeFile(path.join(FIX, 'outside', 'secret.jpg'), 'x');
  await symlink(path.join(FIX, 'outside', 'secret.jpg'), path.join(DS_FIX, 'assets', 'photos', 'escape.jpg'));
  await symlink(path.join(DS_FIX, 'assets', 'photos', 'real.jpg'), path.join(DS_FIX, 'assets', 'photos', 'alias.jpg'));
  await symlink(path.join(REPO, 'design-system'), path.join(FIX, 'link-ds'));
  await symlink(path.dirname(REPO), path.join(FIX, 'link-up'));
});
after(() => rm(FIX, { recursive: true, force: true }));
/** The Dec 2026 reference concert, exactly as shipped (roster-format conductor and soloist). */
const readReferenceConcert = async () => JSON.parse(await readFile(path.join(HERE, 'concert.2026-12-09.json'), 'utf8'));

const TODAY = '2026-10-29';
const OPTS = { today: TODAY };

const WORKS4 = [
  { composer: 'Mozart', work: 'The Magic Flute — Overture' },
  { composer: 'Amy Beach', work: 'Bal Masqué' },
  { composer: 'Chausson', work: 'Poème' },
  { composer: 'Beethoven', work: 'Symphony No. 1' },
];

/** A valid Duo concert (conductor + violin) for 2026-12-09. Tests clone and tweak it. */
function duoConcert(overrides = {}) {
  return {
    title: 'Masks & Revelations',
    blurb: 'Mystery, celebration, longing, and renewal.',
    dayname: 'Wednesday',
    date: 'December 9',
    iso: '2026-12-09',
    time: '7:30 PM',
    doors: 'Doors 7:00 PM',
    venue: 'Blessed Sacrament Church',
    address: '34-43 93rd St, Jackson Heights (parking available)',
    works: WORKS4.map((w) => ({ ...w })),
    people: [
      { name: 'Alex Wen', role: 'Conductor', photo: 'assets/photos/alex-wen.jpg' },
      { name: 'Nicholas Pappone', role: 'Violin', photo: 'assets/photos/nicholas-pappone.jpeg' },
    ],
    ...overrides,
  };
}

const clone = (x) => JSON.parse(JSON.stringify(x));

describe('calendar date', () => {
  test('2026-12-09 is a real Wednesday', () => {
    assert.deepEqual(calendarFacts('2026-12-09'), { weekday: 'Wednesday', month: 'December', day: 9 });
  });
  test('2026-02-30 is not a calendar date (a leap-year bug would accept it)', () => {
    assert.equal(calendarFacts('2026-02-30'), null);
  });
  test('2028-02-29 is a real date (leap years are not rejected)', () => {
    assert.equal(calendarFacts('2028-02-29').weekday, 'Tuesday');
  });
});

describe('date validation', () => {
  test('matching weekday, month/day and iso pass, and dayname/date are kept', async () => {
    const out = await validateConcert(duoConcert(), OPTS);
    assert.equal(out.dayname, 'Wednesday');
    assert.equal(out.date, 'December 9');
  });

  test("'Wednesday' with 2026-12-10 fails with the Thursday message and asks the user", async () => {
    const c = duoConcert({ iso: '2026-12-10', date: 'December 10' });
    await assert.rejects(validateConcert(c, OPTS), (e) => {
      assert.match(e.message, /dayname 'Wednesday' does not match 2026-12-10, which is a Thursday\. Ask the user which they meant \(Wednesday Dec 9 or Thursday Dec 10\)\./);
      return true;
    });
  });

  test('an invalid calendar date (2026-02-30) fails', async () => {
    await assert.rejects(validateConcert(duoConcert({ iso: '2026-02-30', date: 'February 30', dayname: 'Monday' }), OPTS),
      /"iso" 2026-02-30 is not a real calendar date/);
  });

  test('date that disagrees with the iso month/day fails (Dec 10 vs iso Dec 9)', async () => {
    await assert.rejects(validateConcert(duoConcert({ date: 'December 10' }), OPTS),
      /date 'December 10' does not match 2026-12-09, whose month and day are 'December 9'/);
  });

  test('an iso date in the past is rejected unless allowPast is set', async () => {
    const past = duoConcert({ iso: '2026-05-20', date: 'May 20', dayname: 'Wednesday' });
    await assert.rejects(validateConcert(past, OPTS), /2026-05-20 is in the past/);
    const out = await validateConcert(past, { today: TODAY, allowPast: true });
    assert.equal(out.iso, '2026-05-20');
  });

  test('dayname and date are derived from iso when absent', async () => {
    const c = duoConcert({ iso: '2026-12-10', date: undefined, dayname: undefined });
    const out = await validateConcert(c, OPTS);
    assert.equal(out.dayname, 'Thursday');
    assert.equal(out.date, 'December 10');
  });

  test('dayname that is not a weekday name fails', async () => {
    await assert.rejects(validateConcert(duoConcert({ dayname: 'Funday' }), OPTS), /dayname 'Funday' is not a weekday name/);
  });
});

describe('time validation', () => {
  test('"7:30pm" (no space, lowercase) is rejected: the template text would not match the house style', async () => {
    await assert.rejects(validateConcert(duoConcert({ time: '7:30pm' }), OPTS), /"time" must look like "7:30 PM"/);
  });
  test('doors must read "Doors 7:00 PM"', async () => {
    await assert.rejects(validateConcert(duoConcert({ doors: '7:00 PM' }), OPTS), /"doors" must look like "Doors 7:00 PM"/);
  });
});

describe('works (1..MAX_WORKS per template, tag optional)', () => {
  test('MAX_WORKS is the measured limit: Solo 6, Duo 4, Trio 4 (5 overflows the sheet)', () => {
    // Why: a count the template cannot hold must be refused here, before any render. These numbers come from
    // Chromium measurements of 1..6 works with the reference text and with a stress text (see SKILL.md).
    assert.deepEqual(MAX_WORKS, { Solo: 6, Duo: 4, Trio: 4 });
  });
  test('a 7-work Solo is refused by validation, naming the Solo limit', async () => {
    const seven = [...WORKS4, { composer: 'Haydn', work: 'Symphony No. 94' }, { composer: 'Schubert', work: 'Ave Maria' }, { composer: 'Ravel', work: 'Pavane' }];
    const solo = duoConcert({ people: [{ name: 'Alex Wen', role: 'Conductor', photo: 'assets/photos/alex-wen.jpg' }], works: seven });
    await assert.rejects(validateConcert(solo, OPTS), /"works" must have 1 to 6 entries for the Solo template/);
  });
  test('4 works with no tags pass', async () => {
    const out = await validateConcert(duoConcert(), OPTS);
    assert.equal(out.works.length, 4);
    assert.ok(out.works.every((w) => w.tag === undefined));
  });
  test('5 works in a Duo fail: the column would overflow the sheet', async () => {
    const works = [...WORKS4, { composer: 'Haydn', work: 'Symphony No. 94' }];
    await assert.rejects(validateConcert(duoConcert({ works }), OPTS), /"works" must have 1 to 4 entries for the Duo template/);
  });
  test('0 works fail', async () => {
    await assert.rejects(validateConcert(duoConcert({ works: [] }), OPTS), /"works" must have 1 to 4 entries/);
  });
  test('an empty tag string fails (a tag is optional, but must be text if given)', async () => {
    const works = WORKS4.map((w, i) => (i === 1 ? { ...w, tag: '' } : w));
    await assert.rejects(validateConcert(duoConcert({ works }), OPTS), /works\[1\]\.tag, if given, must be a non-empty string/);
  });
});

describe('people and photos', () => {
  test('photo name must match the file name exactly (macOS is case-insensitive, the web server is not)', async () => {
    const c = duoConcert();
    c.people[0].photo = 'assets/photos/Alex-Wen.jpg';
    await assert.rejects(validateConcert(c, OPTS), /photo file not found \(exact name, case-sensitive\)/);
  });
  test('a photo outside design-system/ is rejected', async () => {
    const c = duoConcert();
    c.people[1].photo = '../../../etc/passwd.jpg';
    await assert.rejects(validateConcert(c, OPTS), /photo is outside design-system\//);
  });
  test('two people may not share one photo', async () => {
    const c = duoConcert();
    c.people[1].photo = c.people[0].photo;
    await assert.rejects(validateConcert(c, OPTS), /is used by another person/);
  });
});

describe('fill', () => {
  test('every May 2026 snippet occurs exactly once in each design-system template (uniqueness only, not a substitution proof)', async () => {
    const results = await checkBaseline();
    assert.equal(results.length, 6, 'nine pairs minus the three color pairs (Solo, Duo, Trio), which route to skill templates');
    assert.ok(results.every((r) => r.uniqueSnippets), JSON.stringify(results));
    assert.ok(!results.some((r) => r.template === '/templates/concert-poster-duo/ConcertPosterDuo.dc.html'),
      'the design-system Duo online template must not be used for color any more');
  });

  describe('substitution into the design-system templates (the check that can actually fail)', () => {
    const BASELINE = JSON.parse(readFileSync(path.join(HERE, 'concert.2026-05-20.json'), 'utf8'));
    const TRIO_PEOPLE = [...duoConcert().people, { name: 'Michael A. Lee', role: 'Cello', photo: 'assets/photos/michael-lee.jpg' }];
    /** Texts of a concert as they appear in the HTML (escaped the way the fill writes them). */
    const textsOf = (c) => [c.title, c.blurb, c.venue, c.address,
      ...c.works.flatMap((w) => [w.composer, w.work, w.tag]).filter(Boolean),
      ...c.people.flatMap((p) => [p.name, p.role])];
    /**
     * A substitution worked when no May 2026 text survives and every new text is present.
     * Strings that the new concert also uses (for example Alex Wen) are not counted as stale.
     */
    function substitutionReport(html, baseline, next) {
      const nextTexts = textsOf(next);
      const stale = textsOf(baseline).filter((s) => !nextTexts.includes(s)).filter((s) => html.includes(esc(s)));
      const missing = nextTexts.filter((s) => !html.includes(esc(s)));
      return { stale, missing };
    }
    const baselineFor = (n) => ({ ...BASELINE, people: BASELINE.people.slice(0, n) });

    test('filling each design-system template with another concert removes every May 2026 string and shows the new one', async () => {
      let filled = 0;
      for (const [n, variant] of [[1, 'Solo'], [2, 'Duo'], [3, 'Trio']]) {
        for (const style of ['color', 'print', 'bw']) {
          if (skillTemplateFor(variant, style)) continue;
          const next = duoConcert({ people: TRIO_PEOPLE.slice(0, n) });
          const { html } = await buildPoster(next, style, OPTS);
          const { stale, missing } = substitutionReport(html, baselineFor(n), next);
          assert.deepEqual({ stale, missing }, { stale: [], missing: [] }, `${variant}/${style}`);
          filled++;
        }
      }
      assert.equal(filled, 6, 'every design-system pair (print and bw, three variants) was substituted, not skipped');
    });

    test('the substitution check fails for a fill that changes nothing (so a passing run means something)', async () => {
      const { html } = await buildPoster(baselineFor(2), 'print', { today: TODAY, allowPast: true });
      const { stale, missing } = substitutionReport(html, baselineFor(2), duoConcert());
      assert.ok(stale.length > 0, 'the untouched May text must be reported as stale');
      assert.ok(missing.length > 0, 'the new text must be reported as missing');
    });
  });

  test('the three skill-owned online templates pass their fill check (every slot, no residue, reference text)', async () => {
    const results = await checkSkillTemplates();
    assert.deepEqual(results, [
      { template: '/jho-concert-poster/solo-online/ConcertPosterSoloOnline.dc.html', fill: 'ok' },
      { template: '/jho-concert-poster/duo-online/ConcertPosterDuoOnline.dc.html', fill: 'ok' },
      { template: '/jho-concert-poster/trio-online/ConcertPosterTrioOnline.dc.html', fill: 'ok' },
    ]);
  });

  test('a tag-less 4-work Duo renders all four works and no premiere tag', async () => {
    const { html } = await buildPoster(duoConcert(), 'color', OPTS);
    for (const name of ['Mozart', 'Amy Beach', 'Chausson', 'Beethoven']) {
      assert.equal(html.split(`>${name}</div>`).length - 1, 1, `composer ${name} should appear once in the works column`);
    }
    assert.ok(!html.includes('World Premiere'), 'no premiere tag may be left from the May baseline');
    assert.ok(!html.includes('Cogn&#333;scent'), 'the May premiere work must be gone');
    assert.ok(html.includes('Symphony No. 1'));
  });

  test('the Solo and Trio templates also take 4 works', async () => {
    const solo = duoConcert({ people: [{ name: 'Alex Wen', role: 'Conductor', photo: 'assets/photos/alex-wen.jpg' }] });
    const trio = duoConcert({
      people: [...duoConcert().people, { name: 'Michael A. Lee', role: 'Cello', photo: 'assets/photos/michael-lee.jpg' }],
    });
    for (const c of [solo, trio]) {
      const { html, variant } = await buildPoster(c, 'print', OPTS);
      assert.equal(html.split('>Beethoven</div>').length - 1, 1, `${variant} must show the 4th work`);
    }
  });
});

describe('roster', () => {
  const ROSTER = {
    'Alex Wen': { title: 'Artistic Director', photo: 'assets/photos/alex-wen.jpg' },
    'Wenqi Li': { title: 'Assistant Conductor', photo: null },
    'Nicholas Pappone': { photo: 'assets/photos/nicholas-pappone.jpeg' },
    'Michael A. Lee': { photo: 'assets/photos/michael-lee.jpg' },
  };
  const rosterConcert = (conductor, soloists = []) => {
    const c = duoConcert();
    delete c.people;
    return { ...c, conductor, soloists };
  };

  test('the real roster.json gives Alex Wen the title Artistic Director, not Conductor', async () => {
    const r = await loadRoster();
    assert.equal(r['Alex Wen'].title, 'Artistic Director');
    assert.equal(r['Alex Wen'].photo, 'assets/photos/alex-wen.jpg');
  });

  test('conductor and soloist resolve from the roster: title is the role, instrument is the soloist role', async () => {
    const out = await resolvePeople(rosterConcert({ name: 'Alex Wen' }, [{ name: 'Nicholas Pappone', instrument: 'Violin' }]), ROSTER);
    assert.deepEqual(out.people, [
      { name: 'Alex Wen', role: 'Artistic Director', photo: 'assets/photos/alex-wen.jpg' },
      { name: 'Nicholas Pappone', role: 'Violin', photo: 'assets/photos/nicholas-pappone.jpeg' },
    ]);
  });

  test('explicit people[] still works unchanged (backward compatible)', async () => {
    const c = duoConcert();
    assert.equal(await resolvePeople(c, ROSTER), c);
  });

  test('Wenqi Li as conductor with no headshot fails loud and says what to ask for', async () => {
    await assert.rejects(resolvePeople(rosterConcert({ name: 'Wenqi Li' }), ROSTER), (e) => {
      assert.match(e.message, /no photo registered for conductor "Wenqi Li"/);
      assert.match(e.message, /design-system\/assets\/photos\/wenqi-li\.jpg/);
      assert.match(e.message, /add "photo": "assets\/photos\/wenqi-li\.jpg" for "Wenqi Li" in roster\.json/);
      return true;
    });
  });

  test('a soloist with no photo in the roster fails loud (no silent placeholder)', async () => {
    await assert.rejects(resolvePeople(rosterConcert({ name: 'Alex Wen' }, [{ name: 'Jane Doe', instrument: 'Cello' }]), ROSTER),
      /no photo for soloist "Jane Doe"/);
  });

  test('a soloist without an instrument fails: the role shown must come from the user', async () => {
    await assert.rejects(resolvePeople(rosterConcert({ name: 'Alex Wen' }, [{ name: 'Nicholas Pappone' }]), ROSTER),
      /soloist "Nicholas Pappone" needs an "instrument"/);
  });

  test('a conductor not in the roster fails unless title and photo are both given', async () => {
    await assert.rejects(resolvePeople(rosterConcert({ name: 'New Person' }), ROSTER), /is not in roster\.json/);
    const ok = await resolvePeople(rosterConcert({ name: 'New Person', title: 'Guest Conductor', photo: 'assets/photos/alex-wen.jpg' }), ROSTER);
    assert.equal(ok.people[0].role, 'Guest Conductor');
  });

  test('giving both people[] and conductor is an error (no ambiguous merge)', async () => {
    const c = { ...duoConcert(), conductor: { name: 'Alex Wen' } };
    await assert.rejects(resolvePeople(c, ROSTER), /either "people" or "conductor"/);
  });
});

describe('Duo online routing (skill-owned template)', () => {
  test('Duo color routes to the skill template; Duo print and bw stay on the design-system templates', async () => {
    const color = await buildPoster(duoConcert(), 'color', OPTS);
    assert.equal(color.pagePath, '/jho-concert-poster/duo-online/ConcertPosterDuoOnline.dc.html');
    for (const style of ['print', 'bw']) {
      const out = await buildPoster(duoConcert(), style, OPTS);
      assert.ok(out.pagePath.startsWith('/templates/concert-poster-duo'), `${style} must keep the design-system Duo: ${out.pagePath}`);
    }
  });

  test('Solo and Trio color route to their skill-owned templates; their print and bw stay on the design-system templates', async () => {
    const solo = duoConcert({ people: [{ name: 'Alex Wen', role: 'Conductor', photo: 'assets/photos/alex-wen.jpg' }] });
    const trio = duoConcert({ people: [...duoConcert().people, { name: 'Michael A. Lee', role: 'Cello', photo: 'assets/photos/michael-lee.jpg' }] });
    assert.equal((await buildPoster(solo, 'color', OPTS)).pagePath, '/jho-concert-poster/solo-online/ConcertPosterSoloOnline.dc.html');
    assert.equal((await buildPoster(trio, 'color', OPTS)).pagePath, '/jho-concert-poster/trio-online/ConcertPosterTrioOnline.dc.html');
    for (const [c, folder] of [[solo, 'concert-poster'], [trio, 'concert-poster-trio']]) {
      for (const style of ['print', 'bw']) {
        const { pagePath } = await buildPoster(c, style, OPTS);
        assert.ok(pagePath.startsWith(`/templates/${folder}`), `${style} must keep the design-system template: ${pagePath}`);
      }
    }
  });
});

describe('Duo online fill (reference layout)', () => {
  test('the Dec 2026 reference concert fills with the italic title part, the When line and the roster title', async () => {
    const { html, concert } = await buildPoster(await readReferenceConcert(), 'color', OPTS);
    assert.equal(concert.people[0].role, 'Artistic Director', 'the conductor title must come from roster.json');
    assert.ok(html.includes('Masks <em>&amp; Revelations</em>'), 'title splits at " & " and the ampersand phrase is italic');
    assert.ok(html.includes('Wednesday &middot; December 9'), 'the When line reads the date from the concert');
    assert.ok(html.includes('>Artistic Director<'), 'conductor role is shown in the poster');
    assert.ok(html.includes('>VIOLIN<') === false, 'the role text is set as typed; CSS uppercases it');
    assert.ok(html.includes('>Violin<'), 'the soloist instrument is shown as given in the concert JSON');
  });

  test('no December 10 and no unfilled slot survives in the output (a stale date must never reach a poster)', async () => {
    const { html } = await buildPoster(await readReferenceConcert(), 'color', OPTS);
    assert.ok(!html.includes('December 10'));
    assert.ok(!html.includes('[['), 'every [[slot]] must be replaced');
  });

  test('a tagged work shows its chip and a tag-less work shows none', async () => {
    const c = duoConcert({ works: [
      { composer: 'Michael A. Lee', work: 'Cognōscent', tag: 'World Premiere' },
      { composer: 'Mozart', work: 'The Magic Flute — Overture' },
    ] });
    const { html } = await buildPoster(c, 'color', OPTS);
    assert.equal(html.split('<span class="jho-tag">World Premiere</span>').length - 1, 1);
    assert.equal(html.split('class="jho-tag"').length - 1, 1, 'only the tagged work gets a chip');
    assert.ok(html.includes('Cogn&#333;scent'), 'non-ASCII work titles are entity-escaped');
  });

  test('four works give four rows, each composer once', async () => {
    const { html } = await buildPoster(duoConcert(), 'color', OPTS);
    for (const name of ['Mozart', 'Amy Beach', 'Chausson', 'Beethoven']) {
      assert.equal(html.split(`class="jho-composer">${name}</div>`).length - 1, 1, `${name} once`);
    }
  });

  test('a title with no " & " is set upright in one run (no italic split is invented)', () => {
    assert.equal(titleHtml('100 Years of Trinity Lutheran'), '100 Years of Trinity Lutheran');
    assert.equal(titleHtml('Masks & Revelations'), 'Masks <em>&amp; Revelations</em>');
  });

  test('a template missing a slot fails loudly, naming the slot, instead of printing a blank', async () => {
    const c = await validateConcert(duoConcert(), OPTS);
    const src = await loadSkillSource(skillTemplateFor('Duo', 'color'));
    const broken = src.split('[[blurb]]').join('blurb');
    assert.ok(!broken.includes('[[blurb]]'), 'every occurrence of the slot must be removed for this test to mean anything');
    assert.throws(() => fillSkillTemplate(broken, c, { variant: 'Duo' }), /no slot for: blurb/);
  });

  test('the shipped skill templates pass their own fill check against the reference concert', async () => {
    const results = await checkSkillTemplates();
    assert.equal(results.length, Object.keys(sk.SKILL_TEMPLATES).length);
    assert.ok(results.every((r) => r.fill === 'ok'));
  });
});

describe('Solo and Trio online fill (skill-owned templates, same fill as Duo)', () => {
  const ref = () => readReferenceConcert();
  const fillOf = async (c) => (await buildPoster(c, 'color', OPTS)).html;

  test('Solo fills the conductor and writes no soloist: the Dec reference has one, the Solo poster must not show it', async () => {
    const solo = mp.skillFixture(await ref(), 'Solo');
    const html = await fillOf(await resolveAndValidate(solo));
    assert.ok(html.includes('>Artistic Director</span>'), 'the conductor role is shown');
    assert.ok(!html.includes('class="jho-soloist"'), 'no soloist block in a Solo poster');
    assert.ok(!html.includes('Nicholas Pappone'), 'the Duo soloist must not leak into a Solo poster');
  });

  test('Trio fills both soloists in their own slots, each with its own photo, name and instrument', async () => {
    const trio = await resolveAndValidate(mp.skillFixture(await ref(), 'Trio'));
    const html = await fillOf(trio);
    assert.ok(html.includes('src="../../assets/photos/nicholas-pappone.jpeg" alt="Nicholas Pappone"'), 'first soloist photo and alt');
    assert.ok(html.includes('src="../../assets/photos/michael-lee.jpg" alt="Michael A. Lee"'), 'second soloist photo and alt');
    assert.ok(html.includes('>Violin</span>') && html.includes('>Cello</span>'), 'each instrument is shown as given');
    assert.equal(html.split('class="jho-soloist"').length - 1, 2, 'exactly two soloist blocks');
  });

  test('every Solo, Duo and Trio fill, at 1 and 4 works, has no [[slot]] left and no stale date', async () => {
    for (const variant of ['Solo', 'Duo', 'Trio']) {
      for (const works of [WORKS4.slice(0, 1), WORKS4]) {
        const c = await resolveAndValidate({ ...mp.skillFixture(await ref(), variant), works });
        const html = await fillOf(c);
        assert.ok(!html.includes('[['), `${variant} with ${works.length} work(s) keeps a [[slot]]`);
        assert.ok(!html.includes('December 10'), `${variant} shows December 10`);
        assert.equal(html.split('class="jho-composer">').length - 1, works.length, `${variant}: one composer row per work`);
      }
    }
  });

  test('a Trio template missing its second soloist slot fails loudly, naming the slot', async () => {
    const c = await resolveAndValidate(mp.skillFixture(await ref(), 'Trio'));
    const src = await loadSkillSource(skillTemplateFor('Trio', 'color'));
    const broken = src.split('[[soloist_b_name]]').join('x');
    assert.throws(() => fillSkillTemplate(broken, c, { variant: 'Trio' }), /no slot for: soloist_b_name/);
  });

  test('a Solo template refuses a concert with two people (the count must match the variant)', async () => {
    const duo = await resolveAndValidate(await ref());
    const src = await loadSkillSource(skillTemplateFor('Solo', 'color'));
    assert.throws(() => fillSkillTemplate(src, duo, { variant: 'Solo' }), /Solo template needs 1 people, got 2/);
  });

  test('validation takes 3 people for Trio and refuses a fourth (the limit is unchanged)', async () => {
    const trio = [...duoConcert().people, { name: 'Michael A. Lee', role: 'Cello', photo: 'assets/photos/michael-lee.jpg' }];
    await validateConcert(duoConcert({ people: trio }), OPTS);
    const four = [...trio, { name: 'Extra Person', role: 'Oboe', photo: 'assets/photos/orchestra.jpg' }];
    await assert.rejects(validateConcert(duoConcert({ people: four }), OPTS), /"people" must have 1 \(conductor\) to 3/);
  });
});

/**
 * Resolve roster people and validate, as the CLI does. The roster keys are dropped after resolving:
 * buildPoster refuses a concert that has both people[] and conductor/soloists.
 */
async function resolveAndValidate(c) {
  const { conductor, soloists, ...explicit } = await resolvePeople(c, await loadRoster());
  return validateConcert(explicit, { today: TODAY });
}

/**
 * Layout harness. The rules are in make-poster.mjs (mp.layoutInPage measures in the page, mp.layoutProblems
 * judges the boxes) and the CLI applies the same rules at render time. So a poster that writePoster writes has
 * passed exactly what these tests assert. This file owns the fixtures and the matrix.
 */
/** Render a concert's skill template in Chromium and return its measured layout. */
async function measureLayout(concert, style = 'color') {
  const { html, pagePath, variant } = await buildPoster(concert, style, OPTS);
  const got = {};
  await renderPage({
    root: path.join(REPO, 'design-system'), pagePath, html, width: 816, height: 1056,
    viewport: { width: 896, height: 1136 }, scale: 1, selector: '.jho-sheet',
    png: path.join(FIX, `measure-${variant}-${process.hrtime.bigint()}.png`),
    assertions: async (page) => { got.m = await page.evaluate(mp.layoutInPage); return []; },
  });
  return got.m;
}

/**
 * The shipped path: writePoster renders, runs the layout check, and writes the PNG and PDF only if the check
 * passes. Returns {ok, outDir, message}. A refusal carries the rule text from the render check.
 */
async function writeVerdict(concert, name) {
  const outDir = path.join(FIX, `verdict-${name.replace(/\W+/g, '-')}`);
  try {
    await mp.writePoster(concert, 'color', { outDir, scale: 1, today: TODAY });
    return { ok: true, outDir, message: '' };
  } catch (e) {
    return { ok: false, outDir, message: e.message };
  }
}

/** Text of the whole sheet after the design-system runtime has run (what a reader would see). */
async function renderedSheetText(concert, style) {
  const { html, pagePath, variant } = await buildPoster(concert, style, OPTS);
  const got = {};
  await renderPage({
    root: path.join(REPO, 'design-system'), pagePath, html, width: 816, height: 1056,
    viewport: { width: 896, height: 1136 }, scale: 1, selector: '.jho-sheet',
    png: path.join(FIX, `text-${variant}-${style}-${process.hrtime.bigint()}.png`),
    assertions: async (page) => { got.t = await page.evaluate(() => document.querySelector('.jho-sheet').textContent); return []; },
  });
  return got.t;
}

const LONG_TITLE = 'An Evening of Romantic Masterworks';
const LONG_WORK = 'Rhapsody on a Theme of Paganini, Op. 43';
const LONG_NAME = 'Maria Esperanza Vidal-Ortega';
const BLURB_2_LINES = 'Mystery, celebration, longing, and renewal, traced through three centuries of music written for the stage, the chapel and the concert hall alike.';
const TAGGED_WRAPPING_WORKS = [
  { composer: 'Rachmaninoff', work: LONG_WORK, tag: 'World Premiere' },
  { composer: 'Mozart', work: 'The Magic Flute — Overture', tag: 'Arranged for Strings' },
  { composer: 'Amy Beach', work: 'Bal Masqué', tag: 'Commissioned' },
  { composer: 'Beethoven', work: 'Symphony No. 1', tag: 'Premiere' },
];
// Five works with short titles and tags: the Solo limit. Three in the first column are the tall ones.
const FIVE_SHORT_TAGGED = [
  { composer: 'Mozart', work: 'The Magic Flute — Overture', tag: 'Arranged for Strings' },
  { composer: 'Amy Beach', work: 'Bal Masqué', tag: 'Commissioned' },
  { composer: 'Chausson', work: 'Poème', tag: 'Premiere' },
  { composer: 'Beethoven', work: 'Symphony No. 1', tag: 'Revised' },
  { composer: 'Haydn', work: 'Symphony No. 94', tag: 'Local Premiere' },
];
const CELLO = { name: 'Michael A. Lee', instrument: 'Cello' };
const SOLOIST_PHOTO = 'assets/photos/nicholas-pappone.jpeg';

/**
 * Stress fixtures, each a change to the Dec 2026 reference for one variant. The long-soloist fixture
 * needs a soloist list that matches the variant (Duo: one soloist, Trio: two; Solo has none).
 */
const FIXTURES = {
  '4 works': () => ({}),
  '3 works': () => ({ works: WORKS4.slice(0, 3) }),
  '1 work': () => ({ works: WORKS4.slice(0, 1) }),
  '5 works, short titles, tagged (Solo only)': () => ({ works: FIVE_SHORT_TAGGED }),
  '6 works (Solo only)': () => ({ works: [...FIVE_SHORT_TAGGED, { composer: 'Schubert', work: 'Ave Maria' }] }),
  '5 works, short titles, tagged, 2-line blurb (Solo only)': () => ({ blurb: BLURB_2_LINES, works: FIVE_SHORT_TAGGED }),
  '5 works, long titles, tagged, 2-line blurb (Solo only)': () => ({ blurb: BLURB_2_LINES, works: [...TAGGED_WRAPPING_WORKS, FIVE_SHORT_TAGGED[4]] }),
  'long title': () => ({ title: LONG_TITLE }),
  'long work title': () => ({ works: [{ composer: 'Rachmaninoff', work: LONG_WORK }, ...WORKS4.slice(1)] }),
  'tagged works, tags wrap': () => ({ works: TAGGED_WRAPPING_WORKS }),
  '2-line blurb': () => ({ blurb: BLURB_2_LINES }),
  'long soloist name (Duo)': () => ({ soloists: [{ name: LONG_NAME, instrument: 'Violin', photo: SOLOIST_PHOTO }] }),
  'long soloist name (Trio)': () => ({ soloists: [{ name: LONG_NAME, instrument: 'Violin', photo: SOLOIST_PHOTO }, CELLO] }),
};

/**
 * Expected verdict per variant and fixture: true = written and clean, false = refused with the rule named.
 * Set from Chromium measurements (see SKILL.md, "Limits"). A change here is a change to what the skill accepts.
 */
const EXPECT_FITS = {
  Solo: { '4 works': true, '3 works': true, '1 work': true, '5 works, short titles, tagged (Solo only)': true, '6 works (Solo only)': true, '5 works, short titles, tagged, 2-line blurb (Solo only)': false, '5 works, long titles, tagged, 2-line blurb (Solo only)': false, 'long title': true, 'long work title': true, 'tagged works, tags wrap': true, '2-line blurb': true },
  Duo: { '4 works': true, '3 works': true, '1 work': true, 'long title': true, 'long work title': true, 'tagged works, tags wrap': true, '2-line blurb': false, 'long soloist name (Duo)': true },
  // A Trio caption is 240px wide: a name up to about 18 characters sets on one line. A longer name wraps to two
  // lines, and the two caption blocks then exceed the band between the divider and the footer rule (see SKILL.md).
  Trio: { '4 works': true, '3 works': true, '1 work': true, 'long title': true, 'long work title': true, 'tagged works, tags wrap': true, '2-line blurb': false, 'long soloist name (Trio)': false },
};

describe('layout limits (Chromium): every fixture is written clean, or refused with the rule it breaks', () => {
  const ref = () => readReferenceConcert();
  for (const variant of ['Solo', 'Duo', 'Trio']) {
    for (const [name, make] of Object.entries(FIXTURES)) {
      if (!(name in EXPECT_FITS[variant])) continue;
      test(`${variant}, ${name}: ${EXPECT_FITS[variant][name] ? 'written, clean' : 'refused, rule named'}`, async () => {
        const c = await resolveAndValidate({ ...mp.skillFixture(await ref(), variant), ...make(variant) });
        const v = await writeVerdict(c, `${variant}-${name}`);
        if (v.ok) {
          // writePoster ran mp.layoutProblems on this render before writing; a written PNG is the proof.
          assert.equal(existsSync(path.join(v.outDir, `JHO_2026-12-09_Poster-${variant}_Online.png`)), true, 'a written poster has its PNG');
        } else {
          assert.match(v.message, /poster layout: /, `a refusal must name the rule: ${v.message}`);
          assert.equal(existsSync(path.join(v.outDir, `JHO_2026-12-09_Poster-${variant}_Online.png`)), false, 'a refused poster writes no PNG');
        }
        assert.equal(v.ok, EXPECT_FITS[variant][name], `verdict for ${variant}, ${name}: ${v.message.split('\n').slice(0, 3).join(' | ')}`);
      });
    }
  }
});

describe('Solo works read down column 1, then column 2 (DOM order and visual order agree)', () => {
  const soloWith = async (n) => resolveAndValidate({ ...mp.skillFixture(await readReferenceConcert(), 'Solo'), works: WORKS4.slice(0, n) });
  /** Order of work indices as a reader sees them: down the left column, then down the right. */
  const visualOrder = (boxes) => boxes.map((_, i) => i).sort((i, j) => (
    Math.abs(boxes[i].left - boxes[j].left) > 0.5 ? boxes[i].left - boxes[j].left : boxes[i].top - boxes[j].top));

  test('4 works: 1 and 2 stacked on the left, 3 and 4 stacked on the right, 3 level with 1 (not under 2)', async () => {
    const { works } = await measureLayout(await soloWith(4));
    const [a, b, c, d] = works.map((w) => w.box);
    assert.ok(Math.abs(a.left - b.left) < 0.5 && Math.abs(c.left - d.left) < 0.5, 'each column shares one left edge');
    assert.ok(c.left > a.left + 100, `the right column starts well right of the left one: ${a.left} vs ${c.left}`);
    assert.ok(b.top > a.top + 10 && d.top > c.top + 10, 'the second work in a column sits below the first');
    assert.ok(Math.abs(c.top - a.top) < 0.5, `work 3 starts level with work 1: ${c.top} vs ${a.top}`);
  });

  test('3 works: 1 and 2 on the left, 3 alone on the right, level with 1', async () => {
    const { works } = await measureLayout(await soloWith(3));
    const [a, b, c] = works.map((w) => w.box);
    assert.ok(Math.abs(a.left - b.left) < 0.5 && c.left > a.left + 100);
    assert.ok(b.top > a.top + 10);
    assert.ok(Math.abs(c.top - a.top) < 0.5);
  });

  test('a tall first work does not change the split: 3 works read 2 + 1 (CSS column balancing alone gave 1 + 2)', async () => {
    // Why: the brief is 2 + 1 for three works. Balancing by height moved the break after a tall first work
    // (a long title that wraps, with a tag), so the fill now marks the column break explicitly.
    const tall = [{ composer: 'Rachmaninoff', work: LONG_WORK, tag: 'World Premiere' }, ...WORKS4.slice(1, 3)];
    const { works } = await measureLayout(await resolveAndValidate({ ...mp.skillFixture(await readReferenceConcert(), 'Solo'), works: tall }));
    const [a, b, c] = works.map((w) => w.box);
    assert.ok(Math.abs(a.left - b.left) < 0.5, 'works 1 and 2 share the left column even though work 1 is tall');
    assert.ok(c.left > a.left + 100, 'work 3 starts the right column');
    assert.ok(Math.abs(c.top - a.top) < 0.5, 'work 3 starts level with work 1');
  });

  test('1 work sits alone in the left column; DOM order equals visual order for 1 to 4 works', async () => {
    for (const n of [1, 2, 3, 4]) {
      const { works } = await measureLayout(await soloWith(n));
      const boxes = works.map((w) => w.box);
      assert.deepEqual(visualOrder(boxes), boxes.map((_, i) => i), `${n} works: a reader must read column 1, then column 2`);
    }
  });
});

describe('Trio soloist photos: smaller than Duo, equal to each other, inside the caption column', () => {
  test('the two Trio caption blocks are the same width, at most the 240px column', async () => {
    const trio = await resolveAndValidate({ ...mp.skillFixture(await readReferenceConcert(), 'Trio'), works: WORKS4 });
    const m = await measureLayout(trio);
    assert.equal(m.soloists.length, 2);
    const [a, b] = m.soloists.map((s) => s.block.right - s.block.left);
    assert.ok(a === b && a <= 240, `caption block widths ${a} and ${b}`);
    assert.deepEqual(mp.layoutProblems(m), []);
  });
});

describe('braces in values stay literal (the design-system runtime evaluates {{ x }} in text nodes)', () => {
  test('esc breaks every "{{" with an empty comment, so no text node holds an open pair the runtime evaluates', () => {
    // Why: the runtime splits each DOM text node on {{ ... }}. An entity (&#123;) is decoded back to a brace before
    // the runtime reads the node, so it cannot protect text. An empty comment between the braces splits the node.
    assert.equal(esc('{{ markSize }}'), '{<!---->{ markSize }}');
    assert.equal(esc('}}'), '}}', 'closing braces alone are text the runtime ignores');
  });

  test('a person name with a brace is refused: the name is also written into alt="...", where a comment cannot split it', async () => {
    const c = duoConcert({ people: [{ ...duoConcert().people[0], name: 'Alex {{ x }} Wen' }, duoConcert().people[1]] });
    await assert.rejects(validateConcert(c, OPTS), /people\[0\]\.name must not contain \{ or \}/);
  });

  test('a skill-template title of "{{ markSize }}" is shown literally, not as the runtime value 93', async () => {
    const text = await renderedSheetText(duoConcert({ title: '{{ markSize }}' }), 'color');
    assert.ok(text.includes('{{ markSize }}'), 'the title must print the braces literally (the runtime would print 93)');
  });

  test('the same holds in a design-system template (print Duo), which uses the same runtime', async () => {
    const text = await renderedSheetText(duoConcert({ title: '{{ markSize }}' }), 'print');
    assert.ok(text.includes('{{ markSize }}'), 'the print title must be literal');
  });
});

describe('layout measurement judges fonts too (a fallback face would move every line)', () => {
  test('a text element whose face did not load is reported by name, not as a silent layout change', () => {
    // Why: the poster is measured with the Playfair and Inter faces it is designed for. If one did not load,
    // the browser lays the text out in a fallback face and the measured boxes are not the poster's.
    const m = {
      overflow: { x: 0, y: 0 }, rules: { divider: { bottom: 537 }, footer: { top: 944 } },
      programme: { top: 560, bottom: 800 }, soloists: [],
      texts: [{ cls: 'blurb', text: 'Mystery', clientW: 400, scrollW: 400, height: 20, ink: { left: 47, right: 200 }, fontLoaded: false }],
    };
    assert.deepEqual(mp.layoutProblems(m), ['blurb "Mystery" is set in a face that did not load: a fallback would change the layout']);
    m.texts[0].fontLoaded = true;
    assert.deepEqual(mp.layoutProblems(m), []);
  });
});

describe('the CLI entry point runs when invoked through a symbolic link', () => {
  test('a symlinked make-poster.mjs prints its JSON (the guard compares real paths, not the link)', async () => {
    const link = path.join(FIX, 'link-cli.mjs');
    await symlink(path.join(HERE, 'make-poster.mjs'), link);
    const { stdout } = await execFileP(process.execPath, [link, '--check-baseline'], { maxBuffer: 16 * 1024 * 1024 });
    assert.equal(JSON.parse(stdout).baseline.length, 6);
  });

  test('a symlinked directory holding make-poster.mjs also runs', async () => {
    const dirLink = path.join(FIX, 'link-skill-dir');
    await symlink(HERE, dirLink);
    const { stdout } = await execFileP(process.execPath, [path.join(dirLink, 'make-poster.mjs'), '--check-baseline'], { maxBuffer: 16 * 1024 * 1024 });
    assert.equal(JSON.parse(stdout).baseline.length, 6);
  });
});


describe('CLI output for Solo and Trio: 288 dpi PNG at 2448x3168, one-page Letter PDF', () => {
  for (const [variant, make] of [['Solo', (r) => mp.skillFixture(r, 'Solo')], ['Trio', (r) => mp.skillFixture(r, 'Trio')]]) {
    test(`${variant} online writes a tagged PNG and a one-page 8.5 x 11 PDF`, async () => {
      const data = path.join(FIX, `${variant.toLowerCase()}.json`);
      await writeFile(data, JSON.stringify(make(await readReferenceConcert())));
      const out = path.join(FIX, `cli-${variant.toLowerCase()}`);
      const { stdout } = await execFileP(process.execPath, [path.join(HERE, 'make-poster.mjs'), '--data', data, '--style', 'color', '--out', out],
        { maxBuffer: 16 * 1024 * 1024 });
      const result = JSON.parse(stdout);
      assert.equal(result.variant, variant);
      const png = pngPhysAndSize(await readFile(path.join(out, `JHO_2026-12-09_Poster-${variant}_Online.png`)));
      assert.deepEqual(png.size, { width: 2448, height: 3168 });
      assert.deepEqual(png.phys, [{ x: 11339, y: 11339, unit: 1 }]);
      assert.equal(result.pdf.pages, 1);
      assert.equal(result.pdf.widthPt, 612);
      assert.equal(result.pdf.heightPt, 792);
    });
  }
});

describe('single-pass skill fill (user text is data: never a replacement pattern, never a slot)', () => {
  const htmlFor = async (c) => (await buildPoster(c, 'color', OPTS)).html;
  const withWorks = (works) => duoConcert({ works });

  test("a work title 'Ode to $$$' prints verbatim (String.replace would turn $$ into $)", async () => {
    const html = await htmlFor(withWorks([{ composer: 'Beethoven', work: 'Ode to $$$' }]));
    assert.ok(html.includes('Ode to $$$'), 'the three dollar signs must print');
  });

  test("'$&' in a work title is not replaced by the matched slot text", async () => {
    const html = await htmlFor(withWorks([{ composer: 'Anon', work: 'Fantasia on $& Themes' }]));
    assert.ok(html.includes('Fantasia on $&amp; Themes'));
    assert.ok(!html.includes('[[work_title]]'), 'the slot name must not be spliced into the title');
  });

  test("'$`' and \"$'\" in a composer name print verbatim", async () => {
    const html = await htmlFor(withWorks([{ composer: "A $' B $` C", work: 'Poème' }]));
    assert.ok(html.includes('A $&#39; B $` C'));
  });

  test('a blurb that names a slot prints the slot name, not the venue', async () => {
    const html = await htmlFor(duoConcert({ blurb: 'Meet at [[venue]]' }));
    assert.ok(html.includes('Meet at [[venue]]'), 'user text containing [[venue]] must print literally');
    assert.ok(html.includes('Blessed Sacrament Church'), 'the real venue still prints in its own slot');
  });

  test('a work title that names a slot prints literally (the tag slot is not filled into it)', async () => {
    const html = await htmlFor(withWorks([{ composer: 'Anon', work: '[[work_tag]] Suite', tag: 'Premiere' }]));
    assert.ok(html.includes('[[work_tag]] Suite'));
    assert.ok(html.includes('<span class="jho-tag">Premiere</span>'));
  });
});

describe('esc (one implementation, UTF-16 aware)', () => {
  test('an astral character (U+1D11E, musical G clef) becomes one numeric entity, not two broken surrogates', () => {
    assert.equal(esc('𝄞'), '&#119070;');
  });

  test('make-poster and skill-templates export the same esc', () => {
    assert.equal(mp.esc, sk.esc);
  });

  test('an astral character in a work title prints as one entity in the poster', async () => {
    const { html } = await buildPoster(duoConcert({ works: [{ composer: 'Anon', work: 'Fantasia 𝄞' }] }), 'color', OPTS);
    assert.ok(html.includes('Fantasia &#119070;'));
    assert.ok(!html.includes('&#55348;'), 'no lone high surrogate may reach the HTML');
  });
});

describe('photo paths (exact, canonical, contained, and safe to write into src)', () => {
  test('a directory with the wrong case fails even on macOS, where the file would be found', async () => {
    const c = duoConcert();
    c.people[0].photo = 'assets/Photos/alex-wen.jpg';
    await assert.rejects(validateConcert(c, OPTS), /photo file not found \(exact name, case-sensitive\)/);
  });

  test('an empty, "." or ".." segment is rejected: the path written into src must be the path checked', async () => {
    const c = duoConcert();
    c.people[0].photo = 'assets//photos/alex-wen.jpg';
    await assert.rejects(validateConcert(c, OPTS), /empty, "\." or "\.\." part/);
  });

  test('characters that could break out of a src="..." attribute are rejected before they reach the template', async () => {
    const c = duoConcert();
    c.people[0].photo = 'assets/photos/x"onload=.jpg';
    await assert.rejects(validateConcert(c, OPTS), /photo must be a jpg\/png\/webp path/);
  });

  test('a space in a photo name is percent-encoded in src (a space would split the URL)', () => {
    assert.equal(sk.photoSrc('assets/photos/a b.jpg'), 'assets/photos/a%20b.jpg');
    assert.equal(sk.photoSrc('assets/photos/alex-wen.jpg'), 'assets/photos/alex-wen.jpg', 'plain names are unchanged');
  });

  test('a symlink under design-system/ that points outside it is rejected', async () => {
    const r = await mp.checkPhotoPath('assets/photos/escape.jpg', DS_FIX);
    assert.match(r.problem, /resolves outside design-system\//);
  });

  test('a symlink alias inside design-system/ is refused: the canonical path must be the one written', async () => {
    const r = await mp.checkPhotoPath('assets/photos/alias.jpg', DS_FIX);
    assert.match(r.problem, /must be written exactly as "assets\/photos\/real\.jpg"/);
    assert.equal(r.normalized, undefined);
  });

  test('a canonical photo reports its normalized relative path, which the duplicate check uses', async () => {
    const r = await mp.checkPhotoPath('assets/photos/real.jpg', DS_FIX);
    assert.deepEqual(r, { normalized: 'assets/photos/real.jpg' });
  });

  test('a wrong-case directory is refused against the fixture root too (case-exact on every component)', async () => {
    const r = await mp.checkPhotoPath('assets/Photos/real.jpg', DS_FIX);
    assert.match(r.problem, /photo file not found \(exact name, case-sensitive\)/);
  });
});

describe('today is the New York date, not the machine zone', () => {
  test('at 02:30 UTC on Oct 29 it is still Oct 28 in New York', () => {
    assert.equal(mp.todayInNewYork(new Date('2026-10-29T02:30:00Z')), '2026-10-28');
  });

  test('at 16:00 UTC on Oct 29 it is Oct 29 in New York', () => {
    assert.equal(mp.todayInNewYork(new Date('2026-10-29T16:00:00Z')), '2026-10-29');
  });
});

describe('null entries are validation messages, not TypeErrors', () => {
  test('a null person in people[] is reported by index', async () => {
    const c = duoConcert({ people: [null, duoConcert().people[1]] });
    await assert.rejects(validateConcert(c, OPTS), /people\[0\] needs "name", "role" and "photo"/);
  });

  test('a concert that is JSON null is reported as a concert problem', async () => {
    await assert.rejects(validateConcert(null, OPTS), /concert must be a JSON object/);
  });

  test('soloists that is not a list is reported', async () => {
    const roster = { 'Alex Wen': { title: 'Artistic Director', photo: 'assets/photos/alex-wen.jpg' } };
    await assert.rejects(resolvePeople({ conductor: { name: 'Alex Wen' }, soloists: 5 }, roster), /"soloists", if given, must be a list/);
  });

  test('a null soloist is reported by name, not a TypeError', async () => {
    const roster = { 'Alex Wen': { title: 'Artistic Director', photo: 'assets/photos/alex-wen.jpg' } };
    await assert.rejects(resolvePeople({ conductor: { name: 'Alex Wen' }, soloists: [null] }, roster), /each soloist needs a "name"/);
  });
});

describe('--scale', () => {
  test('a finite positive number is accepted', () => {
    assert.equal(mp.parseScale('3'), 3);
    assert.equal(mp.parseScale('2.5'), 2.5);
  });

  test('zero, negatives, non-numbers, empty, NaN and Infinity are rejected', () => {
    for (const v of ['0', '-1', 'abc', '', 'NaN', 'Infinity']) {
      assert.throws(() => mp.parseScale(v), /--scale must be a positive number/, `"${v}"`);
    }
  });
});

describe('--out (realpath must be inside the repo and outside design-system/)', () => {
  test('a directory inside the repo is accepted, resolved through realpath', async () => {
    const dir = await mp.resolveOutDir(path.join(HERE, 'out-check'));
    assert.equal(dir, path.join(await realpath(HERE), 'out-check'));
  });

  test('design-system/ is refused (its templates are source, not output)', async () => {
    await assert.rejects(mp.resolveOutDir(path.join(REPO, 'design-system', 'out')), /inside design-system\//);
  });

  test('a path outside the repo is refused', async () => {
    await assert.rejects(mp.resolveOutDir(path.join(path.dirname(REPO), 'elsewhere')), /inside the repo/);
    await assert.rejects(mp.resolveOutDir('/'), /inside the repo/);
  });

  test('a ".." segment is refused even if it would land back inside the repo', async () => {
    await assert.rejects(mp.resolveOutDir(`${HERE}/../out`), /must not contain "\.\."/);
  });

  test('a symlink inside the repo that points into design-system/ is refused', async () => {
    await assert.rejects(mp.resolveOutDir(path.join(FIX, 'link-ds', 'out')), /inside design-system\//);
  });

  test('a symlink inside the repo that points outside it is refused', async () => {
    await assert.rejects(mp.resolveOutDir(path.join(FIX, 'link-up', 'elsewhere')), /inside the repo/);
  });
});

describe('default output folder: pr/<YYYYMMDD>_Concert, derived from the concert date', () => {
  test('the folder is the date with the dashes removed, plus _Concert', () => {
    // Why: the folder is how a reader finds a concert's files. It must match the date on the poster.
    assert.equal(mp.concertFolder('2026-12-09'), '20261209_Concert');
    assert.equal(mp.concertFolder('2026-05-20'), '20260520_Concert');
  });

  test('the compact YYYYMMDD form is accepted and gives the same folder', () => {
    assert.equal(mp.concertFolder('20261209'), '20261209_Concert');
  });

  test('the default path is pr/<folder> under the repo, for the Dec 9 concert', () => {
    assert.equal(mp.concertOutDir('2026-12-09', { repo: FIX }), path.join(FIX, 'pr', '20261209_Concert'));
    assert.equal(path.dirname(mp.concertOutDir('2026-12-09')), path.join(REPO, 'pr'));
  });

  test('a date that is not a real calendar day is refused: 2026-02-30 would name a folder no concert uses', () => {
    assert.throws(() => mp.concertFolder('2026-02-30'), /concert date must be YYYY-MM-DD or YYYYMMDD/);
    assert.throws(() => mp.concertFolder('20260230'), /concert date must be/);
    assert.throws(() => mp.concertFolder('2026-13-01'), /concert date must be/);
  });

  test('malformed dates are refused, including mixed forms and stray characters', () => {
    for (const bad of ['2026-12-9', '2026-1209', '202612-09', '2026/12/09', '2026-12-09 ', '2026-12-09\n', 'Dec 9 2026', '', 'x', 20261209, null, undefined]) {
      assert.throws(() => mp.concertFolder(bad), /concert date must be/, JSON.stringify(bad));
    }
  });

  test('a traversal in the date is refused before any path is built', () => {
    // Why: the date goes into a filesystem path. Only digits can pass, so no "..", no "/" can reach it.
    for (const bad of ['../2026-12-09', '2026-12-09/../..', '20261209/../../x', '..']) {
      assert.throws(() => mp.concertOutDir(bad, { repo: FIX }), /concert date must be/, bad);
    }
  });
});

const execFileP = promisify(execFile);

/** pHYs chunks and the IHDR size of a PNG (independent of render.mjs). */
function pngPhysAndSize(buf) {
  let pos = 8; const phys = []; let size = null;
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('latin1', pos + 4, pos + 8);
    const d = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') size = { width: d.readUInt32BE(0), height: d.readUInt32BE(4) };
    if (type === 'pHYs') phys.push({ x: d.readUInt32BE(0), y: d.readUInt32BE(4), unit: d[8] });
    pos += 12 + len;
  }
  return { size, phys };
}

describe('poster PNG resolution: pHYs follows the sheet size and the --scale', () => {
  test('posterPngDpi is pixel width over the 8.5 in sheet, so it tracks --scale', () => {
    // Why: a fixed 288 would tag a --scale 2 PNG as 288 dpi, and it would print 17 in wide, not 8.5.
    assert.equal(mp.posterPngDpi(3), 288);
    assert.equal(mp.posterPngDpi(2), 192);
    assert.equal(mp.posterPngDpi(2.5) * 8.5, 2040);
  });

  test('the poster CLI writes a PNG that reports 288 dpi at 2448x3168 px, and the PDF is written', async () => {
    // Why: this is the shipped path. Unit checks cannot show the file that print tools open.
    const out = path.join(FIX, 'cli-out');
    await execFileP(process.execPath, [path.join(HERE, 'make-poster.mjs'), '--data', path.join(HERE, 'concert.2026-12-09.json'),
      '--style', 'color', '--out', out, '--allow-past'], { maxBuffer: 16 * 1024 * 1024 });
    const png = pngPhysAndSize(await readFile(path.join(out, 'JHO_2026-12-09_Poster-Duo_Online.png')));
    assert.deepEqual(png.size, { width: 2448, height: 3168 });
    assert.deepEqual(png.phys, [{ x: 11339, y: 11339, unit: 1 }]);
    await readFile(path.join(out, 'JHO_2026-12-09_Poster-Duo_Online.pdf'));
  });
});

describe('default CLI run writes the online poster AND the pure-black print poster (8.5 x 11, PDF + PNG each)', () => {
  const out = path.join(REPO, 'pr', `_test-default-${process.pid}`);
  after(() => rm(out, { recursive: true, force: true }));
  test('file set, sizes, and every bw text/rule pixel is #000 with no color', async () => {
    const { stdout } = await execFileP(process.execPath, [path.join(HERE, 'make-poster.mjs'), '--data', path.join(HERE, 'concert.2026-12-09.json'), '--out', out, '--allow-past'],
      { maxBuffer: 16 * 1024 * 1024 });
    const res = JSON.parse(stdout);
    assert.deepEqual(res.posters.map((p) => p.style), ['color', 'bw']);
    for (const f of ['Online', 'Print-BW']) {
      for (const ext of ['png', 'pdf']) assert.ok(existsSync(path.join(out, `JHO_2026-12-09_Poster-Duo_${f}.${ext}`)), `${f}.${ext} missing`);
    }
    const bw = res.posters[1];
    assert.equal(bw.pdf.pages, 1);
    assert.equal(bw.pdf.widthPt, 612);
    assert.equal(bw.pdf.heightPt, 792);
    // Why: grey text or grey rules print as a tint on newsprint. Text is #000 in the template; the rules were
    // rgba(0,0,0,.4) until hardBlackBw. Check computed styles in the live page, not just the source.
    const built = await buildPoster(JSON.parse(await readFile(path.join(HERE, 'concert.2026-12-09.json'), 'utf8')), 'bw', { allowPast: true });
    let bad = null;
    await renderPage({ root: path.join(REPO, 'design-system'), pagePath: built.pagePath, html: built.html, width: 816, height: 1056, png: path.join(out, 'check.png'),
      selector: '.jho-sheet',
      assertions: async (page) => {
        bad = await page.evaluate(() => {
          const out = [];
          for (const el of document.querySelectorAll('.jho-sheet *')) {
            const cs = getComputedStyle(el);
            if (el.childNodes.length && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && cs.color !== 'rgb(0, 0, 0)') out.push('text ' + cs.color + ' ' + el.textContent.trim().slice(0, 30));
            for (const side of ['Top', 'Bottom']) {
              if (parseFloat(cs['border' + side + 'Width']) > 0 && cs['border' + side + 'Style'] !== 'none' && cs['border' + side + 'Color'] !== 'rgb(0, 0, 0)') out.push('rule ' + cs['border' + side + 'Color']);
            }
          }
          return out;
        });
        return [];
      } });
    assert.deepEqual(bad, []);
  });
});
