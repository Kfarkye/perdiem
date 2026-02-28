export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { STATE_NAMES } from "@/lib/gsa";
import { FONTS as f } from "@/lib/theme";
import Link from "next/link";

// ━━━ TYPES ━━━

interface StatePageProps {
  params: Promise<{ state: string }>;
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

interface NlcRow {
  state_code: string;
  compact_member: boolean;
  walk_through: boolean;
}

interface TaxRow {
  state_code: string;
  has_income_tax: boolean;
  top_marginal_rate: number;
  notes: string | null;
}

// ━━━ PALETTE ━━━
// Ive-grade neutral palette — same DNA as the results view

const C = {
  bg: "#FFFFFF",
  black: "#000000",
  text: "#1A1A1A",
  secondary: "#6B6B6B",
  muted: "#8E8E93",
  hairline: "#E5E5EA",
  surface: "#F5F5F7",
  positive: "#34C759",
  positiveBg: "#F0FDF4",
  negative: "#FF3B30",
  negativeBg: "#FEF2F2",
  accent: "#007AFF",
  accentBg: "#EBF5FF",
  brand: "#1A8A6E",
  brandBg: "#E8F5F0",
  brandBorder: "#B8DDD0",
} as const;

const font = f.sans;

// ━━━ METADATA ━━━

export async function generateMetadata({
  params,
}: StatePageProps): Promise<Metadata> {
  const { state } = await params;
  const stateUpper = state.toUpperCase();
  const stateName = STATE_NAMES[stateUpper];
  if (!stateName) return {};

  return {
    title: `${stateName} — Travel Healthcare Markets · PerDiem.fyi`,
    description: `Weekly take-home by market in ${stateName}. GSA stipend ceilings vs. actual housing costs — ranked by what you keep. Data from GSA.gov, HUD FMR, and Zillow ZORI.`,
  };
}

// ━━━ HELPERS ━━━

function fmt(n: number): string {
  return Math.round(n).toLocaleString();
}

function spreadColor(spread: number): string {
  if (spread >= 400) return C.positive;
  if (spread >= 150) return C.text;
  if (spread >= 0) return C.muted;
  return C.negative;
}

// ━━━ PAGE ━━━

export default async function StatePage({ params }: StatePageProps) {
  const { state } = await params;
  const stateUpper = state.toUpperCase();
  const stateName = STATE_NAMES[stateUpper];
  if (!stateName) notFound();

  // Parallel data fetch
  const [localitiesRes, nlcRes, taxRes, reportsRes] = await Promise.all([
    supabase
      .from("market_locality_stats")
      .select("*")
      .eq("state", stateUpper)
      .order("zip_count", { ascending: false }),
    supabase
      .from("nlc_compact_states")
      .select("state_code, compact_member, walk_through")
      .eq("state_code", stateUpper)
      .maybeSingle(),
    supabase
      .from("state_income_tax")
      .select("state_code, has_income_tax, top_marginal_rate, notes")
      .eq("state_code", stateUpper)
      .maybeSingle(),
    supabase
      .from("pay_reports")
      .select("zip, weekly_gross, agency_name, specialty")
      .eq("state", stateUpper),
  ]);

  const rows = (localitiesRes.data ?? []) as LocalityRow[];
  const nlc = nlcRes.data as NlcRow | null;
  const tax = taxRes.data as TaxRow | null;
  const reports = reportsRes.data ?? [];

  // Compute weekly spread per locality and sort by spread descending
  const markets = rows
    .map((loc) => {
      const gsaWeekly = loc.gsa_weekly;
      const zori = loc.avg_zori_rent ? Number(loc.avg_zori_rent) : null;
      const fmr = loc.avg_fmr_1br ? Number(loc.avg_fmr_1br) : null;
      const rentMonthly = zori ?? fmr;
      const rentWeekly = rentMonthly ? rentMonthly / 4.33 : null;
      const spread = rentWeekly !== null ? gsaWeekly - rentWeekly : null;
      const rentSource = zori ? "Zillow" : fmr ? "HUD" : null;
      return { ...loc, rentMonthly, rentWeekly, spread, rentSource };
    })
    .sort((a, b) => {
      if (a.spread === null && b.spread === null) return 0;
      if (a.spread === null) return 1;
      if (b.spread === null) return -1;
      return b.spread - a.spread;
    });

  const isCompact = nlc?.compact_member === true;
  const noIncomeTax = tax?.has_income_tax === false;
  const topRate = tax?.top_marginal_rate ?? 0;
  const reportCount = reports.length;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text }}>
      <div
        style={{
          maxWidth: "640px",
          margin: "0 auto",
          padding: "24px 20px 80px",
        }}
      >
        {/* ━━━ HEADER ━━━ */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "32px",
          }}
        >
          <Link
            href="/market"
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
                background: C.brand,
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
                fontFamily: font,
                fontSize: "16px",
                fontWeight: 700,
                color: C.text,
                letterSpacing: "-0.01em",
              }}
            >
              Per<span style={{ color: C.brand }}>Diem</span>
              <span
                style={{
                  fontWeight: 400,
                  color: C.muted,
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
              fontFamily: font,
              fontSize: "13px",
              fontWeight: 600,
              color: C.brand,
              textDecoration: "none",
              padding: "6px 14px",
              borderRadius: "8px",
              border: `1px solid ${C.brandBorder}`,
              background: C.brandBg,
            }}
          >
            Check your offer →
          </Link>
        </div>

        {/* ━━━ STATE TITLE ━━━ */}
        <div
          style={{
            fontFamily: font,
            fontSize: "11px",
            fontWeight: 500,
            color: C.muted,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}
        >
          Travel Healthcare Markets
        </div>
        <h1
          style={{
            fontFamily: font,
            fontSize: "36px",
            fontWeight: 600,
            color: C.black,
            letterSpacing: "-0.025em",
            lineHeight: 1.1,
            margin: "0 0 16px",
          }}
        >
          {stateName}
        </h1>

        {/* ━━━ STATE BADGES ━━━ */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            marginBottom: "24px",
          }}
        >
          {isCompact && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontFamily: font,
                fontSize: "12px",
                fontWeight: 600,
                color: C.positive,
                background: C.positiveBg,
                padding: "5px 12px",
                borderRadius: "6px",
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
              NLC Compact
            </span>
          )}
          {!isCompact && nlc && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontFamily: font,
                fontSize: "12px",
                fontWeight: 600,
                color: C.negative,
                background: C.negativeBg,
                padding: "5px 12px",
                borderRadius: "6px",
              }}
            >
              State license required
            </span>
          )}
          {noIncomeTax && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontFamily: font,
                fontSize: "12px",
                fontWeight: 600,
                color: C.positive,
                background: C.positiveBg,
                padding: "5px 12px",
                borderRadius: "6px",
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
              No state income tax
            </span>
          )}
          {!noIncomeTax && tax && topRate > 0 && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                fontFamily: font,
                fontSize: "12px",
                fontWeight: 600,
                color: C.secondary,
                background: C.surface,
                padding: "5px 12px",
                borderRadius: "6px",
              }}
            >
              {topRate}% top marginal rate
            </span>
          )}
          {reportCount > 0 && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                fontFamily: font,
                fontSize: "12px",
                fontWeight: 600,
                color: C.brand,
                background: C.brandBg,
                padding: "5px 12px",
                borderRadius: "6px",
              }}
            >
              {reportCount} offer{reportCount !== 1 ? "s" : ""} reported
            </span>
          )}
        </div>

        {/* ━━━ THE EQUATION ━━━ */}
        <div
          style={{
            fontFamily: font,
            fontSize: "14px",
            color: C.secondary,
            lineHeight: 1.6,
            marginBottom: "32px",
          }}
        >
          GSA stipend ceiling minus housing cost = what you keep each week.
          Ranked by spread — highest first.
        </div>

        {/* ━━━ COLUMN HEADERS ━━━ */}
        {markets.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              padding: "0 0 8px",
              fontFamily: font,
              fontSize: "10px",
              fontWeight: 600,
              color: C.muted,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            <div>Market</div>
            <div style={{ textAlign: "right" }}>Weekly spread</div>
          </div>
        )}

        {/* ━━━ MARKET ROWS ━━━ */}
        {markets.length === 0 ? (
          <div
            style={{
              padding: "48px 20px",
              textAlign: "center",
              background: C.surface,
              borderRadius: "12px",
              marginTop: "8px",
            }}
          >
            <div
              style={{
                fontFamily: font,
                fontSize: "15px",
                color: C.secondary,
                marginBottom: "12px",
              }}
            >
              No market data available for {stateName} yet.
            </div>
            <Link
              href="/"
              style={{
                fontFamily: font,
                fontSize: "14px",
                fontWeight: 600,
                color: C.brand,
                textDecoration: "none",
              }}
            >
              Use the calculator to add data →
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0",
            }}
          >
            {markets.map((loc, i) => {
              const hasSpread = loc.spread !== null;
              const spread = loc.spread ?? 0;
              const isTop = i === 0 && hasSpread && spread > 0;

              return (
                <Link
                  key={loc.destination_id}
                  href={`/?zip=${loc.destination_id}&from=market`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: "16px",
                    alignItems: "center",
                    padding: "16px 0",
                    borderBottom: `1px solid ${C.hairline}`,
                    textDecoration: "none",
                    transition: "opacity 0.15s ease",
                  }}
                >
                  {/* Left: Market info */}
                  <div>
                    <div
                      style={{
                        fontFamily: font,
                        fontSize: "15px",
                        fontWeight: 500,
                        color: C.black,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      {loc.locality}
                      {isTop && (
                        <span
                          style={{
                            fontFamily: font,
                            fontSize: "10px",
                            fontWeight: 600,
                            color: C.positive,
                            background: C.positiveBg,
                            padding: "1px 6px",
                            borderRadius: "4px",
                            letterSpacing: "0.02em",
                          }}
                        >
                          Best spread
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontFamily: font,
                        fontSize: "12px",
                        color: C.muted,
                        marginTop: "2px",
                        display: "flex",
                        gap: "6px",
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <span>${fmt(loc.gsa_weekly)}/wk GSA</span>
                      <span style={{ color: C.hairline }}>·</span>
                      {loc.rentMonthly ? (
                        <span>
                          ${fmt(loc.rentMonthly)}/mo rent
                          <span
                            style={{
                              color: C.muted,
                              fontSize: "10px",
                              marginLeft: "3px",
                            }}
                          >
                            {loc.rentSource}
                          </span>
                        </span>
                      ) : (
                        <span style={{ color: C.muted }}>No rent data</span>
                      )}
                    </div>
                  </div>

                  {/* Right: The spread — the hero number */}
                  <div style={{ textAlign: "right", minWidth: "80px" }}>
                    {hasSpread ? (
                      <>
                        <div
                          style={{
                            fontFamily: font,
                            fontSize: "20px",
                            fontWeight: 600,
                            color: spreadColor(spread),
                            letterSpacing: "-0.02em",
                            lineHeight: 1,
                          }}
                        >
                          {spread >= 0 ? "+" : "\u2212"}${fmt(Math.abs(spread))}
                        </div>
                        <div
                          style={{
                            fontFamily: font,
                            fontSize: "10px",
                            color: C.muted,
                            marginTop: "2px",
                          }}
                        >
                          /week
                        </div>
                      </>
                    ) : (
                      <div
                        style={{
                          fontFamily: font,
                          fontSize: "14px",
                          color: C.muted,
                        }}
                      >
                        —
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* ━━━ HOW TO READ THIS ━━━ */}
        {markets.length > 0 && (
          <div
            style={{
              marginTop: "32px",
              padding: "20px",
              background: C.surface,
              borderRadius: "12px",
            }}
          >
            <div
              style={{
                fontFamily: font,
                fontSize: "13px",
                fontWeight: 600,
                color: C.black,
                marginBottom: "10px",
              }}
            >
              How to read the spread
            </div>
            <div
              style={{
                fontFamily: font,
                fontSize: "12px",
                color: C.secondary,
                lineHeight: 1.7,
              }}
            >
              The <strong>weekly spread</strong> is the GSA per diem ceiling
              (the maximum tax-free stipend an agency can pay) minus average
              weekly housing cost in that market.
              A positive spread means the stipend ceiling covers rent with
              room left over. A higher spread means you keep more each week
              after housing.
            </div>
            <div
              style={{
                fontFamily: font,
                fontSize: "12px",
                color: C.secondary,
                lineHeight: 1.7,
                marginTop: "10px",
              }}
            >
              <strong>GSA ceiling</strong> is from{" "}
              <a
                href="https://www.gsa.gov/travel/plan-book/per-diem-rates"
                style={{ color: C.brand }}
                target="_blank"
                rel="noopener noreferrer"
              >
                GSA.gov
              </a>{" "}
              FY2026. <strong>Rent</strong> uses Zillow Observed Rent Index
              where available, otherwise{" "}
              <a
                href="https://www.huduser.gov/portal/datasets/fmr.html"
                style={{ color: C.brand }}
                target="_blank"
                rel="noopener noreferrer"
              >
                HUD Fair Market Rent
              </a>
              . Actual stipends depend on the agency and assignment.
            </div>
          </div>
        )}

        {/* ━━━ LICENSING ━━━ */}
        <div
          style={{
            marginTop: "24px",
            padding: "20px",
            background: isCompact ? C.brandBg : C.surface,
            border: isCompact ? `1px solid ${C.brandBorder}` : "none",
            borderRadius: "12px",
          }}
        >
          <div
            style={{
              fontFamily: font,
              fontSize: "13px",
              fontWeight: 600,
              color: C.black,
              marginBottom: "6px",
            }}
          >
            Licensing in {stateName}
          </div>
          <div
            style={{
              fontFamily: font,
              fontSize: "12px",
              color: C.secondary,
              lineHeight: 1.7,
            }}
          >
            {isCompact ? (
              <>
                {stateName} is part of the{" "}
                <a
                  href="https://www.ncsbn.org/compacts/nurse-licensure-compact.page"
                  style={{ color: C.brand }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Nurse Licensure Compact (NLC)
                </a>
                . If your home state is also an NLC member and you hold a
                multistate license, you can practice in {stateName} without
                applying for a separate state license.
                {nlc?.walk_through && (
                  <span>
                    {" "}
                    {stateName} also supports walk-through licensure for
                    expedited processing.
                  </span>
                )}
              </>
            ) : (
              <>
                {stateName} is <strong>not</strong> part of the Nurse Licensure
                Compact. You&apos;ll need to apply for a{" "}
                {stateName} state license before starting an assignment.
                Check your state nursing board for processing times — some
                states take 4–8 weeks.
              </>
            )}
          </div>
        </div>

        {/* ━━━ CTA ━━━ */}
        <div
          style={{
            marginTop: "24px",
            padding: "24px 20px",
            background: C.bg,
            border: `1px solid ${C.hairline}`,
            borderRadius: "12px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: font,
              fontSize: "15px",
              fontWeight: 600,
              color: C.black,
              marginBottom: "6px",
            }}
          >
            Got an offer in {stateName}?
          </div>
          <div
            style={{
              fontFamily: font,
              fontSize: "13px",
              color: C.secondary,
              marginBottom: "16px",
              lineHeight: 1.5,
            }}
          >
            Plug in your ZIP and gross pay to see exactly what you keep.
          </div>
          <Link
            href="/"
            style={{
              display: "inline-block",
              fontFamily: font,
              fontSize: "14px",
              fontWeight: 600,
              color: "#fff",
              background: C.brand,
              padding: "10px 28px",
              borderRadius: "8px",
              textDecoration: "none",
            }}
          >
            Check your offer →
          </Link>
        </div>

        {/* ━━━ FOOTER ━━━ */}
        <footer
          style={{
            fontFamily: font,
            fontSize: "10px",
            color: C.muted,
            lineHeight: 1.7,
            padding: "24px 0 0",
            marginTop: "32px",
          }}
        >
          GSA per diem rates from{" "}
          <a
            href="https://www.gsa.gov/travel/plan-book/per-diem-rates"
            style={{ color: C.muted }}
            target="_blank"
            rel="noopener noreferrer"
          >
            GSA.gov
          </a>{" "}
          (FY2026). Housing baseline from{" "}
          <a
            href="https://www.huduser.gov/portal/datasets/fmr.html"
            style={{ color: C.muted }}
            target="_blank"
            rel="noopener noreferrer"
          >
            HUD FMR
          </a>
          . Observed rent from Zillow ZORI. Crowdsourced offer data from
          clinicians (NLRA Section 7). Compact data from{" "}
          <a
            href="https://www.ncsbn.org/compacts/nurse-licensure-compact.page"
            style={{ color: C.muted }}
            target="_blank"
            rel="noopener noreferrer"
          >
            NCSBN
          </a>
          . Not an agency — not financial advice.
        </footer>
      </div>
    </div>
  );
}
