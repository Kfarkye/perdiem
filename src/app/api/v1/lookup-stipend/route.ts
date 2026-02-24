import { NextResponse } from "next/server";
import { lookupLocation, lookupGsaRates, lookupHudFmr } from "@/lib/gsa";
import { deriveFinancials } from "@/lib/financials";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            zip,
            gross_weekly,
            hours = 36,
            specialty = "RN",
            agency_name,
        } = body;

        if (!zip || !gross_weekly) {
            return NextResponse.json(
                { error: "Missing required parameters: zip, gross_weekly" },
                { status: 400 }
            );
        }

        // 1. Resolve Location via ZIP Crosswalk
        const location = await lookupLocation(zip);
        if (!location) {
            return NextResponse.json(
                { error: "Location not found for the provided ZIP code" },
                { status: 404 }
            );
        }

        // 2. Resolve GSA Per Diem Rates (target current date for seasonal lodging)
        const today = new Date();
        const gsa = await lookupGsaRates(location.state, location.county, 2026);
        if (!gsa) {
            return NextResponse.json(
                { error: "GSA rates not found for this locality" },
                { status: 404 }
            );
        }

        // 3. Resolve HUD Fair Market Rents (fallback to a baseline if missing)
        const hud = await lookupHudFmr(zip, gsa.fiscal_year);
        const rent1Br = hud?.fmr_1br ?? 2000;

        // 4. Derive Core Financials (Taxes, Net, Surplus)
        const financials = deriveFinancials(
            gross_weekly,
            hours,
            gsa.lodging_daily,
            gsa.meals_daily,
            gsa.fiscal_year,
            rent1Br
        );

        // 5. Fire-and-Forget: Anonymous Pay Report Ingestion
        // This feeds the market index. Intentionally avoiding await to keep response fast.
        const ingestReport = async () => {
            try {
                await supabase.from("pay_reports").insert({
                    zip,
                    state: location.state,
                    county: location.county,
                    city: location.city,
                    specialty,
                    weekly_gross: gross_weekly,
                    hours_per_week: hours,
                    agency_name: agency_name || null,
                    stipend_weekly: financials.breakdown.stipend_weekly,
                    taxable_hourly: financials.breakdown.taxable_hourly,
                    source: "calculator",
                });
            } catch (e) {
                console.error("Failed to ingest anonymous pay report", e);
            }
        };
        // Suppress unhandled promise rejection warnings in Next.js Serverless runtime
        void ingestReport();

        return NextResponse.json({
            success: true,
            data: {
                location,
                financials,
                metadata: {
                    gsa_fiscal_year: gsa.fiscal_year,
                    hud_rent_source: hud ? `HUD FY${gsa.fiscal_year}` : "National Baseline",
                },
            },
        });
    } catch (error: any) {
        console.error("Lookup Stipend API Error:", error);
        return NextResponse.json(
            { error: "An unexpected error occurred during the financial calculation" },
            { status: 500 }
        );
    }
}
