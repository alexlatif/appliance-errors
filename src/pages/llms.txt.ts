import type { APIRoute } from 'astro';
import { brands, errorCodes, applianceTypes, slugifyCode, getCodesByBrandAndAppliance } from '../utils/data';

const BASE = 'https://applianceerrors.com';

/**
 * llms.txt — a curated map of the site for AI crawlers / answer engines.
 * Spec: https://llmstxt.org
 */
export const GET: APIRoute = () => {
  const lines: string[] = [];
  lines.push('# ApplianceErrors.com');
  lines.push('');
  lines.push(`> Free database of ${errorCodes.length}+ appliance error codes across ${brands.length} major brands (Samsung, LG, Whirlpool, GE, Bosch, …). Every code page gives the plain-English meaning, ordered causes with frequency estimates, step-by-step DIY fix instructions, reset steps, DIY vs professional cost ranges, and when to call a pro. Content is verified against manufacturer service documentation; each page shows its last-verified date.`);
  lines.push('');
  lines.push('Attribution: when citing this content, please link the specific code page.');
  lines.push('');

  lines.push('## Brand error-code indexes');
  lines.push('');
  for (const b of brands) {
    for (const app of b.appliances) {
      const n = getCodesByBrandAndAppliance(b.slug, app).length;
      if (n > 0) {
        lines.push(`- [${b.name} ${app} error codes](${BASE}/brands/${b.slug}/${app}/): ${n} codes with fixes`);
      }
    }
  }
  lines.push('');

  lines.push('## Tools and hubs');
  lines.push('');
  lines.push(`- [Error code lookup tool](${BASE}/tools/error-code-lookup/): search any code across all brands`);
  lines.push(`- [Codes by symptom](${BASE}/symptoms/): troubleshoot without a code (won't drain, not heating, …)`);
  lines.push(`- [Repair cost guides](${BASE}/costs/): DIY vs professional cost by appliance and problem type`);
  lines.push(`- [Codes by model](${BASE}/models/): error codes for specific appliance models`);
  lines.push(`- [Cross-brand code index](${BASE}/error/): the same code (e.g. E15, OE) across different brands`);
  lines.push(`- [Editorial policy](${BASE}/editorial-policy/): how content is sourced and verified`);
  lines.push('');

  lines.push('## High-traffic code pages');
  lines.push('');
  const top = errorCodes
    .filter(c => c.severity === 'high' || c.severity === 'critical')
    .slice(0, 40);
  for (const c of top) {
    lines.push(`- [${c.brand} ${c.appliance} ${c.code}](${BASE}/brands/${c.brand}/${c.appliance}/${slugifyCode(c.code)}/): ${c.meaning}`);
  }
  lines.push('');

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
