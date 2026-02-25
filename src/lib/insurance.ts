// ━━━ AGENCY INSURANCE ESTIMATE LIBRARY ━━━
// Sources: Trusted Health FAQ (published $167/wk), Aya nurse blogs (~$200/wk),
//          Host Healthcare benefits page (30-day gap coverage),
//          TNAA benefits page (day-one + plan tiers),
//          Medical Solutions blog ($15/wk, April 2015 — historical only),
//          KFF 2025 Employer Health Benefits Survey ($27.69/wk single avg).
//
// Rule: if a number is not grounded in a primary source, leave it undefined.
// The product ships "estimate or override" and learns from real inputs.

export type InsurancePlan = "none" | "single" | "family" | "aca" | "private";
export type InsuranceSourceType =
  | "published"
  | "reported"
  | "historical"
  | "unknown";

export interface AgencyInsuranceEstimate {
  agency: string;
  source_type: InsuranceSourceType;
  individual_weekly_min?: number;
  individual_weekly_max?: number;
  family_weekly_min?: number;
  family_weekly_max?: number;
  day_one: boolean;
  gap_coverage_days?: number;
  notes?: string;
  source_urls: string[];
  last_verified: string;
}

export const AGENCY_INSURANCE: Record<string, AgencyInsuranceEstimate> = {
  aya: {
    agency: "Aya Healthcare",
    source_type: "reported",
    individual_weekly_min: 100,
    individual_weekly_max: 200,
    day_one: true,
    notes:
      "Aya does not publish premiums. Pay-range spread reflects taking vs waiving insurance. Nurse blogs report ~$200/wk individual.",
    source_urls: [
      "https://travelingwithjuls.com/health-insurance-for-travel-nurses/",
      "https://www.ayahealthcare.com/allied-professionals/pay-and-benefits/",
    ],
    last_verified: "2026-02-24",
  },
  trusted: {
    agency: "Trusted Health",
    source_type: "published",
    individual_weekly_min: 167,
    day_one: true,
    gap_coverage_days: 28,
    notes:
      "Trusted publishes individual starting cost ($167/wk). Dependent pricing not published. 28-day benefit rollover between assignments.",
    source_urls: [
      "https://www.trustedhealth.com/faqs",
      "https://www.trustedhealth.com/how-it-works",
    ],
    last_verified: "2026-02-24",
  },
  host: {
    agency: "Host Healthcare",
    source_type: "published",
    day_one: true,
    gap_coverage_days: 30,
    notes:
      "Host publishes benefits continuity for gaps <30 days. Premiums not published.",
    source_urls: [
      "https://www.hosthealthcare.com/for-travelers/travel-nursing/benefits/",
    ],
    last_verified: "2026-02-24",
  },
  tnaa: {
    agency: "TNAA",
    source_type: "published",
    day_one: true,
    notes:
      "Day-one coverage with plan tiers (HDHP/HSA, PPO Base, PPO Buy-Up). Premiums not published.",
    source_urls: [
      "https://tnaa.com/benefits",
      "https://tnaa.com/blog/allied-health-and-travel-nurse-insurance",
    ],
    last_verified: "2026-02-24",
  },
  medical_solutions: {
    agency: "Medical Solutions",
    source_type: "historical",
    individual_weekly_min: 15,
    day_one: true,
    notes:
      "Published $15/wk starting April 2015. Historical structure only — treat as stale for 2026 pricing.",
    source_urls: [
      "https://www.medicalsolutions.com/blog/clinician/traveler-tips/benefits-and-pay/travel-nurse-insurance/",
    ],
    last_verified: "2026-02-24",
  },
};

const ALIASES: Array<{ key: string; match: RegExp }> = [
  { key: "aya", match: /\baya\b/i },
  { key: "trusted", match: /\btrusted\b/i },
  { key: "host", match: /\bhost\b/i },
  { key: "tnaa", match: /\btnaa\b|\btravel\s*nurse\s*across\s*america\b/i },
  { key: "medical_solutions", match: /\bmedical\s*solutions\b|\baureus\b/i },
];

export function normalizeAgencyKey(input: string): string | null {
  const s = (input || "").trim();
  if (!s) return null;
  for (const a of ALIASES) {
    if (a.match.test(s)) return a.key;
  }
  return null;
}

export interface InsurancePricingResult {
  plan: InsurancePlan;
  agency_key: string | null;
  agency_label: string | null;
  weekly_min: number | null;
  weekly_max: number | null;
  weekly_mid: number | null;
  source_type: InsuranceSourceType;
  source_urls: string[];
  notes?: string;
}

export function estimateInsuranceWeekly(args: {
  agency_name?: string | null;
  plan: InsurancePlan;
  weekly_override?: number | null;
}): InsurancePricingResult {
  const { plan } = args;

  if (plan === "none") {
    return {
      plan,
      agency_key: null,
      agency_label: null,
      weekly_min: 0,
      weekly_max: 0,
      weekly_mid: 0,
      source_type: "unknown",
      source_urls: [],
    };
  }

  const override =
    typeof args.weekly_override === "number" && args.weekly_override >= 0
      ? Math.round(args.weekly_override * 100) / 100
      : null;

  const agencyKey = normalizeAgencyKey(args.agency_name ?? "");
  const row = agencyKey ? AGENCY_INSURANCE[agencyKey] : null;

  if (override !== null) {
    return {
      plan,
      agency_key: agencyKey,
      agency_label: row?.agency ?? args.agency_name ?? null,
      weekly_min: override,
      weekly_max: override,
      weekly_mid: override,
      source_type: "unknown",
      source_urls: [],
      notes: "User-provided premium override",
    };
  }

  if (!row) {
    return {
      plan,
      agency_key: null,
      agency_label: args.agency_name ?? null,
      weekly_min: null,
      weekly_max: null,
      weekly_mid: null,
      source_type: "unknown",
      source_urls: [],
      notes: "No estimate available for this agency",
    };
  }

  const [min, max] =
    plan === "family"
      ? [row.family_weekly_min ?? null, row.family_weekly_max ?? null]
      : [row.individual_weekly_min ?? null, row.individual_weekly_max ?? null];

  const mid =
    min !== null && max !== null
      ? Math.round(((min + max) / 2) * 100) / 100
      : min !== null
        ? min
        : max !== null
          ? max
          : null;

  return {
    plan,
    agency_key: agencyKey,
    agency_label: row.agency,
    weekly_min: min,
    weekly_max: max,
    weekly_mid: mid,
    source_type: row.source_type,
    source_urls: row.source_urls,
    notes: row.notes,
  };
}
