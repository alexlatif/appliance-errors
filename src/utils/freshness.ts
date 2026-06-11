import rawDates from '../data/verified-dates.json';
import type { ErrorCode } from './types';

const dates = rawDates as Record<string, string>;
const FALLBACK = '2026-06-10';

/** ISO date this code's content was last authored/verified. */
export function verifiedDate(code: ErrorCode | string): string {
  const id = typeof code === 'string' ? code : code.id;
  return dates[id] ?? FALLBACK;
}

/** Human-readable form: "June 11, 2026" */
export function verifiedDateHuman(code: ErrorCode | string): string {
  return new Date(verifiedDate(code) + 'T00:00:00Z').toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  });
}

/** Most recent verified date among a set of codes (for hub-page lastmod). */
export function latestVerified(codes: ErrorCode[]): string {
  let max = FALLBACK;
  for (const c of codes) {
    const d = verifiedDate(c);
    if (d > max) max = d;
  }
  return max;
}
