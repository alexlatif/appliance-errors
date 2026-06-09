import type { ErrorCode, Brand, ApplianceType } from './types';

const BASE_URL = 'https://applianceerrors.com';

export function faqSchema(errorCode: ErrorCode): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `What does error code ${errorCode.code} mean on a ${errorCode.brand} ${errorCode.appliance}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": errorCode.meaning
        }
      },
      {
        "@type": "Question",
        "name": `How do I fix ${errorCode.brand} ${errorCode.appliance} error code ${errorCode.code}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": errorCode.fixes.map((f, i) => `Step ${i+1}: ${f.title} — ${f.description}`).join(' ')
        }
      },
      {
        "@type": "Question",
        "name": `How do I reset error code ${errorCode.code} on my ${errorCode.brand} ${errorCode.appliance}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": errorCode.reset_instructions
        }
      },
      {
        "@type": "Question",
        "name": `Is error code ${errorCode.code} serious?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Error code ${errorCode.code} is rated ${errorCode.severity} severity. ${
            errorCode.severity === 'critical' ? 'Stop using the appliance immediately and call a technician.' :
            errorCode.severity === 'high' ? 'Address this soon — running the appliance may cause further damage.' :
            errorCode.severity === 'medium' ? 'The appliance may still work but the issue should be resolved.' :
            'This is a minor issue you can typically fix yourself.'
          }`
        }
      }
    ]
  };
}

export function howToSchema(errorCode: ErrorCode, brandName: string, applianceName: string): object {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": `How to Fix ${brandName} ${applianceName} Error Code ${errorCode.code}`,
    "description": `Step-by-step guide to diagnose and fix ${errorCode.meaning.toLowerCase()} on a ${brandName} ${applianceName}.`,
    "totalTime": errorCode.diy_difficulty === 'easy' ? 'PT15M' : errorCode.diy_difficulty === 'moderate' ? 'PT45M' : 'PT2H',
    "estimatedCost": {
      "@type": "MonetaryAmount",
      "currency": "USD",
      "value": `${errorCode.cost_lo}-${errorCode.cost_hi}`
    },
    "step": errorCode.fixes.map((fix, i) => ({
      "@type": "HowToStep",
      "position": i + 1,
      "name": fix.title,
      "text": fix.description,
      ...(fix.warning ? { "warning": fix.warning } : {})
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

export function articleSchema(errorCode: ErrorCode, brandName: string, applianceName: string): object {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": `${brandName} ${applianceName} Error Code ${errorCode.code}: ${errorCode.meaning}`,
    "description": `${errorCode.detail} Learn what causes this error and how to fix it step by step.`,
    "author": {
      "@type": "Organization",
      "name": "ApplianceErrors.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "ApplianceErrors.com",
      "logo": {
        "@type": "ImageObject",
        "url": `${BASE_URL}/logo.png`
      }
    },
    "dateModified": new Date().toISOString().split('T')[0]
  };
}
