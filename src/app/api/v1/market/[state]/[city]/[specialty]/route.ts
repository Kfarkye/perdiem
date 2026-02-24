import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { STATE_NAMES } from "@/lib/gsa";
import { deriveGsaTotals } from "@/lib/financials";
import type { AgencyComparison } from "@/types";

interface RouteParams {
    params: Promise<{ state: string; city: string; specialty: string }>;
}

export const revalidate = 3600;

export async function GET(_request: Request, { params }: RouteParams) {
    const { state, city, specialty } = await params;
    const stateUpper = state.toUpperCase();
    const stateName = STATE_NAMES[stateUpper];

    if (!stateName) {
        return NextResponse.json(
            { error: "Invalid state", state: stateUpper },
            { status: 404 }
        );
    }

    const cityName = city
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

    const specialtyName = specialty
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

    // Fetch snapshot
    const { data: snapshot, error } = await supabase
        .from("market_snapshots")
        .select("*")
        .eq("state", stateUpper)
        .or(`city.ilike.%${cityName}%,county.ilike.%${cityName}%`)
        .ilike("specialty", specialtyName)
        .single();

    if (error || !snapshot) {
        return NextResponse.json(
            {
                error: "Market data not found",
                state: stateUpper,
                city: cityName,
                specialty: specialtyName,
            },
            { status: 404 }
        );
    }

    // Agency comparison
    const { data: reports } = await supabase
        .from("pay_reports")
        .select("agency_name, weekly_gross")
        .eq("state", stateUpper)
        .or(`city.ilike.%${cityName}%,county.ilike.%${cityName}%`)
        .ilike("specialty", specialtyName)
        .not("agency_name", "is", null);

    const agencyMap = new Map<string, { total: number; count: number }>();
    for (const r of reports ?? []) {
        if (!r.agency_name) continue;
        const existing = agencyMap.get(r.agency_name) ?? { total: 0, count: 0 };
        existing.total += r.weekly_gross;
        existing.count++;
        agencyMap.set(r.agency_name, existing);
    }

    const gsaWeekly = snapshot.gsa_weekly_total ?? 0;
    const agencies: AgencyComparison[] = Array.from(agencyMap.entries())
        .map(([name, agg]) => {
            const avgWeekly = Math.round(agg.total / agg.count);
            return {
                name,
                avg_weekly: avgWeekly,
                report_count: agg.count,
                stipend_pct:
                    gsaWeekly > 0 ? Math.round((avgWeekly / gsaWeekly) * 100) : 0,
            };
        })
        .sort((a, b) => b.report_count - a.report_count)
        .slice(0, 10);

    // Facilities
    const { data: facilities } = await supabase
        .from("facilities")
        .select("name, city, facility_type, bed_count")
        .eq("state", stateUpper)
        .or(`city.ilike.%${cityName}%,county.ilike.%${cityName}%`)
        .limit(10);

    const gsa = deriveGsaTotals(
        snapshot.gsa_lodging_daily ?? 0,
        snapshot.gsa_meals_daily ?? 0,
        snapshot.gsa_fiscal_year ?? 2026
    );

    return NextResponse.json({
        location: {
            state: stateUpper,
            state_name: stateName,
            county: snapshot.county,
            city: snapshot.city ?? snapshot.county,
        },
        specialty: specialtyName,
        gsa,
        housing: {
            studio_avg: snapshot.housing_studio_avg,
            one_bed_avg: snapshot.housing_1br_avg,
            two_bed_avg: snapshot.housing_2br_avg,
            one_bed_median: snapshot.housing_1br_median,
            listings_count: snapshot.housing_listings_count,
        },
        pay: {
            weekly_median: snapshot.pay_weekly_median,
            weekly_p25: snapshot.pay_weekly_p25,
            weekly_p75: snapshot.pay_weekly_p75,
            report_count: snapshot.pay_report_count ?? 0,
        },
        agencies,
        facilities: facilities ?? [],
        stipend_surplus_monthly: snapshot.stipend_surplus_monthly,
        snapshot_date: snapshot.snapshot_date,
    });
}
