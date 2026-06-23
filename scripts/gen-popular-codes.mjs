#!/usr/bin/env node
/**
 * gen-popular-codes — emit src/data/popular-codes.json from the demand core.
 *
 * Surfaces the highest-VOLUME A_INVEST focus-brand pages on the homepage +
 * brand hubs so the site's most authoritative internal links funnel equity
 * into the demand-core pages that are currently stuck "discovered – not
 * indexed" (the 2026-06-22 indexing-throttle finding). Regenerate after each
 * composition pass:  node appliance-site/scripts/gen-popular-codes.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const reportPath = join(here, '..', '..', 'scripts', 'composition-report.json');
const codesPath = join(here, '..', 'src', 'data', 'error-codes.json');
const outPath = join(here, '..', 'src', 'data', 'popular-codes.json');

const FOCUS = ['lg', 'samsung', 'bosch', 'whirlpool'];
const APP = { washer: 'Washer', dryer: 'Dryer', dishwasher: 'Dishwasher', refrigerator: 'Fridge', oven: 'Oven', microwave: 'Microwave', 'air-conditioner': 'AC' };
const BR = { lg: 'LG', samsung: 'Samsung', bosch: 'Bosch', whirlpool: 'Whirlpool' };
const TOP_N = Number(process.argv[2] ?? 12);

const report = JSON.parse(readFileSync(reportPath, 'utf8'));
const codes = new Map(JSON.parse(readFileSync(codesPath, 'utf8')).error_codes.map((c) => [c.id, c]));

const rows = (report.rows ?? [])
  .filter((x) => x.tier === 'A_INVEST' && FOCUS.includes(x.brand))
  .sort((a, b) => b.volume - a.volume)
  .slice(0, TOP_N)
  .map((x) => {
    const c = codes.get(x.id);
    const codeStr = (c && c.code) || x.code || '';
    const slug = codeStr.toLowerCase().replace(/\s+/g, '-');
    return {
      brand: x.brand,
      appliance: x.appliance,
      code: slug,
      label: `${BR[x.brand]} ${APP[x.appliance]} ${codeStr.toUpperCase()}`,
      desc: ((c && c.meaning) || '').slice(0, 60),
      volume: x.volume,
    };
  });

writeFileSync(outPath, JSON.stringify(rows, null, 2) + '\n');
console.log(`wrote ${rows.length} popular codes → ${outPath} (top vol ${rows[0]?.volume}/mo)`);
