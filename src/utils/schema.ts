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

/** FAQPage — kept for crawl signals even though rich results retired May 2026 */
export function faqSchema(errorCode: ErrorCode, brandName: string, appName: string): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `What does error code ${errorCode.code} mean on a ${brandName} ${appName}?`,
        "acceptedAnswer": { "@type": "Answer", "text": errorCode.meaning }
      },
      {
        "@type": "Question",
        "name": `How do I fix ${brandName} ${appName} error code ${errorCode.code}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": errorCode.fixes.map((f, i) => `Step ${i+1}: ${f.title}. ${f.description}`).join(' ')
        }
      },
      {
        "@type": "Question",
        "name": `How do I clear error code ${errorCode.code} on my ${brandName} ${appName}?`,
        "acceptedAnswer": { "@type": "Answer", "text": errorCode.reset_instructions }
      },
      {
        "@type": "Question",
        "name": `Is ${brandName} ${appName} error code ${errorCode.code} serious?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Error code ${errorCode.code} has ${errorCode.severity} severity. ${
            errorCode.severity === 'critical' ? 'Stop using the appliance immediately — safety risk. Call a certified technician.' :
            errorCode.severity === 'high' ? 'Continuing to run the appliance may cause additional damage. Repair soon.' :
            errorCode.severity === 'medium' ? 'The appliance may still operate but the underlying issue should be fixed.' :
            'Low severity — does not prevent normal operation but should be addressed.'
          } DIY repair cost: ${errorCode.cost_lo}–${errorCode.cost_hi}. Professional repair: ${errorCode.pro_cost_lo}–${errorCode.pro_cost_hi}.`
        }
      }
    ]
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
