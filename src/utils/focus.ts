/**
 * Focus-tier dial — reads focus-config.json (emitted by site-composition.mjs
 * --emit-config) to concentrate SEO effort on the demand core.
 *
 * Mechanism (all reversible, no URL deletion):
 *   - models/ family → noindex (crawl-budget drain)
 *   - C_CONSOLIDATE code pages → noindex
 *   - long-tail brands → excluded from sitemap (still indexable if linked)
 *   - A_INVEST pages → boosted sitemap priority
 *
 * Widen the focus by bumping `focusTier` in the config and rebuilding.
 */
import focusConfig from '../data/focus-config.json';

const cfg = focusConfig as {
  focusTier: number;
  focusBrands: string[];
  sitemapExcludeBrands: string[];
  familyPolicy: { models?: string };
  noindexPageIds: string[];
  investPageIds: string[];
};

const noindexSet = new Set(cfg.noindexPageIds ?? []);
const focusBrandSet = new Set(cfg.focusBrands ?? []);
const excludeBrandSet = new Set(cfg.sitemapExcludeBrands ?? []);
const investSet = new Set(cfg.investPageIds ?? []);

export const focus = {
  tier: cfg.focusTier ?? 1,
  /** A consolidate-tier page that should carry a noindex meta. */
  isPageNoindex: (id: string): boolean => noindexSet.has(id),
  /** Whole models/ family policy. */
  modelsNoindex: (): boolean => cfg.familyPolicy?.models === 'noindex',
  /** Brand is inside the current focus tier. */
  isBrandInFocus: (brand: string): boolean => focusBrandSet.has(brand),
  /** Long-tail brand to keep out of the sitemap (still indexable). */
  isBrandSitemapExcluded: (brand: string): boolean => excludeBrandSet.has(brand),
  /** High-demand page to boost in the sitemap. */
  isInvest: (id: string): boolean => investSet.has(id),
};
