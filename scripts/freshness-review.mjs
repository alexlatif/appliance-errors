#!/usr/bin/env node
// Freshness rotation helper (AEO: re-verify top content every 6–8 weeks).
// Repo-local copy — used by the scheduled freshness GitHub Action.
//
// Default: list the N stalest high-severity code pages for re-verification.
// --apply id…: stamp today's date on re-verified ids (only after actual review).
// --markdown: emit a GitHub-issue-ready markdown body.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '../src/data/error-codes.json');
const DATES = join(__dirname, '../src/data/verified-dates.json');

const codes = JSON.parse(readFileSync(DATA, 'utf8')).error_codes;
const dates = JSON.parse(readFileSync(DATES, 'utf8'));
const args = process.argv.slice(2);

if (args[0] === '--apply') {
  const ids = args.slice(1);
  if (ids.length === 0) { console.error('pass code ids to stamp'); process.exit(1); }
  const today = new Date().toISOString().split('T')[0];
  let n = 0;
  for (const id of ids) {
    if (!codes.find(c => c.id === id)) { console.warn(`unknown id: ${id}`); continue; }
    dates[id] = today; n++;
  }
  writeFileSync(DATES, JSON.stringify(dates, null, 2) + '\n');
  console.log(`stamped ${n} codes as verified ${today}`);
  process.exit(0);
}

const limitIdx = args.indexOf('--limit');
const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : 30;
const markdown = args.includes('--markdown');

const sevRank = { critical: 0, high: 1, medium: 2, low: 3 };
const queue = codes
  .map(c => ({ id: c.id, code: c.code, brand: c.brand, appliance: c.appliance,
               severity: c.severity, verified: dates[c.id] ?? '2026-06-10' }))
  .sort((a, b) => a.verified.localeCompare(b.verified) || sevRank[a.severity] - sevRank[b.severity])
  .slice(0, limit);

const weeksOld = d => Math.floor((Date.now() - new Date(d)) / (7 * 864e5));

if (markdown) {
  console.log(`## Freshness review queue — ${limit} stalest pages\n`);
  console.log('Re-verify each page against manufacturer documentation, then stamp:');
  console.log('```\nnode scripts/freshness-review.mjs --apply <id> <id> …\n```\n');
  console.log('| Verified | Age | Severity | Page |');
  console.log('|---|---|---|---|');
  for (const q of queue) {
    const slug = q.code.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    console.log(`| ${q.verified} | ${weeksOld(q.verified)}w | ${q.severity} | [${q.id}](https://applianceerrors.com/brands/${q.brand}/${q.appliance}/${slug}/) |`);
  }
} else {
  console.log(`Freshness review queue — ${limit} stalest pages (re-verify if >6 weeks):\n`);
  for (const q of queue) {
    console.log(`  ${q.verified} (${String(weeksOld(q.verified)).padStart(2)}w)  [${q.severity.padEnd(8)}]  ${q.id}`);
  }
  console.log(`\nAfter re-verifying content against manufacturer docs:\n  node scripts/freshness-review.mjs --apply <id> <id> …`);
}
