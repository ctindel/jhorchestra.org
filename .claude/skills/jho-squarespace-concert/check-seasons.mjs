#!/usr/bin/env node
// Season check for the repo jho-data/*.json files (dependency-free).
// Rule: season is `YYYY–YYYY` (EN DASH U+2013), end = start + 1, and equals the
// season of the concert date in the file name (Sep..Aug: month >= 9 -> y..y+1, else y-1..y).
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

export const SEASON_RE = /^\d{4}–\d{4}$/;

export function seasonForDate(yyyymmdd) {
  const y = Number(yyyymmdd.slice(0, 4));
  const m = Number(yyyymmdd.slice(4, 6));
  return m >= 9 ? `${y}–${y + 1}` : `${y - 1}–${y}`;
}

// Returns a list of problem strings for one (slug, season) pair.
export function checkSeason(slug, season) {
  if (typeof season !== 'string' || !SEASON_RE.test(season)) {
    return [`${slug}: season ${JSON.stringify(season)} is not YYYY–YYYY (EN DASH)`];
  }
  const [a, b] = season.split('–').map(Number);
  const problems = [];
  if (b !== a + 1) problems.push(`${slug}: season ${season} end is not start+1`);
  const want = seasonForDate(slug);
  if (season !== want) problems.push(`${slug}: season ${season} but the date gives ${want}`);
  return problems;
}

// Fails when two labels differ only by format (same start year) or a label is non-canonical.
export function checkLabels(labels) {
  const problems = [];
  const byStart = new Map();
  for (const l of new Set(labels)) {
    if (!SEASON_RE.test(l)) problems.push(`non-canonical label ${JSON.stringify(l)}`);
    const k = (String(l).match(/\d{4}/) || [l])[0];
    byStart.set(k, [...(byStart.get(k) || []), l]);
  }
  for (const [k, v] of byStart) if (v.length > 1) problems.push(`labels differ only by format for ${k}: ${v.join(' | ')}`);
  return problems;
}

export function checkDir(dir) {
  const problems = [];
  const labels = [];
  for (const f of readdirSync(dir).filter((f) => /^\d{8}\.json$/.test(f)).sort()) {
    const slug = f.slice(0, 8);
    const season = JSON.parse(readFileSync(join(dir, f), 'utf8')).season;
    labels.push(season);
    problems.push(...checkSeason(slug, season));
  }
  return [...problems, ...checkLabels(labels)];
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = process.argv[2] || join(dirname(fileURLToPath(import.meta.url)), 'jho-data');
  const problems = checkDir(dir);
  if (problems.length) {
    console.error(problems.join('\n'));
    process.exit(1);
  }
  console.log('season check: ok');
}
