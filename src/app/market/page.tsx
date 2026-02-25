import type { Metadata } from "next";
import { T, FONTS as f } from "@/lib/theme";
import { STATE_NAMES } from "@/lib/gsa";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Travel Nurse Market Index — PerDiem.fyi",
  description:
    "Explore per diem rates, nurse pay, and housing costs across all 50 states. Data from GSA.gov, HUD, and crowdsourced nurse reports.",
};

const STATES = Object.entries(STATE_NAMES).sort((a, b) =>
  a[1].localeCompare(b[1]),
);

export default function MarketIndexPage() {
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
          Travel Nurse Market Index
        </h1>
        <p
          style={{
            fontFamily: f.sans,
            fontSize: "15px",
            color: T.textSecondary,
            margin: "0 0 24px",
            lineHeight: 1.5,
            maxWidth: "540px",
          }}
        >
          Per diem rates, housing costs, and pay data for every state. Pick your
          state to see what you should be making.
        </p>

        {/* State Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: "8px",
          }}
        >
          {STATES.map(([abbr, name]) => (
            <Link
              key={abbr}
              href={`/market/us/${abbr.toLowerCase()}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 14px",
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: "10px",
                textDecoration: "none",
                transition: "border-color 0.15s ease, box-shadow 0.15s ease",
              }}
            >
              <span
                style={{
                  fontFamily: f.sans,
                  fontSize: "14px",
                  fontWeight: 500,
                  color: T.text,
                }}
              >
                {name}
              </span>
              <span
                style={{
                  fontFamily: f.mono,
                  fontSize: "12px",
                  fontWeight: 600,
                  color: T.textTertiary,
                }}
              >
                {abbr}
              </span>
            </Link>
          ))}
        </div>

        {/* Footer */}
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
          Per diem rates from{" "}
          <a
            href="https://www.gsa.gov/travel/plan-book/per-diem-rates"
            style={{ color: T.textTertiary }}
            target="_blank"
            rel="noopener noreferrer"
          >
            GSA.gov
          </a>
          . Housing data from HUD. Pay data crowdsourced from nurses (NLRA
          Section 7). Not an agency.
        </footer>
      </div>
    </div>
  );
}
