import { NextResponse } from "next/server";
import { z } from "zod";
import { lookupLocation, lookupGsaRates, lookupHudFmr, getGsaFiscalYear } from "@/lib/gsa";
import { deriveFinancials } from "@/lib/financials";
import { createServiceClient } from "@/lib/supabase";

// ━━━ INPUT VALIDATION SCHEMA ━━━
const LookupStipendSchema = z.object({
    zip: z
        .string()
        .regex(/^\d{5}$/, "ZIP must be exactly 5 digits"),
    gross_weekly: z
        .coerce.number()
        .min(200, "Gross weekly must be at least $200")
        .max(15000, "Gross weekly cannot exceed $15,000"),
    hours: z
        .coerce.number()
        .min(8, "Hours must be at least 8")
        .max(80, "Hours cannot exceed 80")
        .default(36),
    specialty: z
        .string()
        .max(50, "Specialty must be under 50 characters")
        .default("RN"),
    agency_name: z
        .string()
        .max(100, "Agency name must be under 100 characters")
        .optional()
        .nullable(),
});

// ━━━ SIMPLE IN-MEMORY RATE LIMITER ━━━
// Serverless-friendly: resets on cold start, but catches rapid abuse within a single instance.
// For production at scale, use Vercel KV or Upstash Redis.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 20; // 20 requests per minute per IP

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

export async function POST(req: Request) {
    try {
        // ━━━ Rate Limit Check ━━━
        const forwarded = req.headers.get("x-forwarded-for");
        const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";

        if (!checkRateLimit(ip)) {
            return NextResponse.json(
                { error: "Too many requests. Please wait a minute." },
                { status: 429, headers: { "Retry-After": "60" } }
            );
        }

        // ━━━ Parse & Validate Input ━━━
        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json(
                { error: "Invalid JSON body" },
                { status: 400 }
            );
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
                { status: 400 }
            );
        }

        const { zip, gross_weekly, hours, specialty, agency_name } = parsed.data;

        // ━━━ 1. Resolve Location via ZIP → gsa_zip_mappings ━━━
        const location = await lookupLocation(zip);
        if (!location) {
            return NextResponse.json(
                { error: `No GSA locality found for ZIP ${zip}. Check the ZIP and try again.` },
                { status: 404 }
            );
        }

        // ━━━ 2. Resolve GSA Rates via destination_id → gsa_rates ━━━
        const fiscalYear = getGsaFiscalYear();
        const gsa = await lookupGsaRates(location.destination_id, fiscalYear);
        if (!gsa) {
            return NextResponse.json(
                {
                    error: `GSA rates not found for destination ${location.destination_id} (FY${fiscalYear}). Data may not be seeded for this fiscal year.`,
                },
                { status: 404 }
            );
        }

        // ━━━ 3. Resolve HUD Fair Market Rents (fuzzy county match) ━━━
        const hud = await lookupHudFmr(location.state, gsa.county ?? "");
        const rent1Br = hud?.fmr_1br ?? 1800; // National median fallback

        // ━━━ 4. Derive All Financials ━━━
        const financials = deriveFinancials(
            gross_weekly,
            hours,
            gsa.lodging_daily,
            gsa.meals_daily,
            gsa.fiscal_year,
            rent1Br
        );

        // ━━━ 5. Fire-and-Forget: Anonymous Pay Report Ingestion ━━━
        // Uses service client to bypass RLS. No PII stored.
        const ingestReport = async () => {
            try {
                const serviceClient = createServiceClient();
                await serviceClient.from("pay_reports").insert({
                    zip,
                    state: location.state,
                    county: gsa.county ?? location.county,
                    city: gsa.city ?? location.city,
                    specialty,
                    weekly_gross: gross_weekly,
                    hours_per_week: hours,
                    agency_name: agency_name || null,
                    stipend_weekly: financials.breakdown.stipend_weekly,
                    taxable_hourly: financials.breakdown.taxable_hourly,
                    source: "calculator",
                    ip_hash: ip !== "unknown" ? await hashIP(ip) : null,
                });
            } catch (e) {
                console.error("[pay_reports] Ingestion failed:", e);
            }
        };
        void ingestReport();

        // ━━━ 6. Return Result ━━━
        return NextResponse.json({
            success: true,
            data: {
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
                metadata: {
                    gsa_fiscal_year: gsa.fiscal_year,
                    hud_rent_source: hud ? `HUD FY2025 · ${hud.county}` : "National Median Estimate",
                    tax_method: "Flat 20% estimate on taxable portion only",
                    assumptions: [
                        "Tax-free stipend capped at GSA per diem ceiling (IRS Pub 463)",
                        "Tax estimate is ~20% flat on taxable wages — not a tax calculation",
                        `HUD FMR 1BR: $${rent1Br}/mo — ${hud ? "county-level data" : "national fallback"}`,
                        "Contract projection assumes 13 weeks standard",
                    ],
                },
            },
        });
    } catch (error: unknown) {
        console.error("[lookup-stipend] Unhandled error:", error);
        return NextResponse.json(
            { error: "An unexpected error occurred. Please try again." },
            { status: 500 }
        );
    }
}

/**
 * One-way hash of IP address for deduplication without storing PII.
 * Uses Web Crypto API (available in Edge Runtime and Node.js 18+).
 */
async function hashIP(ip: string): Promise<string> {
    const salt = process.env.IP_HASH_SALT ?? "perdiem-fyi-2026";
    const encoder = new TextEncoder();
    const data = encoder.encode(`${salt}:${ip}`);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

// ━━━ CORS Preflight Handler ━━━
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
