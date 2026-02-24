// ━━━ GSA LOOKUP FUNCTIONS ━━━
// Queries Supabase for GSA rates, ZIP crosswalk, and HUD FMR data.

import { supabase } from "./supabase";
import type { LocationData, GsaData } from "@/types";
import { deriveGsaTotals } from "./financials";

/**
 * Look up location from ZIP via zip_county_crosswalk.
 */
export async function lookupLocation(zip: string): Promise<LocationData | null> {
    const { data, error } = await supabase
        .from("zip_county_crosswalk")
        .select("zip, county, state, city, latitude, longitude")
        .eq("zip", zip)
        .single();

    if (error || !data) return null;

    return {
        zip: data.zip,
        city: data.city ?? data.county,
        county: data.county,
        state: data.state,
        latitude: data.latitude ?? undefined,
        longitude: data.longitude ?? undefined,
    };
}

/**
 * Look up GSA per diem rates for a county/state and fiscal year.
 * Uses the current month's lodging rate for accuracy.
 */
export async function lookupGsaRates(
    state: string,
    county: string,
    fiscalYear: number = 2026
): Promise<GsaData | null> {
    const { data, error } = await supabase
        .from("gsa_rates")
        .select("*")
        .eq("fiscal_year", fiscalYear)
        .eq("state", state.toUpperCase())
        .ilike("county", county)
        .single();

    if (error || !data) return null;

    // Get the current month's lodging rate
    const monthMap: Record<number, string> = {
        0: "jan", 1: "feb", 2: "mar", 3: "apr", 4: "may", 5: "jun",
        6: "jul", 7: "aug", 8: "sep", 9: "oct", 10: "nov", 11: "dec_",
    };
    const currentMonth = new Date().getMonth();
    const monthKey = monthMap[currentMonth];
    const lodgingDaily = data[monthKey] ?? data.max_lodging ?? 0;
    const mealsDaily = data.meals_daily ?? 0;

    return deriveGsaTotals(lodgingDaily, mealsDaily, fiscalYear);
}

/**
 * Look up HUD Fair Market Rent for a ZIP.
 */
export async function lookupHudFmr(
    zip: string,
    fiscalYear: number = 2025
): Promise<{ fmr_1br: number } | null> {
    const { data, error } = await supabase
        .from("hud_fmr")
        .select("fmr_1br")
        .eq("zip", zip)
        .eq("fiscal_year", fiscalYear)
        .single();

    if (error || !data) return null;
    return { fmr_1br: data.fmr_1br ?? 0 };
}

/**
 * US state abbreviation → full name mapping.
 */
export const STATE_NAMES: Record<string, string> = {
    AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas",
    CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware",
    FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho",
    IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas",
    KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
    MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
    MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
    NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
    NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma",
    OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
    SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah",
    VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia",
    WI: "Wisconsin", WY: "Wyoming", DC: "District of Columbia",
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
