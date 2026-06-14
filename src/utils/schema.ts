import type { ErrorCode, Brand, ApplianceType } from './types';

const BASE_URL = 'https://applianceerrors.com';
const BUILD_DATE = new Date().toISOString().split('T')[0];
const SITE_PUBLISHED = '2025-01-01';

const PUBLISHER = {
  "@type": "Organization",
  "name": "ApplianceErrors.com",
  "url": BASE_URL,
  "logo": {
    "@type": "ImageObject",
    "url": `${BASE_URL}/logo.svg`,
    "width": 200,
    "height": 60
  }
};

/** Global site schema — inject on every page via BaseLayout */
export function organizationSchema(): object {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ApplianceErrors.com",
    "url": BASE_URL,
    "description": "Free appliance error code database. Look up what any error code means and how to fix it for Samsung, LG, Whirlpool, GE, Bosch and 15+ major brands.",
    "logo": `${BASE_URL}/logo.svg`,
    "sameAs": []
  };
}

/** Homepage only */
export function webSiteSchema(totalCodes: number): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "ApplianceErrors.com",
    "url": BASE_URL,
    "description": `Free database of ${totalCodes}+ appliance error codes for every major brand. Plain-English meanings and step-by-step DIY fixes.`,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${BASE_URL}/search-index.json?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    "publisher": PUBLISHER
  };
}

const USD = String.fromCharCode(36);

const DIFFICULTY_TIME: Record<string, string> = {
  easy: 'about 10–20 minutes',
  moderate: 'roughly 30–60 minutes',
  hard: '1–3 hours',
  pro_only: 'a full service visit',
};

const DIFFICULTY_PHRASE: Record<string, string> = {
  easy: 'a beginner-friendly job needing only basic hand tools',
  moderate: 'a moderate job — a multimeter and some disassembly are usually involved',
  hard: 'an advanced repair involving deeper disassembly or electrical testing',
  pro_only: 'a repair most owners hand to a technician',
};

/** Human label for a raw category slug, used in synthesized prose. */
function categoryWord(category: string): string {
  const map: Record<string, string> = {
    control_board: 'control-board',
    control_panel: 'control-panel',
    water_supply: 'water-supply',
    water_inlet: 'water-inlet',
    water_level: 'water-level',
    temperature_sensor: 'temperature-sensor',
    door_latch: 'door-latch',
    door_lock: 'door-lock',
    ice_maker: 'ice-maker',
    user_error: 'usage',
    user_interface: 'interface',
  };
  return map[category] ?? category.replace(/_/g, ' ');
}

/**
 * Single source of truth for the page FAQ. Every answer is synthesized from
 * per-code fields (causes/fixes/severity/cost/models) and is query-shaped, so
 * the FAQ does not duplicate the page body verbatim and varies code to code.
 * Used by BOTH faqSchema (JSON-LD) and the visible FAQ block so they match.
 */
export function errorCodeFaqs(
  errorCode: ErrorCode,
  brandName: string,
  appName: string,
): Array<{ q: string; a: string }> {
  const code = errorCode.code;
  const app = appName.toLowerCase();
  const cat = categoryWord(errorCode.category);
  const causes = [...(errorCode.causes ?? [])].sort((a, b) => b.frequency - a.frequency);
  const fixes = errorCode.fixes ?? [];
  const saving = errorCode.pro_cost_lo - errorCode.cost_lo;
  const faqs: Array<{ q: string; a: string }> = [];

  // Q1 — operational impact (from severity + category, not the meaning text)
  const keepUsing =
    errorCode.severity === 'critical'
      ? `No — stop using the ${app} right away. ${code} is a critical ${cat} fault, and continuing to run it risks further damage or a safety hazard. Unplug it and resolve the fault before the next cycle.`
      : errorCode.severity === 'high'
      ? `It is not advisable. The ${app} may still power on, but running it while ${code} is active can worsen the ${cat} fault or damage related parts. Treat it as a soon-as-possible repair.`
      : errorCode.severity === 'medium'
      ? `You often can for a cycle or two, but the ${cat} issue behind ${code} will keep interrupting normal operation until it is fixed. Plan the repair rather than ignoring the code.`
      : `Usually yes — ${code} is a low-severity ${cat} notice that rarely stops the ${app} from working, but clearing the underlying cause prevents it from escalating.`;
  faqs.push({ q: `Can I keep using my ${brandName} ${appName} when error ${code} appears?`, a: keepUsing });

  // Q2 — most common causes, ranked with real frequencies (data-grounded, unique per code)
  if (causes.length > 0) {
    const parts = causes.slice(0, 3).map((c, i) => {
      const desc = c.description.charAt(0).toLowerCase() + c.description.slice(1);
      return i === 0
        ? `the most frequent is ${desc} (${c.frequency}% of cases)`
        : `${desc} (${c.frequency}%)`;
    });
    const joined =
      parts.length === 1
        ? parts[0]
        : `${parts.slice(0, -1).join(', ')}${parts.length > 2 ? ',' : ''} then ${parts[parts.length - 1]}`;
    faqs.push({
      q: `What most commonly causes ${code} on a ${brandName} ${appName}?`,
      a: `Across reported ${brandName} ${app} repairs, ${joined}. Check them in that order before replacing any parts.`,
    });
  }

  // Q3 — recurring after reset (references fixes by title, not the reset text verbatim)
  if (fixes.length > 0) {
    const firstTwo = fixes.slice(0, 2).map((f) => f.title.charAt(0).toLowerCase() + f.title.slice(1));
    const fixOrder = firstTwo.length > 1 ? `${firstTwo[0]}, then ${firstTwo[1]}` : firstTwo[0];
    faqs.push({
      q: `${code} keeps coming back after a reset — what should I check next?`,
      a: `A reset only clears the stored ${code} fault; if it returns, the ${cat} problem is still present. Move on to the physical checks — ${fixOrder} — since the code will reappear until the root cause is resolved. This is ${DIFFICULTY_PHRASE[errorCode.diy_difficulty] ?? 'a repair best matched to your comfort level'}.`,
    });
  }

  // Q4 — cost (unique numbers per code)
  faqs.push({
    q: `How much does it cost to fix ${brandName} ${appName} error ${code}?`,
    a: `A DIY repair typically runs ${USD}${errorCode.cost_lo}–${USD}${errorCode.cost_hi} in parts, versus ${USD}${errorCode.pro_cost_lo}–${USD}${errorCode.pro_cost_hi} for a professional service call${saving > 50 ? `, so handling it yourself saves around ${USD}${saving}` : ''}. Expect the work to take ${DIFFICULTY_TIME[errorCode.diy_difficulty] ?? 'a variable amount of time'}.`,
  });

  // Q5 — affected models (only when present; never fabricated)
  if (errorCode.models_affected) {
    faqs.push({
      q: `Which ${brandName} ${appName} models show error ${code}?`,
      a: `${code} is documented on ${errorCode.models_affected}. Other units sharing the same control platform can display it too, so the fixes here generally transfer across the series.`,
    });
  }

  return faqs;
}

/** FAQPage — kept for crawl signals even though rich results retired May 2026 */
export function faqSchema(errorCode: ErrorCode, brandName: string, appName: string): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": errorCodeFaqs(errorCode, brandName, appName).map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a }
    }))
  };
}

export function howToSchema(errorCode: ErrorCode, brandName: string, applianceName: string): object {
  const supply = [...new Set(errorCode.fixes.flatMap(f => f.parts ?? []))].filter(Boolean).slice(0, 6);
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": `How to Fix ${brandName} ${applianceName} Error Code ${errorCode.code}`,
    "description": `${errorCode.meaning}. Step-by-step repair guide for ${brandName} ${applianceName} error code ${errorCode.code}.`,
    "totalTime": errorCode.diy_difficulty === 'easy' ? 'PT15M' : errorCode.diy_difficulty === 'moderate' ? 'PT45M' : 'PT2H',
    "estimatedCost": {
      "@type": "MonetaryAmount",
      "currency": "USD",
      "value": `${errorCode.cost_lo}–${errorCode.cost_hi}`
    },
    ...(supply.length > 0 ? {
      "supply": supply.map(s => ({ "@type": "HowToSupply", "name": s }))
    } : {}),
    "tool": [
      { "@type": "HowToTool", "name": "Multimeter" },
      { "@type": "HowToTool", "name": "Screwdriver set" }
    ],
    "step": errorCode.fixes.map((fix, i) => ({
      "@type": "HowToStep",
      "position": i + 1,
      "name": fix.title,
      "text": `${fix.description}${fix.warning ? ` Warning: ${fix.warning}` : ''}`,
      ...((fix.parts?.length ?? 0) > 0 ? {
        "supply": fix.parts!.map(p => ({ "@type": "HowToSupply", "name": p }))
      } : {})
    }))
  };
}

/** Generic FAQPage from a list of Q&As — for procedure/symptom/cost pages. */
export function faqListSchema(faqs: Array<{ q: string; a: string }>): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a }
    }))
  };
}

export function breadcrumbSchema(items: Array<{ name: string; url: string }>): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": item.name,
      "item": BASE_URL + item.url
    }))
  };
}

export function articleSchema(errorCode: ErrorCode, brandName: string, applianceName: string, lastVerified?: string): object {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": `${errorCode.code} Error Code: ${brandName} ${applianceName} — Meaning & Fix`,
    "description": errorCode.detail,
    "image": {
      "@type": "ImageObject",
      "url": `${BASE_URL}/images/codes/${errorCode.id}.svg`,
      "width": 800,
      "height": 450,
      "caption": `${brandName} ${applianceName} error code ${errorCode.code} on the display panel`
    },
    "about": {
      "@type": "Thing",
      "name": `${brandName} ${applianceName} error code ${errorCode.code}`,
      "description": errorCode.meaning
    },
    "proficiencyLevel": errorCode.diy_difficulty === 'easy' ? 'Beginner' : errorCode.diy_difficulty === 'moderate' ? 'Expert' : 'Expert',
    "author": {
      "@type": "Organization",
      "name": "ApplianceErrors Editorial Team",
      "url": `${BASE_URL}/editorial-policy/`
    },
    "reviewedBy": {
      "@type": "Organization",
      "name": "ApplianceErrors Editorial Team",
      "url": `${BASE_URL}/editorial-policy/`
    },
    "publisher": PUBLISHER,
    "datePublished": SITE_PUBLISHED,
    "dateModified": lastVerified ?? BUILD_DATE,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${BASE_URL}/brands/${errorCode.brand}/${errorCode.appliance}/${errorCode.code.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')}/`
    },
    "keywords": [
      `${brandName} ${applianceName} error code ${errorCode.code}`,
      `${errorCode.code} error`,
      `${brandName} ${errorCode.code}`,
      errorCode.category.replace(/_/g, ' ') + ' repair'
    ].join(', ')
  };
}

export function itemListSchema(items: Array<{name: string; url: string; description: string}>, listName: string): object {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": listName,
    "numberOfItems": items.length,
    "itemListElement": items.map((item, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": item.name,
      "description": item.description,
      "url": BASE_URL + item.url
    }))
  };
}
