#!/usr/bin/env node
/**
 * Content uniqueness audit for appliance error-code pages.
 *
 * Measures the code-specific text available to each generated error page,
 * excluding shared layout/navigation/ads/boilerplate. This is the guardrail
 * for Google's people-first / scaled-content guidance: pages should not look
 * large only because the template is large.
 *
 * Usage:
 *   node scripts/content-uniqueness.mjs
 *   node scripts/content-uniqueness.mjs --json
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const DATA_PATH = join(ROOT, 'src/data/error-codes.json');
const OUT_PATH = join(ROOT, 'uniqueness-report.json');
const data = JSON.parse(readFileSync(DATA_PATH, 'utf8'));
const codes = data.error_codes ?? [];
const brands = new Map((data.brands ?? []).map((b) => [b.slug, b]));
const appliances = new Map((data.appliance_types ?? []).map((a) => [a.slug, a]));

const args = new Set(process.argv.slice(2));
const jsonOnly = args.has('--json');

function text(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

function words(value) {
  return text(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/[^\p{L}\p{N}$–-]+/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function uniqueWordCount(value) {
  return words(value).length;
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(p * (sorted.length - 1))];
}

function distribution(values) {
  if (!values.length) return { min: 0, p25: 0, median: 0, p75: 0, max: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  return {
    min: sorted[0],
    p25: percentile(sorted, 0.25),
    median: percentile(sorted, 0.5),
    p75: percentile(sorted, 0.75),
    max: sorted[sorted.length - 1],
  };
}

function duplicateStats(values) {
  const counts = new Map();
  for (const value of values) {
    const key = text(value).trim().toLowerCase();
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let duplicateRows = 0;
  let duplicateGroups = 0;
  for (const count of counts.values()) {
    if (count > 1) {
      duplicateRows += count;
      duplicateGroups += 1;
    }
  }
  return { distinct: counts.size, duplicateRows, duplicateGroups };
}

function codeSpecificText(code) {
  const causes = (code.causes ?? [])
    .map((cause) => `${cause.description ?? ''} ${cause.frequency ? `${cause.frequency}% of cases` : ''}`)
    .join(' ');
  const fixes = (code.fixes ?? [])
    .map((fix) => `${fix.title ?? ''}. ${fix.description ?? ''} ${(fix.parts ?? []).join(' ')} ${fix.warning ?? ''}`)
    .join(' ');
  const brand = brands.get(code.brand)?.name ?? code.brand;
  const appliance = appliances.get(code.appliance)?.name ?? code.appliance;

  return [
    brand,
    appliance,
    code.code,
    code.aliases?.join(' '),
    code.meaning,
    code.detail,
    code.category?.replaceAll('_', ' '),
    code.severity,
    code.diy_difficulty,
    causes,
    fixes,
    code.reset_instructions,
    code.when_to_call_pro,
    code.models_affected,
    code.real_world_notes,
    `DIY cost ${code.cost_lo} ${code.cost_hi}`,
    `professional repair cost ${code.pro_cost_lo} ${code.pro_cost_hi}`,
  ].join(' ');
}

const rows = codes.map((code) => {
  const brand = brands.get(code.brand)?.name ?? code.brand;
  const appliance = appliances.get(code.appliance)?.name ?? code.appliance;
  const uniqueWords = uniqueWordCount(codeSpecificText(code));
  return {
    id: code.id,
    url: `/brands/${code.brand}/${code.appliance}/${String(code.code).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}/`,
    brand,
    appliance,
    code: code.code,
    category: code.category,
    severity: code.severity,
    uniqueWords,
    hasModelsAffected: Boolean(code.models_affected),
    fieldLengths: {
      meaning: uniqueWordCount(code.meaning),
      detail: uniqueWordCount(code.detail),
      reset: uniqueWordCount(code.reset_instructions),
      pro: uniqueWordCount(code.when_to_call_pro),
      causes: uniqueWordCount((code.causes ?? []).map((c) => c.description).join(' ')),
      fixes: uniqueWordCount((code.fixes ?? []).map((f) => `${f.title}. ${f.description}`).join(' ')),
    },
  };
});

const uniqueCounts = rows.map((row) => row.uniqueWords);
const report = {
  generatedAt: new Date().toISOString(),
  totalCodes: rows.length,
  uniqueWords: distribution(uniqueCounts),
  thresholds: {
    lt120: rows.filter((row) => row.uniqueWords < 120).length,
    lt180: rows.filter((row) => row.uniqueWords < 180).length,
    lt280: rows.filter((row) => row.uniqueWords < 280).length,
  },
  fieldDuplication: {
    meaning: duplicateStats(codes.map((c) => c.meaning)),
    detail: duplicateStats(codes.map((c) => c.detail)),
    reset: duplicateStats(codes.map((c) => c.reset_instructions)),
    whenToCallPro: duplicateStats(codes.map((c) => c.when_to_call_pro)),
    causesJoined: duplicateStats(codes.map((c) => (c.causes ?? []).map((x) => x.description).join('|'))),
    fixesJoined: duplicateStats(codes.map((c) => (c.fixes ?? []).map((x) => `${x.title}|${x.description}`).join('|'))),
  },
  modelsAffected: {
    present: rows.filter((row) => row.hasModelsAffected).length,
    missing: rows.filter((row) => !row.hasModelsAffected).length,
  },
  thinnest: [...rows].sort((a, b) => a.uniqueWords - b.uniqueWords).slice(0, 50),
};

writeFileSync(OUT_PATH, `${JSON.stringify(report, null, 2)}\n`);

if (jsonOnly) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log('Content uniqueness audit');
  console.log('========================');
  console.log(`Codes: ${report.totalCodes}`);
  console.log(`Unique words/page: min ${report.uniqueWords.min}, p25 ${report.uniqueWords.p25}, median ${report.uniqueWords.median}, p75 ${report.uniqueWords.p75}, max ${report.uniqueWords.max}`);
  console.log(`Thin pages: <120=${report.thresholds.lt120}, <180=${report.thresholds.lt180}, <280=${report.thresholds.lt280}`);
  console.log(`models_affected: present=${report.modelsAffected.present}, missing=${report.modelsAffected.missing}`);
  console.log(`Report written: ${OUT_PATH}`);
  console.log('\nThinnest 10 pages:');
  for (const row of report.thinnest.slice(0, 10)) {
    console.log(`- ${row.uniqueWords.toString().padStart(3)} words  ${row.url}  ${row.brand} ${row.appliance} ${row.code}`);
  }
}
