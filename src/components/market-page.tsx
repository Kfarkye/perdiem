"use client";

import { T, FONTS as f } from "@/lib/theme";
import type { MarketPageData, AgencyComparison } from "@/types";

// ━━━ PRIMITIVES ━━━

function Logo() {
    return (
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
                <span style={{ fontWeight: 400, color: T.textTertiary, fontSize: "13px" }}>
                    .fyi
                </span>
            </span>
        </a>
    );
}

function GovBadge({ text }: { text: string }) {
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontFamily: f.sans,
                fontSize: "10px",
                fontWeight: 600,
                color: T.accent,
                background: T.accentMuted,
                border: `1px solid ${T.accentBorder}`,
                padding: "2px 8px",
                borderRadius: "4px",
                letterSpacing: "0.04em",
            }}
        >
            <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke={T.accent}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            {text}
        </span>
    );
}

function MicroLabel({ children }: { children: React.ReactNode }) {
    return (
        <span
            style={{
                fontFamily: f.sans,
                fontSize: "10px",
                fontWeight: 600,
                color: T.textTertiary,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
            }}
        >
            {children}
        </span>
    );
}

function Card({
    children,
    style = {},
}: {
    children: React.ReactNode;
    style?: React.CSSProperties;
}) {
    return (
        <div
            style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: "12px",
                padding: "20px",
                ...style,
            }}
        >
            {children}
        </div>
    );
}

function MoneyValue({
    value,
    size = "28px",
    color = T.text,
    unit,
}: {
    value: string;
    size?: string;
    color?: string;
    unit?: string;
}) {
    return (
        <div style={{ display: "flex", alignItems: "baseline", gap: "3px" }}>
            <span
                style={{
                    fontFamily: f.mono,
                    fontSize: size,
                    fontWeight: 700,
                    color,
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                }}
            >
                {value}
            </span>
            {unit && (
                <span style={{ fontFamily: f.sans, fontSize: "13px", color: T.textTertiary }}>
                    {unit}
                </span>
            )}
        </div>
    );
}

function StipendPctDot({ pct }: { pct: number }) {
    const color =
        pct >= 95 ? T.moneyPositive : pct >= 90 ? T.accent : T.moneyNegative;
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontFamily: f.mono,
                fontSize: "12px",
                fontWeight: 600,
                color,
            }}
        >
            <span
                style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: color,
                }}
            />
            {pct}%
        </span>
    );
}

// ━━━ MARKET PAGE COMPONENT ━━━

export default function MarketPage({ data }: { data: MarketPageData }) {
    const d = data;

    return (
        <div style={{ background: T.bg, minHeight: "100vh", color: T.text }}>
            <div
                style={{
                    maxWidth: "880px",
                    margin: "0 auto",
                    padding: "24px 16px 80px",
                }}
            >
                {/* ━━━ Header ━━━ */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "24px",
                    }}
                >
                    <Logo />
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

                {/* ━━━ Breadcrumb ━━━ */}
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
                    <a
                        href={`/market/us/${d.location.state.toLowerCase()}`}
                        style={{ color: T.textTertiary, textDecoration: "none" }}
                    >
                        {d.location.state_name}
                    </a>
                    <span>›</span>
                    <span style={{ color: T.textSecondary }}>{d.location.city}</span>
                </nav>

                {/* ━━━ Page Title ━━━ */}
                <h1
                    style={{
                        fontFamily: f.sans,
                        fontSize: "24px",
                        fontWeight: 700,
                        color: T.text,
                        margin: "0 0 4px",
                        letterSpacing: "-0.01em",
                    }}
                >
                    {d.specialty} Pay in {d.location.city}, {d.location.state}
                </h1>
                <p
                    style={{
                        fontFamily: f.sans,
                        fontSize: "14px",
                        color: T.textSecondary,
                        margin: "0 0 24px",
                        lineHeight: 1.5,
                    }}
                >
                    What travel nurses should actually make here, based on{" "}
                    {d.pay.report_count} nurse reports and federal per diem data.
                </p>

                {/* ━━━ Key Metrics Grid ━━━ */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "12px",
                        marginBottom: "16px",
                    }}
                >
                    {/* GSA Ceiling */}
                    <Card>
                        <GovBadge text={`GSA.GOV · FY${d.gsa.fiscal_year}`} />
                        <div style={{ marginTop: "10px" }}>
                            <MicroLabel>PER DIEM CEILING</MicroLabel>
                        </div>
                        <div style={{ marginTop: "6px" }}>
                            <MoneyValue
                                value={`$${d.gsa.weekly_max.toLocaleString()}`}
                                size="28px"
                                color={T.text}
                                unit="/week"
                            />
                        </div>
                        <div
                            style={{
                                fontFamily: f.sans,
                                fontSize: "11px",
                                color: T.textTertiary,
                                marginTop: "4px",
                            }}
                        >
                            Lodging ${d.gsa.lodging_daily}/night + M&IE ${d.gsa.meals_daily}
                            /day
                        </div>
                    </Card>

                    {/* Median Pay */}
                    <Card>
                        <MicroLabel>MEDIAN WEEKLY GROSS</MicroLabel>
                        <div style={{ marginTop: "10px" }}>
                            {d.pay.weekly_median ? (
                                <>
                                    <MoneyValue
                                        value={`$${d.pay.weekly_median.toLocaleString()}`}
                                        size="28px"
                                        color={T.text}
                                        unit="/week"
                                    />
                                    <div
                                        style={{
                                            fontFamily: f.sans,
                                            fontSize: "11px",
                                            color: T.textTertiary,
                                            marginTop: "4px",
                                        }}
                                    >
                                        P25: ${d.pay.weekly_p25?.toLocaleString()} · P75: $
                                        {d.pay.weekly_p75?.toLocaleString()}
                                    </div>
                                </>
                            ) : (
                                <div
                                    style={{
                                        fontFamily: f.sans,
                                        fontSize: "13px",
                                        color: T.textTertiary,
                                        marginTop: "4px",
                                    }}
                                >
                                    Not enough data yet.{" "}
                                    <a href="/" style={{ color: T.primary }}>
                                        Add yours
                                    </a>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* 1BR Rent */}
                    <Card>
                        <MicroLabel>AVG 1BR RENT</MicroLabel>
                        <div style={{ marginTop: "10px" }}>
                            {d.housing.one_bed_avg ? (
                                <>
                                    <MoneyValue
                                        value={`$${d.housing.one_bed_avg.toLocaleString()}`}
                                        size="28px"
                                        color={T.text}
                                        unit="/month"
                                    />
                                    <div
                                        style={{
                                            fontFamily: f.sans,
                                            fontSize: "11px",
                                            color: T.textTertiary,
                                            marginTop: "4px",
                                        }}
                                    >
                                        Source: HUD FMR
                                    </div>
                                </>
                            ) : (
                                <div
                                    style={{
                                        fontFamily: f.sans,
                                        fontSize: "13px",
                                        color: T.textTertiary,
                                        marginTop: "4px",
                                    }}
                                >
                                    No data available
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Surplus */}
                    <Card>
                        <MicroLabel>TAX-FREE SURPLUS</MicroLabel>
                        <div style={{ marginTop: "10px" }}>
                            {d.stipend_surplus_monthly !== null ? (
                                <MoneyValue
                                    value={`${d.stipend_surplus_monthly >= 0 ? "+" : ""}$${d.stipend_surplus_monthly.toLocaleString()}`}
                                    size="28px"
                                    color={
                                        d.stipend_surplus_monthly >= 0
                                            ? T.moneyPositive
                                            : T.moneyNegative
                                    }
                                    unit="/month"
                                />
                            ) : (
                                <div
                                    style={{
                                        fontFamily: f.sans,
                                        fontSize: "13px",
                                        color: T.textTertiary,
                                        marginTop: "4px",
                                    }}
                                >
                                    Insufficient data
                                </div>
                            )}
                        </div>
                        <div
                            style={{
                                fontFamily: f.sans,
                                fontSize: "11px",
                                color: T.textTertiary,
                                marginTop: "4px",
                            }}
                        >
                            Per diem − rent
                        </div>
                    </Card>
                </div>

                {/* ━━━ Agency Comparison ━━━ */}
                {d.agencies.length > 0 && (
                    <Card style={{ marginBottom: "16px" }}>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "12px",
                            }}
                        >
                            <MicroLabel>AGENCY COMPARISON</MicroLabel>
                            <span
                                style={{
                                    fontFamily: f.sans,
                                    fontSize: "10px",
                                    color: T.textTertiary,
                                    background: T.surfaceRaised,
                                    padding: "2px 8px",
                                    borderRadius: "4px",
                                }}
                            >
                                {d.pay.report_count} REPORTS
                            </span>
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 80px 60px 60px",
                                gap: "8px",
                                padding: "0 0 8px",
                                borderBottom: `1px solid ${T.border}`,
                            }}
                        >
                            {["Agency", "Avg/wk", "Reports", "% GSA"].map((h, i) => (
                                <span
                                    key={h}
                                    style={{
                                        fontFamily: f.sans,
                                        fontSize: "10px",
                                        fontWeight: 600,
                                        color: T.textTertiary,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.06em",
                                        textAlign: i >= 1 ? "right" : "left",
                                    }}
                                >
                                    {h}
                                </span>
                            ))}
                        </div>

                        {d.agencies.map((a: AgencyComparison, i: number) => (
                            <div
                                key={a.name}
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 80px 60px 60px",
                                    gap: "8px",
                                    padding: "10px 0",
                                    borderBottom:
                                        i < d.agencies.length - 1
                                            ? `1px solid ${T.borderSubtle}`
                                            : "none",
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily: f.sans,
                                        fontSize: "13px",
                                        fontWeight: 500,
                                        color: T.text,
                                    }}
                                >
                                    {a.name}
                                </span>
                                <span
                                    style={{
                                        fontFamily: f.mono,
                                        fontSize: "14px",
                                        fontWeight: 600,
                                        color: T.text,
                                        textAlign: "right",
                                    }}
                                >
                                    ${a.avg_weekly.toLocaleString()}
                                </span>
                                <span
                                    style={{
                                        fontFamily: f.sans,
                                        fontSize: "11px",
                                        color: T.textTertiary,
                                        textAlign: "right",
                                    }}
                                >
                                    {a.report_count}
                                </span>
                                <div style={{ textAlign: "right" }}>
                                    <StipendPctDot pct={a.stipend_pct} />
                                </div>
                            </div>
                        ))}
                    </Card>
                )}

                {/* ━━━ Facilities ━━━ */}
                {d.facilities.length > 0 && (
                    <Card style={{ marginBottom: "16px" }}>
                        <MicroLabel>NEARBY FACILITIES</MicroLabel>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                                gap: "10px",
                                marginTop: "12px",
                            }}
                        >
                            {d.facilities.slice(0, 6).map((fac) => (
                                <div
                                    key={fac.name}
                                    style={{
                                        padding: "10px 12px",
                                        background: T.surfaceRaised,
                                        borderRadius: "8px",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontFamily: f.sans,
                                            fontSize: "13px",
                                            fontWeight: 500,
                                            color: T.text,
                                        }}
                                    >
                                        {fac.name}
                                    </div>
                                    <div
                                        style={{
                                            fontFamily: f.sans,
                                            fontSize: "11px",
                                            color: T.textTertiary,
                                            marginTop: "2px",
                                        }}
                                    >
                                        {fac.facility_type}
                                        {fac.bed_count ? ` · ${fac.bed_count} beds` : ""}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* ━━━ CTA ━━━ */}
                <Card
                    style={{
                        marginBottom: "16px",
                        textAlign: "center",
                        background: T.primaryMuted,
                        border: `1px solid ${T.primaryBorder}`,
                    }}
                >
                    <h2
                        style={{
                            fontFamily: f.sans,
                            fontSize: "18px",
                            fontWeight: 700,
                            color: T.text,
                            margin: "0 0 8px",
                        }}
                    >
                        Check your offer for {d.location.city}
                    </h2>
                    <p
                        style={{
                            fontFamily: f.sans,
                            fontSize: "14px",
                            color: T.textSecondary,
                            margin: "0 0 16px",
                            lineHeight: 1.5,
                        }}
                    >
                        Enter your ZIP and what they&apos;re offering — we&apos;ll show you what
                        GSA says you should get and what you actually keep.
                    </p>
                    <a
                        href="/"
                        style={{
                            fontFamily: f.sans,
                            fontSize: "15px",
                            fontWeight: 600,
                            padding: "12px 32px",
                            borderRadius: "10px",
                            border: "none",
                            background: T.primary,
                            color: "#fff",
                            textDecoration: "none",
                            display: "inline-block",
                        }}
                    >
                        Check your offer →
                    </a>
                </Card>

                {/* ━━━ Footer ━━━ */}
                <footer
                    style={{
                        fontFamily: f.sans,
                        fontSize: "10px",
                        color: T.textTertiary,
                        lineHeight: 1.6,
                        padding: "16px 0",
                        borderTop: `1px solid ${T.borderSubtle}`,
                    }}
                >
                    Pay data comes from nurses like you (protected under NLRA Section 7).
                    Per diem rates from{" "}
                    <a
                        href="https://www.gsa.gov/travel/plan-book/per-diem-rates"
                        style={{ color: T.textTertiary }}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        GSA.gov
                    </a>
                    . Housing data from HUD + public furnished rental averages.
                    Not an agency. Not sponsored by one. Just the math.
                </footer>
            </div>
        </div>
    );
}
