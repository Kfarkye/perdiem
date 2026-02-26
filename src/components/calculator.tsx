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
    zori_rent?: number | null;
    market_ratio?: number | null;
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
  taxEstimateWeekly: number;
  pctOfMax: number;
  deltaToTypicalWeekly: number;
  targetStipendWeekly: number;
  offerLabel: string;
  typicalBand: string;
  housing1br: number;
  zoriRent: number | null;
  marketRatio: number | null;
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
    taxEstimateWeekly: api.breakdown.tax_estimate_weekly,
    pctOfMax: api.negotiation.pct_of_max ?? 0,
    deltaToTypicalWeekly: ov?.delta_to_typical_weekly ?? 0,
    targetStipendWeekly: ov?.target_stipend_weekly ?? 0,
    offerLabel: ov?.label ?? "—",
    typicalBand: ov?.typical_band ?? "85–95%",
    housing1br: api.housing.hud_fmr_1br,
    zoriRent: api.housing.zori_rent ?? null,
    marketRatio: api.housing.market_ratio ?? null,
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

// ━━━ CONSTANTS ━━━

const SPECIALTIES: Array<{ value: string; label: string; hours: number }> = [
  { value: "RN", label: "RN", hours: 36 },
  { value: "PT", label: "PT", hours: 40 },
  { value: "OT", label: "OT", hours: 40 },
  { value: "SLP", label: "SLP", hours: 40 },
  { value: "RT", label: "RT", hours: 36 },
  { value: "LPN", label: "LPN / LVN", hours: 36 },
  { value: "CNA", label: "CNA", hours: 36 },
  { value: "TECH", label: "Surg Tech", hours: 40 },
  { value: "PHLEBOTOMIST", label: "Phlebotomist", hours: 40 },
  { value: "MLT", label: "Lab / MLT", hours: 40 },
  { value: "RAD_TECH", label: "Rad Tech", hours: 40 },
  { value: "DIETITIAN", label: "Dietitian", hours: 40 },
  { value: "OTHER", label: "Other", hours: 36 },
];

// Neutral ordering — no single agency leads. Alphabetical by display name.
const AGENCY_CHIPS = [
  "AMN",
  "Aya",
  "Cross Country",
  "Fastaff",
  "FlexCare",
  "Host",
  "Medical Solutions",
  "Nomad",
  "TNAA",
  "Trusted",
];

const PLAN_OPTIONS: Array<{ value: InsurancePlan; label: string }> = [
  { value: "none", label: "None / waived" },
  { value: "single", label: "Single" },
  { value: "family", label: "Family" },
  { value: "aca", label: "ACA" },
  { value: "private", label: "Private" },
];

// ━━━ HELPERS ━━━

function buildPrefillUrl(p: {
  zip: string;
  gross?: number;
  specialty?: string;
  hours?: number;
  agency?: string;
  facility?: string;
  plan?: InsurancePlan;
  ins?: number | null;
}) {
  const url = new URL(window.location.href);
  const sp = url.searchParams;
  sp.set("zip", p.zip);
  if (p.gross && p.gross > 0) sp.set("gross", String(p.gross));
  else sp.delete("gross");
  if (p.specialty) sp.set("specialty", p.specialty);
  else sp.delete("specialty");
  if (p.hours && p.hours !== 36) sp.set("hours", String(p.hours));
  else sp.delete("hours");
  const a = (p.agency ?? "").trim();
  if (a) sp.set("agency", a);
  else sp.delete("agency");
  const fac = (p.facility ?? "").trim();
  if (fac) sp.set("facility", fac);
  else sp.delete("facility");
  sp.set("plan", p.plan ?? "none");
  if (typeof p.ins === "number" && p.ins >= 0) sp.set("ins", String(p.ins));
  else sp.delete("ins");
  url.search = sp.toString();
  return url.toString();
}

function classifyOffer(pct: number, taxableHourly?: number) {
  // IRS Audit Risk: dangerously low hourly base paired with high stipends
  if (taxableHourly !== undefined && taxableHourly < 20 && pct >= 85) {
    return {
      label: "🚨 IRS Audit Risk",
      pill: "Dangerously low hourly base",
      color: T.moneyNegative,
      bg: T.moneyNegativeBg,
      tier: "irs" as const,
    };
  }
  if (pct >= 95) return {
    label: "Maxed Out",
    pill: `${pct}% of GSA stipends`,
    color: T.moneyPositive,
    bg: T.moneyPositiveBg,
    tier: "green" as const,
  };
  if (pct >= 85) return {
    label: "Solid",
    pill: `${pct}% of GSA — within typical band`,
    color: T.primary,
    bg: T.primaryMuted,
    tier: "green" as const,
  };
  if (pct >= 75) return {
    label: "Room to Negotiate",
    pill: "Stipends below GSA max",
    color: T.accent,
    bg: T.accentMuted,
    tier: "amber" as const,
  };
  return {
    label: "Lowball",
    pill: "Underfunded stipends & high tax burden",
    color: T.moneyNegative,
    bg: T.moneyNegativeBg,
    tier: "red" as const,
  };
}

function getDefaultHours(specialty: string): number {
  return SPECIALTIES.find((s) => s.value === specialty)?.hours ?? 36;
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
          style={{ fontWeight: 400, color: T.textTertiary, fontSize: "13px" }}
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
        boxShadow:
          "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
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

function Pill({
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
  const [specialty, setSpecialty] = useState("RN");
  const [hours, setHours] = useState(36);
  const [gross, setGross] = useState("");
  const [agency, setAgency] = useState("");
  const [facilityName, setFacilityName] = useState("");
  const [plan, setPlan] = useState<InsurancePlan>("none");
  const [insuranceOverride, setInsuranceOverride] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Loading…");
  const [error, setError] = useState<string | null>(null);
  const [gsaPreview, setGsaPreview] = useState<ApiResult | null>(null);
  const [result, setResult] = useState<DisplayResult | null>(null);
  const [scriptCopied, setScriptCopied] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showAdvisories, setShowAdvisories] = useState(false);

  // When specialty changes, update hours to default for that profession
  const handleSpecialtyChange = useCallback((val: string) => {
    setSpecialty(val);
    setHours(getDefaultHours(val));
  }, []);

  // ━━━ URL PREFILL ON MOUNT ━━━
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);

    const z = (sp.get("zip") ?? "").replace(/\D/g, "").slice(0, 5);
    const gRaw = sp.get("gross") ?? "";
    const g = parseInt(gRaw.replace(/\D/g, ""), 10);
    const a = (sp.get("agency") ?? "").slice(0, 100);
    const fac = (sp.get("facility") ?? "").slice(0, 200);
    const p = (sp.get("plan") ?? "none") as InsurancePlan;
    const ins = sp.get("ins") ?? "";
    const spec = sp.get("specialty") ?? "RN";
    const h = parseInt(sp.get("hours") ?? "", 10);

    if (z.length === 5) setZip(z);
    if (!Number.isNaN(g) && g > 0) setGross(String(g));
    if (a) setAgency(a);
    if (fac) setFacilityName(fac);
    if (["none", "single", "family", "aca", "private"].includes(p)) setPlan(p);
    if (ins) setInsuranceOverride(ins.replace(/[^\d.]/g, ""));
    if (spec) setSpecialty(spec);
    if (!Number.isNaN(h) && h >= 8 && h <= 80) setHours(h);
    else setHours(getDefaultHours(spec));

    const effectiveHours =
      !Number.isNaN(h) && h >= 8 && h <= 80 ? h : getDefaultHours(spec);

    const run = async () => {
      if (z.length !== 5) return;
      const overrideNum = ins ? parseFloat(ins) : null;

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
              hours: effectiveHours,
              specialty: spec,
              agency_name: a || null,
              facility_name: fac || null,
              ingest: true,
              insurance_plan: p,
              insurance_weekly_override: Number.isFinite(overrideNum as number)
                ? overrideNum
                : null,
            }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Calculation failed (${res.status})`);
          }
          const json = await res.json();
          if (!json.success || !json.data)
            throw new Error("Unexpected response format");
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

      setLoading(true);
      setLoadingText("Looking up GSA rates…");
      setError(null);
      try {
        const res = await fetch("/api/v1/lookup-stipend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            zip: z,
            gross_weekly: 2000,
            hours: effectiveHours,
            specialty: spec,
            ingest: false,
            insurance_plan: "none",
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Lookup failed (${res.status})`);
        }
        const json = await res.json();
        if (!json.success || !json.data)
          throw new Error("Unexpected response format");
        setGsaPreview(json.data as ApiResult);
        setStep(1);
      } catch (e: unknown) {
        setError(
          e instanceof Error ? e.message : "Failed to look up GSA rates",
        );
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
    const insNum = insuranceOverride.trim()
      ? parseFloat(insuranceOverride)
      : null;
    const url = buildPrefillUrl({
      zip,
      gross: grossNum,
      specialty,
      hours,
      agency: agency.trim(),
      facility: facilityName.trim(),
      plan,
      ins: Number.isFinite(insNum as number) ? insNum : null,
    });
    window.history.replaceState({}, "", url);
  }, [zip, gross, specialty, hours, agency, facilityName, plan, insuranceOverride]);

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
        body: JSON.stringify({
          zip,
          gross_weekly: 2000,
          hours,
          specialty,
          ingest: false,
          insurance_plan: "none",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Lookup failed (${res.status})`);
      }
      const json = await res.json();
      if (!json.success || !json.data)
        throw new Error("Unexpected response format");
      setGsaPreview(json.data as ApiResult);
      setStep(1);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to look up GSA rates");
    } finally {
      setLoading(false);
    }
  }, [zip, hours, specialty]);

  const handleOfferSubmit = useCallback(async () => {
    if (gross.length < 3) return;
    setLoading(true);
    setLoadingText("Decoding the offer…");
    setError(null);
    try {
      const grossNum = parseInt(gross, 10);
      const overrideNum = insuranceOverride.trim()
        ? parseFloat(insuranceOverride)
        : null;
      const res = await fetch("/api/v1/lookup-stipend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zip,
          gross_weekly: grossNum,
          hours,
          specialty,
          agency_name: agency.trim() ? agency.trim() : null,
          facility_name: facilityName.trim() ? facilityName.trim() : null,
          ingest: true,
          insurance_plan: plan,
          insurance_weekly_override: Number.isFinite(overrideNum as number)
            ? overrideNum
            : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Calculation failed (${res.status})`);
      }
      const json = await res.json();
      if (!json.success || !json.data)
        throw new Error("Unexpected response format");
      setResult(mapApiToDisplay(json.data as ApiResult));
      setStep(2);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to calculate");
    } finally {
      setLoading(false);
    }
  }, [zip, gross, hours, specialty, agency, facilityName, plan, insuranceOverride]);

  const handleShareLink = useCallback(async () => {
    if (typeof window === "undefined" || !result) return;
    const insNum = insuranceOverride.trim()
      ? parseFloat(insuranceOverride)
      : null;
    const url = buildPrefillUrl({
      zip: result.zip,
      gross: result.weeklyGross,
      specialty,
      hours: result.hours,
      agency: agency.trim(),
      facility: facilityName.trim(),
      plan,
      ins: Number.isFinite(insNum as number) ? insNum : null,
    });
    const specLabel =
      SPECIALTIES.find((s) => s.value === specialty)?.label ?? specialty;
    const text = `PerDiem.fyi — ${specLabel} in ${result.zip} · $${result.weeklyGross}/wk · ${result.pctOfMax}% GSA · net after insurance $${result.netAfterInsuranceWeekly}/wk`;
    if (navigator.share) {
      await navigator.share({ title: "PerDiem.fyi", text, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  }, [result, specialty, agency, plan, insuranceOverride]);

  const handleReset = useCallback(() => {
    setStep(0);
    setZip("");
    setGross("");
    setSpecialty("RN");
    setHours(36);
    setAgency("");
    setFacilityName("");
    setPlan("none");
    setInsuranceOverride("");
    setGsaPreview(null);
    setResult(null);
    setError(null);
    if (typeof window !== "undefined")
      window.history.replaceState({}, "", window.location.pathname);
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
      <div
        style={{
          background: T.bg,
          minHeight: "100vh",
          color: T.text,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 20px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "360px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            alignItems: "center",
          }}
        >
          <Logo />
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: f.sans,
                fontSize: "24px",
                fontWeight: 900,
                letterSpacing: "-0.02em",
                color: T.text,
              }}
            >
              Is this a good pay package?
            </div>
            <div
              style={{
                fontFamily: f.sans,
                fontSize: "14px",
                color: T.textSecondary,
                marginTop: "8px",
                lineHeight: 1.6,
              }}
            >
              Calculate your true take-home pay after taxes and insurance.
            </div>
          </div>
          {/* Spacer between intro and form */}
          <div style={{ height: "4px" }} />
          <div style={{ width: "100%" }}>
            <label
              htmlFor="zip-input"
              style={{
                fontFamily: f.sans,
                fontSize: "12px",
                fontWeight: 800,
                color: T.textSecondary,
                display: "block",
                marginBottom: "6px",
              }}
            >
              Assignment ZIP code
            </label>
            <input
              id="zip-input"
              value={zip}
              onChange={(e) =>
                setZip(e.target.value.replace(/\D/g, "").slice(0, 5))
              }
              onKeyDown={(e) => e.key === "Enter" && handleZipSubmit()}
              inputMode="numeric"
              placeholder="90012"
              autoFocus
              style={{
                width: "100%",
                boxSizing: "border-box" as const,
                fontFamily: f.mono,
                fontSize: "24px",
                fontWeight: 900,
                padding: "14px 16px",
                borderRadius: "10px",
                border: `2px solid ${zip.length === 5 ? T.borderFocus : T.border}`,
                background: T.surface,
                color: T.text,
                outline: "none",
                textAlign: "left" as const,
                letterSpacing: "0.04em",
                transition: "border-color 0.2s ease",
              }}
            />
          </div>
          <button
            onClick={handleZipSubmit}
            disabled={zip.length !== 5}
            style={{
              width: "100%",
              fontFamily: f.sans,
              fontSize: "15px",
              fontWeight: 900,
              padding: "14px",
              borderRadius: "10px",
              border: "none",
              background: zip.length === 5 ? T.primary : T.surfaceRaised,
              color: zip.length === 5 ? "#fff" : T.textTertiary,
              cursor: zip.length === 5 ? "pointer" : "default",
              transition: "background 0.2s ease, color 0.2s ease, transform 0.1s ease",
              transform: zip.length === 5 ? "none" : "none",
            }}
            onMouseDown={(e) => {
              if (zip.length === 5) (e.currentTarget.style.transform = "scale(0.98)");
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = "none";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
            }}
          >
            Calculate Pay
          </button>
        </div>
      </div>
    );
  }

  // ━━━ STEP 1: PROFESSION + AGENCY + INSURANCE + OFFER ━━━
  if (step === 1 && gsaPreview) {
    const specLabel =
      SPECIALTIES.find((s) => s.value === specialty)?.label ?? specialty;

    return (
      <div
        style={{
          background: T.bg,
          minHeight: "100vh",
          color: T.text,
          padding: "28px 16px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "420px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <Logo />

          {/* GSA ceiling */}
          <Card>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <MicroLabel>GSA per diem ceiling</MicroLabel>
              <GovBadge text={`FY${gsaPreview.gsa.fiscal_year}`} />
            </div>
            <div
              style={{
                marginTop: "8px",
                fontFamily: f.mono,
                fontSize: "34px",
                fontWeight: 900,
                color: T.text,
              }}
            >
              ${gsaPreview.gsa.weekly_max.toLocaleString()}
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: 400,
                  color: T.textTertiary,
                }}
              >
                /wk
              </span>
            </div>
            <div
              style={{
                marginTop: "4px",
                fontFamily: f.sans,
                fontSize: "13px",
                color: T.textSecondary,
              }}
            >
              {gsaPreview.location.city ? `${gsaPreview.location.city}, ` : ""}
              {gsaPreview.location.state}
            </div>
          </Card>

          {/* ━━━ PROFESSION ━━━ */}
          <Card>
            <MicroLabel>Profession</MicroLabel>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap" as const,
                gap: "8px",
                marginTop: "10px",
              }}
            >
              {SPECIALTIES.map((s) => (
                <Pill
                  key={s.value}
                  label={s.label}
                  active={specialty === s.value}
                  onClick={() => handleSpecialtyChange(s.value)}
                />
              ))}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginTop: "12px",
              }}
            >
              <label
                style={{
                  fontFamily: f.sans,
                  fontSize: "12px",
                  fontWeight: 700,
                  color: T.textSecondary,
                  whiteSpace: "nowrap" as const,
                }}
              >
                Hours/wk
              </label>
              <input
                value={hours}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!Number.isNaN(v) && v >= 0 && v <= 80) setHours(v);
                  else if (e.target.value === "")
                    setHours(0 as unknown as number);
                }}
                inputMode="numeric"
                style={{
                  width: "60px",
                  fontFamily: f.mono,
                  fontSize: "15px",
                  fontWeight: 900,
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: `1px solid ${T.border}`,
                  background: T.surface,
                  color: T.text,
                  outline: "none",
                  textAlign: "center" as const,
                }}
              />
              <span
                style={{
                  fontFamily: f.sans,
                  fontSize: "11px",
                  color: T.textTertiary,
                }}
              >
                Default for {specLabel}: {getDefaultHours(specialty)}hr
              </span>
            </div>
          </Card>

          {/* ━━━ AGENCY ━━━ */}
          <Card>
            <MicroLabel>Agency</MicroLabel>
            <input
              value={agency}
              onChange={(e) => setAgency(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleOfferSubmit()}
              placeholder="Type or tap below"
              style={{
                width: "100%",
                marginTop: "8px",
                boxSizing: "border-box" as const,
                fontFamily: f.sans,
                fontSize: "15px",
                fontWeight: 700,
                padding: "12px",
                borderRadius: "10px",
                border: `2px solid ${agency.trim().length >= 2 ? T.borderFocus : T.border}`,
                background: T.surface,
                color: T.text,
                outline: "none",
              }}
            />
            <div
              style={{
                display: "flex",
                flexWrap: "wrap" as const,
                gap: "8px",
                marginTop: "10px",
              }}
            >
              {AGENCY_CHIPS.map((x) => (
                <button
                  key={x}
                  onClick={() => setAgency(x)}
                  style={{
                    border: `1px solid ${T.border}`,
                    background: agency === x ? T.primaryMuted : T.surface,
                    color: agency === x ? T.primary : T.textSecondary,
                    borderRadius: "999px",
                    padding: "6px 10px",
                    fontFamily: f.sans,
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {x}
                </button>
              ))}
            </div>
          </Card>

          {/* ━━━ FACILITY (optional) ━━━ */}
          <Card>
            <MicroLabel>Facility name (optional)</MicroLabel>
            <input
              value={facilityName}
              onChange={(e) => setFacilityName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleOfferSubmit()}
              placeholder="e.g. Memorial Hermann, Banner Health…"
              style={{
                width: "100%",
                marginTop: "8px",
                boxSizing: "border-box" as const,
                fontFamily: f.sans,
                fontSize: "15px",
                fontWeight: 500,
                padding: "12px",
                borderRadius: "10px",
                border: `2px solid ${facilityName.trim().length >= 2 ? T.borderFocus : T.border}`,
                background: T.surface,
                color: T.text,
                outline: "none",
              }}
            />
            <span
              style={{
                fontFamily: f.sans,
                fontSize: "11px",
                color: T.textTertiary,
                marginTop: "4px",
                display: "block",
              }}
            >
              Optional — used to improve pay data accuracy.
            </span>
          </Card>

          {/* ━━━ INSURANCE ━━━ */}
          <Card>
            <MicroLabel>Health insurance</MicroLabel>
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginTop: "10px",
                flexWrap: "wrap" as const,
              }}
            >
              {PLAN_OPTIONS.map((o) => (
                <Pill
                  key={o.value}
                  label={o.label}
                  active={plan === o.value}
                  onClick={() => setPlan(o.value)}
                />
              ))}
            </div>
            {plan !== "none" && (
              <div style={{ marginTop: "12px" }}>
                <div
                  style={{
                    fontFamily: f.sans,
                    fontSize: "12px",
                    color: T.textSecondary,
                    lineHeight: 1.5,
                    marginBottom: "8px",
                  }}
                >
                  Weekly premium override (from your paystub)
                </div>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontFamily: f.mono,
                      fontSize: "18px",
                      fontWeight: 900,
                      color: T.textTertiary,
                    }}
                  >
                    $
                  </span>
                  <input
                    value={insuranceOverride}
                    onChange={(e) =>
                      setInsuranceOverride(
                        e.target.value.replace(/[^\d.]/g, ""),
                      )
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleOfferSubmit()}
                    placeholder="0"
                    inputMode="decimal"
                    style={{
                      width: "100%",
                      boxSizing: "border-box" as const,
                      fontFamily: f.mono,
                      fontSize: "18px",
                      fontWeight: 900,
                      padding: "12px 12px 12px 34px",
                      borderRadius: "10px",
                      border: `2px solid ${insuranceOverride.trim() ? T.borderFocus : T.border}`,
                      background: T.surface,
                      color: T.text,
                      outline: "none",
                    }}
                  />
                </div>
              </div>
            )}
          </Card>

          {/* ━━━ GROSS + SUBMIT ━━━ */}
          <Card>
            <MicroLabel>Weekly gross offer</MicroLabel>
            <div style={{ position: "relative", marginTop: "10px" }}>
              <span
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontFamily: f.mono,
                  fontSize: "22px",
                  fontWeight: 900,
                  color: T.textTertiary,
                }}
              >
                $
              </span>
              <input
                value={gross}
                onChange={(e) => setGross(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && handleOfferSubmit()}
                placeholder="2800"
                inputMode="numeric"
                autoFocus
                style={{
                  width: "100%",
                  boxSizing: "border-box" as const,
                  fontFamily: f.mono,
                  fontSize: "22px",
                  fontWeight: 900,
                  padding: "12px 12px 12px 34px",
                  borderRadius: "10px",
                  border: `2px solid ${gross.length >= 3 ? T.borderFocus : T.border}`,
                  background: T.surface,
                  color: T.text,
                  outline: "none",
                  textAlign: "center" as const,
                }}
              />
            </div>
            <button
              onClick={handleOfferSubmit}
              disabled={gross.length < 3}
              style={{
                width: "100%",
                marginTop: "12px",
                fontFamily: f.sans,
                fontSize: "15px",
                fontWeight: 900,
                padding: "12px",
                borderRadius: "10px",
                border: "none",
                background: gross.length >= 3 ? T.primary : T.surfaceRaised,
                color: gross.length >= 3 ? "#fff" : T.textTertiary,
                cursor: gross.length >= 3 ? "pointer" : "default",
              }}
            >
              Calculate Pay
            </button>
          </Card>
        </div>
      </div>
    );
  }

  // ━━━ STEP 2: RESULTS ━━━
  if (step === 2 && result) {
    const r = result;
    const gsaPctCapped = Math.min(r.pctOfMax, 100);
    const avgLocalRent = r.zoriRent ?? r.housing1br;
    const surplusMonthly = Math.round(r.stipendMonthlyEst - avgLocalRent);
    const ficaWeekly = Math.round(r.taxableWeekly * 0.0765);
    const federalWeekly = Math.round(r.taxEstimateWeekly - ficaWeekly);
    const otBase = Math.round(r.taxableHourly * 1.5);

    // ── Ive palette ──
    const C = {
      black: "#000000",
      muted: "#8E8E93",
      hairline: "#E5E5EA",
      bg: "#FFFFFF",
    };
    const font = "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif";

    // shared row style
    const rowStyle = (opts?: { bold?: boolean }): React.CSSProperties => ({
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      fontFamily: font,
      fontSize: "15px",
      fontWeight: opts?.bold ? 500 : 400,
      color: C.black,
      lineHeight: "1.6",
    });

    const breathe: React.CSSProperties = { height: "80px" };
    const hairline: React.CSSProperties = {
      height: "1px",
      background: C.hairline,
      width: "100%",
    };

    return (
      <div
        style={{
          background: C.bg,
          minHeight: "100vh",
          color: C.black,
          padding: "24px 24px 80px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: "460px" }}>
          {/* ── Sticky header ── */}
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              background: C.bg,
              padding: "12px 0 24px",
            }}
          >
            <button
              onClick={handleReset}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <Logo />
            </button>
          </div>

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* ZONE 1: PROFIT SIGNALS                */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}

          <div
            style={{
              fontFamily: font,
              fontSize: "11px",
              fontWeight: 500,
              color: C.muted,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              marginBottom: "8px",
            }}
          >
            Take-home
          </div>
          <div
            style={{
              fontFamily: font,
              fontSize: "48px",
              fontWeight: 500,
              color: C.black,
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            ${Math.round(r.netAfterInsuranceWeekly).toLocaleString()}
            <span style={{ fontSize: "20px", fontWeight: 400, color: C.muted, marginLeft: "6px" }}>
              / wk
            </span>
          </div>

          <div style={{ height: "48px" }} />

          <div
            style={{
              fontFamily: font,
              fontSize: "11px",
              fontWeight: 500,
              color: C.muted,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              marginBottom: "8px",
            }}
          >
            Monthly pocketed
          </div>
          <div
            style={{
              fontFamily: font,
              fontSize: "48px",
              fontWeight: 500,
              color: C.black,
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            {surplusMonthly >= 0 ? "+" : "−"}${Math.abs(surplusMonthly).toLocaleString()}
          </div>

          <div style={{ height: "48px" }} />

          <div
            style={{
              fontFamily: font,
              fontSize: "11px",
              fontWeight: 500,
              color: C.muted,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              marginBottom: "8px",
            }}
          >
            Stipend utilization
          </div>
          <div
            style={{
              fontFamily: font,
              fontSize: "48px",
              fontWeight: 500,
              color: C.black,
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            {gsaPctCapped}%
          </div>

          {/* ── Breathing Zone 1 ── */}
          <div style={breathe} />

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* ZONE 2: THE MATH                      */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}

          <div style={hairline} />
          <button
            onClick={() => setShowBreakdown((p) => !p)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              padding: "18px 0",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: font,
              fontSize: "16px",
              fontWeight: 400,
              color: C.black,
              textAlign: "left" as const,
              minHeight: "44px",
            }}
          >
            <span>Pay & tax breakdown</span>
            <span style={{ fontSize: "18px", color: C.muted }}>{showBreakdown ? "−" : "+"}</span>
          </button>
          <div
            style={{
              maxHeight: showBreakdown ? "600px" : "0px",
              overflow: "hidden",
              transition: "max-height 0.3s ease-in-out",
            }}
          >
            <div style={{ paddingBottom: "24px" }}>
              <div style={rowStyle({ bold: true })}>
                <span>Gross</span>
                <span>${r.weeklyGross.toLocaleString()}</span>
              </div>
              <div style={rowStyle()}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  Stipend
                  <button
                    onClick={(e) => { e.stopPropagation(); setScriptCopied((p) => !p); }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      fontFamily: font,
                      fontSize: "13px",
                      color: C.muted,
                      lineHeight: 1,
                    }}
                    title="Assumes duplicated expenses to qualify for tax-free stipends."
                  >
                    ⓘ
                  </button>
                </span>
                <span>${r.stipendWeekly.toLocaleString()}</span>
              </div>
              {/* ⓘ disclaimer expand */}
              {scriptCopied && (
                <div
                  style={{
                    fontFamily: font,
                    fontSize: "12px",
                    color: C.muted,
                    lineHeight: 1.5,
                    padding: "8px 0 4px",
                  }}
                >
                  Assumes duplicated expenses to qualify for tax-free stipends.
                </div>
              )}
              <div style={rowStyle()}>
                <span>Taxable</span>
                <span>${r.taxableWeekly.toLocaleString()}</span>
              </div>

              <div style={{ height: "12px" }} />

              <div style={rowStyle()}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  Taxes
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowAdvisories((p) => !p); }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      fontFamily: font,
                      fontSize: "13px",
                      color: C.muted,
                      lineHeight: 1,
                    }}
                  >
                    {showAdvisories ? "−" : "+"}
                  </button>
                </span>
                <span>–${Math.round(r.taxEstimateWeekly).toLocaleString()}</span>
              </div>
              {/* Nested tax details */}
              <div
                style={{
                  maxHeight: showAdvisories ? "200px" : "0px",
                  overflow: "hidden",
                  transition: "max-height 0.25s ease-in-out",
                }}
              >
                <div style={{ ...rowStyle(), color: C.muted, fontSize: "13px", paddingLeft: "16px" }}>
                  <span>FICA (7.65%)</span>
                  <span>–${ficaWeekly}</span>
                </div>
                <div style={{ ...rowStyle(), color: C.muted, fontSize: "13px", paddingLeft: "16px" }}>
                  <span>Federal (eff.)</span>
                  <span>–${Math.max(federalWeekly, 0)}</span>
                </div>
                <div style={{ ...rowStyle(), color: C.muted, fontSize: "13px", paddingLeft: "16px" }}>
                  <span>State</span>
                  <span>–$0</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Breathing Zone 2 ── */}
          <div style={breathe} />

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* ZONE 3: DECISION INTELLIGENCE          */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}

          <div style={hairline} />
          <div
            style={{
              fontFamily: font,
              fontSize: "11px",
              fontWeight: 500,
              color: C.muted,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              padding: "18px 0 12px",
            }}
          >
            Contract risks
          </div>

          {/* Housing risk */}
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontFamily: font, fontSize: "15px", fontWeight: 500, color: C.black, marginBottom: "2px" }}>
              Housing risk
            </div>
            <div style={{ fontFamily: font, fontSize: "14px", color: C.muted, lineHeight: 1.5 }}>
              Avoid long-term leases until week 2.
            </div>
          </div>

          {/* Overtime ceiling */}
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontFamily: font, fontSize: "15px", fontWeight: 500, color: C.black, marginBottom: "2px" }}>
              Overtime ceiling
            </div>
            <div style={{ fontFamily: font, fontSize: "14px", color: C.muted, lineHeight: 1.5 }}>
              ${r.taxableHourly}/hr base → OT ≈ ${otBase}/hr. Negotiate elevated OT rate.
            </div>
          </div>

          {/* Guaranteed hours */}
          <div style={{ marginBottom: "0" }}>
            <div style={{ fontFamily: font, fontSize: "15px", fontWeight: 500, color: C.black, marginBottom: "2px" }}>
              Guaranteed hours
            </div>
            <div style={{ fontFamily: font, fontSize: "14px", color: C.muted, lineHeight: 1.5 }}>
              Ensure stipends aren&#39;t reduced on low census.
            </div>
          </div>

          {/* ── Breathing Zone 3 ── */}
          <div style={breathe} />

          {/* ━━━ SHARE ANALYSIS ━━━ */}
          <div style={hairline} />
          <button
            onClick={handleShareLink}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              padding: "18px 0",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: font,
              fontSize: "16px",
              fontWeight: 400,
              color: C.black,
              textAlign: "left" as const,
              minHeight: "44px",
            }}
          >
            <span>Share analysis</span>
            <span style={{ fontSize: "16px", color: C.muted }}>↗</span>
          </button>
          <div style={hairline} />

          {/* ── New lookup ── */}
          <button
            onClick={handleReset}
            style={{
              width: "100%",
              marginTop: "32px",
              padding: 0,
              background: "none",
              border: "none",
              color: C.muted,
              fontFamily: font,
              fontSize: "14px",
              fontWeight: 400,
              cursor: "pointer",
              textAlign: "left" as const,
            }}
          >
            New lookup
          </button>

          {/* ── Footer ── */}
          <footer
            style={{
              fontFamily: font,
              fontSize: "11px",
              color: C.muted,
              lineHeight: 1.7,
              padding: "32px 0 0",
            }}
          >
            Per diem rates from{" "}
            <a href="https://www.gsa.gov/travel/plan-book/per-diem-rates" style={{ color: C.muted }} target="_blank" rel="noopener noreferrer">GSA.gov</a>
            . Housing from{" "}
            <a href="https://www.huduser.gov/portal/datasets/fmr.html" style={{ color: C.muted }} target="_blank" rel="noopener noreferrer">HUD FMR</a>
            . Pay data protected under NLRA Section 7.
          </footer>
        </div>
      </div>
    );
  }

  return null;
}
