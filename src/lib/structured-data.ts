// ━━━ JSON-LD STRUCTURED DATA GENERATORS ━━━
// Produces schema.org structured data for SEO on market pages.
// Every market page gets: Occupation, Dataset, FAQPage, BreadcrumbList, WebPage.

import type { MarketPageData } from "@/types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://perdiem.fyi";

export function generateOccupationSchema(data: MarketPageData) {
  return {
    "@context": "https://schema.org",
    "@type": "Occupation",
    name: `Travel ${data.specialty} Nurse`,
    occupationLocation: {
      "@type": "City",
      name: data.location.city,
      containedInPlace: {
        "@type": "State",
        name: data.location.state_name,
      },
    },
    estimatedSalary: data.pay.weekly_median
      ? {
          "@type": "MonetaryAmountDistribution",
          name: "Weekly Gross Pay",
          currency: "USD",
          median: data.pay.weekly_median,
          percentile25: data.pay.weekly_p25,
          percentile75: data.pay.weekly_p75,
          unitText: "WEEK",
        }
      : undefined,
    description: `Travel ${data.specialty} nursing positions in ${data.location.city}, ${data.location.state}. GSA per diem ceiling: $${data.gsa.weekly_max}/week.`,
  };
}

export function generateDatasetSchema(data: MarketPageData) {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `${data.specialty} Travel Nurse Pay Data — ${data.location.city}, ${data.location.state}`,
    description: `Crowdsourced pay data from ${data.pay.report_count} travel nurse reports in ${data.location.city}, ${data.location.state}. Includes GSA per diem rates, housing costs, and agency comparison.`,
    creator: {
      "@type": "Organization",
      name: "PerDiem.fyi",
      url: SITE_URL,
    },
    license: "https://creativecommons.org/licenses/by-nc/4.0/",
    temporalCoverage: data.snapshot_date,
    spatialCoverage: {
      "@type": "Place",
      name: `${data.location.city}, ${data.location.state}`,
    },
    variableMeasured: [
      {
        "@type": "PropertyValue",
        name: "Weekly Gross Pay",
        unitText: "USD/week",
      },
      {
        "@type": "PropertyValue",
        name: "GSA Per Diem Ceiling",
        unitText: "USD/week",
      },
      { "@type": "PropertyValue", name: "1BR Rent", unitText: "USD/month" },
    ],
  };
}

export function generateFAQSchema(data: MarketPageData) {
  const faqs = [
    {
      question: `What is the GSA per diem rate for ${data.location.city}, ${data.location.state}?`,
      answer: `The GSA per diem ceiling for ${data.location.county} County, ${data.location.state} is $${data.gsa.weekly_max}/week ($${data.gsa.lodging_daily}/night lodging + $${data.gsa.meals_daily}/day M&IE) for FY${data.gsa.fiscal_year}. Source: GSA.gov.`,
    },
    {
      question: `How much do travel nurses make in ${data.location.city}, ${data.location.state}?`,
      answer: data.pay.weekly_median
        ? `Based on ${data.pay.report_count} nurse reports, the median weekly gross for ${data.specialty} travel nurses in ${data.location.city} is $${data.pay.weekly_median}/week.`
        : `We don't have enough nurse reports yet for ${data.location.city}. Use our calculator to see your GSA per diem breakdown.`,
    },
    {
      question: `What is the average rent in ${data.location.city}, ${data.location.state}?`,
      answer: data.housing.one_bed_avg
        ? `The average 1-bedroom rent in ${data.location.city} is $${data.housing.one_bed_avg}/month based on HUD Fair Market Rent data.`
        : `HUD FMR data is not yet available for this specific location.`,
    },
  ];

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function generateBreadcrumbSchema(data: MarketPageData) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Market Index",
        item: `${SITE_URL}/market`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: data.location.state_name,
        item: `${SITE_URL}/market/us/${data.location.state.toLowerCase()}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: data.location.city,
        item: `${SITE_URL}/market/us/${data.location.state.toLowerCase()}/${data.location.slug}`,
      },
    ],
  };
}

export function generateWebPageSchema(data: MarketPageData) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${data.specialty} Pay in ${data.location.city}, ${data.location.state} | PerDiem.fyi`,
    description: `Travel nurse pay transparency for ${data.location.city}, ${data.location.state}. GSA per diem: $${data.gsa.weekly_max}/week. ${data.pay.report_count} nurse reports.`,
    url: `${SITE_URL}/market/us/${data.location.state.toLowerCase()}/${data.location.slug}/${data.specialty.toLowerCase().replace(/\s+/g, "-")}`,
    dateModified: data.snapshot_date,
    publisher: {
      "@type": "Organization",
      name: "PerDiem.fyi",
      url: SITE_URL,
    },
    isPartOf: {
      "@type": "WebSite",
      name: "PerDiem.fyi",
      url: SITE_URL,
    },
  };
}

/**
 * Generate all JSON-LD scripts for a market page.
 */
export function generateAllStructuredData(data: MarketPageData): string[] {
  return [
    JSON.stringify(generateOccupationSchema(data)),
    JSON.stringify(generateDatasetSchema(data)),
    JSON.stringify(generateFAQSchema(data)),
    JSON.stringify(generateBreadcrumbSchema(data)),
    JSON.stringify(generateWebPageSchema(data)),
  ];
}
