import type { SiteData, Brand, ApplianceType, ErrorCode } from './types';
import rawData from '../data/error-codes.json';

const data = rawData as SiteData;

export const brands: Brand[] = data.brands;
export const applianceTypes: ApplianceType[] = data.appliance_types;
export const errorCodes: ErrorCode[] = data.error_codes;

export function getBrand(slug: string): Brand | undefined {
  return brands.find(b => b.slug === slug);
}

export function getApplianceType(slug: string): ApplianceType | undefined {
  return applianceTypes.find(a => a.slug === slug);
}

export function getCodesByBrand(brand: string): ErrorCode[] {
  return errorCodes.filter(c => c.brand === brand);
}

export function getCodesByBrandAndAppliance(brand: string, appliance: string): ErrorCode[] {
  return errorCodes.filter(c => c.brand === brand && c.appliance === appliance);
}

export function getCode(brand: string, appliance: string, code: string): ErrorCode | undefined {
  const normalizedCode = code.toUpperCase().replace(/-/g, '');
  return errorCodes.find(c =>
    c.brand === brand &&
    c.appliance === appliance &&
    (c.code.toUpperCase().replace(/-/g, '') === normalizedCode ||
     c.aliases.some(a => a.toUpperCase().replace(/-/g, '') === normalizedCode))
  );
}

export function getRelatedCodes(errorCode: ErrorCode): ErrorCode[] {
  return errorCode.related_codes
    .map(rc => errorCodes.find(c =>
      c.brand === errorCode.brand &&
      c.appliance === errorCode.appliance &&
      (c.code === rc || c.aliases.includes(rc))
    ))
    .filter((c): c is ErrorCode => c !== undefined);
}

export function getCrossBrandCodes(code: string, excludeBrand: string): ErrorCode[] {
  const normalized = code.toUpperCase().replace(/[-\s]/g, '');
  return errorCodes.filter(c =>
    c.brand !== excludeBrand &&
    (c.code.toUpperCase().replace(/[-\s]/g, '') === normalized ||
     c.aliases.some(a => a.toUpperCase().replace(/[-\s]/g, '') === normalized))
  );
}

// Also keep old name as alias
export function getCrosseBrandCodes(code: string): ErrorCode[] {
  const normalized = code.toUpperCase().replace(/-/g, '');
  return errorCodes.filter(c =>
    c.code.toUpperCase().replace(/-/g, '') === normalized ||
    c.aliases.some(a => a.toUpperCase().replace(/-/g, '') === normalized)
  );
}

export function getCodesByAppliance(appliance: string): ErrorCode[] {
  return errorCodes.filter(c => c.appliance === appliance);
}

export function getTopCodesByAppliance(appliance: string, limit = 12): ErrorCode[] {
  const high = errorCodes.filter(c => c.appliance === appliance && (c.severity === 'high' || c.severity === 'critical'));
  const medium = errorCodes.filter(c => c.appliance === appliance && c.severity === 'medium');
  return [...high, ...medium].slice(0, limit);
}

export function getBrandAppliances(brand: string): string[] {
  return [...new Set(errorCodes.filter(c => c.brand === brand).map(c => c.appliance))];
}

export function getTopCodesForBrand(brand: string, limit = 8): ErrorCode[] {
  const high = errorCodes.filter(c => c.brand === brand && (c.severity === 'high' || c.severity === 'critical'));
  const medium = errorCodes.filter(c => c.brand === brand && c.severity === 'medium');
  return [...high, ...medium].slice(0, limit);
}

export function severityLabel(s: string): string {
  return { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' }[s] ?? s;
}

export function difficultyLabel(d: string): string {
  return { easy: 'Easy DIY', moderate: 'Moderate DIY', hard: 'Advanced DIY', pro_only: 'Call a Pro' }[d] ?? d;
}

export function slugifyCode(code: string): string {
  return code.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export function totalCodeCount(): number {
  return errorCodes.length;
}
