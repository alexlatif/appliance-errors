/** Official manufacturer support/service portals — cited on every code page (E-E-A-T). */
export const BRAND_SOURCES: Record<string, { name: string; url: string }[]> = {
  samsung: [{ name: 'Samsung Support — Error Codes', url: 'https://www.samsung.com/us/support/' }],
  lg: [{ name: 'LG Support — Help Library', url: 'https://www.lg.com/us/support' }],
  whirlpool: [{ name: 'Whirlpool Product Help', url: 'https://producthelp.whirlpool.com/' }],
  ge: [{ name: 'GE Appliances Support', url: 'https://www.geappliances.com/ge/service-and-support/' }],
  bosch: [{ name: 'Bosch Home Appliances Service', url: 'https://www.bosch-home.com/us/service' }],
  kitchenaid: [{ name: 'KitchenAid Product Help', url: 'https://producthelp.kitchenaid.com/' }],
  frigidaire: [{ name: 'Frigidaire Support', url: 'https://www.frigidaire.com/Support/' }],
  maytag: [{ name: 'Maytag Product Help', url: 'https://producthelp.maytag.com/' }],
  kenmore: [{ name: 'Kenmore Customer Care', url: 'https://www.kenmore.com/pages/customer-care' }],
  electrolux: [{ name: 'Electrolux Support', url: 'https://www.electroluxappliances.com/support/' }],
  miele: [{ name: 'Miele Customer Support', url: 'https://www.mieleusa.com/domestic/customer-support-385.htm' }],
  speedqueen: [{ name: 'Speed Queen Support', url: 'https://speedqueen.com/support/' }],
  amana: [{ name: 'Amana Product Help', url: 'https://producthelp.amana.com/' }],
  'fisher-paykel': [{ name: 'Fisher & Paykel Support', url: 'https://www.fisherpaykel.com/us/support.html' }],
  broan: [{ name: 'Broan-NuTone Support', url: 'https://www.broan-nutone.com/en-us/support' }],
  haier: [{ name: 'Haier Appliances Support', url: 'https://www.haierappliances.com/support' }],
};

export function sourcesForBrand(slug: string): { name: string; url: string }[] {
  return BRAND_SOURCES[slug] ?? [];
}
