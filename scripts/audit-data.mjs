#!/usr/bin/env node
// Data-integrity audit (repo-local copy — runs in CI as a deploy gate).
// Checks: structural integrity, dangling references, cost sanity, duplicates,
// content quality thresholds, symptom/category coverage, model code coverage.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '../src/data');
const { error_codes: codes, brands, appliance_types } = JSON.parse(readFileSync(join(DATA, 'error-codes.json'), 'utf8'));
const { models } = JSON.parse(readFileSync(join(DATA, 'models.json'), 'utf8'));
const { symptoms } = JSON.parse(readFileSync(join(DATA, 'symptoms.json'), 'utf8'));
const { procedures } = JSON.parse(readFileSync(join(DATA, 'procedures.json'), 'utf8'));

const issues = { error: [], warn: [] };
const err = (m) => issues.error.push(m);
const warn = (m) => issues.warn.push(m);
const norm = (s) => s.toUpperCase().replace(/[-\s]/g, '');

const brandSlugs = new Set(brands.map(b => b.slug));
const typeSlugs = new Set(appliance_types.map(a => a.slug));

const seenIds = new Set();
for (const c of codes) {
  const tag = c.id;
  if (seenIds.has(c.id)) err(`duplicate id: ${c.id}`);
  seenIds.add(c.id);
  if (!brandSlugs.has(c.brand)) err(`${tag}: unknown brand '${c.brand}'`);
  if (!typeSlugs.has(c.appliance)) err(`${tag}: unknown appliance '${c.appliance}'`);
  if (!c.meaning || c.meaning.length < 10) err(`${tag}: meaning too short`);
  if (!c.detail || c.detail.length < 80) warn(`${tag}: detail thin (${c.detail?.length ?? 0} chars)`);
  if (!Array.isArray(c.causes) || c.causes.length < 2) warn(`${tag}: <2 causes`);
  if (!Array.isArray(c.fixes) || c.fixes.length < 2) warn(`${tag}: <2 fix steps`);
  if (!c.reset_instructions || c.reset_instructions.length < 30) warn(`${tag}: reset_instructions thin`);
  if (!c.when_to_call_pro || c.when_to_call_pro.length < 30) warn(`${tag}: when_to_call_pro thin`);

  if (Array.isArray(c.causes) && c.causes.length >= 2) {
    const sum = c.causes.reduce((a, x) => a + (x.frequency ?? 0), 0);
    if (sum < 80 || sum > 120) warn(`${tag}: cause frequencies sum to ${sum}%`);
  }

  if (c.cost_lo > c.cost_hi) err(`${tag}: cost_lo > cost_hi`);
  if (c.pro_cost_lo > c.pro_cost_hi) err(`${tag}: pro_cost_lo > pro_cost_hi`);
  if (c.cost_hi > 1500 || c.pro_cost_hi > 3000) warn(`${tag}: suspiciously high cost (${c.cost_hi}/${c.pro_cost_hi})`);

  for (const rc of c.related_codes ?? []) {
    const hit = codes.find(x => x.brand === c.brand && x.appliance === c.appliance &&
      (norm(x.code) === norm(rc) || x.aliases.some(a => norm(a) === norm(rc))));
    if (!hit) warn(`${tag}: related_code '${rc}' not found in ${c.brand}/${c.appliance}`);
  }
  for (const a of c.aliases ?? []) {
    if (norm(a) === norm(c.code)) warn(`${tag}: alias '${a}' identical to code`);
  }
  if (!['low','medium','high','critical'].includes(c.severity)) err(`${tag}: bad severity '${c.severity}'`);
  if (!['easy','moderate','hard','pro_only'].includes(c.diy_difficulty)) err(`${tag}: bad difficulty '${c.diy_difficulty}'`);
}

const codeKey = new Map();
for (const c of codes) {
  const k = `${c.brand}/${c.appliance}/${norm(c.code)}`;
  if (codeKey.has(k)) err(`duplicate code ${c.code} in ${c.brand}/${c.appliance} (${codeKey.get(k)} vs ${c.id})`);
  codeKey.set(k, c.id);
}
for (const c of codes) {
  for (const a of c.aliases ?? []) {
    const k = `${c.brand}/${c.appliance}/${norm(a)}`;
    if (codeKey.has(k) && codeKey.get(k) !== c.id) warn(`${c.id}: alias '${a}' collides with code ${codeKey.get(k)}`);
  }
}

for (const m of models) {
  if (!brandSlugs.has(m.brand)) err(`model ${m.slug}: unknown brand`);
  const pool = codes.filter(c => c.brand === m.brand && c.appliance === m.appliance);
  if (pool.length === 0) { err(`model ${m.slug}: no codes exist for ${m.brand}/${m.appliance}`); continue; }
  const matched = m.common_codes.filter(cc => pool.some(c => norm(c.code) === norm(cc) || c.aliases.some(a => norm(a) === norm(cc))));
  const missed = m.common_codes.filter(cc => !matched.includes(cc));
  if (m.common_codes.length > 0 && matched.length === 0) err(`model ${m.slug}: zero common_codes resolve`);
  else if (missed.length > 0) warn(`model ${m.slug}: unresolved common_codes: ${missed.join(', ')}`);
}

const catByApp = new Map();
for (const c of codes) {
  if (!catByApp.has(c.appliance)) catByApp.set(c.appliance, new Set());
  catByApp.get(c.appliance).add(c.category);
}
for (const s of symptoms) {
  const avail = catByApp.get(s.appliance) ?? new Set();
  const dead = s.categories.filter(cat => !avail.has(cat));
  if (dead.length === s.categories.length) err(`symptom ${s.slug}: NO categories match any codes`);
  else if (dead.length > 0) warn(`symptom ${s.slug}: unused categories: ${dead.join(', ')}`);
  const n = codes.filter(c => c.appliance === s.appliance && s.categories.includes(c.category)).length;
  if (n < 4) warn(`symptom ${s.slug}: only ${n} matching codes (thin page risk)`);
}

for (const p of procedures) {
  const n = codes.filter(c => c.brand === p.brand && c.appliance === p.appliance).length;
  if (n === 0) err(`procedure ${p.brand}/${p.appliance}: no codes exist`);
  else if (n < 3) warn(`procedure ${p.brand}/${p.appliance}: only ${n} codes`);
}

console.log(`codes=${codes.length} models=${models.length} symptoms=${symptoms.length} procedures=${procedures.length}`);
console.log(`\nERRORS (${issues.error.length}):`);
for (const e of issues.error) console.log('  ✗ ' + e);
console.log(`\nWARNINGS (${issues.warn.length}):`);
for (const w of issues.warn) console.log('  ⚠ ' + w);
// CI gate: errors always fail; warnings fail only with --strict
const strict = process.argv.includes('--strict');
process.exit(issues.error.length > 0 || (strict && issues.warn.length > 0) ? 1 : 0);
