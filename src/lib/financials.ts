// ━━━ FINANCIAL CALCULATIONS ━━━
// All per diem math lives here. Every function is pure — no side effects.
// Uses MEDIAN as the central tendency for all derived display values.

import type {
    PayBreakdown,
    GsaData,
    HousingData,
    NegotiationBandData,
    ContractProjection,
} from "@/types";

const TAX_RATE = 0.20; // Flat estimate for travel nurse taxable income
const CONTRACT_WEEKS = 13;

/**
 * Calculate GSA weekly/monthly maximums from daily rates.
 */
export function deriveGsaTotals(
    lodgingDaily: number,
    mealsDaily: number,
    fiscalYear: number
): GsaData {
    const weeklyMax = lodgingDaily * 7 + mealsDaily * 7;
    const monthlyMax = lodgingDaily * 30 + mealsDaily * 30;
    return {
        fiscal_year: fiscalYear,
        lodging_daily: lodgingDaily,
        meals_daily: mealsDaily,
        weekly_max: weeklyMax,
        monthly_max: monthlyMax,
    };
}

/**
 * Full pay breakdown from weekly gross, GSA ceiling, and hours.
 */
export function derivePayBreakdown(
    weeklyGross: number,
    gsaWeeklyMax: number,
    hours: number
): PayBreakdown {
    const stipendWeekly = Math.min(gsaWeeklyMax, weeklyGross);
    const taxableWeekly = Math.max(weeklyGross - gsaWeeklyMax, 0);
    const taxableHourly = hours > 0 ? Math.round((taxableWeekly / hours) * 100) / 100 : 0;
    const taxEstimate = Math.round(taxableWeekly * TAX_RATE * 100) / 100;
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

/**
 * Housing surplus: how much tax-free money remains after paying rent.
 */
export function deriveHousingData(
    gsaLodgingDaily: number,
    gsaMealsDaily: number,
    hudFmr1br: number
): HousingData {
    const gsaMonthlyStipend = (gsaLodgingDaily + gsaMealsDaily) * 30;
    const surplus = gsaMonthlyStipend - hudFmr1br;
    return {
        hud_fmr_1br: hudFmr1br,
        stipend_surplus_monthly: surplus,
    };
}

/**
 * Negotiation bands at 70%, 80%, 95%, 100% of GSA max.
 */
export function deriveNegotiationBands(
    gsaWeeklyMax: number,
    yourStipend: number
): NegotiationBandData {
    const pctOfMax = gsaWeeklyMax > 0
        ? Math.round((yourStipend / gsaWeeklyMax) * 100)
        : 0;
    return {
        pct_70: Math.round(gsaWeeklyMax * 0.70),
        pct_80: Math.round(gsaWeeklyMax * 0.80),
        pct_95: Math.round(gsaWeeklyMax * 0.95),
        your_stipend: yourStipend,
        pct_of_max: pctOfMax,
    };
}

/**
 * 13-week contract projection.
 */
export function deriveContractProjection(
    breakdown: PayBreakdown,
    weeks: number = CONTRACT_WEEKS
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

/**
 * All-in-one: compute full calculator result from raw inputs.
 */
export function deriveFinancials(
    weeklyGross: number,
    hours: number,
    gsaLodgingDaily: number,
    gsaMealsDaily: number,
    fiscalYear: number,
    hudFmr1br: number
) {
    const gsa = deriveGsaTotals(gsaLodgingDaily, gsaMealsDaily, fiscalYear);
    const breakdown = derivePayBreakdown(weeklyGross, gsa.weekly_max, hours);
    const housing = deriveHousingData(gsaLodgingDaily, gsaMealsDaily, hudFmr1br);
    const negotiation = deriveNegotiationBands(gsa.weekly_max, breakdown.stipend_weekly);
    const contract = deriveContractProjection(breakdown);

    return { gsa, breakdown, housing, negotiation, contract_13wk: contract };
}
