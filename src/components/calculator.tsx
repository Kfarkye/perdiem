"use client";

import React, { useState, useEffect, useCallback } from "react";
import { T, FONTS as f } from "@/lib/theme";

// ━━━ TYPES ━━━

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
    housing: {
        hud_fmr_1br: number;
        stipend_monthly_est: number;
        stipend_surplus_monthly: number;
    };
    negotiation: {
        pct_70: number;
        pct_80: number;
        pct_95: number;
        pct_100: number;
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
        offer_verdict?: {
            stipend_pct_of_gsa: number;
            label: string;
            typical_band: string;
            typical_target_pct: number;
            delta_to_typical_weekly: number;
            target_stipend_weekly: number;
        };
        assumptions: string[];
    };
}

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
    stipendWeekly: number;
    stipendMonthlyEst: number;
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
    pctOfMax: number;
    offerLabel: string;
    deltaToTypicalWeekly: number;
    targetStipendWeekly: number;
}

function mapApiToDisplay(api: ApiResult): DisplayResult {
    const ov = api.metadata.offer_verdict;
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
        stipendWeekly: api.breakdown.stipend_weekly,
        stipendMonthlyEst: api.housing.stipend_monthly_est,
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
        pctOfMax: api.negotiation.pct_of_max,
        offerLabel: ov?.label ?? "—",
        deltaToTypicalWeekly: ov?.delta_to_typical_weekly ?? 0,
        targetStipendWeekly: ov?.target_stipend_weekly ?? 0,
    };
}

// ━━━ HELPERS ━━━

function buildPrefillUrl(params: { zip: string; gross?: number; hours?: number; agency?: string }) {
    const url = new URL(window.location.href);
    const sp = url.searchParams;
    sp.set("zip", params.zip);
    if (params.gross && params.gross > 0) sp.set("gross", String(params.gross));
    else sp.delete("gross");
    if (params.hours && params.hours > 0) sp.set("hours", String(params.hours));
    else sp.delete("hours");
    const agency = (params.agency ?? "").trim();
    if (agency) sp.set("agency", agency);
    else sp.delete("agency");
    url.search = sp.toString();
    return url.toString();
}

function classifyOffer(pct: number) {
    if (pct >= 95) return { label: "Top", color: T.moneyPositive };
    if (pct >= 85) return { label: "Typical", color: T.primary };
    if (pct >= 80) return { label: "Below Avg", color: T.accent };
    return { label: "Low", color: T.moneyNegative };
}

// ━━━ UI PRIMITIVES ━━━

function Logo() {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: T.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
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
        <span style={{ fontFamily: f.sans, fontSize: "10px", fontWeight: 600, color: T.textTertiary, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
            {children}
        </span>
    );
}

function MoneyValue({ value, size = "28px", color = T.text, unit }: { value: string; size?: string; color?: string; unit?: string }) {
    return (
        <div style={{ display: "flex", alignItems: "baseline", gap: "3px" }}>
            <span style={{ fontFamily: f.mono, fontSize: size, fontWeight: 700, color, letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</span>
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
    const safeMax = Math.max(max, 1);
    const pct = Math.min((value / safeMax) * 100, 100);
    return (
        <div style={{ width: "100%", height, background: T.surfaceRaised, borderRadius: "99px", overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "99px", transition: "width 1s cubic-bezier(0.16, 1, 0.3, 1)" }} />
        </div>
    );
}

function LoadingView({ text }: { text: string }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "40px 20px", gap: "24px" }}>
            <Logo />
            <div style={{ width: "40px", height: "40px", border: `3px solid ${T.border}`, borderTopColor: T.primary, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <p style={{ fontFamily: f.sans, fontSize: "15px", color: T.textSecondary, textAlign: "center" }}>{text}</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "40px 20px", gap: "20px" }}>
            <Logo />
            <Card style={{ maxWidth: "360px", textAlign: "center" }}>
                <div style={{ fontFamily: f.sans, fontSize: "14px", color: T.moneyNegative, fontWeight: 600, marginBottom: "8px" }}>Something went wrong</div>
                <p style={{ fontFamily: f.sans, fontSize: "13px", color: T.textSecondary, margin: "0 0 16px", lineHeight: 1.5 }}>{message}</p>
                <button onClick={onRetry} style={{ fontFamily: f.sans, fontSize: "14px", fontWeight: 600, padding: "10px 32px", borderRadius: "8px", border: "none", background: T.primary, color: "#fff", cursor: "pointer" }}>
                    Try again
                </button>
            </Card>
        </div>
    );
}

// ━━━ AGENCY CHIPS ━━━
const AGENCY_CHIPS = ["Aya", "Trusted", "Medical Solutions", "Host", "TNAA", "AMN", "Cross Country", "FlexCare", "Fastaff", "Nomad"];

// ━━━ INPUT VIEW ━━━

function CalculatorInput({
    step,
    onSubmitZip,
    onSubmitOffer,
    zip,
    setZip,
    gross,
    setGross,
    agency,
    setAgency,
    gsaPreview,
}: {
    step: number;
    onSubmitZip: () => void;
    onSubmitOffer: () => void;
    zip: string;
    setZip: (v: string) => void;
    gross: string;
    setGross: (v: string) => void;
    agency: string;
    setAgency: (v: string) => void;
    gsaPreview: ApiResult | null;
}) {
    const handleKeyDownZip = useCallback((e: React.KeyboardEvent) => { if (e.key === "Enter") onSubmitZip(); }, [onSubmitZip]);
    const handleKeyDownOffer = useCallback((e: React.KeyboardEvent) => { if (e.key === "Enter") onSubmitOffer(); }, [onSubmitOffer]);

    if (step === 0) {
        return (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", gap: "24px", minHeight: "100vh" }}>
                <Logo />
                <h1 style={{ fontFamily: f.sans, fontSize: "24px", fontWeight: 700, color: T.text, textAlign: "center", margin: 0, letterSpacing: "-0.01em", lineHeight: 1.3 }}>
                    Is this offer good?
                </h1>
                <p style={{ fontFamily: f.sans, fontSize: "15px", color: T.textSecondary, textAlign: "center", margin: 0, maxWidth: "320px", lineHeight: 1.5 }}>
                    Enter the assignment ZIP. Then paste the weekly gross and agency name.
                </p>
                <div style={{ width: "100%", maxWidth: "320px" }}>
                    <label htmlFor="zip-input" style={{ fontFamily: f.sans, fontSize: "12px", fontWeight: 500, color: T.textSecondary, display: "block", marginBottom: "6px" }}>Assignment ZIP</label>
                    <input
                        id="zip-input"
                        type="text"
                        inputMode="numeric"
                        maxLength={5}
                        value={zip}
                        onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
                        onKeyDown={handleKeyDownZip}
                        placeholder="90012"
                        autoFocus
                        style={{ width: "100%", boxSizing: "border-box" as const, fontFamily: f.mono, fontSize: "24px", fontWeight: 600, padding: "14px 16px", borderRadius: "10px", border: `2px solid ${zip.length === 5 ? T.borderFocus : T.border}`, background: T.surface, color: T.text, outline: "none", textAlign: "center" as const, letterSpacing: "0.1em", transition: "border-color 0.2s ease" }}
                    />
                </div>
                <button
                    onClick={() => zip.length === 5 && onSubmitZip()}
                    disabled={zip.length !== 5}
                    style={{ fontFamily: f.sans, fontSize: "15px", fontWeight: 600, padding: "12px 40px", borderRadius: "10px", border: "none", background: zip.length === 5 ? T.primary : T.surfaceRaised, color: zip.length === 5 ? "#fff" : T.textTertiary, cursor: zip.length === 5 ? "pointer" : "default" }}
                >
                    Next →
                </button>
            </div>
        );
    }

    if (step === 1 && gsaPreview) {
        const gsa = gsaPreview.gsa;
        const loc = gsaPreview.location;

        return (
            <div style={{ padding: "32px 20px", display: "flex", flexDirection: "column", gap: "18px", alignItems: "center", minHeight: "100vh", justifyContent: "center" }}>
                <Logo />
                <Card style={{ width: "100%", maxWidth: "380px", textAlign: "center" }}>
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

                <div style={{ width: "100%", maxWidth: "380px" }}>
                    <label style={{ fontFamily: f.sans, fontSize: "12px", fontWeight: 600, color: T.textSecondary, display: "block", marginBottom: "6px" }}>
                        Agency name (crowdsourced intel)
                    </label>
                    <input
                        type="text"
                        value={agency}
                        onChange={(e) => setAgency(e.target.value)}
                        onKeyDown={handleKeyDownOffer}
                        placeholder="Aya, Trusted, Medical Solutions…"
                        style={{ width: "100%", boxSizing: "border-box" as const, fontFamily: f.sans, fontSize: "15px", fontWeight: 600, padding: "12px", borderRadius: "10px", border: `2px solid ${agency.trim().length >= 2 ? T.borderFocus : T.border}`, background: T.surface, color: T.text, outline: "none" }}
                    />
                    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "8px", marginTop: "10px" }}>
                        {AGENCY_CHIPS.map((x) => (
                            <button key={x} onClick={() => setAgency(x)} style={{ border: `1px solid ${T.border}`, background: agency === x ? T.primaryMuted : T.surface, color: agency === x ? T.primary : T.textSecondary, borderRadius: "999px", padding: "6px 10px", fontFamily: f.sans, fontSize: "12px", cursor: "pointer" }}>
                                {x}
                            </button>
                        ))}
                    </div>

                    <div style={{ marginTop: "16px" }}>
                        <label style={{ fontFamily: f.sans, fontSize: "12px", fontWeight: 600, color: T.textSecondary, display: "block", marginBottom: "6px" }}>Weekly gross offer</label>
                        <div style={{ position: "relative" }}>
                            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontFamily: f.mono, fontSize: "22px", fontWeight: 700, color: T.textTertiary }}>$</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={gross}
                                onChange={(e) => setGross(e.target.value.replace(/\D/g, ""))}
                                onKeyDown={handleKeyDownOffer}
                                placeholder="2800"
                                autoFocus
                                style={{ width: "100%", boxSizing: "border-box" as const, fontFamily: f.mono, fontSize: "22px", fontWeight: 700, padding: "12px 12px 12px 34px", borderRadius: "10px", border: `2px solid ${gross.length >= 3 ? T.borderFocus : T.border}`, background: T.surface, color: T.text, outline: "none", textAlign: "center" as const }}
                            />
                        </div>
                        <button
                            onClick={() => gross.length >= 3 && onSubmitOffer()}
                            disabled={gross.length < 3}
                            style={{ width: "100%", marginTop: "12px", fontFamily: f.sans, fontSize: "15px", fontWeight: 700, padding: "12px", borderRadius: "10px", border: "none", background: gross.length >= 3 ? T.primary : T.surfaceRaised, color: gross.length >= 3 ? "#fff" : T.textTertiary, cursor: gross.length >= 3 ? "pointer" : "default" }}
                        >
                            Decode my offer →
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

// ━━━ RESULTS VIEW ━━━

function ResultsView({
    result,
    agency,
    onReset,
    onShareLink,
}: {
    result: DisplayResult;
    agency: string;
    onReset: () => void;
    onShareLink: () => void;
}) {
    const r = result;
    const cls = classifyOffer(r.pctOfMax);
    const delta = Math.round(r.deltaToTypicalWeekly);
    const leaving = delta > 0;

    const verdictLine = leaving
        ? `Your stipend is ${r.pctOfMax}% of the GSA max. Most agencies land 85–95%. You're leaving ~$${Math.abs(delta).toLocaleString()}/wk on the table (vs 90%).`
        : `Your stipend is ${r.pctOfMax}% of the GSA max. That's ${cls.label.toLowerCase()} versus the typical 85–95% band.`;

    return (
        <div style={{ padding: "24px 16px 80px", maxWidth: "460px", margin: "0 auto" }}>
            {/* Sticky header */}
            <div style={{ position: "sticky", top: 0, zIndex: 10, background: T.bg, padding: "12px 0 8px", borderBottom: `1px solid ${T.borderSubtle}`, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <button onClick={onReset} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    <Logo />
                </button>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                    <MicroLabel>EST. NET</MicroLabel>
                    <span style={{ fontFamily: f.mono, fontSize: "18px", fontWeight: 800, color: T.moneyPositive }}>
                        ${r.netWeekly.toLocaleString()}/wk
                    </span>
                </div>
            </div>

            {/* ━━━ VERDICT CARD ━━━ */}
            <Card style={{ marginBottom: "12px", background: T.surface }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                    <div>
                        <MicroLabel>OFFER VERDICT</MicroLabel>
                        <div style={{ fontFamily: f.sans, fontSize: "14px", color: T.textSecondary, marginTop: "4px" }}>
                            {r.city ? `${r.city}, ` : ""}{r.state} · {r.zip} · {r.hours}hr
                        </div>
                        {agency.trim() && (
                            <div style={{ fontFamily: f.sans, fontSize: "12px", color: T.textTertiary, marginTop: "2px" }}>
                                Agency: {agency.trim()}
                            </div>
                        )}
                    </div>
                    <GovBadge text={`GSA FY${r.fiscalYear}`} />
                </div>

                {/* Verdict banner */}
                <div style={{ padding: "10px 12px", borderRadius: "10px", background: `${cls.color}14`, border: `1px solid ${cls.color}30`, marginBottom: "14px" }}>
                    <div style={{ fontFamily: f.sans, fontSize: "12px", fontWeight: 800, color: cls.color, letterSpacing: "0.02em" }}>
                        {cls.label.toUpperCase()} · {r.pctOfMax}% of GSA
                    </div>
                    <div style={{ fontFamily: f.sans, fontSize: "12px", color: T.textSecondary, marginTop: "4px", lineHeight: 1.5 }}>
                        {verdictLine}
                    </div>
                </div>

                {/* Waterfall */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontFamily: f.sans, fontSize: "14px", color: T.textSecondary }}>Weekly Gross</span>
                        <span style={{ fontFamily: f.mono, fontSize: "18px", fontWeight: 700, color: T.text }}>${r.weeklyGross.toLocaleString()}</span>
                    </div>

                    {/* Stipend bar */}
                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <span style={{ fontFamily: f.sans, fontSize: "12px", color: T.primary, fontWeight: 700 }}>Tax-Free Stipend (actual)</span>
                            <span style={{ fontFamily: f.mono, fontSize: "14px", fontWeight: 700, color: T.primary }}>${r.stipendWeekly.toLocaleString()}</span>
                        </div>
                        <ProgressBar value={r.stipendWeekly} max={r.weeklyGross} color={T.primary} />
                        <div style={{ fontFamily: f.sans, fontSize: "10px", color: T.textTertiary, marginTop: "6px" }}>
                            GSA ceiling: ${r.gsaWeeklyMax.toLocaleString()}/wk · &quot;Typical&quot; target: ${Math.round(r.targetStipendWeekly).toLocaleString()}/wk
                        </div>
                    </div>

                    {/* Taxable bar */}
                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <span style={{ fontFamily: f.sans, fontSize: "12px", color: T.textSecondary }}>Taxable Wages ({r.hours}hr × ${r.taxableHourly}/hr)</span>
                            <span style={{ fontFamily: f.mono, fontSize: "14px", fontWeight: 600, color: T.textSecondary }}>${r.taxableWeekly.toLocaleString()}</span>
                        </div>
                        <ProgressBar value={r.taxableWeekly} max={r.weeklyGross} color={T.textTertiary} />
                    </div>

                    <div style={{ height: "1px", background: T.borderSubtle, margin: "4px 0" }} />

                    {/* Net take-home */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: T.moneyPositiveBg, borderRadius: "8px", border: `1px solid ${T.moneyPositive}20` }}>
                        <span style={{ fontFamily: f.sans, fontSize: "14px", fontWeight: 800, color: T.moneyPositive }}>Est. Net Take-Home</span>
                        <span style={{ fontFamily: f.mono, fontSize: "18px", fontWeight: 900, color: T.moneyPositive }}>${r.netWeekly.toLocaleString()}/wk</span>
                    </div>
                </div>

                <div style={{ fontFamily: f.sans, fontSize: "10px", color: T.textTertiary, marginTop: "10px", padding: "6px 8px", background: T.surfaceRaised, borderRadius: "4px", lineHeight: 1.5 }}>
                    {r.taxMethod}
                </div>
            </Card>

            {/* ━━━ HOUSING VS STIPEND ━━━ */}
            <Card style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <MicroLabel>HOUSING VS STIPEND</MicroLabel>
                    <span style={{ fontFamily: f.sans, fontSize: "9px", color: T.textTertiary, background: T.surfaceRaised, padding: "2px 6px", borderRadius: "3px" }}>{r.hudSource}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontFamily: f.sans, fontSize: "13px", color: T.textSecondary }}>HUD 1BR Fair Market Rent</span>
                    <span style={{ fontFamily: f.mono, fontSize: "14px", fontWeight: 700, color: T.text }}>${r.housing1br.toLocaleString()}/mo</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontFamily: f.sans, fontSize: "13px", color: T.textSecondary }}>Your Monthly Stipend (est.)</span>
                    <span style={{ fontFamily: f.mono, fontSize: "14px", fontWeight: 700, color: T.text }}>${Math.round(r.stipendMonthlyEst).toLocaleString()}/mo</span>
                </div>
                <div style={{ height: "1px", background: T.borderSubtle, margin: "8px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: r.stipendSurplus >= 0 ? T.moneyPositiveBg : T.moneyNegativeBg, borderRadius: "6px" }}>
                    <span style={{ fontFamily: f.sans, fontSize: "13px", fontWeight: 800, color: r.stipendSurplus >= 0 ? T.moneyPositive : T.moneyNegative }}>
                        {r.stipendSurplus >= 0 ? "Surplus After Rent" : "Shortfall"}
                    </span>
                    <span style={{ fontFamily: f.mono, fontSize: "16px", fontWeight: 900, color: r.stipendSurplus >= 0 ? T.moneyPositive : T.moneyNegative }}>
                        {r.stipendSurplus >= 0 ? "+" : ""}${Math.round(r.stipendSurplus).toLocaleString()}/mo
                    </span>
                </div>
            </Card>

            {/* ━━━ SHARE BUTTON ━━━ */}
            <button
                onClick={onShareLink}
                style={{ width: "100%", padding: "14px", borderRadius: "10px", border: `2px solid ${T.primary}`, background: "transparent", color: T.primary, fontFamily: f.sans, fontSize: "15px", fontWeight: 800, cursor: "pointer", marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                Share link (prefilled)
            </button>

            <button
                onClick={onReset}
                style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${T.border}`, background: T.surface, color: T.textSecondary, fontFamily: f.sans, fontSize: "14px", fontWeight: 600, cursor: "pointer", marginBottom: "12px" }}
            >
                New lookup
            </button>

            {/* ━━━ FOOTER ━━━ */}
            <footer style={{ fontFamily: f.sans, fontSize: "10px", color: T.textTertiary, lineHeight: 1.6, padding: "16px 0", borderTop: `1px solid ${T.borderSubtle}` }}>
                Pay data from nurses like you (protected under NLRA Section 7).
                Per diem rates from{" "}
                <a href="https://www.gsa.gov/travel/plan-book/per-diem-rates" style={{ color: T.textTertiary }} target="_blank" rel="noopener noreferrer">GSA.gov</a>.
                Housing data from{" "}
                <a href="https://www.huduser.gov/portal/datasets/fmr.html" style={{ color: T.textTertiary }} target="_blank" rel="noopener noreferrer">HUD FMR</a>.
                Not an agency. Not sponsored by one. Just the math.
            </footer>
        </div>
    );
}

// ━━━ MAIN CALCULATOR ━━━

export default function Calculator() {
    const [step, setStep] = useState(0);
    const [zip, setZip] = useState("");
    const [gross, setGross] = useState("");
    const [agency, setAgency] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingText, setLoadingText] = useState("Loading…");
    const [error, setError] = useState<string | null>(null);
    const [gsaPreview, setGsaPreview] = useState<ApiResult | null>(null);
    const [result, setResult] = useState<DisplayResult | null>(null);

    const hours = 36;

    // Keep URL bar in sync for shareability
    useEffect(() => {
        if (typeof window === "undefined") return;
        if (zip.length !== 5) return;
        const grossNum = gross.length >= 3 ? parseInt(gross, 10) : undefined;
        const url = buildPrefillUrl({ zip, gross: grossNum, hours, agency });
        window.history.replaceState({}, "", url);
    }, [zip, gross, agency]);

    // Prefill from URL on mount: /?zip=90012&gross=2800&agency=Aya
    useEffect(() => {
        if (typeof window === "undefined") return;

        const sp = new URLSearchParams(window.location.search);
        const z = (sp.get("zip") ?? "").replace(/\D/g, "").slice(0, 5);
        const gRaw = sp.get("gross") ?? sp.get("gross_weekly") ?? "";
        const g = parseInt(gRaw.replace(/\D/g, ""), 10);
        const a = (sp.get("agency") ?? sp.get("agency_name") ?? "").slice(0, 100);

        if (z.length === 5) setZip(z);
        if (!Number.isNaN(g) && g > 0) setGross(String(g));
        if (a) setAgency(a);

        const run = async () => {
            if (z.length !== 5) return;

            // Full auto-run if both ZIP + gross present
            if (!Number.isNaN(g) && g >= 200) {
                setLoading(true);
                setLoadingText("Decoding the offer…");
                setError(null);
                try {
                    const res = await fetch("/api/v1/lookup-stipend", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ zip: z, gross_weekly: g, hours, agency_name: a || null, ingest: true }),
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
                    setStep(0);
                } finally {
                    setLoading(false);
                }
                return;
            }

            // ZIP-only: fetch preview (NO ingestion)
            setLoading(true);
            setLoadingText("Looking up GSA rates…");
            setError(null);
            try {
                const res = await fetch("/api/v1/lookup-stipend", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ zip: z, gross_weekly: 2000, hours, ingest: false }),
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
                setStep(0);
            } finally {
                setLoading(false);
            }
        };

        void run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleZipSubmit = useCallback(async () => {
        if (zip.length !== 5) return;
        setLoading(true);
        setLoadingText("Looking up GSA rates…");
        setError(null);
        try {
            const res = await fetch("/api/v1/lookup-stipend", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ zip, gross_weekly: 2000, hours, ingest: false }),
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

    const handleOfferSubmit = useCallback(async () => {
        if (gross.length < 3) return;
        setLoading(true);
        setLoadingText("Decoding the offer…");
        setError(null);
        try {
            const grossNum = parseInt(gross, 10);
            const res = await fetch("/api/v1/lookup-stipend", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ zip, gross_weekly: grossNum, hours, agency_name: agency.trim() ? agency.trim() : null, ingest: true }),
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
    }, [zip, gross, agency]);

    const handleShareLink = useCallback(async () => {
        if (typeof window === "undefined" || !result) return;
        const url = buildPrefillUrl({ zip: result.zip, gross: result.weeklyGross, hours: result.hours, agency: agency.trim() });
        const text = `PerDiem.fyi — ${result.zip} $${result.weeklyGross}/wk: stipend is ${result.pctOfMax}% of GSA. ${url}`;
        if (navigator.share) {
            await navigator.share({ title: "PerDiem.fyi", text, url });
        } else {
            await navigator.clipboard.writeText(url);
        }
    }, [result, agency]);

    const handleReset = useCallback(() => {
        setStep(0);
        setZip("");
        setGross("");
        setAgency("");
        setGsaPreview(null);
        setResult(null);
        setError(null);
        if (typeof window !== "undefined") window.history.replaceState({}, "", window.location.pathname);
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
                <LoadingView text={loadingText} />
            </div>
        );
    }

    return (
        <div style={{ background: T.bg, minHeight: "100vh", color: T.text }}>
            {step < 2 ? (
                <CalculatorInput
                    step={step}
                    onSubmitZip={handleZipSubmit}
                    onSubmitOffer={handleOfferSubmit}
                    zip={zip}
                    setZip={setZip}
                    gross={gross}
                    setGross={setGross}
                    agency={agency}
                    setAgency={setAgency}
                    gsaPreview={gsaPreview}
                />
            ) : result ? (
                <ResultsView result={result} agency={agency} onReset={handleReset} onShareLink={handleShareLink} />
            ) : null}
        </div>
    );
}
