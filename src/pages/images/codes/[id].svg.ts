import type { APIRoute } from 'astro';
import { errorCodes, getBrand, getApplianceType } from '../../../utils/data';

/**
 * Per-code display-panel SVG: a stylized appliance LED display showing the error code.
 * Used as the on-page illustration (image SEO) and referenced from Article schema.
 */
export function getStaticPaths() {
  return errorCodes.map(c => ({ params: { id: c.id }, props: { code: c } }));
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: APIRoute = ({ props }) => {
  const code = (props as { code: typeof errorCodes[0] }).code;
  const brand = getBrand(code.brand);
  const appType = getApplianceType(code.appliance);
  const label = `${brand?.name ?? code.brand} ${appType?.name ?? code.appliance}`;
  const display = esc(code.code);
  // scale display font for long codes
  const fontSize = display.length <= 3 ? 120 : display.length <= 5 ? 88 : display.length <= 8 ? 60 : 42;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450" role="img" aria-label="${esc(label)} error code ${display} on display panel">
  <title>${esc(label)} error code ${display}</title>
  <rect width="800" height="450" rx="24" fill="#f3f4f6"/>
  <!-- appliance control panel -->
  <rect x="60" y="60" width="680" height="330" rx="20" fill="#1f2937"/>
  <rect x="60" y="60" width="680" height="330" rx="20" fill="none" stroke="#374151" stroke-width="3"/>
  <!-- brand label -->
  <text x="400" y="118" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="26" font-weight="600" fill="#9ca3af" letter-spacing="4">${esc(label.toUpperCase())}</text>
  <!-- LED display window -->
  <rect x="200" y="150" width="400" height="160" rx="12" fill="#0a0f0a" stroke="#111827" stroke-width="4"/>
  <text x="400" y="${230 + fontSize / 3}" text-anchor="middle" font-family="'Courier New', monospace" font-size="${fontSize}" font-weight="bold" fill="#ef4444" letter-spacing="6">${display}</text>
  <!-- indicator dots -->
  <circle cx="240" cy="350" r="7" fill="#ef4444"/>
  <circle cx="270" cy="350" r="7" fill="#374151"/>
  <circle cx="300" cy="350" r="7" fill="#374151"/>
  <text x="560" y="356" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="18" fill="#6b7280">applianceerrors.com</text>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
