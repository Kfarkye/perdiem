// ━━━ GSA / HUD LOOKUP FUNCTIONS ━━━
// Queries Supabase for GSA per diem rates via ZIP → destination_id join path.
// Table: gsa_zip_mappings (40,426 rows) → gsa_rates (297 rows) via destination_id.
// Housing: zip_housing_costs (38,601 rows) — HUD SAFMR + Zillow ZORI, deterministic ZIP lookup.

import { supabase } from "./supabase";
import type { LocationData, GsaData } from "@/types";

/**
 * Compute the GSA fiscal year from a date.
 * GSA fiscal year starts October 1. FY2026 covers Oct 1 2025 → Sep 30 2026.
 * If current month >= October, fiscal year = calendar year + 1.
 */
export function getGsaFiscalYear(date: Date = new Date()): number {
  const month = date.getMonth(); // 0-indexed: 0=Jan, 9=Oct
  const year = date.getFullYear();
  return month >= 9 ? year + 1 : year;
}

/**
 * Get the current month's lodging column name.
 * GSA rates store seasonal lodging as lodging_jan, lodging_feb, etc.
 * Falls back to max_lodging if the month column is null.
 */
function getLodgingColumnForMonth(date: Date = new Date()): string {
  const monthColumns: Record<number, string> = {
    0: "lodging_jan",
    1: "lodging_feb",
    2: "lodging_mar",
    3: "lodging_apr",
    4: "lodging_may",
    5: "lodging_jun",
    6: "lodging_jul",
    7: "lodging_aug",
    8: "lodging_sep",
    9: "lodging_oct",
    10: "lodging_nov",
    11: "lodging_dec",
  };
  return monthColumns[date.getMonth()];
}

/**
 * Look up location from ZIP via gsa_zip_mappings.
 * Returns destination_id for joining to gsa_rates.
 */
export async function lookupLocation(
  zip: string,
): Promise<(LocationData & { destination_id: string }) | null> {
  const fiscalYear = getGsaFiscalYear();

  const { data, error } = await supabase
    .from("gsa_zip_mappings")
    .select("zip, destination_id, state, city, county, fiscal_year")
    .eq("zip", zip)
    .eq("fiscal_year", fiscalYear)
    .single();

  if (error || !data) {
    // Fallback: try without fiscal year filter (grab any mapping for this ZIP)
    const { data: fallback, error: fbError } = await supabase
      .from("gsa_zip_mappings")
      .select("zip, destination_id, state, city, county, fiscal_year")
      .eq("zip", zip)
      .order("fiscal_year", { ascending: false })
      .limit(1)
      .single();

    if (fbError || !fallback) return null;

    return {
      zip: fallback.zip,
      city: fallback.city || "",
      county: fallback.county || "",
      state: fallback.state,
      destination_id: fallback.destination_id,
    };
  }

  return {
    zip: data.zip,
    city: data.city || "",
    county: data.county || "",
    state: data.state,
    destination_id: data.destination_id,
  };
}

/**
 * Look up GSA per diem rates via destination_id.
 * This is the correct join path — NOT county name matching.
 * gsa_rates.county contains multi-county strings like "Essex / Bergen / Hudson / Passaic".
 * The destination_id is the canonical link between ZIP mappings and rate tables.
 */
export async function lookupGsaRates(
  destinationId: string,
  fiscalYear?: number,
): Promise<GsaData | null> {
  const fy = fiscalYear ?? getGsaFiscalYear();
  const now = new Date();
  const monthCol = getLodgingColumnForMonth(now);

  const { data, error } = await supabase
    .from("gsa_rates")
    .select("*")
    .eq("destination_id", destinationId)
    .eq("fiscal_year", fy)
    .single();

  if (error || !data) return null;

  // Use current month's seasonal lodging rate, falling back to max_lodging
  const rawData = data as Record<string, unknown>;
  const lodgingDaily: number =
    (rawData[monthCol] as number) ?? (rawData.max_lodging as number) ?? 0;
  const mealsDaily: number = (rawData.meals_daily as number) ?? 0;

  // Use pre-computed weekly_max from DB if available, otherwise derive
  const weeklyMax: number =
    (rawData.weekly_max as number) ?? (lodgingDaily + mealsDaily) * 7;
  const monthlyMax: number =
    (rawData.monthly_total as number) ?? (lodgingDaily + mealsDaily) * 30;

  return {
    fiscal_year: fy,
    lodging_daily: lodgingDaily,
    meals_daily: mealsDaily,
    weekly_max: weeklyMax,
    monthly_max: monthlyMax,
    city: (rawData.city as string) ?? "",
    county: (rawData.county as string) ?? "",
  };
}

// ━━━ HOUSING COST TYPES ━━━

export interface HousingCostData {
  zip: string;
  metro_area: string | null;
  fmr_studio: number | null;
  fmr_1br: number | null;
  fmr_2br: number | null;
  fmr_3br: number | null;
  fmr_4br: number | null;
  zori_rent: number | null;
}

export interface HousingCostResult extends HousingCostData {
  market_ratio: number | null; // zori_rent / fmr_1br
  fmr_1br_compat: number; // legacy compat
  county: string; // legacy compat
}

function normalizeZip(input: string | number): string | null {
  if (input === null || input === undefined) return null;

  // Keep digits only; supports inputs like "07030-1234"
  const digits = String(input).trim().replace(/\D/g, "");

  // Handle the common "leading zero dropped" case (e.g., 7030 -> 07030)
  if (digits.length === 4) return `0${digits}`;

  // Standard ZIP5 or ZIP+4
  if (digits.length >= 5) return digits.slice(0, 5);

  return null;
}

/**
 * Retrieves HUD SAFMR baseline and Zillow ZORI market rent deterministically by ZIP.
 * Replaces legacy fuzzy county matching against the old `hud_fmr` table.
 * O(1) primary-key lookup on `zip_housing_costs`.
 *
 * @param zipCode The 5-digit USPS ZIP code (string or number).
 */
export async function lookupHudFmr(
  zipCode: string | number,
  _legacyCounty?: string,
): Promise<HousingCostResult | null> {
  const cleanZip = normalizeZip(zipCode);
  if (!cleanZip) return null;

  const { data, error } = await supabase
    .from("zip_housing_costs")
    .select("zip, metro_area, fmr_studio, fmr_1br, fmr_2br, fmr_3br, fmr_4br, zori_rent")
    .eq("zip", cleanZip)
    .maybeSingle();

  if (error || !data) return null;

  const market_ratio =
    data.fmr_1br && data.zori_rent && data.fmr_1br > 0
      ? Number((data.zori_rent / data.fmr_1br).toFixed(2))
      : null;

  return {
    ...(data as HousingCostData),
    market_ratio,
    fmr_1br_compat: (data.fmr_1br as number) ?? 0,
    county: (data.metro_area as string) ?? ""
  };
}

/**
 * US state abbreviation → full name mapping.
 */
export const STATE_NAMES: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "District of Columbia",
};

/**
 * Convert text to URL slug.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
