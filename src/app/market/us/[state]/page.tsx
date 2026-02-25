export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { STATE_NAMES, slugify } from "@/lib/gsa";
import { T, FONTS as f } from "@/lib/theme";

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
    title: `Travel Nurse Pay in ${stateName} — PerDiem.fyi`,
    description: `Travel nurse per diem rates, housing costs, and pay data for ${stateName}. Based on GSA.gov FY2026 rates and crowdsourced nurse reports.`,
  };
}

export default async function StatePage({ params }: StatePageProps) {
  const { state } = await params;
  const stateUpper = state.toUpperCase();
  const stateName = STATE_NAMES[stateUpper];
  if (!stateName) notFound();

  // Fetch market snapshots for this state
  const { data: snapshots } = await supabase
    .from("market_snapshots")
    .select(
      "city, county, specialty, gsa_weekly_total, pay_weekly_median, pay_report_count, housing_1br_avg, stipend_surplus_monthly",
    )
    .eq("state", stateUpper)
    .order("pay_report_count", { ascending: false });

  const cities = snapshots ?? [];

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
          <a
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
          </a>
          <a
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
          </a>
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
          <a
            href="/market"
            style={{ color: T.textTertiary, textDecoration: "none" }}
          >
            Market
          </a>
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
          Travel Nurse Pay in {stateName}
        </h1>
        <p
          style={{
            fontFamily: f.sans,
            fontSize: "15px",
            color: T.textSecondary,
            margin: "0 0 24px",
            lineHeight: 1.5,
          }}
        >
          Per diem rates, housing costs, and nurse pay data across {stateName}.
          Click a city for the full breakdown.
        </p>

        {cities.length === 0 ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: "12px",
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
            <a
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
            </a>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {cities.map((c) => {
              const cityName = c.city || c.county;
              const citySlug = slugify(cityName);
              return (
                <a
                  key={`${cityName}-${c.specialty}`}
                  href={`/market/us/${state}/${citySlug}/${slugify(c.specialty)}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 100px 100px 80px",
                    gap: "12px",
                    alignItems: "center",
                    padding: "14px 16px",
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    borderRadius: "10px",
                    textDecoration: "none",
                    transition: "border-color 0.15s ease",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: f.sans,
                        fontSize: "14px",
                        fontWeight: 500,
                        color: T.text,
                      }}
                    >
                      {cityName}
                    </div>
                    <div
                      style={{
                        fontFamily: f.sans,
                        fontSize: "11px",
                        color: T.textTertiary,
                      }}
                    >
                      {c.specialty}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontFamily: f.mono,
                        fontSize: "14px",
                        fontWeight: 600,
                        color: T.text,
                      }}
                    >
                      {c.gsa_weekly_total
                        ? `$${c.gsa_weekly_total.toLocaleString()}`
                        : "—"}
                    </div>
                    <div
                      style={{
                        fontFamily: f.sans,
                        fontSize: "10px",
                        color: T.textTertiary,
                      }}
                    >
                      GSA/wk
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontFamily: f.mono,
                        fontSize: "14px",
                        fontWeight: 600,
                        color: c.pay_weekly_median ? T.text : T.textTertiary,
                      }}
                    >
                      {c.pay_weekly_median
                        ? `$${c.pay_weekly_median.toLocaleString()}`
                        : "—"}
                    </div>
                    <div
                      style={{
                        fontFamily: f.sans,
                        fontSize: "10px",
                        color: T.textTertiary,
                      }}
                    >
                      Median/wk
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontFamily: f.sans,
                        fontSize: "11px",
                        color: T.textTertiary,
                      }}
                    >
                      {c.pay_report_count} reports
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
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
          Per diem rates from GSA.gov. Housing data from HUD. Pay data
          crowdsourced (NLRA Section 7). Not an agency.
        </footer>
      </div>
    </div>
  );
}
