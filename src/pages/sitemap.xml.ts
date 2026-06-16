import type { APIRoute } from 'astro';
import { brands, errorCodes, applianceTypes, slugifyCode, getCodesByBrand, getCodesByBrandAndAppliance } from '../utils/data';
import { verifiedDate, latestVerified } from '../utils/freshness';
import { focus } from '../utils/focus';
import modelsData from '../data/models.json';
import proceduresData from '../data/procedures.json';
import symptomsData from '../data/symptoms.json';

const BASE = 'https://applianceerrors.com';
const SITE_LAUNCH = '2026-06-10';

function url(loc: string, priority: number, lastmod: string, freq = 'monthly'): string {
  return `  <url>
    <loc>${BASE}${loc}</loc>
    <changefreq>${freq}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
    <lastmod>${lastmod}</lastmod>
  </url>`;
}

export const GET: APIRoute = () => {
  const urls: string[] = [];
  const siteLatest = latestVerified(errorCodes);

  // Homepage + static pages
  urls.push(url('/', 1.0, siteLatest, 'weekly'));
  urls.push(url('/about/', 0.4, SITE_LAUNCH, 'yearly'));
  urls.push(url('/editorial-policy/', 0.4, siteLatest, 'yearly'));
  urls.push(url('/contact/', 0.3, SITE_LAUNCH, 'yearly'));
  urls.push(url('/privacy/', 0.3, SITE_LAUNCH, 'yearly'));
  urls.push(url('/terms/', 0.3, SITE_LAUNCH, 'yearly'));
  urls.push(url('/tools/error-code-lookup/', 0.8, siteLatest, 'weekly'));

  // Brand index
  urls.push(url('/brands/', 0.9, siteLatest, 'weekly'));

  // Appliance type index pages
  for (const at of applianceTypes) {
    const codes = errorCodes.filter(c => c.appliance === at.slug);
    urls.push(url(`/appliances/${at.slug}/`, 0.8, codes.length ? latestVerified(codes) : SITE_LAUNCH));
  }

  // Brand hubs + brand × appliance hubs — focus-tier brands only (long-tail
  // brands stay indexable but are kept out of the sitemap to concentrate crawl).
  for (const brand of brands) {
    if (focus.isBrandSitemapExcluded(brand.slug)) continue;
    const brandCodes = getCodesByBrand(brand.slug);
    urls.push(url(`/brands/${brand.slug}/`, 0.8, brandCodes.length ? latestVerified(brandCodes) : SITE_LAUNCH));
    for (const app of brand.appliances) {
      const appCodes = getCodesByBrandAndAppliance(brand.slug, app);
      urls.push(url(`/brands/${brand.slug}/${app}/`, 0.7, appCodes.length ? latestVerified(appCodes) : SITE_LAUNCH));
    }
  }

  // Individual error code pages — skip noindexed (consolidate) + long-tail brands;
  // boost A_INVEST (proven demand) to top priority.
  for (const ec of errorCodes) {
    if (focus.isPageNoindex(ec.id) || focus.isBrandSitemapExcluded(ec.brand)) continue;
    const slug = slugifyCode(ec.code);
    urls.push(url(`/brands/${ec.brand}/${ec.appliance}/${slug}/`, focus.isInvest(ec.id) ? 1.0 : 0.9, verifiedDate(ec)));
  }

  // Cross-brand disambiguation pages (codes spanning 2+ brand/appliance combos)
  const groups = new Map<string, typeof errorCodes>();
  for (const c of errorCodes) {
    const key = c.code.toUpperCase().replace(/[-\s]/g, '');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(c);
  }
  const crossBrandKeys = [...groups.entries()].filter(([, cs]) => cs.length >= 2);
  if (crossBrandKeys.length > 0) {
    urls.push(url('/error/', 0.8, siteLatest, 'weekly'));
    for (const [key, cs] of crossBrandKeys) {
      urls.push(url(`/error/${key.toLowerCase()}/`, 0.7, latestVerified(cs)));
    }
  }

  // Model pages — excluded from sitemap when the family is noindexed (crawl drain).
  const models = (modelsData as { models: { slug: string; brand: string; appliance: string }[] }).models;
  if (models.length > 0 && !focus.modelsNoindex()) {
    urls.push(url('/models/', 0.7, siteLatest, 'weekly'));
    for (const m of models) {
      const codes = getCodesByBrandAndAppliance(m.brand, m.appliance);
      urls.push(url(`/models/${m.brand}/${m.slug}/`, 0.7, codes.length ? latestVerified(codes) : SITE_LAUNCH));
    }
  }

  // Diagnostic-mode + reset procedure pages
  const procedures = (proceduresData as { procedures: { brand: string; appliance: string }[] }).procedures;
  for (const p of procedures) {
    if (focus.isBrandSitemapExcluded(p.brand)) continue;
    const codes = getCodesByBrandAndAppliance(p.brand, p.appliance);
    const lastmod = codes.length ? latestVerified(codes) : SITE_LAUNCH;
    urls.push(url(`/brands/${p.brand}/${p.appliance}/diagnostic-mode/`, 0.7, lastmod));
    urls.push(url(`/brands/${p.brand}/${p.appliance}/reset/`, 0.7, lastmod));
  }

  // Symptom pages
  const symptoms = (symptomsData as { symptoms: { slug: string; appliance: string }[] }).symptoms;
  if (symptoms.length > 0) {
    urls.push(url('/symptoms/', 0.8, siteLatest, 'weekly'));
    for (const s of symptoms) {
      const codes = errorCodes.filter(c => c.appliance === s.appliance);
      urls.push(url(`/symptoms/${s.appliance}/${s.slug}/`, 0.8, codes.length ? latestVerified(codes) : SITE_LAUNCH));
    }
  }

  // Repair cost guides (appliances with >= 30 codes)
  const costCounts = new Map<string, number>();
  for (const c of errorCodes) costCounts.set(c.appliance, (costCounts.get(c.appliance) ?? 0) + 1);
  const costApps = [...costCounts.entries()].filter(([, n]) => n >= 30).map(([a]) => a);
  if (costApps.length > 0) {
    urls.push(url('/costs/', 0.7, siteLatest, 'monthly'));
    for (const a of costApps) {
      const codes = errorCodes.filter(c => c.appliance === a);
      urls.push(url(`/costs/${a}/`, 0.7, latestVerified(codes)));
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
