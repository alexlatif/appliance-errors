import type { APIRoute } from 'astro';
import { brands, errorCodes, applianceTypes, slugifyCode } from '../utils/data';

const BASE = 'https://applianceerrors.com';

function url(loc: string, priority: number, freq = 'monthly'): string {
  return `  <url>
    <loc>${BASE}${loc}</loc>
    <changefreq>${freq}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>`;
}

export const GET: APIRoute = () => {
  const urls: string[] = [];

  // Homepage
  urls.push(url('/', 1.0, 'weekly'));

  // Brand index
  urls.push(url('/brands/', 0.9, 'weekly'));

  // Appliance type index pages
  for (const at of applianceTypes) {
    urls.push(url(`/appliances/${at.slug}/`, 0.8));
  }

  // Brand hubs
  for (const brand of brands) {
    urls.push(url(`/brands/${brand.slug}/`, 0.8));

    // Brand × appliance hubs
    for (const app of brand.appliances) {
      urls.push(url(`/brands/${brand.slug}/${app}/`, 0.7));
    }
  }

  // Individual error code pages (highest SEO value)
  for (const ec of errorCodes) {
    const slug = slugifyCode(ec.code);
    urls.push(url(`/brands/${ec.brand}/${ec.appliance}/${slug}/`, 0.9, 'monthly'));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
