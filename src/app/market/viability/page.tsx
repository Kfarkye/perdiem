"use client";

import React, { useState, useMemo } from "react";

/* ━━━ TYPES ━━━ */
interface StateRow {
    state: string;
    travel: number;
    rent: number;
    verified: boolean;
    n?: number;
    seasonalMultiplier?: number;  // peak-season housing markup
    seasonalPeak?: string;        // e.g. "Nov-Apr"
    seasonalNote?: string;        // why
}

interface SpecialtyData {
    label: string;
    soc: string;
    staffWeekly: number;
    states: StateRow[];
}

/* ━━━ DATA ━━━ */
const DATA: Record<string, SpecialtyData> = {
    RRT: {
        label: "Respiratory Therapist",
        soc: "29-1126",
        staffWeekly: 1535,
        states: [
            { state: "WA", travel: 2559, rent: 346, verified: true, n: 2 },
            { state: "IL", travel: 2526, rent: 254, verified: false, seasonalMultiplier: 1.20, seasonalPeak: "Nov–Mar", seasonalNote: "Chicago winter heating" },
            { state: "CA", travel: 2200, rent: 485, verified: false },
            { state: "NY", travel: 2100, rent: 404, verified: false },
            { state: "TX", travel: 1900, rent: 266, verified: false },
        ],
    },
    RN: {
        label: "Registered Nurse",
        soc: "29-1141",
        staffWeekly: 1690,
        states: [
            { state: "CA", travel: 2500, rent: 485, verified: false },
            { state: "NY", travel: 2400, rent: 404, verified: false },
            { state: "WA", travel: 2300, rent: 346, verified: false },
            { state: "AZ", travel: 2100, rent: 277, verified: false, seasonalMultiplier: 1.35, seasonalPeak: "Nov–Mar", seasonalNote: "Snowbird season" },
            { state: "TX", travel: 2000, rent: 266, verified: false },
            { state: "FL", travel: 1800, rent: 335, verified: false, seasonalMultiplier: 1.40, seasonalPeak: "Nov–Apr", seasonalNote: "Snowbird season" },
        ],
    },
    PT: {
        label: "Physical Therapist",
        soc: "29-1123",
        staffWeekly: 1943,
        states: [
            { state: "CA", travel: 2500, rent: 485, verified: false },
            { state: "AK", travel: 2453, rent: 310, verified: false, seasonalMultiplier: 1.15, seasonalPeak: "Jun–Aug", seasonalNote: "Tourism fills rooms" },
            { state: "NY", travel: 2400, rent: 404, verified: false },
            { state: "TX", travel: 2200, rent: 266, verified: false },
            { state: "AZ", travel: 2100, rent: 277, verified: false, seasonalMultiplier: 1.35, seasonalPeak: "Nov–Mar", seasonalNote: "Snowbird season" },
            { state: "FL", travel: 2000, rent: 335, verified: false, seasonalMultiplier: 1.40, seasonalPeak: "Nov–Apr", seasonalNote: "Snowbird season" },
        ],
    },
    CST: {
        label: "Surgical Technologist",
        soc: "29-2055",
        staffWeekly: 1208,
        states: [
            { state: "PA", travel: 2497, rent: 243, verified: false },
            { state: "MA", travel: 2180, rent: 439, verified: false, seasonalMultiplier: 1.45, seasonalPeak: "Jun–Sep", seasonalNote: "Cape Cod summer" },
            { state: "NY", travel: 1967, rent: 404, verified: false },
            { state: "NJ", travel: 1890, rent: 369, verified: false, seasonalMultiplier: 1.25, seasonalPeak: "Jun–Sep", seasonalNote: "Shore towns summer" },
            { state: "IL", travel: 1824, rent: 254, verified: false, seasonalMultiplier: 1.20, seasonalPeak: "Nov–Mar", seasonalNote: "Chicago winter heating" },
            { state: "GA", travel: 1589, rent: 277, verified: false },
            { state: "CA", travel: 1304, rent: 485, verified: true, n: 11 },
        ],
    },
    PHLEB: {
        label: "Phlebotomist",
        soc: "31-9097",
        staffWeekly: 840,
        states: [
            { state: "CA", travel: 1181, rent: 485, verified: true, n: 4 },
            { state: "ID", travel: 792, rent: 208, verified: true, n: 1 },
        ],
    },
    OT: {
        label: "Occupational Therapist",
        soc: "29-1122",
        staffWeekly: 1853,
        states: [
            { state: "CA", travel: 2310, rent: 485, verified: false },
            { state: "NY", travel: 2080, rent: 404, verified: false },
            { state: "TX", travel: 1915, rent: 266, verified: false },
            { state: "FL", travel: 1900, rent: 335, verified: false, seasonalMultiplier: 1.40, seasonalPeak: "Nov–Apr", seasonalNote: "Snowbird season" },
        ],
    },
    SLP: {
        label: "Speech-Language Pathologist",
        soc: "29-1127",
        staffWeekly: 1717,
        states: [
            { state: "CA", travel: 2787, rent: 485, verified: false },
            { state: "TX", travel: 2655, rent: 266, verified: false },
            { state: "MA", travel: 2489, rent: 439, verified: false, seasonalMultiplier: 1.45, seasonalPeak: "Jun–Sep", seasonalNote: "Cape Cod summer" },
            { state: "CO", travel: 2326, rent: 358, verified: false, seasonalMultiplier: 1.35, seasonalPeak: "Dec–Mar", seasonalNote: "Ski town premium" },
            { state: "NY", travel: 2200, rent: 404, verified: false },
            { state: "OR", travel: 2099, rent: 312, verified: false },
        ],
    },
    RAD: {
        label: "Radiologic Technologist",
        soc: "29-2034",
        staffWeekly: 1493,
        states: [
            { state: "WA", travel: 2610, rent: 346, verified: false },
            { state: "CA", travel: 2533, rent: 485, verified: false },
            { state: "NY", travel: 2400, rent: 404, verified: false },
            { state: "TX", travel: 1705, rent: 266, verified: false },
            { state: "FL", travel: 1368, rent: 335, verified: false, seasonalMultiplier: 1.40, seasonalPeak: "Nov–Apr", seasonalNote: "Snowbird season" },
        ],
    },
    LPN: {
        label: "Licensed Practical Nurse",
        soc: "29-2061",
        staffWeekly: 997,
        states: [
            { state: "OR", travel: 1816, rent: 312, verified: false },
            { state: "CA", travel: 1779, rent: 485, verified: false },
            { state: "FL", travel: 1520, rent: 335, verified: false, seasonalMultiplier: 1.40, seasonalPeak: "Nov–Apr", seasonalNote: "Snowbird season" },
            { state: "TX", travel: 1488, rent: 266, verified: false },
        ],
    },
    CNA: {
        label: "Certified Nursing Assistant",
        soc: "31-1131",
        staffWeekly: 697,
        states: [
            { state: "CA", travel: 1200, rent: 485, verified: false },
            { state: "CO", travel: 1100, rent: 358, verified: false, seasonalMultiplier: 1.35, seasonalPeak: "Dec–Mar", seasonalNote: "Ski town premium" },
            { state: "WA", travel: 1070, rent: 346, verified: false },
        ],
    },
};

/* ━━━ VIABILITY ━━━ */
function getViability(surplus: number, staff: number): "strong" | "marginal" | "below" {
    const ratio = surplus / staff;
    if (ratio >= 1.5) return "strong";
    if (ratio >= 1.0) return "marginal";
    return "below";
}

/* ━━━ COMPONENT ━━━ */
export default function MarketViabilityPage() {
    const [selected, setSelected] = useState("RRT");
    const [isPeak, setIsPeak] = useState(false);

    const spec = DATA[selected];
    const maxScale = 2800;
    const mono = "'Roboto Mono', 'SF Mono', monospace";
    const sans = "'Inter', -apple-system, sans-serif";

    // Compute rows with seasonal adjustment
    const rows = useMemo(() => {
        return spec.states.map((row) => {
            const adjustedRent = isPeak && row.seasonalMultiplier
                ? Math.round(row.rent * row.seasonalMultiplier)
                : row.rent;
            const surplus = row.travel - adjustedRent;
            return { ...row, adjustedRent, surplus };
        }).sort((a, b) => b.surplus - a.surplus);
    }, [spec, isPeak]);

    const seasonalCount = spec.states.filter((s) => s.seasonalMultiplier).length;
    const avgTravel = Math.round(rows.reduce((s, r) => s + r.travel, 0) / rows.length);
    const avgPremium = (avgTravel / spec.staffWeekly).toFixed(2);
    const verifiedCount = rows.filter((s) => s.verified).length;
    const staffPct = (spec.staffWeekly / maxScale) * 100;

    return (
        <div
            style={{
                maxWidth: 880,
                margin: "0 auto",
                padding: "60px 32px 80px",
                fontFamily: sans,
                color: "#1a1a1a",
                background: "#fafafa",
                minHeight: "100vh",
            }}
        >
            {/* Header */}
            <div style={{ fontFamily: mono, fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "#a3a3a3", marginBottom: 8 }}>
                Market Intelligence
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 6 }}>
                Travel Viability by State
            </h1>
            <p style={{ fontSize: 15, color: "#737373", lineHeight: 1.5, marginBottom: 40, maxWidth: 560 }}>
                Weekly travel compensation against local housing cost, measured
                against the permanent staff median. One bar. Three data points.
            </p>

            {/* Controls Row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 36 }}>
                {/* Specialty Selector */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontFamily: mono, fontSize: 12, color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        Specialty
                    </span>
                    <select
                        value={selected}
                        onChange={(e) => setSelected(e.target.value)}
                        style={{
                            fontFamily: mono,
                            fontSize: 14,
                            fontWeight: 500,
                            color: "#1a1a1a",
                            background: "#ffffff",
                            border: "1px solid #d4d4d4",
                            borderRadius: 6,
                            padding: "8px 36px 8px 14px",
                            cursor: "pointer",
                            appearance: "none" as const,
                            WebkitAppearance: "none" as const,
                        }}
                    >
                        {Object.entries(DATA).map(([key, val]) => (
                            <option key={key} value={key}>
                                {val.label} ({key})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Season Toggle */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        background: "#f0f0f0",
                        borderRadius: 6,
                        padding: 3,
                        gap: 0,
                    }}
                >
                    <button
                        onClick={() => setIsPeak(false)}
                        style={{
                            fontFamily: mono,
                            fontSize: 12,
                            fontWeight: 500,
                            letterSpacing: "0.04em",
                            padding: "7px 16px",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                            background: !isPeak ? "#1a1a1a" : "transparent",
                            color: !isPeak ? "#ffffff" : "#a3a3a3",
                            transition: "all 0.2s ease",
                        }}
                    >
                        Annual
                    </button>
                    <button
                        onClick={() => setIsPeak(true)}
                        style={{
                            fontFamily: mono,
                            fontSize: 12,
                            fontWeight: 500,
                            letterSpacing: "0.04em",
                            padding: "7px 16px",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                            background: isPeak ? "#1a1a1a" : "transparent",
                            color: isPeak ? "#ffffff" : "#a3a3a3",
                            transition: "all 0.2s ease",
                        }}
                    >
                        Peak Season
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div style={{ display: "flex", gap: 48, marginBottom: 40, paddingBottom: 24, borderBottom: "1px solid #e5e5e5", flexWrap: "wrap" }}>
                {[
                    { label: "Staff Median", value: `$${spec.staffWeekly.toLocaleString()}/wk` },
                    { label: "Avg Travel", value: `$${avgTravel.toLocaleString()}/wk` },
                    { label: "Avg Premium", value: `${avgPremium}×` },
                    { label: "States", value: `${rows.length}` },
                    { label: "Verified", value: `${verifiedCount}` },
                    ...(seasonalCount > 0 ? [{ label: "Seasonal", value: `${seasonalCount}` }] : []),
                ].map((m) => (
                    <div key={m.label} style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontFamily: mono, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "#a3a3a3", marginBottom: 4 }}>
                            {m.label}
                        </span>
                        <span style={{ fontFamily: mono, fontSize: 22, fontWeight: 500 }}>{m.value}</span>
                    </div>
                ))}
            </div>

            {/* Chart Header */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "56px 90px 90px 1fr 100px",
                    alignItems: "end",
                    padding: "0 0 8px 0",
                    borderBottom: "1px solid #e5e5e5",
                    marginBottom: 4,
                }}
            >
                {["State", "Travel", "Rent/wk", "", "Surplus"].map((h, i) => (
                    <span
                        key={h || i}
                        style={{
                            fontFamily: mono,
                            fontSize: 10,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            color: "#a3a3a3",
                            textAlign: i === 4 ? "right" : "left",
                        }}
                    >
                        {h}
                    </span>
                ))}
            </div>

            {/* Chart Rows */}
            {rows.map((row) => {
                const barWidthPct = (row.travel / maxScale) * 100;
                const rentPct = (row.adjustedRent / row.travel) * 100;
                const surplusPct = 100 - rentPct;
                const viability = getViability(row.surplus, spec.staffWeekly);
                const belowStaff = row.surplus < spec.staffWeekly;
                const isSeasonallyAdjusted = isPeak && row.seasonalMultiplier;

                return (
                    <div
                        key={row.state}
                        style={{
                            display: "grid",
                            gridTemplateColumns: "56px 90px 90px 1fr 100px",
                            alignItems: "center",
                            padding: "10px 0",
                            borderBottom: "1px solid #f0f0f0",
                            transition: "opacity 0.3s ease",
                        }}
                    >
                        {/* State */}
                        <div style={{ fontFamily: mono, fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                            {row.state}
                            {row.verified && (
                                <span style={{ fontSize: 11, color: "#1a1a1a" }} title={`Verified (n=${row.n})`}>✓</span>
                            )}
                        </div>

                        {/* Travel */}
                        <div style={{ fontFamily: mono, fontSize: 13, color: "#404040" }}>
                            ${row.travel.toLocaleString()}
                        </div>

                        {/* Rent — animates value change */}
                        <div style={{ fontFamily: mono, fontSize: 13, display: "flex", flexDirection: "column" }}>
                            <span style={{ color: isSeasonallyAdjusted ? "#1a1a1a" : "#a3a3a3", fontWeight: isSeasonallyAdjusted ? 500 : 400, transition: "color 0.3s" }}>
                                ${row.adjustedRent}
                            </span>
                            {isSeasonallyAdjusted && (
                                <span style={{ fontSize: 9, color: "#a3a3a3", fontFamily: mono, letterSpacing: "0.04em", marginTop: 1 }}>
                                    {row.seasonalPeak}
                                </span>
                            )}
                        </div>

                        {/* Depletion Bar */}
                        <div style={{ position: "relative", height: 24, width: "100%" }}>
                            {/* Staff parity line */}
                            <div
                                style={{
                                    position: "absolute",
                                    top: -4,
                                    bottom: -4,
                                    width: 1.5,
                                    background: "#a3a3a3",
                                    left: `${staffPct}%`,
                                    zIndex: 2,
                                }}
                            >
                                <div
                                    style={{
                                        position: "absolute",
                                        top: -14,
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        fontFamily: mono,
                                        fontSize: 8,
                                        letterSpacing: "0.08em",
                                        color: "#a3a3a3",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    STAFF
                                </div>
                            </div>

                            {/* Bar */}
                            <div
                                style={{
                                    display: "flex",
                                    height: "100%",
                                    width: `${barWidthPct}%`,
                                    borderRadius: 3,
                                    overflow: "hidden",
                                }}
                            >
                                <div
                                    style={{
                                        width: `${surplusPct}%`,
                                        height: "100%",
                                        background: belowStaff ? "#a3a3a3" : "#1a1a1a",
                                        transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1), background 0.4s ease",
                                    }}
                                />
                                <div
                                    style={{
                                        width: `${rentPct}%`,
                                        height: "100%",
                                        background: "#e5e5e5",
                                        transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                                    }}
                                />
                            </div>
                        </div>

                        {/* Surplus */}
                        <div
                            style={{
                                fontFamily: mono,
                                fontSize: 13,
                                fontWeight: 500,
                                textAlign: "right",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "flex-end",
                                gap: 6,
                                color: belowStaff ? "#a3a3a3" : "#1a1a1a",
                                transition: "color 0.3s",
                            }}
                        >
                            ${row.surplus.toLocaleString()}
                            <span
                                style={{
                                    display: "inline-block",
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    flexShrink: 0,
                                    ...(viability === "strong"
                                        ? { background: "#1a1a1a" }
                                        : viability === "marginal"
                                            ? { background: "linear-gradient(90deg, #1a1a1a 50%, #d4d4d4 50%)" }
                                            : { background: "transparent", border: "1.5px solid #a3a3a3" }),
                                }}
                            />
                        </div>
                    </div>
                );
            })}

            {/* Legend */}
            <div
                style={{
                    display: "flex",
                    gap: 24,
                    marginTop: 24,
                    paddingTop: 16,
                    borderTop: "1px solid #e5e5e5",
                    flexWrap: "wrap",
                }}
            >
                {[
                    { bg: "#1a1a1a", label: "Net surplus" },
                    { bg: "#e5e5e5", label: "Housing cost" },
                ].map((l) => (
                    <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: mono, fontSize: 10, color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        <div style={{ width: 16, height: 10, borderRadius: 2, background: l.bg }} />
                        {l.label}
                    </div>
                ))}
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: mono, fontSize: 10, color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    <div style={{ width: 16, height: 1.5, background: "#a3a3a3" }} />
                    Staff median
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: mono, fontSize: 10, color: "#a3a3a3", textTransform: "uppercase" }}>
                    <span style={{ fontSize: 11 }}>✓</span> Verified
                </div>
            </div>

            {/* Peak Season note */}
            {isPeak && seasonalCount > 0 && (
                <div
                    style={{
                        marginTop: 20,
                        padding: "14px 18px",
                        background: "#f5f5f5",
                        borderRadius: 6,
                        fontFamily: mono,
                        fontSize: 11,
                        color: "#737373",
                        lineHeight: 1.6,
                        transition: "opacity 0.3s ease",
                    }}
                >
                    <span style={{ fontWeight: 600, color: "#404040" }}>
                        {seasonalCount} state{seasonalCount > 1 ? "s" : ""} adjusted.
                    </span>{" "}
                    Peak season multipliers applied to short-term furnished housing.
                    HUD FMR is an annual average — travelers booking 13-week contracts
                    during peak months pay the seasonal rate, not the annual rate.
                </div>
            )}

            {/* Sources */}
            <div style={{ marginTop: 48, paddingTop: 20, borderTop: "1px solid #e5e5e5" }}>
                <div style={{ fontFamily: mono, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: "#a3a3a3", marginBottom: 6 }}>
                    Data Sources
                </div>
                <p style={{ fontSize: 11, color: "#a3a3a3", lineHeight: 1.6 }}>
                    Staff wages: U.S. Bureau of Labor Statistics, OEWS May 2024 (median, not mean).
                    Housing: HUD Fair Market Rents FY2026.
                    Seasonal adjustments: Furnished Finder / Airbnb market analysis, Feb 2026.
                    Travel rates: aggregated public listings. Verified (✓) = anonymized traveler-reported.
                </p>
            </div>
        </div>
    );
}
