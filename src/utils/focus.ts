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
  familyPolicy: { models?: string; errorDisambig?: string };
  noindexPageIds: string[];
  investPageIds: string[];
  modelsIndexAllowlist?: string[];
  errorDisambigIndexAllowlist?: string[];
};

const noindexSet = new Set(cfg.noindexPageIds ?? []);
const focusBrandSet = new Set(cfg.focusBrands ?? []);
const excludeBrandSet = new Set(cfg.sitemapExcludeBrands ?? []);
const investSet = new Set(cfg.investPageIds ?? []);
const modelsAllowSet = new Set(cfg.modelsIndexAllowlist ?? []);
const errorAllowSet = new Set(cfg.errorDisambigIndexAllowlist ?? []);

export const focus = {
  tier: cfg.focusTier ?? 1,
  /** A consolidate-tier page that should carry a noindex meta. */
  isPageNoindex: (id: string): boolean => noindexSet.has(id),
  /** Whole models/ family policy. */
  modelsNoindex: (): boolean => cfg.familyPolicy?.models === 'noindex',
  /**
   * Per-model noindex decision. The models/ family is noindexed for crawl-budget,
   * BUT traffic-proven models (organic GSC impressions) are allowlisted back to
   * indexable — a noindexed page can never grow the very traffic that justified it.
   * Allowlist key is `${brand}/${slug}` (e.g. 'ge/pvd28bynfs').
   */
  modelNoindex: (brand: string, slug: string): boolean =>
    cfg.familyPolicy?.models === 'noindex' && !modelsAllowSet.has(`${brand}/${slug}`),
  /** Whole cross-brand /error/ disambiguation family policy. */
  errorDisambigFamilyNoindex: (): boolean => cfg.familyPolicy?.errorDisambig === 'noindex',
  /**
   * Per-disambiguation-page noindex decision. The /error/[code] pages are thin
   * navigational aggregators (a code + a list of links to the real brand pages).
   * They read as "scaled low-value content" to a reviewer, so the family is
   * noindexed for crawl/quality budget — but proven performers can be allowlisted
   * back. Allowlist key is the normalized code slug (e.g. '4c').
   */
  errorDisambigNoindex: (codeSlug: string): boolean =>
    cfg.familyPolicy?.errorDisambig === 'noindex' && !errorAllowSet.has(codeSlug),
  /** Brand is inside the current focus tier. */
  isBrandInFocus: (brand: string): boolean => focusBrandSet.has(brand),
  /** Long-tail brand to keep out of the sitemap (still indexable). */
  isBrandSitemapExcluded: (brand: string): boolean => excludeBrandSet.has(brand),
  /** High-demand page to boost in the sitemap. */
  isInvest: (id: string): boolean => investSet.has(id),
};
