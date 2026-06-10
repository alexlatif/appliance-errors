import type { APIRoute } from 'astro';
import { errorCodes, getBrand, getApplianceType, slugifyCode } from '../utils/data';

export const GET: APIRoute = () => {
  const index = errorCodes.map(c => {
    const brand = getBrand(c.brand);
    const app = getApplianceType(c.appliance);
    return {
      b: brand?.name ?? c.brand,
      bs: c.brand,
      a: app?.name ?? c.appliance,
      as: c.appliance,
      c: c.code,
      m: c.meaning,
      sev: c.severity,
      u: `/brands/${c.brand}/${c.appliance}/${slugifyCode(c.code)}/`,
    };
  });

  return new Response(JSON.stringify(index), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
