"use client";

import React, { useState, useEffect, useCallback } from "react";
import { T, FONTS as f } from "@/lib/theme";

// ━━━ TYPES ━━━

type InsurancePlan = "none" | "single" | "family" | "aca" | "private";

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
    negotiation: { pct_of_max: number };
    contract_13wk: {
        weeks: number;
        gross: number;
        net_estimate: number;
        tax_free_total: number;
    };
    insurance: {
        plan: InsurancePlan;
        agency_label: string | null;
        weekly_min: number | null;
        weekly_max: number | null;
        weekly_mid: number | null;
        source_type: string;
        source_urls: string[];
        notes?: string;
    };
    derived: { net_after_insurance_weekly: number };
    metadata: {
        gsa_fiscal_year: number;
        hud_rent_source: string;
        tax_method: string;
        offer_verdict?: {
            stipend_pct_of_gsa: number;
            label: string;
            typical_band: string;
            delta_to_typical_weekly: number;
            target_stipend_weekly: number;
        };
        assumptions: string[];
    };
}

interface DisplayResult {
    zip: string;
    city: string;
    state: string;
    weeklyGross: number;
    hours: number;
    gsaWeeklyMax: number;
    fiscalYear: number;
    stipendWeekly: number;
    stipendMonthlyEst: number;
    taxableWeekly: number;
    taxableHourly: number;
    netWeekly: number;
    pctOfMax: number;
    deltaToTypicalWeekly: number;
    targetStipendWeekly: number;
    offerLabel: string;
    typicalBand: string;
    housing1br: number;
    stipendSurplus: number;
    insurancePlan: InsurancePlan;
    insuranceWeeklyMid: number;
    insuranceWeeklyMin: number | null;
    insuranceWeeklyMax: number | null;
    insuranceSourceType: string;
    netAfterInsuranceWeekly: number;
    hudSource: string;
    taxMethod: string;
}

function mapApiToDisplay(api: ApiResult): DisplayResult {
    const ov = api.metadata.offer_verdict;
    return {
        zip: api.location.zip,
        city: api.location.city,
        state: api.location.state,
        weeklyGross: api.breakdown.weekly_gross,
        hours: api.breakdown.hours,
        gsaWeeklyMax: api.gsa.weekly_max,
        fiscalYear: api.gsa.fiscal_year,
        stipendWeekly: api.breakdown.stipend_weekly,
        stipendMonthlyEst: api.housing.stipend_monthly_est,
        taxableWeekly: api.breakdown.taxable_weekly,
        taxableHourly: api.breakdown.taxable_hourly,
        netWeekly: api.breakdown.net_weekly,
        pctOfMax: api.negotiation.pct_of_max ?? 0,
        deltaToTypicalWeekly: ov?.delta_to_typical_weekly ?? 0,
        targetStipendWeekly: ov?.target_stipend_weekly ?? 0,
        offerLabel: ov?.label ?? "—",
        typicalBand: ov?.typical_band ?? "85–95%",
        housing1br: api.housing.hud_fmr_1br,
        stipendSurplus: api.housing.stipend_surplus_monthly,
        insurancePlan: api.insurance.plan,
        insuranceWeeklyMid: api.insurance.weekly_mid ?? 0,
        insuranceWeeklyMin: api.insurance.weekly_min,
        insuranceWeeklyMax: api.insurance.weekly_max,
        insuranceSourceType: api.insurance.source_type,
        netAfterInsuranceWeekly: api.derived.net_after_insurance_weekly,
        hudSource: api.metadata.hud_rent_source,
        taxMethod: api.metadata.tax_method,
    };
}

// ━━━ HELPERS ━━━

function buildPrefillUrl(p: {
    zip: string;
    gross?: number;
    agency?: string;
    plan?: InsurancePlan;
    ins?: number | null;
}) {
    const url = new URL(window.location.href);
    const sp = url.searchParams;
    sp.set("zip", p.zip);
    if (p.gross && p.gross > 0) sp.set("gross", String(p.gross));
    else sp.delete("gross");
    const a = (p.agency ?? "").trim();
    if (a) sp.set("agency", a);
    else sp.delete("agency");
    sp.set("plan", p.plan ?? "none");
    if (typeof p.ins === "number" && p.ins >= 0) sp.set("ins", String(p.ins));
    else sp.delete("ins");
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
                fontWeight: 700,
                color: T.textTertiary,
                letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
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
    const safeMax = Math.max(max, 1);
    const pct = Math.min((value / safeMax) * 100, 100);
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

function LoadingView({ text }: { text: string }) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
                padding: "40px 20px",
                gap: "24px",
            }}
        >
            <Logo />
            <div
                style={{
                    width: "40px",
                    height: "40px",
                    border: `3px solid ${T.border}`,
                    borderTopColor: T.primary,
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                }}
            />
            <p
                style={{
                    fontFamily: f.sans,
                    fontSize: "15px",
                    color: T.textSecondary,
                    textAlign: "center",
                }}
            >
                {text}
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

function ErrorView({
    message,
    onRetry,
}: {
    message: string;
    onRetry: () => void;
}) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
                padding: "40px 20px",
                gap: "20px",
            }}
        >
            <Logo />
            <Card style={{ maxWidth: "360px", textAlign: "center" }}>
                <div
                    style={{
                        fontFamily: f.sans,
                        fontSize: "14px",
                        color: T.moneyNegative,
                        fontWeight: 800,
                        marginBottom: "8px",
                    }}
                >
                    Something went wrong
                </div>
                <p
                    style={{
                        fontFamily: f.sans,
                        fontSize: "13px",
                        color: T.textSecondary,
                        margin: "0 0 16px",
                        lineHeight: 1.5,
                    }}
                >
                    {message}
                </p>
                <button
                    onClick={onRetry}
                    style={{
                        fontFamily: f.sans,
                        fontSize: "14px",
                        fontWeight: 800,
                        padding: "10px 32px",
                        borderRadius: "8px",
                        border: "none",
                        background: T.primary,
                        color: "#fff",
                        cursor: "pointer",
                    }}
                >
                    Try again
                </button>
            </Card>
        </div>
    );
}

// ━━━ CONSTANTS ━━━

const AGENCY_CHIPS = [
    "Aya",
    "Trusted",
    "Medical Solutions",
    "Host",
    "TNAA",
    "AMN",
    "Cross Country",
    "FlexCare",
    "Fastaff",
    "Nomad",
];

const PLAN_OPTIONS: Array<{ value: InsurancePlan; label: string }> = [
    { value: "none", label: "None / waived" },
    { value: "single", label: "Single" },
    { value: "family", label: "Family" },
    { value: "aca", label: "ACA" },
    { value: "private", label: "Private" },
];

function PlanPill({
    label,
    active,
    onClick,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            style={{
                border: `1px solid ${active ? T.borderFocus : T.border}`,
                background: active ? T.primaryMuted : T.surface,
                color: active ? T.primary : T.textSecondary,
                borderRadius: "999px",
                padding: "7px 12px",
                fontFamily: f.sans,
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
            }}
        >
            {label}
        </button>
    );
}

// ━━━ MAIN CALCULATOR ━━━

export default function Calculator() {
    const [step, setStep] = useState(0);
    const [zip, setZip] = useState("");
    const [gross, setGross] = useState("");
    const [agency, setAgency] = useState("");
    const [plan, setPlan] = useState<InsurancePlan>("none");
    const [insuranceOverride, setInsuranceOverride] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingText, setLoadingText] = useState("Loading…");
    const [error, setError] = useState<string | null>(null);
    const [gsaPreview, setGsaPreview] = useState<ApiResult | null>(null);
    const [result, setResult] = useState<DisplayResult | null>(null);

    const hours = 36;

    // ━━━ URL PREFILL ON MOUNT ━━━
    useEffect(() => {
        if (typeof window === "undefined") return;
        const sp = new URLSearchParams(window.location.search);

        const z = (sp.get("zip") ?? "").replace(/\D/g, "").slice(0, 5);
        const gRaw = sp.get("gross") ?? "";
        const g = parseInt(gRaw.replace(/\D/g, ""), 10);
        const a = (sp.get("agency") ?? "").slice(0, 100);
        const p = (sp.get("plan") ?? "none") as InsurancePlan;
        const ins = sp.get("ins") ?? "";

        if (z.length === 5) setZip(z);
        if (!Number.isNaN(g) && g > 0) setGross(String(g));
        if (a) setAgency(a);
        if (["none", "single", "family", "aca", "private"].includes(p)) setPlan(p);
        if (ins) setInsuranceOverride(ins.replace(/[^\d.]/g, ""));

        const run = async () => {
            if (z.length !== 5) return;

            const overrideNum = ins ? parseFloat(ins) : null;

            // Full auto-run if ZIP + gross
            if (!Number.isNaN(g) && g >= 200) {
                setLoading(true);
                setLoadingText("Decoding the offer…");
                setError(null);
                try {
                    const res = await fetch("/api/v1/lookup-stipend", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            zip: z,
                            gross_weekly: g,
                            hours,
                            agency_name: a || null,
                            ingest: true,
                            insurance_plan: p,
                            insurance_weekly_override: Number.isFinite(overrideNum as number) ? overrideNum : null,
                        }),
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

            // ZIP-only preview (NO ingestion)
            setLoading(true);
            setLoadingText("Looking up GSA rates…");
            setError(null);
            try {
                const res = await fetch("/api/v1/lookup-stipend", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ zip: z, gross_weekly: 2000, hours, ingest: false, insurance_plan: "none" }),
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

    // ━━━ KEEP URL IN SYNC ━━━
    useEffect(() => {
        if (typeof window === "undefined" || zip.length !== 5) return;
        const grossNum = gross.length >= 3 ? parseInt(gross, 10) : undefined;
        const insNum = insuranceOverride.trim() ? parseFloat(insuranceOverride) : null;
        const url = buildPrefillUrl({
            zip,
            gross: grossNum,
            agency: agency.trim(),
            plan,
            ins: Number.isFinite(insNum as number) ? insNum : null,
        });
        window.history.replaceState({}, "", url);
    }, [zip, gross, agency, plan, insuranceOverride]);

    // ━━━ HANDLERS ━━━

    const handleZipSubmit = useCallback(async () => {
        if (zip.length !== 5) return;
        setLoading(true);
        setLoadingText("Looking up GSA rates…");
        setError(null);
        try {
            const res = await fetch("/api/v1/lookup-stipend", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ zip, gross_weekly: 2000, hours, ingest: false, insurance_plan: "none" }),
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
            const overrideNum = insuranceOverride.trim() ? parseFloat(insuranceOverride) : null;
            const res = await fetch("/api/v1/lookup-stipend", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    zip,
                    gross_weekly: grossNum,
                    hours,
                    agency_name: agency.trim() ? agency.trim() : null,
                    ingest: true,
                    insurance_plan: plan,
                    insurance_weekly_override: Number.isFinite(overrideNum as number) ? overrideNum : null,
                }),
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
    }, [zip, gross, agency, plan, insuranceOverride]);

    const handleShareLink = useCallback(async () => {
        if (typeof window === "undefined" || !result) return;
        const insNum = insuranceOverride.trim() ? parseFloat(insuranceOverride) : null;
        const url = buildPrefillUrl({
            zip: result.zip,
            gross: result.weeklyGross,
            agency: agency.trim(),
            plan,
            ins: Number.isFinite(insNum as number) ? insNum : null,
        });
        const text = `PerDiem.fyi — ${result.zip} $${result.weeklyGross}/wk · ${result.pctOfMax}% GSA · net after insurance $${result.netAfterInsuranceWeekly}/wk`;
        if (navigator.share) {
            await navigator.share({ title: "PerDiem.fyi", text, url });
        } else {
            await navigator.clipboard.writeText(url);
        }
    }, [result, agency, plan, insuranceOverride]);

    const handleReset = useCallback(() => {
        setStep(0);
        setZip("");
        setGross("");
        setAgency("");
        setPlan("none");
        setInsuranceOverride("");
        setGsaPreview(null);
        setResult(null);
        setError(null);
        if (typeof window !== "undefined") window.history.replaceState({}, "", window.location.pathname);
    }, []);

    // ━━━ RENDER ━━━

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

    // ━━━ STEP 0: ZIP ━━━
    if (step === 0) {
        return (
            <div style={{ background: T.bg, minHeight: "100vh", color: T.text, display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 20px" }}>
                <div style={{ width: "100%", maxWidth: "360px", display: "flex", flexDirection: "column", gap: "18px", alignItems: "center" }}>
                    <Logo />
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontFamily: f.sans, fontSize: "24px", fontWeight: 900, letterSpacing: "-0.02em" }}>
                            Is this offer good?
                        </div>
                        <div style={{ fontFamily: f.sans, fontSize: "14px", color: T.textSecondary, marginTop: "6px", lineHeight: 1.5 }}>
                            ZIP → offer → insurance → real net.
                        </div>
                    </div>
                    <div style={{ width: "100%" }}>
                        <label style={{ fontFamily: f.sans, fontSize: "12px", fontWeight: 800, color: T.textSecondary, display: "block", marginBottom: "6px" }}>
                            Assignment ZIP
                        </label>
                        <input
                            value={zip}
                            onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
                            onKeyDown={(e) => e.key === "Enter" && handleZipSubmit()}
                            inputMode="numeric"
                            placeholder="90012"
                            autoFocus
                            style={{ width: "100%", boxSizing: "border-box" as const, fontFamily: f.mono, fontSize: "24px", fontWeight: 900, padding: "14px 16px", borderRadius: "10px", border: `2px solid ${zip.length === 5 ? T.borderFocus : T.border}`, background: T.surface, color: T.text, outline: "none", textAlign: "center" as const, letterSpacing: "0.1em" }}
                        />
                    </div>
                    <button
                        onClick={handleZipSubmit}
                        disabled={zip.length !== 5}
                        style={{ width: "100%", fontFamily: f.sans, fontSize: "15px", fontWeight: 900, padding: "12px", borderRadius: "10px", border: "none", background: zip.length === 5 ? T.primary : T.surfaceRaised, color: zip.length === 5 ? "#fff" : T.textTertiary, cursor: zip.length === 5 ? "pointer" : "default" }}
                    >
                        Next →
                    </button>
                </div>
            </div>
        );
    }

    // ━━━ STEP 1: AGENCY + OFFER + INSURANCE ━━━
    if (step === 1 && gsaPreview) {
        return (
            <div style={{ background: T.bg, minHeight: "100vh", color: T.text, padding: "28px 16px", display: "flex", justifyContent: "center" }}>
                <div style={{ width: "100%", maxWidth: "420px", display: "flex", flexDirection: "column", gap: "14px" }}>
                    <Logo />

                    {/* GSA ceiling */}
                    <Card>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <MicroLabel>GSA per diem ceiling</MicroLabel>
                            <GovBadge text={`FY${gsaPreview.gsa.fiscal_year}`} />
                        </div>
                        <div style={{ marginTop: "8px", fontFamily: f.mono, fontSize: "34px", fontWeight: 900, color: T.text }}>
                            ${gsaPreview.gsa.weekly_max.toLocaleString()}<span style={{ fontSize: "16px", fontWeight: 400, color: T.textTertiary }}>/wk</span>
                        </div>
                        <div style={{ marginTop: "4px", fontFamily: f.sans, fontSize: "13px", color: T.textSecondary }}>
                            {gsaPreview.location.city ? `${gsaPreview.location.city}, ` : ""}{gsaPreview.location.state}
                        </div>
                    </Card>

                    {/* Agency */}
                    <Card>
                        <MicroLabel>Agency (crowdsourced intel)</MicroLabel>
                        <input
                            value={agency}
                            onChange={(e) => setAgency(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleOfferSubmit()}
                            placeholder="Aya, Trusted, Medical Solutions…"
                            style={{ width: "100%", marginTop: "8px", boxSizing: "border-box" as const, fontFamily: f.sans, fontSize: "15px", fontWeight: 700, padding: "12px", borderRadius: "10px", border: `2px solid ${agency.trim().length >= 2 ? T.borderFocus : T.border}`, background: T.surface, color: T.text, outline: "none" }}
                        />
                        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "8px", marginTop: "10px" }}>
                            {AGENCY_CHIPS.map((x) => (
                                <button
                                    key={x}
                                    onClick={() => setAgency(x)}
                                    style={{ border: `1px solid ${T.border}`, background: agency === x ? T.primaryMuted : T.surface, color: agency === x ? T.primary : T.textSecondary, borderRadius: "999px", padding: "6px 10px", fontFamily: f.sans, fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                                >
                                    {x}
                                </button>
                            ))}
                        </div>
                    </Card>

                    {/* Insurance */}
                    <Card>
                        <MicroLabel>Health insurance</MicroLabel>
                        <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" as const }}>
                            {PLAN_OPTIONS.map((o) => (
                                <PlanPill key={o.value} label={o.label} active={plan === o.value} onClick={() => setPlan(o.value)} />
                            ))}
                        </div>
                        {plan !== "none" && (
                            <div style={{ marginTop: "12px" }}>
                                <div style={{ fontFamily: f.sans, fontSize: "12px", color: T.textSecondary, lineHeight: 1.5, marginBottom: "8px" }}>
                                    Weekly premium override (from your paystub)
                                </div>
                                <div style={{ position: "relative" }}>
                                    <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontFamily: f.mono, fontSize: "18px", fontWeight: 900, color: T.textTertiary }}>$</span>
                                    <input
                                        value={insuranceOverride}
                                        onChange={(e) => setInsuranceOverride(e.target.value.replace(/[^\d.]/g, ""))}
                                        onKeyDown={(e) => e.key === "Enter" && handleOfferSubmit()}
                                        placeholder="0"
                                        inputMode="decimal"
                                        style={{ width: "100%", boxSizing: "border-box" as const, fontFamily: f.mono, fontSize: "18px", fontWeight: 900, padding: "12px 12px 12px 34px", borderRadius: "10px", border: `2px solid ${insuranceOverride.trim() ? T.borderFocus : T.border}`, background: T.surface, color: T.text, outline: "none" }}
                                    />
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Gross + submit */}
                    <Card>
                        <MicroLabel>Weekly gross offer</MicroLabel>
                        <div style={{ position: "relative", marginTop: "10px" }}>
                            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontFamily: f.mono, fontSize: "22px", fontWeight: 900, color: T.textTertiary }}>$</span>
                            <input
                                value={gross}
                                onChange={(e) => setGross(e.target.value.replace(/\D/g, ""))}
                                onKeyDown={(e) => e.key === "Enter" && handleOfferSubmit()}
                                placeholder="2800"
                                inputMode="numeric"
                                autoFocus
                                style={{ width: "100%", boxSizing: "border-box" as const, fontFamily: f.mono, fontSize: "22px", fontWeight: 900, padding: "12px 12px 12px 34px", borderRadius: "10px", border: `2px solid ${gross.length >= 3 ? T.borderFocus : T.border}`, background: T.surface, color: T.text, outline: "none", textAlign: "center" as const }}
                            />
                        </div>
                        <button
                            onClick={handleOfferSubmit}
                            disabled={gross.length < 3}
                            style={{ width: "100%", marginTop: "12px", fontFamily: f.sans, fontSize: "15px", fontWeight: 900, padding: "12px", borderRadius: "10px", border: "none", background: gross.length >= 3 ? T.primary : T.surfaceRaised, color: gross.length >= 3 ? "#fff" : T.textTertiary, cursor: gross.length >= 3 ? "pointer" : "default" }}
                        >
                            Decode my offer →
                        </button>
                    </Card>
                </div>
            </div>
        );
    }

    // ━━━ STEP 2: RESULTS ━━━
    if (step === 2 && result) {
        const r = result;
        const cls = classifyOffer(r.pctOfMax);
        const delta = Math.round(r.deltaToTypicalWeekly);
        const leaving = delta > 0;

        const verdictLine = leaving
            ? `Stipend is ${r.pctOfMax}% of GSA max. Most agencies land ${r.typicalBand}. You're leaving ~$${Math.abs(delta).toLocaleString()}/wk on the table vs 90%.`
            : `Stipend is ${r.pctOfMax}% of GSA max — ${cls.label.toLowerCase()} versus the typical ${r.typicalBand} band.`;

        const insLabel = PLAN_OPTIONS.find((o) => o.value === plan)?.label ?? "None";

        return (
            <div style={{ background: T.bg, minHeight: "100vh", color: T.text, padding: "18px 16px 80px", display: "flex", justifyContent: "center" }}>
                <div style={{ width: "100%", maxWidth: "460px" }}>
                    {/* Sticky header */}
                    <div style={{ position: "sticky", top: 0, zIndex: 10, background: T.bg, padding: "12px 0 10px", borderBottom: `1px solid ${T.borderSubtle}`, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <button onClick={handleReset} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                            <Logo />
                        </button>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontFamily: f.sans, fontSize: "10px", fontWeight: 900, color: T.textTertiary, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
                                Net after insurance
                            </div>
                            <div style={{ fontFamily: f.mono, fontSize: "18px", fontWeight: 900, color: T.moneyPositive }}>
                                ${r.netAfterInsuranceWeekly.toLocaleString()}/wk
                            </div>
                        </div>
                    </div>

                    {/* ━━━ VERDICT CARD ━━━ */}
                    <Card>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                            <div>
                                <MicroLabel>Offer verdict</MicroLabel>
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
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontFamily: f.sans, fontSize: "13px", color: T.textSecondary }}>Weekly Gross</span>
                                <span style={{ fontFamily: f.mono, fontSize: "16px", fontWeight: 900 }}>${r.weeklyGross.toLocaleString()}</span>
                            </div>

                            {/* Stipend */}
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                    <span style={{ fontFamily: f.sans, fontSize: "12px", color: T.primary, fontWeight: 700 }}>Tax-Free Stipend</span>
                                    <span style={{ fontFamily: f.mono, fontSize: "14px", fontWeight: 700, color: T.primary }}>${r.stipendWeekly.toLocaleString()}</span>
                                </div>
                                <ProgressBar value={r.stipendWeekly} max={r.weeklyGross} color={T.primary} />
                                <div style={{ fontFamily: f.sans, fontSize: "10px", color: T.textTertiary, marginTop: "4px" }}>
                                    GSA ceiling: ${r.gsaWeeklyMax.toLocaleString()}/wk · Target (90%): ${Math.round(r.targetStipendWeekly).toLocaleString()}/wk
                                </div>
                            </div>

                            {/* Taxable */}
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                    <span style={{ fontFamily: f.sans, fontSize: "12px", color: T.textSecondary }}>Taxable ({r.hours}hr × ${r.taxableHourly}/hr)</span>
                                    <span style={{ fontFamily: f.mono, fontSize: "14px", fontWeight: 600, color: T.textSecondary }}>${r.taxableWeekly.toLocaleString()}</span>
                                </div>
                                <ProgressBar value={r.taxableWeekly} max={r.weeklyGross} color={T.textTertiary} />
                            </div>

                            <div style={{ height: "1px", background: T.borderSubtle }} />

                            {/* Net before insurance */}
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontFamily: f.sans, fontSize: "13px", color: T.textSecondary }}>Est. Net (before insurance)</span>
                                <span style={{ fontFamily: f.mono, fontSize: "14px", fontWeight: 900 }}>${r.netWeekly.toLocaleString()}</span>
                            </div>

                            {/* Insurance deduction */}
                            {r.insuranceWeeklyMid > 0 && (
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ fontFamily: f.sans, fontSize: "13px", color: T.moneyNegative }}>Insurance ({insLabel})</span>
                                    <span style={{ fontFamily: f.mono, fontSize: "14px", fontWeight: 900, color: T.moneyNegative }}>
                                        −${Math.round(r.insuranceWeeklyMid).toLocaleString()}/wk
                                    </span>
                                </div>
                            )}

                            {/* Net after insurance */}
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: T.moneyPositiveBg, borderRadius: "8px", border: `1px solid ${T.moneyPositive}20` }}>
                                <span style={{ fontFamily: f.sans, fontSize: "13px", fontWeight: 900, color: T.moneyPositive }}>Net after insurance</span>
                                <span style={{ fontFamily: f.mono, fontSize: "16px", fontWeight: 900, color: T.moneyPositive }}>${r.netAfterInsuranceWeekly.toLocaleString()}/wk</span>
                            </div>
                        </div>

                        <div style={{ fontFamily: f.sans, fontSize: "10px", color: T.textTertiary, marginTop: "10px", padding: "6px 8px", background: T.surfaceRaised, borderRadius: "4px", lineHeight: 1.5 }}>
                            {r.taxMethod}
                        </div>
                    </Card>

                    {/* ━━━ HOUSING ━━━ */}
                    <Card style={{ marginTop: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                            <MicroLabel>Housing vs stipend</MicroLabel>
                            <span style={{ fontFamily: f.sans, fontSize: "9px", color: T.textTertiary, background: T.surfaceRaised, padding: "2px 6px", borderRadius: "3px" }}>{r.hudSource}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                            <span style={{ fontFamily: f.sans, fontSize: "13px", color: T.textSecondary }}>HUD 1BR Fair Market Rent</span>
                            <span style={{ fontFamily: f.mono, fontSize: "14px", fontWeight: 700 }}>${r.housing1br.toLocaleString()}/mo</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                            <span style={{ fontFamily: f.sans, fontSize: "13px", color: T.textSecondary }}>Your Monthly Stipend (est.)</span>
                            <span style={{ fontFamily: f.mono, fontSize: "14px", fontWeight: 700 }}>${Math.round(r.stipendMonthlyEst).toLocaleString()}/mo</span>
                        </div>
                        <div style={{ height: "1px", background: T.borderSubtle, margin: "8px 0" }} />
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: r.stipendSurplus >= 0 ? T.moneyPositiveBg : T.moneyNegativeBg, borderRadius: "6px" }}>
                            <span style={{ fontFamily: f.sans, fontSize: "13px", fontWeight: 800, color: r.stipendSurplus >= 0 ? T.moneyPositive : T.moneyNegative }}>
                                {r.stipendSurplus >= 0 ? "Surplus After Rent" : "Shortfall"}
                            </span>
                            <span style={{ fontFamily: f.mono, fontSize: "16px", fontWeight: 900, color: r.stipendSurplus >= 0 ? T.moneyPositive : T.moneyNegative }}>
                                {r.stipendSurplus >= 0 ? "+" : ""}${Math.round(r.stipendSurplus).toLocaleString()}/mo
                            </span>
                        </div>
                    </Card>

                    {/* ━━━ INSURANCE SOURCE ━━━ */}
                    {r.insuranceWeeklyMid > 0 && (
                        <Card style={{ marginTop: "12px" }}>
                            <MicroLabel>Insurance estimate</MicroLabel>
                            <div style={{ marginTop: "8px", fontFamily: f.sans, fontSize: "12px", color: T.textSecondary, lineHeight: 1.5 }}>
                                Source: {r.insuranceSourceType}.
                                {r.insuranceWeeklyMin !== null && r.insuranceWeeklyMax !== null && r.insuranceWeeklyMin !== r.insuranceWeeklyMax
                                    ? ` Range: $${r.insuranceWeeklyMin}–$${r.insuranceWeeklyMax}/wk.`
                                    : ""}
                                {" "}Override wins when provided.
                            </div>
                        </Card>
                    )}

                    {/* ━━━ SHARE ━━━ */}
                    <button
                        onClick={handleShareLink}
                        style={{ width: "100%", marginTop: "12px", padding: "14px", borderRadius: "10px", border: `2px solid ${T.primary}`, background: "transparent", color: T.primary, fontFamily: f.sans, fontSize: "15px", fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                        </svg>
                        Share link (prefilled)
                    </button>

                    <button
                        onClick={handleReset}
                        style={{ width: "100%", marginTop: "10px", padding: "12px", borderRadius: "10px", border: `1px solid ${T.border}`, background: T.surface, color: T.textSecondary, fontFamily: f.sans, fontSize: "14px", fontWeight: 700, cursor: "pointer" }}
                    >
                        New lookup
                    </button>

                    {/* Footer */}
                    <footer style={{ fontFamily: f.sans, fontSize: "10px", color: T.textTertiary, lineHeight: 1.6, padding: "16px 0", borderTop: `1px solid ${T.borderSubtle}`, marginTop: "12px" }}>
                        Pay data from nurses like you (protected under NLRA Section 7).
                        Per diem rates from{" "}
                        <a href="https://www.gsa.gov/travel/plan-book/per-diem-rates" style={{ color: T.textTertiary }} target="_blank" rel="noopener noreferrer">GSA.gov</a>.
                        Housing data from{" "}
                        <a href="https://www.huduser.gov/portal/datasets/fmr.html" style={{ color: T.textTertiary }} target="_blank" rel="noopener noreferrer">HUD FMR</a>.
                        Insurance estimates sourced per-agency; override with your paystub number.
                        Not an agency. Not sponsored by one. Just the math.
                    </footer>
                </div>
            </div>
        );
    }

    return null;
}
