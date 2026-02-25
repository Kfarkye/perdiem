export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { STATE_NAMES } from "@/lib/gsa";
import { T, FONTS as f } from "@/lib/theme";
import Link from "next/link";

interface StatePageProps {
  params: Promise<{ state: string }>;
}

export async function generateMetadata({
  params,
}: StatePageProps): Promise<Metadata> {
  const { state } = await params;
  const stateUpper = state.toUpperCase();
  const stateName = STATE_NAMES[stateUpper];
  if (!stateName) return {};

  return {
    title: `Travel Healthcare Stipends & Housing in ${stateName} — PerDiem.fyi`,
    description: `Compare GSA tax-free stipend ceilings vs. actual rent in ${stateName}. See which ${stateName} markets let you keep the most. Data from GSA.gov, HUD FMR, and Zillow ZORI.`,
  };
}

interface LocalityRow {
  state: string;
  locality: string;
  county: string;
  destination_id: string;
  max_lodging: number;
  meals_daily: number;
  gsa_weekly: number;
  zip_count: number;
  avg_fmr_1br: string | null;
  avg_zori_rent: string | null;
  market_ratio: string | null;
  rent_budget: string | null;
  rent_mid: string | null;
  rent_furnished: string | null;
}

export default async function StatePage({ params }: StatePageProps) {
  const { state } = await params;
  const stateUpper = state.toUpperCase();
  const stateName = STATE_NAMES[stateUpper];
  if (!stateName) notFound();

  const { data: localities } = await supabase
    .from("market_locality_stats")
    .select("*")
    .eq("state", stateUpper)
    .order("zip_count", { ascending: false });

  // Fetch pay report counts by state
  const { data: reportCounts } = await supabase
    .from("pay_reports")
    .select("zip, weekly_gross, agency_name, specialty")
    .eq("state", stateUpper);

  const reports = reportCounts ?? [];
  const uniqueAgencies = [...new Set(reports.map((r) => r.agency_name).filter(Boolean))];
  const rows = (localities ?? []) as LocalityRow[];

  // Compute break-even % for each locality
  const enriched = rows.map((loc) => {
    const gsaMonthly = (loc.max_lodging + loc.meals_daily) * 30;
    const observedRent = loc.avg_zori_rent ? Number(loc.avg_zori_rent) : null;
    const fmrRent = loc.avg_fmr_1br ? Number(loc.avg_fmr_1br) : null;
    const effectiveRent = observedRent ?? fmrRent;
    const breakEvenPct = effectiveRent && gsaMonthly > 0
      ? Math.round((effectiveRent / gsaMonthly) * 100)
      : null;
    return { ...loc, gsaMonthly, effectiveRent, breakEvenPct };
  });

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.text }}>
      <div
        style={{
          maxWidth: "880px",
          margin: "0 auto",
          padding: "24px 16px 80px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: T.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <span
              style={{
                fontFamily: f.sans,
                fontSize: "16px",
                fontWeight: 700,
                color: T.text,
                letterSpacing: "-0.01em",
              }}
            >
              Per<span style={{ color: T.primary }}>Diem</span>
              <span
                style={{
                  fontWeight: 400,
                  color: T.textTertiary,
                  fontSize: "13px",
                }}
              >
                .fyi
              </span>
            </span>
          </Link>
          <Link
            href="/"
            style={{
              fontFamily: f.sans,
              fontSize: "13px",
              fontWeight: 600,
              color: T.primary,
              textDecoration: "none",
              padding: "6px 14px",
              borderRadius: "8px",
              border: `1px solid ${T.primaryBorder}`,
              background: T.primaryMuted,
            }}
          >
            Check your offer →
          </Link>
        </div>

        {/* Breadcrumb */}
        <nav
          style={{
            fontFamily: f.sans,
            fontSize: "12px",
            color: T.textTertiary,
            marginBottom: "16px",
            display: "flex",
            gap: "4px",
            alignItems: "center",
          }}
        >
          <Link
            href="/market"
            style={{ color: T.textTertiary, textDecoration: "none" }}
          >
            Market
          </Link>
          <span>›</span>
          <span style={{ color: T.textSecondary }}>{stateName}</span>
        </nav>

        <h1
          style={{
            fontFamily: f.sans,
            fontSize: "24px",
            fontWeight: 700,
            color: T.text,
            margin: "0 0 8px",
            letterSpacing: "-0.01em",
          }}
        >
          Travel Healthcare Stipends & Housing in {stateName}
        </h1>
        <p
          style={{
            fontFamily: f.sans,
            fontSize: "15px",
            color: T.textSecondary,
            margin: "0 0 8px",
            lineHeight: 1.5,
          }}
        >
          How much of the GSA ceiling do you need just to cover rent? Markets
          ranked by break-even threshold — the lower, the more you keep.
        </p>

        {/* Crowdsourced data badge */}
        {reports.length > 0 && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              background: T.primaryMuted,
              border: `1px solid ${T.primaryBorder}`,
              borderRadius: "6px",
              fontFamily: f.sans,
              fontSize: "12px",
              fontWeight: 600,
              color: T.primary,
              marginBottom: "16px",
            }}
          >
            <span style={{ fontSize: "14px" }}>📊</span>
            {reports.length} clinician{reports.length !== 1 ? "s" : ""} reported
            offers in {stateName}
            {uniqueAgencies.length > 0 && (
              <span style={{ color: T.textSecondary, fontWeight: 400 }}>
                · {uniqueAgencies.join(", ")}
              </span>
            )}
          </div>
        )}

        {enriched.length === 0 ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: "12px",
              marginTop: "16px",
            }}
          >
            <p
              style={{
                fontFamily: f.sans,
                fontSize: "15px",
                color: T.textSecondary,
                marginBottom: "12px",
              }}
            >
              No market data available for {stateName} yet.
            </p>
            <Link
              href="/"
              style={{
                fontFamily: f.sans,
                fontSize: "14px",
                fontWeight: 600,
                color: T.primary,
                textDecoration: "none",
              }}
            >
              Use the calculator to add data →
            </Link>
          </div>
        ) : (
          <>
            {/* Column Headers */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 90px 90px 90px 80px",
                gap: "8px",
                padding: "8px 16px",
                marginTop: "16px",
                fontFamily: f.sans,
                fontSize: "10px",
                fontWeight: 600,
                color: T.textTertiary,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              <div>Market</div>
              <div style={{ textAlign: "right" }}>GSA Ceiling</div>
              <div style={{ textAlign: "right" }}>Avg Rent</div>
              <div style={{ textAlign: "right" }}>Market Ratio</div>
              <div style={{ textAlign: "right" }}>Break-Even</div>
            </div>

            {/* Locality Rows */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              {enriched.map((loc) => {
                const ratio = loc.market_ratio ? Number(loc.market_ratio) : null;
                const isHot = ratio !== null && ratio > 1.2;
                const isCool = ratio !== null && ratio < 1.0;

                return (
                  <Link
                    key={loc.destination_id}
                    href={`/?zip=${loc.destination_id}&from=market`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 90px 90px 90px 80px",
                      gap: "8px",
                      alignItems: "center",
                      padding: "14px 16px",
                      background: T.surface,
                      border: `1px solid ${T.border}`,
                      borderRadius: "10px",
                      textDecoration: "none",
                      transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                    }}
                  >
                    {/* Locality Name */}
                    <div>
                      <div
                        style={{
                          fontFamily: f.sans,
                          fontSize: "14px",
                          fontWeight: 600,
                          color: T.text,
                        }}
                      >
                        {loc.locality}
                      </div>
                      <div
                        style={{
                          fontFamily: f.sans,
                          fontSize: "11px",
                          color: T.textTertiary,
                          marginTop: "2px",
                        }}
                      >
                        {loc.county} · {loc.zip_count} ZIPs
                      </div>
                    </div>

                    {/* GSA Ceiling Weekly */}
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontFamily: f.mono,
                          fontSize: "14px",
                          fontWeight: 600,
                          color: T.text,
                        }}
                      >
                        ${loc.gsa_weekly.toLocaleString()}
                      </div>
                      <div
                        style={{
                          fontFamily: f.sans,
                          fontSize: "10px",
                          color: T.textTertiary,
                        }}
                      >
                        /week
                      </div>
                    </div>

                    {/* Avg Rent */}
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontFamily: f.mono,
                          fontSize: "14px",
                          fontWeight: 600,
                          color: loc.effectiveRent ? T.text : T.textTertiary,
                        }}
                      >
                        {loc.effectiveRent
                          ? `$${Math.round(loc.effectiveRent).toLocaleString()}`
                          : "—"}
                      </div>
                      <div
                        style={{
                          fontFamily: f.sans,
                          fontSize: "10px",
                          color: T.textTertiary,
                        }}
                      >
                        {loc.avg_zori_rent ? "Zillow" : loc.avg_fmr_1br ? "HUD" : ""}/mo
                      </div>
                    </div>

                    {/* Market Ratio */}
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontFamily: f.mono,
                          fontSize: "14px",
                          fontWeight: 700,
                          color: isHot
                            ? T.moneyNegative
                            : isCool
                              ? T.moneyPositive
                              : T.text,
                        }}
                      >
                        {ratio !== null ? `${ratio}×` : "—"}
                      </div>
                      <div
                        style={{
                          fontFamily: f.sans,
                          fontSize: "10px",
                          color: T.textTertiary,
                        }}
                      >
                        {isHot ? "hot market" : isCool ? "favorable" : ""}
                      </div>
                    </div>

                    {/* Break-Even */}
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontFamily: f.mono,
                          fontSize: "14px",
                          fontWeight: 700,
                          color:
                            loc.breakEvenPct !== null && loc.breakEvenPct <= 50
                              ? T.moneyPositive
                              : loc.breakEvenPct !== null && loc.breakEvenPct >= 80
                                ? T.moneyNegative
                                : T.text,
                        }}
                      >
                        {loc.breakEvenPct !== null ? `${loc.breakEvenPct}%` : "—"}
                      </div>
                      <div
                        style={{
                          fontFamily: f.sans,
                          fontSize: "10px",
                          color: T.textTertiary,
                        }}
                      >
                        of ceiling
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Explainer */}
            <div
              style={{
                marginTop: "24px",
                padding: "16px",
                background: T.surfaceInset,
                border: `1px solid ${T.borderSubtle}`,
                borderRadius: "10px",
              }}
            >
              <div
                style={{
                  fontFamily: f.sans,
                  fontSize: "13px",
                  fontWeight: 700,
                  color: T.text,
                  marginBottom: "8px",
                }}
              >
                How to read this
              </div>
              <div
                style={{
                  fontFamily: f.sans,
                  fontSize: "12px",
                  color: T.textSecondary,
                  lineHeight: 1.6,
                }}
              >
                <strong>GSA Ceiling</strong> is the maximum tax-free stipend an
                agency <em>can</em> pay — not what you&apos;ll get. Your actual
                stipend depends on the assignment.
                <br />
                <strong>Avg Rent</strong> is the Zillow Observed Rent Index
                (ZORI) where available, or the HUD Fair Market Rent baseline.
                <br />
                <strong>Market Ratio</strong> shows how much higher observed
                rent is vs. the federal baseline. Under 1.0× = favorable. Over
                1.2× = hot market where rent outpaces the government estimate.
                <br />
                <strong>Break-Even %</strong> is the minimum % of the GSA
                ceiling your stipend needs to cover rent. Lower = more room to
                keep the difference.
              </div>
            </div>

            {/* CTA */}
            <div
              style={{
                marginTop: "16px",
                padding: "16px",
                background: T.primaryMuted,
                border: `1px solid ${T.primaryBorder}`,
                borderRadius: "10px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: f.sans,
                  fontSize: "14px",
                  fontWeight: 600,
                  color: T.text,
                  marginBottom: "6px",
                }}
              >
                Got an offer in {stateName}?
              </div>
              <div
                style={{
                  fontFamily: f.sans,
                  fontSize: "12px",
                  color: T.textSecondary,
                  marginBottom: "12px",
                }}
              >
                Plug in your ZIP and gross pay to see exactly how your stipend
                compares. Every search helps other clinicians see what agencies
                are really paying.
              </div>
              <Link
                href="/"
                style={{
                  display: "inline-block",
                  fontFamily: f.sans,
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#fff",
                  background: T.primary,
                  padding: "10px 24px",
                  borderRadius: "8px",
                  textDecoration: "none",
                }}
              >
                Check your offer →
              </Link>
            </div>
          </>
        )}

        <footer
          style={{
            fontFamily: f.sans,
            fontSize: "10px",
            color: T.textTertiary,
            lineHeight: 1.6,
            padding: "24px 0 0",
            marginTop: "32px",
            borderTop: `1px solid ${T.borderSubtle}`,
          }}
        >
          GSA per diem rates from{" "}
          <a
            href="https://www.gsa.gov/travel/plan-book/per-diem-rates"
            style={{ color: T.textTertiary }}
            target="_blank"
            rel="noopener noreferrer"
          >
            GSA.gov
          </a>
          {" "}(FY2026). Housing baseline from{" "}
          <a
            href="https://www.huduser.gov/portal/datasets/fmr.html"
            style={{ color: T.textTertiary }}
            target="_blank"
            rel="noopener noreferrer"
          >
            HUD FMR
          </a>
          . Observed rent from Zillow ZORI. Crowdsourced offer data from
          clinicians (NLRA Section 7). Not an agency — not financial advice.
        </footer>
      </div>
    </div>
  );
}
