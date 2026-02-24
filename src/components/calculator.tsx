"use client";

import { useState, useEffect, useCallback } from "react";
import { T, FONTS as f } from "@/lib/theme";

// ━━━ RESULT DATA (static demo — replaced by Supabase lookup in production) ━━━
const RESULT = {
    zip: "07030",
    city: "Hoboken",
    county: "Hudson",
    state: "NJ",
    weeklyGross: 2500,
    hours: 36,
    gsaLodging: 201,
    gsaMeals: 79,
    gsaWeeklyMax: 1960,
    gsaMonthlyMax: 8400,
    fiscalYear: 2026,
    taxableWeekly: 540,
    taxableHourly: 15.0,
    taxEstimate: 108,
    netWeekly: 2392,
    housing1br: 2140,
    stipendSurplus: 3890,
    contractGross: 32500,
    contractNet: 31096,
    taxFreeTotal: 25480,
    agencies: [
        { name: "Agency A", avg: 2540, reports: 12, stipendPct: 96 },
        { name: "Agency B", avg: 2480, reports: 8, stipendPct: 91 },
        { name: "Agency C", avg: 2390, reports: 5, stipendPct: 88 },
    ],
};

// ━━━ UI PRIMITIVES ━━━

function Logo() {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
        </div>
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
                <span
                    style={{
                        fontFamily: f.sans,
                        fontSize: "13px",
                        color: T.textTertiary,
                    }}
                >
                    {unit}
                </span>
            )}
        </div>
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

function ProgressBar({
    value,
    max,
    color,
    height = "6px",
}: {
    value: number;
    max: number;
    color: string;
    height?: string;
}) {
    const pct = Math.min((value / max) * 100, 100);
    return (
        <div
            style={{
                width: "100%",
                height,
                background: T.surfaceRaised,
                borderRadius: "99px",
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: color,
                    borderRadius: "99px",
                    transition: "width 1s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
            />
        </div>
    );
}

function NegotiationBand() {
    const bands = [
        { pct: 70, value: 1372, label: "Low", color: T.moneyNegative },
        { pct: 80, value: 1568, label: "Avg", color: T.accent },
        { pct: 95, value: 1862, label: "Fair", color: T.moneyPositive },
        { pct: 100, value: 1960, label: "Max", color: T.primary },
    ];

    return (
        <div style={{ padding: "16px 0" }}>
            <div style={{ position: "relative", height: "36px", marginBottom: "8px" }}>
                <div
                    style={{
                        position: "absolute",
                        top: "14px",
                        left: 0,
                        right: 0,
                        height: "8px",
                        background: T.surfaceRaised,
                        borderRadius: "4px",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: "4px",
                            background: `linear-gradient(90deg, ${T.moneyNegative}40 0%, ${T.accent}60 50%, ${T.moneyPositive}80 75%, ${T.primary} 100%)`,
                        }}
                    />
                </div>
                {bands.map((b) => (
                    <div
                        key={b.pct}
                        style={{
                            position: "absolute",
                            left: `${((b.pct - 70) / 30) * 100}%`,
                            top: 0,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            transform: "translateX(-50%)",
                        }}
                    >
                        <span
                            style={{
                                fontFamily: f.sans,
                                fontSize: "9px",
                                fontWeight: 600,
                                color: b.color,
                                marginBottom: "2px",
                            }}
                        >
                            {b.pct}%
                        </span>
                        <div
                            style={{
                                width: "2px",
                                height: "20px",
                                background: b.color,
                                borderRadius: "1px",
                            }}
                        />
                    </div>
                ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                {bands.map((b) => (
                    <div key={b.pct} style={{ textAlign: "center", flex: 1 }}>
                        <div
                            style={{
                                fontFamily: f.mono,
                                fontSize: "12px",
                                fontWeight: 600,
                                color: b.color,
                            }}
                        >
                            ${b.value.toLocaleString()}
                        </div>
                        <div
                            style={{
                                fontFamily: f.sans,
                                fontSize: "10px",
                                color: T.textTertiary,
                            }}
                        >
                            {b.label}
                        </div>
                    </div>
                ))}
            </div>
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

// ━━━ CALCULATOR INPUT VIEW ━━━

function CalculatorInput({
    step,
    onSubmit,
    zip,
    setZip,
    gross,
    setGross,
}: {
    step: number;
    onSubmit: () => void;
    zip: string;
    setZip: (v: string) => void;
    gross: string;
    setGross: (v: string) => void;
}) {
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter") onSubmit();
        },
        [onSubmit]
    );

    if (step === 0) {
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "60px 20px",
                    gap: "24px",
                    minHeight: "100vh",
                }}
            >
                <Logo />
                <h1
                    style={{
                        fontFamily: f.sans,
                        fontSize: "24px",
                        fontWeight: 700,
                        color: T.text,
                        textAlign: "center",
                        margin: 0,
                        letterSpacing: "-0.01em",
                        lineHeight: 1.3,
                    }}
                >
                    Know your rate
                    <br />
                    before you sign.
                </h1>
                <p
                    style={{
                        fontFamily: f.sans,
                        fontSize: "15px",
                        color: T.textSecondary,
                        textAlign: "center",
                        margin: 0,
                        maxWidth: "320px",
                        lineHeight: 1.5,
                    }}
                >
                    Plug in your assignment ZIP and see what GSA says your per diem should
                    be. The math your recruiter won&apos;t show you.
                </p>
                <div style={{ width: "100%", maxWidth: "320px" }}>
                    <label
                        htmlFor="zip-input"
                        style={{
                            fontFamily: f.sans,
                            fontSize: "12px",
                            fontWeight: 500,
                            color: T.textSecondary,
                            display: "block",
                            marginBottom: "6px",
                        }}
                    >
                        Where&apos;s your assignment?
                    </label>
                    <input
                        id="zip-input"
                        type="text"
                        inputMode="numeric"
                        maxLength={5}
                        value={zip}
                        onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
                        onKeyDown={handleKeyDown}
                        placeholder="07030"
                        autoFocus
                        style={{
                            width: "100%",
                            boxSizing: "border-box",
                            fontFamily: f.mono,
                            fontSize: "24px",
                            fontWeight: 600,
                            padding: "14px 16px",
                            borderRadius: "10px",
                            border: `2px solid ${zip.length === 5 ? T.borderFocus : T.border}`,
                            background: T.surface,
                            color: T.text,
                            outline: "none",
                            textAlign: "center",
                            letterSpacing: "0.1em",
                            transition: "border-color 0.2s ease",
                        }}
                    />
                </div>
                <button
                    onClick={() => zip.length === 5 && onSubmit()}
                    disabled={zip.length !== 5}
                    style={{
                        fontFamily: f.sans,
                        fontSize: "15px",
                        fontWeight: 600,
                        padding: "12px 40px",
                        borderRadius: "10px",
                        border: "none",
                        background: zip.length === 5 ? T.primary : T.surfaceRaised,
                        color: zip.length === 5 ? "#fff" : T.textTertiary,
                        cursor: zip.length === 5 ? "pointer" : "default",
                        transition: "all 0.2s ease",
                    }}
                >
                    Look up my per diem →
                </button>
            </div>
        );
    }

    if (step === 1) {
        return (
            <div
                style={{
                    padding: "32px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                    alignItems: "center",
                    minHeight: "100vh",
                    justifyContent: "center",
                }}
            >
                <Logo />
                {/* Instant GSA result */}
                <Card style={{ width: "100%", maxWidth: "360px", textAlign: "center" }}>
                    <GovBadge text={`GSA.GOV · FY${RESULT.fiscalYear}`} />
                    <div style={{ marginTop: "12px" }}>
                        <MicroLabel>GSA PER DIEM CEILING</MicroLabel>
                    </div>
                    <div
                        style={{
                            marginTop: "8px",
                            display: "flex",
                            justifyContent: "center",
                        }}
                    >
                        <MoneyValue
                            value={`$${RESULT.gsaWeeklyMax.toLocaleString()}`}
                            size="36px"
                            color={T.text}
                            unit="/week"
                        />
                    </div>
                    <div
                        style={{
                            fontFamily: f.sans,
                            fontSize: "13px",
                            color: T.textSecondary,
                            marginTop: "6px",
                        }}
                    >
                        {RESULT.county} County, {RESULT.state}
                    </div>
                    <div
                        style={{
                            fontFamily: f.sans,
                            fontSize: "12px",
                            color: T.textTertiary,
                            marginTop: "2px",
                        }}
                    >
                        Lodging ${RESULT.gsaLodging}/night + M&IE ${RESULT.gsaMeals}
                        /day
                    </div>
                </Card>

                {/* Now ask for gross */}
                <div style={{ width: "100%", maxWidth: "360px" }}>
                    <p
                        style={{
                            fontFamily: f.sans,
                            fontSize: "14px",
                            color: T.textSecondary,
                            textAlign: "center",
                            margin: "0 0 12px",
                        }}
                    >
                        Now — what are they offering you per week?
                    </p>
                    <div style={{ position: "relative" }}>
                        <span
                            style={{
                                position: "absolute",
                                left: "16px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                fontFamily: f.mono,
                                fontSize: "24px",
                                fontWeight: 600,
                                color: T.textTertiary,
                            }}
                        >
                            $
                        </span>
                        <input
                            id="gross-input"
                            type="text"
                            inputMode="numeric"
                            value={gross}
                            onChange={(e) => setGross(e.target.value.replace(/\D/g, ""))}
                            onKeyDown={handleKeyDown}
                            placeholder="2,500"
                            autoFocus
                            style={{
                                width: "100%",
                                boxSizing: "border-box",
                                fontFamily: f.mono,
                                fontSize: "24px",
                                fontWeight: 600,
                                padding: "14px 16px 14px 36px",
                                borderRadius: "10px",
                                border: `2px solid ${gross.length >= 3 ? T.borderFocus : T.border}`,
                                background: T.surface,
                                color: T.text,
                                outline: "none",
                                textAlign: "center",
                                transition: "border-color 0.2s ease",
                            }}
                        />
                    </div>
                    <button
                        onClick={() => gross.length >= 3 && onSubmit()}
                        disabled={gross.length < 3}
                        style={{
                            width: "100%",
                            marginTop: "12px",
                            fontFamily: f.sans,
                            fontSize: "15px",
                            fontWeight: 600,
                            padding: "12px",
                            borderRadius: "10px",
                            border: "none",
                            background: gross.length >= 3 ? T.primary : T.surfaceRaised,
                            color: gross.length >= 3 ? "#fff" : T.textTertiary,
                            cursor: gross.length >= 3 ? "pointer" : "default",
                            transition: "all 0.2s ease",
                        }}
                    >
                        Show me what I keep →
                    </button>
                </div>
            </div>
        );
    }

    return null;
}

// ━━━ RESULTS VIEW ━━━

function ResultsView() {
    const r = RESULT;
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        setTimeout(() => setVisible(true), 50);
    }, []);

    return (
        <div
            style={{
                padding: "24px 16px 80px",
                maxWidth: "440px",
                margin: "0 auto",
                opacity: visible ? 1 : 0,
                transform: visible ? "none" : "translateY(12px)",
                transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
        >
            {/* ━━━ Sticky header ━━━ */}
            <div
                style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                    background: T.bg,
                    padding: "12px 0 8px",
                    borderBottom: `1px solid ${T.borderSubtle}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                }}
            >
                <Logo />
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                    <MicroLabel>WHAT YOU KEEP</MicroLabel>
                    <span
                        style={{
                            fontFamily: f.mono,
                            fontSize: "18px",
                            fontWeight: 700,
                            color: T.moneyPositive,
                        }}
                    >
                        ${r.netWeekly.toLocaleString()}/wk
                    </span>
                </div>
            </div>

            {/* ━━━ HERO RESULT CARD ━━━ */}
            <Card
                style={{
                    marginBottom: "12px",
                    background: T.surface,
                    boxShadow:
                        "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "16px",
                    }}
                >
                    <div>
                        <MicroLabel>YOUR PAY, DECODED</MicroLabel>
                        <div
                            style={{
                                fontFamily: f.sans,
                                fontSize: "14px",
                                color: T.textSecondary,
                                marginTop: "4px",
                            }}
                        >
                            {r.city}, {r.state} · {r.zip} · 36hr
                        </div>
                    </div>
                    <GovBadge text="GSA.GOV" />
                </div>

                {/* Waterfall */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {/* Gross */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <span
                            style={{
                                fontFamily: f.sans,
                                fontSize: "14px",
                                color: T.textSecondary,
                            }}
                        >
                            Weekly Gross
                        </span>
                        <span
                            style={{
                                fontFamily: f.mono,
                                fontSize: "18px",
                                fontWeight: 600,
                                color: T.text,
                            }}
                        >
                            ${r.weeklyGross.toLocaleString()}
                        </span>
                    </div>

                    {/* Tax-free bar */}
                    <div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "4px",
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: f.sans,
                                    fontSize: "12px",
                                    color: T.primary,
                                    fontWeight: 500,
                                }}
                            >
                                Tax-Free (your per diem)
                            </span>
                            <span
                                style={{
                                    fontFamily: f.mono,
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    color: T.primary,
                                }}
                            >
                                ${r.gsaWeeklyMax.toLocaleString()}
                            </span>
                        </div>
                        <ProgressBar
                            value={r.gsaWeeklyMax}
                            max={r.weeklyGross}
                            color={T.primary}
                        />
                    </div>

                    {/* Taxable bar */}
                    <div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "4px",
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: f.sans,
                                    fontSize: "12px",
                                    color: T.textSecondary,
                                }}
                            >
                                Taxable Portion
                            </span>
                            <span
                                style={{
                                    fontFamily: f.mono,
                                    fontSize: "14px",
                                    fontWeight: 500,
                                    color: T.textSecondary,
                                }}
                            >
                                ${r.taxableWeekly}
                            </span>
                        </div>
                        <ProgressBar
                            value={r.taxableWeekly}
                            max={r.weeklyGross}
                            color={T.textTertiary}
                        />
                    </div>

                    <div
                        style={{
                            height: "1px",
                            background: T.borderSubtle,
                            margin: "4px 0",
                        }}
                    />

                    {/* Net take-home */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "10px 12px",
                            background: T.moneyPositiveBg,
                            borderRadius: "8px",
                            border: `1px solid ${T.moneyPositive}20`,
                        }}
                    >
                        <span
                            style={{
                                fontFamily: f.sans,
                                fontSize: "14px",
                                fontWeight: 600,
                                color: T.moneyPositive,
                            }}
                        >
                            What You Actually Keep
                        </span>
                        <span
                            style={{
                                fontFamily: f.mono,
                                fontSize: "22px",
                                fontWeight: 700,
                                color: T.moneyPositive,
                            }}
                        >
                            ${r.netWeekly.toLocaleString()}/wk
                        </span>
                    </div>

                    <div
                        style={{
                            fontFamily: f.sans,
                            fontSize: "10px",
                            color: T.textTertiary,
                            textAlign: "right",
                        }}
                    >
                        20% flat tax on taxable portion · Source: GSA.gov FY{r.fiscalYear}
                    </div>
                </div>
            </Card>

            {/* ━━━ NEGOTIATION BANDS ━━━ */}
            <Card style={{ marginBottom: "12px" }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "4px",
                    }}
                >
                    <MicroLabel>ARE THEY SKIMMING?</MicroLabel>
                    <span
                        style={{
                            fontFamily: f.sans,
                            fontSize: "10px",
                            color: T.textTertiary,
                        }}
                    >
                        Most agencies give you 70–95% of what GSA allows
                    </span>
                </div>
                <NegotiationBand />
                <div
                    style={{
                        padding: "10px 12px",
                        background: T.primaryMuted,
                        borderRadius: "8px",
                        border: `1px solid ${T.primaryBorder}`,
                        fontFamily: f.sans,
                        fontSize: "13px",
                        color: T.primary,
                        fontWeight: 500,
                        textAlign: "center",
                    }}
                >
                    If your agency offers 80%, that&apos;s $
                    {(RESULT.gsaWeeklyMax * 0.2).toLocaleString()}/wk they&apos;re
                    keeping. Ask about it.
                </div>
            </Card>

            {/* ━━━ HOUSING + SURPLUS ━━━ */}
            <Card style={{ marginBottom: "12px" }}>
                <MicroLabel>HOUSING VS YOUR PER DIEM</MicroLabel>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "16px",
                        marginTop: "12px",
                    }}
                >
                    <div
                        style={{
                            padding: "12px",
                            background: T.accentMuted,
                            borderRadius: "8px",
                            border: `1px solid ${T.accentBorder}`,
                        }}
                    >
                        <div
                            style={{
                                fontFamily: f.sans,
                                fontSize: "11px",
                                color: T.accent,
                                fontWeight: 500,
                                marginBottom: "4px",
                            }}
                        >
                            GSA Lodging Max
                        </div>
                        <MoneyValue
                            value={`$${(r.gsaLodging * 30).toLocaleString()}`}
                            size="20px"
                            color={T.accent}
                            unit="/mo"
                        />
                    </div>
                    <div
                        style={{
                            padding: "12px",
                            background: T.surfaceRaised,
                            borderRadius: "8px",
                        }}
                    >
                        <div
                            style={{
                                fontFamily: f.sans,
                                fontSize: "11px",
                                color: T.textSecondary,
                                fontWeight: 500,
                                marginBottom: "4px",
                            }}
                        >
                            Avg 1BR Rent
                        </div>
                        <MoneyValue
                            value={`$${r.housing1br.toLocaleString()}`}
                            size="20px"
                            color={T.text}
                            unit="/mo"
                        />
                    </div>
                </div>
                <div
                    style={{
                        marginTop: "12px",
                        padding: "12px",
                        background: T.moneyPositiveBg,
                        borderRadius: "8px",
                        border: `1px solid ${T.moneyPositive}20`,
                        textAlign: "center",
                    }}
                >
                    <div
                        style={{
                            fontFamily: f.sans,
                            fontSize: "11px",
                            color: T.moneyPositive,
                            fontWeight: 500,
                        }}
                    >
                        WHAT YOU POCKET TAX-FREE AFTER RENT
                    </div>
                    <MoneyValue
                        value={`+$${r.stipendSurplus.toLocaleString()}`}
                        size="26px"
                        color={T.moneyPositive}
                        unit="/mo"
                    />
                    <div
                        style={{
                            fontFamily: f.sans,
                            fontSize: "11px",
                            color: T.textTertiary,
                            marginTop: "4px",
                        }}
                    >
                        This is yours, tax-free, after paying rent
                    </div>
                </div>
            </Card>

            {/* ━━━ 13-WEEK CONTRACT ━━━ */}
            <Card style={{ marginBottom: "12px" }}>
                <MicroLabel>13-WEEK CONTRACT</MicroLabel>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        marginTop: "12px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                        }}
                    >
                        <span
                            style={{
                                fontFamily: f.sans,
                                fontSize: "13px",
                                color: T.textSecondary,
                            }}
                        >
                            Gross
                        </span>
                        <span
                            style={{
                                fontFamily: f.mono,
                                fontSize: "15px",
                                fontWeight: 600,
                                color: T.text,
                            }}
                        >
                            ${r.contractGross.toLocaleString()}
                        </span>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                        }}
                    >
                        <span
                            style={{
                                fontFamily: f.sans,
                                fontSize: "13px",
                                color: T.primary,
                            }}
                        >
                            Tax-Free Portion
                        </span>
                        <span
                            style={{
                                fontFamily: f.mono,
                                fontSize: "15px",
                                fontWeight: 600,
                                color: T.primary,
                            }}
                        >
                            ${r.taxFreeTotal.toLocaleString()}
                        </span>
                    </div>
                    <div style={{ height: "1px", background: T.borderSubtle }} />
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                        }}
                    >
                        <span
                            style={{
                                fontFamily: f.sans,
                                fontSize: "14px",
                                fontWeight: 600,
                                color: T.moneyPositive,
                            }}
                        >
                            Est. Net Take-Home
                        </span>
                        <span
                            style={{
                                fontFamily: f.mono,
                                fontSize: "18px",
                                fontWeight: 700,
                                color: T.moneyPositive,
                            }}
                        >
                            ${r.contractNet.toLocaleString()}
                        </span>
                    </div>
                    <div
                        style={{
                            fontFamily: f.sans,
                            fontSize: "12px",
                            color: T.textTertiary,
                            textAlign: "center",
                            padding: "8px",
                            background: T.surfaceRaised,
                            borderRadius: "6px",
                        }}
                    >
                        After rent (${r.housing1br}/mo × 3 months) you pocket ~$
                        {(r.contractNet - r.housing1br * 3).toLocaleString()}
                    </div>
                </div>
            </Card>

            {/* ━━━ AGENCY COMPARISON ━━━ */}
            <Card style={{ marginBottom: "12px" }}>
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
                        CROWDSOURCED
                    </span>
                </div>

                {/* Header */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 80px 60px 54px",
                        gap: "8px",
                        padding: "0 0 8px",
                        borderBottom: `1px solid ${T.border}`,
                    }}
                >
                    {["Agency", "Avg/wk", "Data", "% GSA"].map((h, i) => (
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

                {r.agencies.map((a, i) => (
                    <div
                        key={a.name}
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 80px 60px 54px",
                            gap: "8px",
                            padding: "10px 0",
                            borderBottom:
                                i < r.agencies.length - 1
                                    ? `1px solid ${T.borderSubtle}`
                                    : "none",
                            background: i % 2 === 1 ? T.surfaceRaised : "transparent",
                            margin: i % 2 === 1 ? "0 -20px" : "0",
                            paddingLeft: i % 2 === 1 ? "20px" : "0",
                            paddingRight: i % 2 === 1 ? "20px" : "0",
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
                            ${a.avg.toLocaleString()}
                        </span>
                        <span
                            style={{
                                fontFamily: f.sans,
                                fontSize: "11px",
                                color: T.textTertiary,
                                textAlign: "right",
                            }}
                        >
                            {a.reports}
                        </span>
                        <div style={{ textAlign: "right" }}>
                            <StipendPctDot pct={a.stipendPct} />
                        </div>
                    </div>
                ))}

                <div
                    style={{
                        fontFamily: f.sans,
                        fontSize: "10px",
                        color: T.textTertiary,
                        marginTop: "10px",
                    }}
                >
                    % GSA = how much of your per diem they&apos;re actually giving you.
                    ≥95% = fair · &lt;90% = they&apos;re keeping some
                </div>
            </Card>

            {/* ━━━ SHARE BUTTON ━━━ */}
            <button
                id="share-button"
                style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "10px",
                    border: `2px solid ${T.primary}`,
                    background: "transparent",
                    color: T.primary,
                    fontFamily: f.sans,
                    fontSize: "15px",
                    fontWeight: 600,
                    cursor: "pointer",
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                }}
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={T.primary}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                Share with your nurse fam
            </button>

            {/* ━━━ FOOTER ━━━ */}
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
                . Housing data from HUD + public furnished rental averages. Not an
                agency. Not sponsored by one. Just the math.
            </footer>
        </div>
    );
}

// ━━━ MAIN CALCULATOR EXPORT ━━━

export default function Calculator() {
    const [step, setStep] = useState(0);
    const [zip, setZip] = useState("");
    const [gross, setGross] = useState("");

    return (
        <div style={{ background: T.bg, minHeight: "100vh", color: T.text }}>
            {step < 2 ? (
                <CalculatorInput
                    step={step}
                    onSubmit={() => setStep((s) => s + 1)}
                    zip={zip}
                    setZip={setZip}
                    gross={gross}
                    setGross={setGross}
                />
            ) : (
                <ResultsView />
            )}
        </div>
    );
}
