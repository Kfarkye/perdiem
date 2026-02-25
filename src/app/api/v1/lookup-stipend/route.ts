import { NextResponse } from "next/server";
import { z } from "zod";
import {
  lookupLocation,
  lookupGsaRates,
  lookupHudFmr,
  getGsaFiscalYear,
} from "@/lib/gsa";
import {
  deriveFinancials,
  getMinTaxableHourly,
  getTierInfo,
} from "@/lib/financials";
import { createServiceClient } from "@/lib/supabase";
import { estimateInsuranceWeekly, type InsurancePlan } from "@/lib/insurance";
import {
  computeConstructionPay,
  getGsaComparisonWeekly,
  scheduleToHours,
  type ConstructionSchedule,
  type HousingModel,
} from "@/lib/construction";

// ━━━ INPUT VALIDATION ━━━
const LookupStipendSchema = z.object({
  zip: z.string().regex(/^\d{5}$/, "ZIP must be exactly 5 digits"),

  // Mode: healthcare (default) or construction
  mode: z.enum(["healthcare", "construction"]).optional().default("healthcare"),

  // Healthcare mode fields
  gross_weekly: z.coerce.number().min(200).max(15000).optional(),
  hours: z.coerce.number().min(8).max(84).optional().default(36),
  specialty: z.string().max(50).default("RN"),

  // Construction mode fields
  hourly_rate: z.coerce.number().min(10).max(200).optional(),
  daily_per_diem: z.coerce.number().min(0).max(500).optional(),
  per_diem_days: z.coerce.number().min(5).max(7).optional().default(7),
  schedule: z
    .enum(["4x10", "5x8", "5x10", "6x10", "7x12", "custom"])
    .optional()
    .default("5x10"),
  custom_hours: z.coerce.number().min(8).max(100).optional(),
  housing_model: z.enum(["self", "company"]).optional().default("self"),
  trade: z.string().max(50).optional().default("electrician"),

  // Shared fields
  agency_name: z.string().max(100).optional().nullable(),
  facility_name: z.string().max(200).optional().nullable(),
  ingest: z.boolean().optional().default(true),
  insurance_plan: z
    .enum(["none", "single", "family", "aca", "private", "union"])
    .optional()
    .default("none"),
  insurance_weekly_override: z.coerce
    .number()
    .min(0)
    .max(2000)
    .optional()
    .nullable(),
});

// ━━━ RATE LIMIT ━━━
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

function offerBand(pct: number) {
  if (pct >= 95) return { label: "Top", typical_band: "95–100%" };
  if (pct >= 85) return { label: "Typical", typical_band: "85–95%" };
  if (pct >= 80) return { label: "Below Avg", typical_band: "80–85%" };
  return { label: "Low", typical_band: "<80%" };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function POST(req: Request) {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a minute." },
        { status: 429, headers: { "Retry-After": "60" } },
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = LookupStipendSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        {
          error: `Validation error: ${firstError.path.join(".")} — ${firstError.message}`,
          issues: parsed.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 },
      );
    }

    const d = parsed.data;
    const zip = d.zip;

    // 1) ZIP → location
    const location = await lookupLocation(zip);
    if (!location) {
      return NextResponse.json(
        {
          error: `No GSA locality found for ZIP ${zip}. Check the ZIP and try again.`,
        },
        { status: 404 },
      );
    }

    // 2) GSA rates
    const fiscalYear = getGsaFiscalYear();
    const gsa = await lookupGsaRates(location.destination_id, fiscalYear);
    if (!gsa) {
      return NextResponse.json(
        {
          error: `GSA rates not found for destination ${location.destination_id} (FY${fiscalYear}).`,
        },
        { status: 404 },
      );
    }

    // 3) Housing costs (deterministic ZIP lookup)
    const hud = await lookupHudFmr(zip);
    const rent1Br = hud?.fmr_1br ?? 1800;

    // ━━━ BRANCH: CONSTRUCTION vs HEALTHCARE ━━━
    if (d.mode === "construction") {
      return handleConstruction(d, location, gsa, hud, rent1Br, fiscalYear, ip);
    }

    // ━━━ HEALTHCARE (existing logic) ━━━
    const gross_weekly = d.gross_weekly ?? 2000;
    const hours = d.hours ?? 36;
    const specialty = d.specialty ?? "RN";

    const financials = deriveFinancials(
      gross_weekly,
      hours,
      gsa.lodging_daily,
      gsa.meals_daily,
      gsa.fiscal_year,
      rent1Br,
      specialty,
      hud?.zori_rent ?? null,
    );

    const pct = clamp(financials.negotiation.pct_of_max ?? 0, 0, 200);
    const band = offerBand(pct);
    const targetPct = 90;
    const targetStipend = round2(gsa.weekly_max * (targetPct / 100));
    const deltaTo90 = round2(
      targetStipend - financials.breakdown.stipend_weekly,
    );

    const insPlan = d.insurance_plan === "union" ? "none" : d.insurance_plan;
    const insurance = estimateInsuranceWeekly({
      agency_name: d.agency_name ?? null,
      plan: insPlan as InsurancePlan,
      weekly_override: d.insurance_weekly_override ?? null,
    });

    const insuranceMid = insurance.weekly_mid ?? 0;
    const netAfterInsuranceWeekly = round2(
      financials.breakdown.net_weekly - insuranceMid,
    );

    if (d.ingest)
      void ingestReport(
        d,
        location,
        gsa,
        financials,
        insurance,
        insuranceMid,
        ip,
      );

    return NextResponse.json({
      success: true,
      data: {
        mode: "healthcare",
        location: {
          zip: location.zip,
          city: gsa.city || location.city || "",
          county: gsa.county || location.county || "",
          state: location.state,
        },
        gsa: {
          fiscal_year: gsa.fiscal_year,
          lodging_daily: gsa.lodging_daily,
          meals_daily: gsa.meals_daily,
          weekly_max: gsa.weekly_max,
          monthly_max: gsa.monthly_max,
        },
        breakdown: financials.breakdown,
        housing: financials.housing,
        negotiation: financials.negotiation,
        contract_13wk: financials.contract_13wk,
        insurance: {
          plan: insurance.plan,
          agency_label: insurance.agency_label,
          weekly_min: insurance.weekly_min,
          weekly_max: insurance.weekly_max,
          weekly_mid: insurance.weekly_mid,
          source_type: insurance.source_type,
          source_urls: insurance.source_urls,
          notes: insurance.notes,
        },
        derived: { net_after_insurance_weekly: netAfterInsuranceWeekly },
        metadata: {
          gsa_fiscal_year: gsa.fiscal_year,
          hud_rent_source: hud
            ? `HUD SAFMR · ZIP ${zip} · FY2026${hud.market_ratio ? ` · Market ratio: ${hud.market_ratio}×` : ""}`
            : "National Median Estimate",
          tax_method: `Taxable base floored at $${getMinTaxableHourly(specialty)}/hr. ${getTierInfo(specialty).blsDesc}.`,
          offer_verdict: {
            stipend_pct_of_gsa: pct,
            label: band.label,
            typical_band: band.typical_band,
            typical_target_pct: targetPct,
            delta_to_typical_weekly: deltaTo90,
            target_stipend_weekly: targetStipend,
          },
          assumptions: [
            `Taxable base rate: $${getMinTaxableHourly(specialty)}/hr minimum (site floor for ${specialty})`,
            "Tax-free stipend = gross minus taxable wages, capped at GSA ceiling",
            "Tax estimate is ~20% flat on taxable wages — not a tax calculation",
            `HUD FMR 1BR: $${rent1Br}/mo — ${hud ? "ZIP-level data (FY2026)" : "national fallback"}`,
            hud?.zori_rent ? `Zillow Observed Rent: $${Math.round(hud.zori_rent)}/mo` : null,
            hud?.market_ratio ? `Market ratio: ${hud.market_ratio}× (observed / federal baseline)` : null,
            "Contract projection assumes 13 weeks",
          ].filter(Boolean),
        },
      },
    });
  } catch (error: unknown) {
    console.error("[lookup-stipend] Unhandled error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}

// ━━━ CONSTRUCTION HANDLER ━━━
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleConstruction(
  d: any,
  location: any,
  gsa: any,
  hud: any,
  rent1Br: number,
  fiscalYear: number,
  ip: string,
) {
  const hourlyRate = d.hourly_rate ?? 35;
  const dailyPd = d.daily_per_diem ?? 100;
  const pdDays = (d.per_diem_days ?? 7) as 5 | 6 | 7;
  const schedule = (d.schedule ?? "5x10") as ConstructionSchedule;
  const customHours = d.custom_hours;
  const housingModel = (d.housing_model ?? "self") as HousingModel;
  const trade = d.trade ?? "electrician";

  const pay = computeConstructionPay({
    hourly_rate: hourlyRate,
    daily_per_diem: dailyPd,
    per_diem_days: pdDays,
    schedule,
    custom_hours: customHours,
    housing_model: housingModel,
  });

  // GSA comparison: per diem portion vs GSA ceiling
  const gsaComparison = getGsaComparisonWeekly(
    gsa.weekly_max,
    gsa.meals_daily,
    housingModel,
    pdDays,
  );
  const pctOfGsa =
    gsaComparison > 0
      ? clamp(round2((pay.weekly_per_diem / gsaComparison) * 100), 0, 200)
      : 0;
  const band = offerBand(pctOfGsa);
  const targetPct = 90;
  const targetPdWeekly = round2(gsaComparison * (targetPct / 100));
  const deltaPd = round2(targetPdWeekly - pay.weekly_per_diem);

  // Tax estimate: wages are fully taxable, per diem is tax-free (under 1yr)
  const taxRate = 0.22; // marginal rate for construction wages
  const taxEstWeekly = round2(pay.weekly_wage * taxRate);
  const netWeekly = round2(
    pay.weekly_wage - taxEstWeekly + pay.weekly_per_diem,
  );

  // Housing
  const stipendMonthlyEst = round2(pay.weekly_per_diem * (52 / 12));
  const stipendSurplus = round2(stipendMonthlyEst - rent1Br);

  // Insurance
  const insPlan = d.insurance_plan === "union" ? "none" : d.insurance_plan;
  const insurance = estimateInsuranceWeekly({
    agency_name: d.agency_name ?? null,
    plan: insPlan as InsurancePlan,
    weekly_override: d.insurance_weekly_override ?? null,
  });
  const insuranceMid = insurance.weekly_mid ?? 0;
  const netAfterInsurance = round2(netWeekly - insuranceMid);

  // Ingest
  if (d.ingest) {
    try {
      const serviceClient = createServiceClient();
      await serviceClient.from("pay_reports").insert({
        zip: d.zip,
        state: location.state,
        county: gsa.county ?? location.county,
        city: gsa.city ?? location.city,
        specialty: `construction:${trade}`,
        weekly_gross: pay.weekly_gross_total,
        hours_per_week: pay.total_hours,
        agency_name: d.agency_name || null,
        facility_name: d.facility_name || null,
        stipend_weekly: pay.weekly_per_diem,
        taxable_hourly: hourlyRate,
        contract_length_weeks: 13,
        is_local: false,
        source: "calculator",
        session_id: null,
        ip_hash: ip !== "unknown" ? await hashIP(ip) : null,
        insurance_plan: insurance.plan,
        insurance_weekly_est: insuranceMid,
        insurance_source: insurance.source_type,
      });
    } catch (e) {
      console.error("[pay_reports] Construction ingestion failed:", e);
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      mode: "construction",
      location: {
        zip: location.zip,
        city: gsa.city || location.city || "",
        county: gsa.county || location.county || "",
        state: location.state,
      },
      gsa: {
        fiscal_year: gsa.fiscal_year,
        lodging_daily: gsa.lodging_daily,
        meals_daily: gsa.meals_daily,
        weekly_max: gsa.weekly_max,
        monthly_max: gsa.monthly_max,
      },
      construction: {
        trade,
        schedule,
        housing_model: housingModel,
        hourly_rate: hourlyRate,
        daily_per_diem: dailyPd,
        per_diem_days: pdDays,
        straight_hours: pay.straight_hours,
        ot_hours: pay.ot_hours,
        straight_pay: pay.straight_pay,
        ot_pay: pay.ot_pay,
        weekly_wage: pay.weekly_wage,
        weekly_per_diem: pay.weekly_per_diem,
        weekly_gross_total: pay.weekly_gross_total,
      },
      breakdown: {
        weekly_gross: pay.weekly_gross_total,
        hours: pay.total_hours,
        stipend_weekly: pay.weekly_per_diem,
        taxable_weekly: pay.weekly_wage,
        taxable_hourly: hourlyRate,
        tax_estimate_weekly: taxEstWeekly,
        net_weekly: netWeekly,
      },
      housing: {
        hud_fmr_1br: rent1Br,
        stipend_monthly_est: stipendMonthlyEst,
        stipend_surplus_monthly: stipendSurplus,
      },
      negotiation: { pct_of_max: pctOfGsa },
      insurance: {
        plan: insurance.plan,
        agency_label: insurance.agency_label,
        weekly_min: insurance.weekly_min,
        weekly_max: insurance.weekly_max,
        weekly_mid: insurance.weekly_mid,
        source_type: insurance.source_type,
        source_urls: insurance.source_urls,
        notes: insurance.notes,
      },
      derived: {
        net_after_insurance_weekly: netAfterInsurance,
        gsa_comparison_weekly: gsaComparison,
      },
      metadata: {
        gsa_fiscal_year: gsa.fiscal_year,
        hud_rent_source: hud
          ? `HUD SAFMR · ZIP ${location.zip} · FY2026${hud.market_ratio ? ` · Market ratio: ${hud.market_ratio}×` : ""}`
          : "National Median Estimate",
        tax_method: `Flat 22% on wages ($${pay.weekly_wage}/wk); per diem ($${pay.weekly_per_diem}/wk) tax-free under IRS 1-year rule`,
        offer_verdict: {
          stipend_pct_of_gsa: pctOfGsa,
          label: band.label,
          typical_band: band.typical_band,
          typical_target_pct: targetPct,
          delta_to_typical_weekly: deltaPd,
          target_stipend_weekly: targetPdWeekly,
          gsa_comparison_basis:
            housingModel === "company"
              ? "M&IE only (company provides lodging)"
              : "Full GSA (lodging + M&IE)",
        },
        assumptions: [
          `Trade: ${trade} · Schedule: ${schedule} · ${pay.total_hours}hr/wk`,
          `Straight: ${pay.straight_hours}hr × $${hourlyRate}/hr = $${pay.straight_pay}`,
          pay.ot_hours > 0
            ? `OT: ${pay.ot_hours}hr × $${round2(hourlyRate * 1.5)}/hr = $${pay.ot_pay}`
            : null,
          `Per diem: $${dailyPd}/day × ${pdDays} days = $${pay.weekly_per_diem}/wk (tax-free)`,
          housingModel === "company"
            ? "Company provides lodging — GSA comparison uses M&IE only"
            : "Self-sourced housing — GSA comparison uses full lodging + M&IE",
          `Tax estimate: ~22% flat on wages — not a tax calculation`,
          `HUD FMR 1BR: $${rent1Br}/mo — ${hud ? "county-level data" : "national fallback"}`,
          "Per diem is tax-free under IRS rules if assignment < 1 year",
        ].filter(Boolean),
      },
    },
  });
}

// ━━━ HEALTHCARE INGEST ━━━
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ingestReport(
  d: any,
  location: any,
  gsa: any,
  financials: any,
  insurance: any,
  insuranceMid: number,
  ip: string,
) {
  try {
    const serviceClient = createServiceClient();
    await serviceClient.from("pay_reports").insert({
      zip: d.zip,
      state: location.state,
      county: gsa.county ?? location.county,
      city: gsa.city ?? location.city,
      specialty: d.specialty ?? "RN",
      weekly_gross: d.gross_weekly,
      hours_per_week: d.hours,
      agency_name: d.agency_name || null,
      facility_name: d.facility_name || null,
      stipend_weekly: financials.breakdown.stipend_weekly,
      taxable_hourly: financials.breakdown.taxable_hourly,
      contract_length_weeks: 13,
      is_local: false,
      source: "calculator",
      session_id: null,
      ip_hash: ip !== "unknown" ? await hashIP(ip) : null,
      insurance_plan: insurance.plan,
      insurance_weekly_est: insuranceMid,
      insurance_source: insurance.source_type,
    });
  } catch (e) {
    console.error("[pay_reports] Ingestion failed:", e);
  }
}

async function hashIP(ip: string): Promise<string> {
  const salt = process.env.IP_HASH_SALT ?? "perdiem-fyi-2026";
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${ip}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "https://perdiem.fyi",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}
