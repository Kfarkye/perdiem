"use client";

import React, { useState } from "react";

/* ━━━ DATA (from seeded migration — BLS OES May 2024 + aggregated listings) ━━━ */
const DATA: Record<string, SpecialtyData> = {
    RRT: {
        label: "Respiratory Therapist",
        soc: "29-1126",
        staffWeekly: 1535, // $79,830 / 52
        states: [
            { state: "WA", travel: 2559, rent: 346, verified: true, n: 2 },
            { state: "IL", travel: 2526, rent: 254, verified: false },
            { state: "CA", travel: 2200, rent: 485, verified: false },
            { state: "NY", travel: 2100, rent: 404, verified: false },
            { state: "TX", travel: 1900, rent: 266, verified: false },
        ],
    },
    RN: {
        label: "Registered Nurse",
        soc: "29-1141",
        staffWeekly: 1690, // $87,900 / 52
        states: [
            { state: "CA", travel: 2500, rent: 485, verified: false },
            { state: "NY", travel: 2400, rent: 404, verified: false },
            { state: "WA", travel: 2300, rent: 346, verified: false },
            { state: "AZ", travel: 2100, rent: 277, verified: false },
            { state: "TX", travel: 2000, rent: 266, verified: false },
            { state: "FL", travel: 1800, rent: 335, verified: false },
        ],
    },
    PT: {
        label: "Physical Therapist",
        soc: "29-1123",
        staffWeekly: 1943, // $101,020 / 52
        states: [
            { state: "CA", travel: 2500, rent: 485, verified: false },
            { state: "AK", travel: 2453, rent: 289, verified: false },
            { state: "NY", travel: 2400, rent: 404, verified: false },
            { state: "TX", travel: 2200, rent: 266, verified: false },
            { state: "AZ", travel: 2100, rent: 277, verified: false },
            { state: "FL", travel: 2000, rent: 335, verified: false },
        ],
    },
    CST: {
        label: "Surgical Technologist",
        soc: "29-2055",
        staffWeekly: 1208, // $62,830 / 52
        states: [
            { state: "PA", travel: 2497, rent: 243, verified: false },
            { state: "MA", travel: 2180, rent: 439, verified: false },
            { state: "NY", travel: 1967, rent: 404, verified: false },
            { state: "NJ", travel: 1890, rent: 369, verified: false },
            { state: "IL", travel: 1824, rent: 254, verified: false },
            { state: "GA", travel: 1589, rent: 277, verified: false },
            { state: "CA", travel: 1304, rent: 485, verified: true, n: 11 },
        ],
    },
    PHLEB: {
        label: "Phlebotomist",
        soc: "31-9097",
        staffWeekly: 840, // $43,660 / 52
        states: [
            { state: "CA", travel: 1181, rent: 485, verified: true, n: 4 },
            { state: "ID", travel: 792, rent: 208, verified: true, n: 1 },
        ],
    },
};

/* ━━━ TYPES ━━━ */
interface StateRow {
    state: string;
    travel: number;
    rent: number;
    verified: boolean;
    n?: number;
}

interface SpecialtyData {
    label: string;
    soc: string;
    staffWeekly: number;
    states: StateRow[];
}

/* ━━━ VIABILITY LOGIC ━━━ */
function getViability(surplus: number, staff: number): "strong" | "marginal" | "below" {
    const ratio = surplus / staff;
    if (ratio >= 1.5) return "strong";
    if (ratio >= 1.0) return "marginal";
    return "below";
}

function getViabilityDot(v: "strong" | "marginal" | "below") {
    if (v === "strong") return <span style={dotStyles.strong} />;
    if (v === "marginal") return <span style={dotStyles.marginal} />;
    return <span style={dotStyles.below} />;
}

const dotStyles = {
    strong: {
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: "#1a1a1a",
        marginLeft: 6,
        verticalAlign: "middle",
    } as React.CSSProperties,
    marginal: {
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: "linear-gradient(90deg, #1a1a1a 50%, #d4d4d4 50%)",
        marginLeft: 6,
        verticalAlign: "middle",
    } as React.CSSProperties,
    below: {
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: "transparent",
        border: "1.5px solid #a3a3a3",
        marginLeft: 6,
        verticalAlign: "middle",
    } as React.CSSProperties,
};

/* ━━━ COMPONENT ━━━ */
export default function MarketViabilityPage() {
    const [selected, setSelected] = useState("RRT");
    const spec = DATA[selected];
    const sorted = [...spec.states].sort((a, b) => (b.travel - b.rent) - (a.travel - a.rent));
    const maxScale = 2800; // ceiling for bar width

    const avgTravel = Math.round(sorted.reduce((s, r) => s + r.travel, 0) / sorted.length);
    const avgPremium = (avgTravel / spec.staffWeekly).toFixed(2);
    const verifiedCount = sorted.filter((s) => s.verified).length;
    const staffPct = (spec.staffWeekly / maxScale) * 100;

    const mono = "'Roboto Mono', 'SF Mono', monospace";
    const sans = "'Inter', -apple-system, sans-serif";

    return (
        <div
            style={{
                maxWidth: 860,
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

            {/* Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
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
                    }}
                >
                    {Object.entries(DATA).map(([key, val]) => (
                        <option key={key} value={key}>
                            {val.label} ({key})
                        </option>
                    ))}
                </select>
            </div>

            {/* Metrics */}
            <div style={{ display: "flex", gap: 48, marginBottom: 40, paddingBottom: 24, borderBottom: "1px solid #e5e5e5" }}>
                {[
                    { label: "Staff Median", value: `$${spec.staffWeekly.toLocaleString()}/wk` },
                    { label: "Avg Travel", value: `$${avgTravel.toLocaleString()}/wk` },
                    { label: "Avg Premium", value: `${avgPremium}×` },
                    { label: "States", value: `${sorted.length}` },
                    { label: "Verified", value: `${verifiedCount}` },
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
                    gridTemplateColumns: "56px 90px 90px 1fr 80px",
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
            {sorted.map((row) => {
                const surplus = row.travel - row.rent;
                const barWidthPct = (row.travel / maxScale) * 100;
                const rentPct = (row.rent / row.travel) * 100;
                const surplusPct = 100 - rentPct;
                const viability = getViability(surplus, spec.staffWeekly);
                const belowStaff = surplus < spec.staffWeekly;

                return (
                    <div
                        key={row.state}
                        style={{
                            display: "grid",
                            gridTemplateColumns: "56px 90px 90px 1fr 80px",
                            alignItems: "center",
                            padding: "10px 0",
                            borderBottom: "1px solid #f0f0f0",
                        }}
                    >
                        <div style={{ fontFamily: mono, fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                            {row.state}
                            {row.verified && (
                                <span style={{ fontSize: 11, color: "#1a1a1a" }} title={`Verified (n=${row.n})`}>
                                    ✓
                                </span>
                            )}
                        </div>
                        <div style={{ fontFamily: mono, fontSize: 13, color: "#404040" }}>
                            ${row.travel.toLocaleString()}
                        </div>
                        <div style={{ fontFamily: mono, fontSize: 13, color: "#a3a3a3" }}>
                            ${row.rent}
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
                                        transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s",
                                    }}
                                />
                                <div
                                    style={{
                                        width: `${rentPct}%`,
                                        height: "100%",
                                        background: "#e5e5e5",
                                        transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                                    }}
                                />
                            </div>
                        </div>

                        <div
                            style={{
                                fontFamily: mono,
                                fontSize: 13,
                                fontWeight: 500,
                                textAlign: "right",
                                color: belowStaff ? "#a3a3a3" : "#1a1a1a",
                            }}
                        >
                            ${surplus.toLocaleString()}
                            {getViabilityDot(viability)}
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
                    { color: "#1a1a1a", label: "Net surplus" },
                    { color: "#e5e5e5", label: "Housing cost" },
                ].map((l) => (
                    <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: mono, fontSize: 10, color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        <div style={{ width: 16, height: 10, borderRadius: 2, background: l.color }} />
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

            {/* Sources */}
            <div style={{ marginTop: 48, paddingTop: 20, borderTop: "1px solid #e5e5e5" }}>
                <div style={{ fontFamily: mono, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: "#a3a3a3", marginBottom: 6 }}>
                    Data Sources
                </div>
                <p style={{ fontSize: 11, color: "#a3a3a3", lineHeight: 1.6 }}>
                    Pay data: U.S. Bureau of Labor Statistics, Occupational Employment and Wage Statistics (OEWS), May 2024.
                    Housing: U.S. Department of Housing and Urban Development, Fair Market Rents, FY2026.
                    Travel rates aggregated from public job listings. Verified (✓)
                    rates sourced from anonymized traveler-reported contracts.
                </p>
            </div>
        </div>
    );
}
