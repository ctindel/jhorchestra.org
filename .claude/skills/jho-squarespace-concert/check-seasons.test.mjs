// Why: Archives groups concerts by the exact season string, so "2017–18" and "2017–2018"
// show up as two groups. These tests fail if the format rule or the date rule is loosened.
import test from 'node:test';
import assert from 'node:assert/strict';
import { checkSeason, checkLabels, seasonForDate, checkDir } from './check-seasons.mjs';
import { fileURLToPath } from 'node:url';

test('season runs September to August', () => {
  assert.equal(seasonForDate('20250831'), '2024–2025');
  assert.equal(seasonForDate('20250901'), '2025–2026');
  assert.equal(seasonForDate('20191211'), '2019–2020');
});

test('two-digit end year is rejected (would split the Archives group)', () => {
  assert.equal(checkSeason('20180516', '2017–18').length, 1);
});

test('hyphen instead of EN DASH is rejected', () => {
  assert.equal(checkSeason('20180516', '2017-2018').length, 1);
});

test('canonical label that disagrees with the date is rejected', () => {
  assert.match(checkSeason('20180516', '2018–2019')[0], /date gives 2017–2018/);
});

test('end year must be start + 1', () => {
  assert.ok(checkSeason('20180516', '2017–2019').length >= 1);
});

test('labels differing only by format are flagged', () => {
  assert.ok(checkLabels(['2017–18', '2017–2018']).some((p) => /only by format/.test(p)));
  assert.deepEqual(checkLabels(['2017–2018', '2018–2019', '2017–2018']), []);
});

test('repo jho-data files are all canonical', () => {
  assert.deepEqual(checkDir(fileURLToPath(new URL('./jho-data', import.meta.url))), []);
});
