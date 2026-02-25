// ━━━ FINANCIAL CALCULATIONS ━━━
// All per diem math lives here. Every function is pure — no side effects.
// Tax estimate uses a conservative 20% flat rate as a baseline approximation.

import type {
  PayBreakdown,
  GsaData,
  HousingData,
  NegotiationBandData,
  ContractProjection,
} from "@/types";

const TAX_RATE_ESTIMATE = 0.2;
const CONTRACT_WEEKS = 13;

export interface TierInfo {
  floor: number;
  blsDesc: string;
}

export function getTierInfo(specialty: string): TierInfo {
  const s = specialty.toUpperCase();
  const tierA = [
    "PT",
    "DPT",
    "OT",
    "SLP",
    "MLS",
    "CRNA",
    "NP",
    "APRN",
    "PHARMD",
    "LCSW",
    "RD",
    "DIETITIAN",
    "AUD",
    "BSN",
  ];
  const isTierA =
    tierA.some((role) => s.includes(role)) &&
    !s.includes("PTA") &&
    !s.includes("OTA");

  if (isTierA) {
    return {
      floor: 20,
      blsDesc: "Tier A (Bachelor's degree or higher BLS requirement)",
    };
  }
  return {
    floor: 15,
    blsDesc: "Tier B (Associate degree or certificate BLS requirement)",
  };
}

export function getMinTaxableHourly(specialty: string): number {
  return getTierInfo(specialty).floor;
}

export function deriveGsaTotals(
  lodgingDaily: number,
  mealsDaily: number,
  fiscalYear: number,
): GsaData {
  const weeklyMax = (lodgingDaily + mealsDaily) * 7;
  const monthlyMax = (lodgingDaily + mealsDaily) * 30;
  return {
    fiscal_year: fiscalYear,
    lodging_daily: lodgingDaily,
    meals_daily: mealsDaily,
    weekly_max: weeklyMax,
    monthly_max: monthlyMax,
  };
}

export function derivePayBreakdown(
  weeklyGross: number,
  gsaWeeklyMax: number,
  hours: number,
  specialty: string = "RN",
): PayBreakdown {
  const minTaxableHourly = getMinTaxableHourly(specialty);
  const minTaxableWeekly = minTaxableHourly * hours;

  let taxableWeekly = Math.max(weeklyGross - gsaWeeklyMax, 0);

  // Enforce floor
  if (taxableWeekly < minTaxableWeekly) {
    taxableWeekly = Math.min(minTaxableWeekly, weeklyGross);
  }

  const stipendWeekly = Math.max(weeklyGross - taxableWeekly, 0);
  const taxableHourly =
    hours > 0 ? Math.round((taxableWeekly / hours) * 100) / 100 : 0;
  const taxEstimate = Math.round(taxableWeekly * TAX_RATE_ESTIMATE * 100) / 100;
  const netWeekly = Math.round((weeklyGross - taxEstimate) * 100) / 100;

  return {
    weekly_gross: weeklyGross,
    hours,
    stipend_weekly: stipendWeekly,
    taxable_weekly: taxableWeekly,
    taxable_hourly: taxableHourly,
    tax_estimate_weekly: taxEstimate,
    net_weekly: netWeekly,
  };
}

export function deriveHousingData(
  lodgingDailyOrStipend: number,
  mealsDailyOrRent: number,
  rentOptional?: number,
): HousingData {
  let monthlyStipend;
  let rent;

  if (rentOptional !== undefined) {
    monthlyStipend = (lodgingDailyOrStipend + mealsDailyOrRent) * 30;
    rent = rentOptional;
  } else {
    monthlyStipend = (lodgingDailyOrStipend / 7) * 30;
    rent = mealsDailyOrRent;
  }

  return {
    hud_fmr_1br: rent,
    stipend_monthly_est: monthlyStipend,
    stipend_surplus_monthly: monthlyStipend - rent,
  };
}

export function deriveNegotiationBands(
  gsaWeeklyMax: number,
  yourStipend: number,
): NegotiationBandData {
  const pctOfMax =
    gsaWeeklyMax > 0 ? Math.round((yourStipend / gsaWeeklyMax) * 100) : 0;
  return {
    pct_70: Math.round(gsaWeeklyMax * 0.7),
    pct_80: Math.round(gsaWeeklyMax * 0.8),
    pct_95: Math.round(gsaWeeklyMax * 0.95),
    pct_100: gsaWeeklyMax,
    your_stipend: yourStipend,
    pct_of_max: pctOfMax,
  };
}

export function deriveContractProjection(
  breakdown: PayBreakdown,
  weeks: number = CONTRACT_WEEKS,
): ContractProjection {
  const gross = breakdown.weekly_gross * weeks;
  const taxFreeTotal = breakdown.stipend_weekly * weeks;
  const netEstimate = breakdown.net_weekly * weeks;
  return {
    weeks,
    gross: Math.round(gross),
    net_estimate: Math.round(netEstimate),
    tax_free_total: Math.round(taxFreeTotal),
  };
}

export function deriveFinancials(
  weeklyGross: number,
  hours: number,
  gsaLodgingDaily: number,
  gsaMealsDaily: number,
  fiscalYear: number,
  hudFmr1br: number,
  specialty: string = "RN",
) {
  const gsa = deriveGsaTotals(gsaLodgingDaily, gsaMealsDaily, fiscalYear);
  const breakdown = derivePayBreakdown(
    weeklyGross,
    gsa.weekly_max,
    hours,
    specialty,
  );
  const housing = deriveHousingData(breakdown.stipend_weekly, hudFmr1br);
  const negotiation = deriveNegotiationBands(
    gsa.weekly_max,
    breakdown.stipend_weekly,
  );
  const contract = deriveContractProjection(breakdown);

  return { gsa, breakdown, housing, negotiation, contract_13wk: contract };
}
