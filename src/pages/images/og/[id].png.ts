import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { errorCodes, getBrand, getApplianceType } from '../../../utils/data';

/**
 * Per-code Open Graph image (1200×630 PNG) for social cards.
 * Built at compile time from the code data; rasterized via sharp.
 * Social platforms don't render SVG og:images, so we emit real PNGs.
 */
export function getStaticPaths() {
  return errorCodes.map(c => ({ params: { id: c.id }, props: { code: c } }));
}

const esc = (s: string) =>
  (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Greedy word-wrap to <= maxChars per line, capped at maxLines.
function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars) {
      if (cur) lines.push(cur);
      cur = w;
      if (lines.length === maxLines - 1) break;
    } else {
      cur = (cur + ' ' + w).trim();
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  let out = lines.slice(0, maxLines);
  // ellipsis if truncated
  const used = out.join(' ').length;
  if (used < text.length && out.length) out[out.length - 1] = out[out.length - 1].replace(/[.,;:]?$/, '') + '…';
  return out;
}

const SEV: Record<string, { c: string; label: string }> = {
  low: { c: '#16a34a', label: 'LOW SEVERITY' },
  medium: { c: '#ca8a04', label: 'MEDIUM SEVERITY' },
  high: { c: '#dc2626', label: 'HIGH SEVERITY' },
  critical: { c: '#7f1d1d', label: 'CRITICAL' },
};

export const GET: APIRoute = async ({ props }) => {
  const code = (props as { code: typeof errorCodes[0] }).code;
  const brand = getBrand(code.brand);
  const appType = getApplianceType(code.appliance);
  const brandColor = brand?.logo_color || '#1d4ed8';
  const label = `${brand?.name ?? code.brand} ${appType?.name ?? code.appliance}`;
  const sev = SEV[code.severity] ?? SEV.medium;
  const display = esc(code.code);
  const codeFont = display.length <= 3 ? 110 : display.length <= 5 ? 84 : display.length <= 8 ? 58 : 42;
  const meaningLines = wrap(code.meaning, 38, 3);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#ffffff"/>
  <rect width="1200" height="14" y="0" fill="${brandColor}"/>
  <!-- brand/appliance eyebrow -->
  <text x="64" y="108" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" fill="${brandColor}" letter-spacing="1">${esc(label.toUpperCase())}</text>
  <text x="64" y="150" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="#6b7280">Error Code</text>
  <!-- display panel with the code -->
  <rect x="64" y="178" width="420" height="220" rx="18" fill="#0a0f0a" stroke="#111827" stroke-width="4"/>
  <text x="274" y="${300 + codeFont / 3}" text-anchor="middle" font-family="'Courier New', monospace" font-size="${codeFont}" font-weight="bold" fill="#ef4444" letter-spacing="4">${display}</text>
  <!-- severity chip -->
  <rect x="534" y="200" width="${sev.label.length * 15 + 44}" height="48" rx="24" fill="${sev.c}"/>
  <text x="${534 + 22}" y="232" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" fill="#ffffff">${esc(sev.label)}</text>
  <!-- meaning -->
  ${meaningLines.map((ln, i) => `<text x="534" y="${300 + i * 46}" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="600" fill="#111827">${esc(ln)}</text>`).join('\n  ')}
  <!-- footer -->
  <rect x="0" y="556" width="1200" height="74" fill="#f3f4f6"/>
  <text x="64" y="602" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700" fill="#111827">ApplianceErrors.com</text>
  <text x="1136" y="602" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="#6b7280">Causes · Fixes · Cost</text>
</svg>`;

  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return new Response(png, {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' },
  });
};
