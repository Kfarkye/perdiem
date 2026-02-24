"use client";

import { useState, useEffect, useCallback } from "react";
import { T, FONTS as f } from "@/lib/theme";

// ━━━ API RESPONSE TYPE (matches route.ts output) ━━━
interface ApiResult {
    location: { zip: string; city: string; county: string; state: string };
    gsa: {
        fiscal_year: number;
        lodging_daily: number;
        meals_daily: number;
        weekly_max: number;
        monthly_max: number;
    };
    breakdown: {
        weekly_gross: number;
        hours: number;
        stipend_weekly: number;
        taxable_weekly: number;
        taxable_hourly: number;
        tax_estimate_weekly: number;
        net_weekly: number;
    };
    housing: { hud_fmr_1br: number; stipend_surplus_monthly: number };
    negotiation: {
        pct_70: number;
        pct_80: number;
        pct_95: number;
        your_stipend: number;
        pct_of_max: number;
    };
    contract_13wk: {
        weeks: number;
        gross: number;
        net_estimate: number;
        tax_free_total: number;
    };
    metadata: {
        gsa_fiscal_year: number;
        hud_rent_source: string;
        tax_method: string;
        assumptions: string[];
    };
}

// ━━━ DISPLAY RESULT (mapped from API response for the UI) ━━━
interface DisplayResult {
    zip: string;
    city: string;
    county: string;
    state: string;
    weeklyGross: number;
    hours: number;
    gsaLodging: number;
    gsaMeals: number;
    gsaWeeklyMax: number;
    gsaMonthlyMax: number;
    fiscalYear: number;
    taxableWeekly: number;
    taxableHourly: number;
    taxEstimate: number;
    netWeekly: number;
    housing1br: number;
    stipendSurplus: number;
    contractGross: number;
    contractNet: number;
    taxFreeTotal: number;
    hudSource: string;
    taxMethod: string;
    assumptions: string[];
}

function mapApiToDisplay(api: ApiResult): DisplayResult {
    return {
        zip: api.location.zip,
        city: api.location.city,
        county: api.location.county,
        state: api.location.state,
        weeklyGross: api.breakdown.weekly_gross,
        hours: api.breakdown.hours,
        gsaLodging: api.gsa.lodging_daily,
        gsaMeals: api.gsa.meals_daily,
        gsaWeeklyMax: api.gsa.weekly_max,
        gsaMonthlyMax: api.gsa.monthly_max,
        fiscalYear: api.gsa.fiscal_year,
        taxableWeekly: api.breakdown.taxable_weekly,
        taxableHourly: api.breakdown.taxable_hourly,
        taxEstimate: api.breakdown.tax_estimate_weekly,
        netWeekly: api.breakdown.net_weekly,
        housing1br: api.housing.hud_fmr_1br,
        stipendSurplus: api.housing.stipend_surplus_monthly,
        contractGross: api.contract_13wk.gross,
        contractNet: api.contract_13wk.net_estimate,
        taxFreeTotal: api.contract_13wk.tax_free_total,
        hudSource: api.metadata.hud_rent_source,
        taxMethod: api.metadata.tax_method,
        assumptions: api.metadata.assumptions,
    };
}

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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
            </div>
            <span style={{ fontFamily: f.sans, fontSize: "16px", fontWeight: 700, color: T.text, letterSpacing: "-0.01em" }}>
                Per<span style={{ color: T.primary }}>Diem</span>
                <span style={{ fontWeight: 400, color: T.textTertiary, fontSize: "13px" }}>.fyi</span>
            </span>
        </div>
    );
}

function GovBadge({ text }: { text: string }) {
    return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontFamily: f.sans, fontSize: "10px", fontWeight: 600, color: T.accent, background: T.accentMuted, border: `1px solid ${T.accentBorder}`, padding: "2px 8px", borderRadius: "4px", letterSpacing: "0.04em" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            {text}
        </span>
    );
}

function MicroLabel({ children }: { children: React.ReactNode }) {
    return (
        <span style={{ fontFamily: f.sans, fontSize: "10px", fontWeight: 600, color: T.textTertiary, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {children}
        </span>
    );
}

function MoneyValue({ value, size = "28px", color = T.text, unit }: { value: string; size?: string; color?: string; unit?: string }) {
    return (
        <div style={{ display: "flex", alignItems: "baseline", gap: "3px" }}>
            <span style={{ fontFamily: f.mono, fontSize: size, fontWeight: 700, color, letterSpacing: "-0.02em", lineHeight: 1 }}>
                {value}
            </span>
            {unit && <span style={{ fontFamily: f.sans, fontSize: "13px", color: T.textTertiary }}>{unit}</span>}
        </div>
    );
}

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
    return (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "12px", padding: "20px", ...style }}>
            {children}
        </div>
    );
}

function ProgressBar({ value, max, color, height = "6px" }: { value: number; max: number; color: string; height?: string }) {
    const pct = Math.min((value / max) * 100, 100);
    return (
        <div style={{ width: "100%", height, background: T.surfaceRaised, borderRadius: "99px", overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "99px", transition: "width 1s cubic-bezier(0.16, 1, 0.3, 1)" }} />
        </div>
    );
}

function NegotiationBand({ gsaWeeklyMax }: { gsaWeeklyMax: number }) {
    const bands = [
        { pct: 70, value: Math.round(gsaWeeklyMax * 0.7), label: "Low", color: T.moneyNegative },
        { pct: 80, value: Math.round(gsaWeeklyMax * 0.8), label: "Avg", color: T.accent },
        { pct: 95, value: Math.round(gsaWeeklyMax * 0.95), label: "Fair", color: T.moneyPositive },
        { pct: 100, value: gsaWeeklyMax, label: "Max", color: T.primary },
    ];

    return (
        <div style={{ padding: "16px 0" }}>
            <div style={{ position: "relative", height: "36px", marginBottom: "8px" }}>
                <div style={{ position: "absolute", top: "14px", left: 0, right: 0, height: "8px", background: T.surfaceRaised, borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ width: "100%", height: "100%", borderRadius: "4px", background: `linear-gradient(90deg, ${T.moneyNegative}40 0%, ${T.accent}60 50%, ${T.moneyPositive}80 75%, ${T.primary} 100%)` }} />
                </div>
                {bands.map((b) => (
                    <div key={b.pct} style={{ position: "absolute", left: `${((b.pct - 70) / 30) * 100}%`, top: 0, display: "flex", flexDirection: "column", alignItems: "center", transform: "translateX(-50%)" }}>
                        <span style={{ fontFamily: f.sans, fontSize: "9px", fontWeight: 600, color: b.color, marginBottom: "2px" }}>{b.pct}%</span>
                        <div style={{ width: "2px", height: "20px", background: b.color, borderRadius: "1px" }} />
                    </div>
                ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                {bands.map((b) => (
                    <div key={b.pct} style={{ textAlign: "center", flex: 1 }}>
                        <div style={{ fontFamily: f.mono, fontSize: "12px", fontWeight: 600, color: b.color }}>
                            ${b.value.toLocaleString()}
                        </div>
                        <div style={{ fontFamily: f.sans, fontSize: "10px", color: T.textTertiary }}>{b.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function StipendPctDot({ pct }: { pct: number }) {
    const color = pct >= 95 ? T.moneyPositive : pct >= 90 ? T.accent : T.moneyNegative;
    return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontFamily: f.mono, fontSize: "12px", fontWeight: 600, color }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: color }} />
            {pct}%
        </span>
    );
}

// ━━━ LOADING SPINNER ━━━
function LoadingView() {
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "40px 20px", gap: "24px" }}>
            <Logo />
            <div style={{ width: "40px", height: "40px", border: `3px solid ${T.border}`, borderTopColor: T.primary, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <p style={{ fontFamily: f.sans, fontSize: "15px", color: T.textSecondary, textAlign: "center" }}>
                Looking up GSA rates for your ZIP...
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

// ━━━ ERROR VIEW ━━━
function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "40px 20px", gap: "20px" }}>
            <Logo />
            <Card style={{ maxWidth: "360px", textAlign: "center" }}>
                <div style={{ fontFamily: f.sans, fontSize: "14px", color: T.moneyNegative, fontWeight: 600, marginBottom: "8px" }}>
                    Something went wrong
                </div>
                <p style={{ fontFamily: f.sans, fontSize: "13px", color: T.textSecondary, margin: "0 0 16px", lineHeight: 1.5 }}>
                    {message}
                </p>
                <button
                    onClick={onRetry}
                    style={{ fontFamily: f.sans, fontSize: "14px", fontWeight: 600, padding: "10px 32px", borderRadius: "8px", border: "none", background: T.primary, color: "#fff", cursor: "pointer" }}
                >
                    Try again
                </button>
            </Card>
        </div>
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
    gsaPreview,
}: {
    step: number;
    onSubmit: () => void;
    zip: string;
    setZip: (v: string) => void;
    gross: string;
    setGross: (v: string) => void;
    gsaPreview: ApiResult | null;
}) {
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter") onSubmit();
        },
        [onSubmit]
    );

    if (step === 0) {
        return (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", gap: "24px", minHeight: "100vh" }}>
                <Logo />
                <h1 style={{ fontFamily: f.sans, fontSize: "24px", fontWeight: 700, color: T.text, textAlign: "center", margin: 0, letterSpacing: "-0.01em", lineHeight: 1.3 }}>
                    Know your rate<br />before you sign.
                </h1>
                <p style={{ fontFamily: f.sans, fontSize: "15px", color: T.textSecondary, textAlign: "center", margin: 0, maxWidth: "320px", lineHeight: 1.5 }}>
                    Plug in your assignment ZIP and see what GSA says your per diem should be. The math your recruiter won&apos;t show you.
                </p>
                <div style={{ width: "100%", maxWidth: "320px" }}>
                    <label htmlFor="zip-input" style={{ fontFamily: f.sans, fontSize: "12px", fontWeight: 500, color: T.textSecondary, display: "block", marginBottom: "6px" }}>
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
                            width: "100%", boxSizing: "border-box", fontFamily: f.mono, fontSize: "24px", fontWeight: 600,
                            padding: "14px 16px", borderRadius: "10px",
                            border: `2px solid ${zip.length === 5 ? T.borderFocus : T.border}`,
                            background: T.surface, color: T.text, outline: "none", textAlign: "center",
                            letterSpacing: "0.1em", transition: "border-color 0.2s ease",
                        }}
                    />
                </div>
                <button
                    onClick={() => zip.length === 5 && onSubmit()}
                    disabled={zip.length !== 5}
                    style={{
                        fontFamily: f.sans, fontSize: "15px", fontWeight: 600, padding: "12px 40px", borderRadius: "10px",
                        border: "none", background: zip.length === 5 ? T.primary : T.surfaceRaised,
                        color: zip.length === 5 ? "#fff" : T.textTertiary,
                        cursor: zip.length === 5 ? "pointer" : "default", transition: "all 0.2s ease",
                    }}
                >
                    Look up my per diem →
                </button>
            </div>
        );
    }

    // Step 1: Show GSA preview + ask for gross
    if (step === 1 && gsaPreview) {
        const gsa = gsaPreview.gsa;
        const loc = gsaPreview.location;
        return (
            <div style={{ padding: "32px 20px", display: "flex", flexDirection: "column", gap: "20px", alignItems: "center", minHeight: "100vh", justifyContent: "center" }}>
                <Logo />
                <Card style={{ width: "100%", maxWidth: "360px", textAlign: "center" }}>
                    <GovBadge text={`GSA.GOV · FY${gsa.fiscal_year}`} />
                    <div style={{ marginTop: "12px" }}><MicroLabel>GSA PER DIEM CEILING</MicroLabel></div>
                    <div style={{ marginTop: "8px", display: "flex", justifyContent: "center" }}>
                        <MoneyValue value={`$${gsa.weekly_max.toLocaleString()}`} size="36px" color={T.text} unit="/week" />
                    </div>
                    <div style={{ fontFamily: f.sans, fontSize: "13px", color: T.textSecondary, marginTop: "6px" }}>
                        {loc.city ? `${loc.city}, ` : ""}{loc.county ? `${loc.county}, ` : ""}{loc.state}
                    </div>
                    <div style={{ fontFamily: f.sans, fontSize: "12px", color: T.textTertiary, marginTop: "2px" }}>
                        Lodging ${gsa.lodging_daily}/night + M&IE ${gsa.meals_daily}/day
                    </div>
                </Card>

                <div style={{ width: "100%", maxWidth: "360px" }}>
                    <p style={{ fontFamily: f.sans, fontSize: "14px", color: T.textSecondary, textAlign: "center", margin: "0 0 12px" }}>
                        Now — what are they offering you per week?
                    </p>
                    <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", fontFamily: f.mono, fontSize: "24px", fontWeight: 600, color: T.textTertiary }}>$</span>
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
                                width: "100%", boxSizing: "border-box", fontFamily: f.mono, fontSize: "24px", fontWeight: 600,
                                padding: "14px 16px 14px 36px", borderRadius: "10px",
                                border: `2px solid ${gross.length >= 3 ? T.borderFocus : T.border}`,
                                background: T.surface, color: T.text, outline: "none", textAlign: "center",
                                transition: "border-color 0.2s ease",
                            }}
                        />
                    </div>
                    <button
                        onClick={() => gross.length >= 3 && onSubmit()}
                        disabled={gross.length < 3}
                        style={{
                            width: "100%", marginTop: "12px", fontFamily: f.sans, fontSize: "15px", fontWeight: 600,
                            padding: "12px", borderRadius: "10px", border: "none",
                            background: gross.length >= 3 ? T.primary : T.surfaceRaised,
                            color: gross.length >= 3 ? "#fff" : T.textTertiary,
                            cursor: gross.length >= 3 ? "pointer" : "default", transition: "all 0.2s ease",
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

function ResultsView({ result, onReset }: { result: DisplayResult; onReset: () => void }) {
    const r = result;
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        setTimeout(() => setVisible(true), 50);
    }, []);

    return (
        <div
            style={{
                padding: "24px 16px 80px", maxWidth: "440px", margin: "0 auto",
                opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(12px)",
                transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
        >
            {/* ━━━ Sticky header ━━━ */}
            <div style={{ position: "sticky", top: 0, zIndex: 10, background: T.bg, padding: "12px 0 8px", borderBottom: `1px solid ${T.borderSubtle}`, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <button onClick={onReset} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    <Logo />
                </button>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                    <MicroLabel>EST. NET</MicroLabel>
                    <span style={{ fontFamily: f.mono, fontSize: "18px", fontWeight: 700, color: T.moneyPositive }}>
                        ${r.netWeekly.toLocaleString()}/wk
                    </span>
                </div>
            </div>

            {/* ━━━ HERO RESULT CARD ━━━ */}
            <Card style={{ marginBottom: "12px", background: T.surface, boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                    <div>
                        <MicroLabel>YOUR PAY, DECODED</MicroLabel>
                        <div style={{ fontFamily: f.sans, fontSize: "14px", color: T.textSecondary, marginTop: "4px" }}>
                            {r.city ? `${r.city}, ` : ""}{r.state} · {r.zip} · {r.hours}hr
                        </div>
                    </div>
                    <GovBadge text={`GSA FY${r.fiscalYear}`} />
                </div>

                {/* Waterfall */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {/* Gross */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontFamily: f.sans, fontSize: "14px", color: T.textSecondary }}>Weekly Gross</span>
                        <span style={{ fontFamily: f.mono, fontSize: "18px", fontWeight: 600, color: T.text }}>${r.weeklyGross.toLocaleString()}</span>
                    </div>

                    {/* Tax-free bar */}
                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <span style={{ fontFamily: f.sans, fontSize: "12px", color: T.primary, fontWeight: 500 }}>Tax-Free (your per diem)</span>
                            <span style={{ fontFamily: f.mono, fontSize: "14px", fontWeight: 600, color: T.primary }}>${r.gsaWeeklyMax.toLocaleString()}</span>
                        </div>
                        <ProgressBar value={r.gsaWeeklyMax} max={r.weeklyGross} color={T.primary} />
                    </div>

                    {/* Taxable bar */}
                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <span style={{ fontFamily: f.sans, fontSize: "12px", color: T.textSecondary }}>Taxable Portion</span>
                            <span style={{ fontFamily: f.mono, fontSize: "14px", fontWeight: 500, color: T.textSecondary }}>${r.taxableWeekly.toLocaleString()}</span>
                        </div>
                        <ProgressBar value={r.taxableWeekly} max={r.weeklyGross} color={T.textTertiary} />
                    </div>

                    <div style={{ height: "1px", background: T.borderSubtle, margin: "4px 0" }} />

                    {/* Net take-home */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: T.moneyPositiveBg, borderRadius: "8px", border: `1px solid ${T.moneyPositive}20` }}>
                        <span style={{ fontFamily: f.sans, fontSize: "14px", fontWeight: 600, color: T.moneyPositive }}>Est. Net Take-Home</span>
                        <span style={{ fontFamily: f.mono, fontSize: "18px", fontWeight: 700, color: T.moneyPositive }}>${r.netWeekly.toLocaleString()}/wk</span>
                    </div>
                </div>

                {/* Tax estimate disclaimer */}
                <div style={{ fontFamily: f.sans, fontSize: "10px", color: T.textTertiary, marginTop: "10px", padding: "6px 8px", background: T.surfaceRaised, borderRadius: "4px", lineHeight: 1.5 }}>
                    Tax estimate: ~20% flat on taxable portion only. Not a tax calculation. Your effective rate depends on filing status, deductions, and state taxes.
                </div>
            </Card>

            {/* ━━━ GSA RATE DETAIL ━━━ */}
            <Card style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <MicroLabel>GSA PER DIEM BREAKDOWN</MicroLabel>
                    <GovBadge text="GSA.GOV" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                    <div>
                        <div style={{ fontFamily: f.sans, fontSize: "10px", color: T.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Lodging</div>
                        <div style={{ fontFamily: f.mono, fontSize: "16px", fontWeight: 600, color: T.text }}>${r.gsaLodging}</div>
                        <div style={{ fontFamily: f.sans, fontSize: "10px", color: T.textTertiary }}>/night</div>
                    </div>
                    <div>
                        <div style={{ fontFamily: f.sans, fontSize: "10px", color: T.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>M&IE</div>
                        <div style={{ fontFamily: f.mono, fontSize: "16px", fontWeight: 600, color: T.text }}>${r.gsaMeals}</div>
                        <div style={{ fontFamily: f.sans, fontSize: "10px", color: T.textTertiary }}>/day</div>
                    </div>
                    <div>
                        <div style={{ fontFamily: f.sans, fontSize: "10px", color: T.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Weekly Max</div>
                        <div style={{ fontFamily: f.mono, fontSize: "16px", fontWeight: 700, color: T.primary }}>${r.gsaWeeklyMax.toLocaleString()}</div>
                        <div style={{ fontFamily: f.sans, fontSize: "10px", color: T.textTertiary }}>/week</div>
                    </div>
                </div>
            </Card>

            {/* ━━━ NEGOTIATION BAND ━━━ */}
            <Card style={{ marginBottom: "12px" }}>
                <MicroLabel>STIPEND NEGOTIATION RANGE</MicroLabel>
                <NegotiationBand gsaWeeklyMax={r.gsaWeeklyMax} />
                <div style={{ fontFamily: f.sans, fontSize: "10px", color: T.textTertiary, lineHeight: 1.5 }}>
                    Your agency should be offering at or near the GSA max. ≥95% = fair deal. &lt;80% = they&apos;re keeping a large cut of your per diem.
                </div>
            </Card>

            {/* ━━━ HOUSING ANALYSIS ━━━ */}
            <Card style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <MicroLabel>HOUSING VS STIPEND</MicroLabel>
                    <span style={{ fontFamily: f.sans, fontSize: "9px", color: T.textTertiary, background: T.surfaceRaised, padding: "2px 6px", borderRadius: "3px" }}>
                        {r.hudSource}
                    </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontFamily: f.sans, fontSize: "13px", color: T.textSecondary }}>HUD 1BR Fair Market Rent</span>
                    <span style={{ fontFamily: f.mono, fontSize: "14px", fontWeight: 600, color: T.text }}>${r.housing1br.toLocaleString()}/mo</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontFamily: f.sans, fontSize: "13px", color: T.textSecondary }}>Your Monthly Stipend</span>
                    <span style={{ fontFamily: f.mono, fontSize: "14px", fontWeight: 600, color: T.text }}>${r.gsaMonthlyMax.toLocaleString()}/mo</span>
                </div>
                <div style={{ height: "1px", background: T.borderSubtle, margin: "8px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: r.stipendSurplus >= 0 ? T.moneyPositiveBg : T.moneyNegativeBg, borderRadius: "6px" }}>
                    <span style={{ fontFamily: f.sans, fontSize: "13px", fontWeight: 600, color: r.stipendSurplus >= 0 ? T.moneyPositive : T.moneyNegative }}>
                        {r.stipendSurplus >= 0 ? "Surplus After Rent" : "Shortfall"}
                    </span>
                    <span style={{ fontFamily: f.mono, fontSize: "16px", fontWeight: 700, color: r.stipendSurplus >= 0 ? T.moneyPositive : T.moneyNegative }}>
                        {r.stipendSurplus >= 0 ? "+" : ""}${r.stipendSurplus.toLocaleString()}/mo
                    </span>
                </div>
            </Card>

            {/* ━━━ 13-WEEK CONTRACT PROJECTION ━━━ */}
            <Card style={{ marginBottom: "12px" }}>
                <MicroLabel>13-WEEK CONTRACT PROJECTION</MicroLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontFamily: f.sans, fontSize: "13px", color: T.textSecondary }}>Contract Gross</span>
                        <span style={{ fontFamily: f.mono, fontSize: "14px", fontWeight: 600, color: T.text }}>${r.contractGross.toLocaleString()}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontFamily: f.sans, fontSize: "13px", color: T.primary }}>Tax-Free Total</span>
                        <span style={{ fontFamily: f.mono, fontSize: "14px", fontWeight: 600, color: T.primary }}>${r.taxFreeTotal.toLocaleString()}</span>
                    </div>
                    <div style={{ height: "1px", background: T.borderSubtle }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: T.moneyPositiveBg, borderRadius: "6px" }}>
                        <span style={{ fontFamily: f.sans, fontSize: "14px", fontWeight: 600, color: T.moneyPositive }}>Est. Net Take-Home</span>
                        <span style={{ fontFamily: f.mono, fontSize: "18px", fontWeight: 700, color: T.moneyPositive }}>${r.contractNet.toLocaleString()}</span>
                    </div>
                    <div style={{ fontFamily: f.sans, fontSize: "12px", color: T.textTertiary, textAlign: "center", padding: "8px", background: T.surfaceRaised, borderRadius: "6px" }}>
                        After rent (${r.housing1br.toLocaleString()}/mo × 3 months) you pocket ~${(r.contractNet - r.housing1br * 3).toLocaleString()}
                    </div>
                </div>
            </Card>

            {/* ━━━ ASSUMPTIONS DISCLOSURE ━━━ */}
            {r.assumptions.length > 0 && (
                <Card style={{ marginBottom: "12px", background: T.surfaceRaised, border: `1px solid ${T.borderSubtle}` }}>
                    <MicroLabel>CALCULATION ASSUMPTIONS</MicroLabel>
                    <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                        {r.assumptions.map((a, i) => (
                            <div key={i} style={{ fontFamily: f.sans, fontSize: "11px", color: T.textTertiary, lineHeight: 1.5, paddingLeft: "12px", position: "relative" }}>
                                <span style={{ position: "absolute", left: 0, color: T.textTertiary }}>·</span>
                                {a}
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* ━━━ SHARE BUTTON ━━━ */}
            <button
                onClick={() => {
                    const text = `My travel nurse per diem in ${r.city || r.state}: GSA says $${r.gsaWeeklyMax}/wk tax-free. Check yours at perdiem.fyi`;
                    if (navigator.share) {
                        navigator.share({ title: "PerDiem.fyi", text, url: "https://perdiem.fyi" });
                    } else {
                        navigator.clipboard.writeText(text);
                    }
                }}
                style={{
                    width: "100%", padding: "14px", borderRadius: "10px", border: `2px solid ${T.primary}`,
                    background: "transparent", color: T.primary, fontFamily: f.sans, fontSize: "15px", fontWeight: 600,
                    cursor: "pointer", marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                Share with your nurse fam
            </button>

            {/* ━━━ NEW LOOKUP BUTTON ━━━ */}
            <button
                onClick={onReset}
                style={{
                    width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${T.border}`,
                    background: T.surface, color: T.textSecondary, fontFamily: f.sans, fontSize: "14px", fontWeight: 500,
                    cursor: "pointer", marginBottom: "12px",
                }}
            >
                Look up another ZIP
            </button>

            {/* ━━━ FOOTER ━━━ */}
            <footer style={{ fontFamily: f.sans, fontSize: "10px", color: T.textTertiary, lineHeight: 1.6, padding: "16px 0", borderTop: `1px solid ${T.borderSubtle}` }}>
                Pay data comes from nurses like you (protected under NLRA Section 7).
                Per diem rates from{" "}
                <a href="https://www.gsa.gov/travel/plan-book/per-diem-rates" style={{ color: T.textTertiary }} target="_blank" rel="noopener noreferrer">GSA.gov</a>.
                Housing data from{" "}
                <a href="https://www.huduser.gov/portal/datasets/fmr.html" style={{ color: T.textTertiary }} target="_blank" rel="noopener noreferrer">HUD FMR</a>.
                Not an agency. Not sponsored by one. Just the math.
            </footer>
        </div>
    );
}

// ━━━ MAIN CALCULATOR EXPORT ━━━

export default function Calculator() {
    const [step, setStep] = useState(0);
    const [zip, setZip] = useState("");
    const [gross, setGross] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [gsaPreview, setGsaPreview] = useState<ApiResult | null>(null);
    const [result, setResult] = useState<DisplayResult | null>(null);

    // Step 0 → 1: Look up GSA rates for the ZIP (quick preview, no gross needed yet)
    const handleZipSubmit = useCallback(async () => {
        if (zip.length !== 5) return;
        setLoading(true);
        setError(null);

        try {
            // Quick lookup with a placeholder gross just to get GSA rates for preview
            const res = await fetch("/api/v1/lookup-stipend", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ zip, gross_weekly: 2000, hours: 36 }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || `Lookup failed (${res.status})`);
            }

            const json = await res.json();
            if (!json.success || !json.data) throw new Error("Unexpected response format");

            setGsaPreview(json.data as ApiResult);
            setStep(1);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to look up GSA rates");
        } finally {
            setLoading(false);
        }
    }, [zip]);

    // Step 1 → 2: Full calculation with user's gross
    const handleGrossSubmit = useCallback(async () => {
        if (gross.length < 3) return;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/v1/lookup-stipend", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ zip, gross_weekly: parseInt(gross, 10), hours: 36 }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || `Calculation failed (${res.status})`);
            }

            const json = await res.json();
            if (!json.success || !json.data) throw new Error("Unexpected response format");

            setResult(mapApiToDisplay(json.data as ApiResult));
            setStep(2);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to calculate");
        } finally {
            setLoading(false);
        }
    }, [zip, gross]);

    const handleReset = useCallback(() => {
        setStep(0);
        setZip("");
        setGross("");
        setGsaPreview(null);
        setResult(null);
        setError(null);
    }, []);

    if (error) {
        return (
            <div style={{ background: T.bg, minHeight: "100vh", color: T.text }}>
                <ErrorView message={error} onRetry={handleReset} />
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{ background: T.bg, minHeight: "100vh", color: T.text }}>
                <LoadingView />
            </div>
        );
    }

    return (
        <div style={{ background: T.bg, minHeight: "100vh", color: T.text }}>
            {step < 2 ? (
                <CalculatorInput
                    step={step}
                    onSubmit={step === 0 ? handleZipSubmit : handleGrossSubmit}
                    zip={zip}
                    setZip={setZip}
                    gross={gross}
                    setGross={setGross}
                    gsaPreview={gsaPreview}
                />
            ) : result ? (
                <ResultsView result={result} onReset={handleReset} />
            ) : null}
        </div>
    );
}
