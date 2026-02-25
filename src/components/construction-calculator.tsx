"use client";

import React, { useState, useEffect, useCallback } from "react";
import { T, FONTS as f } from "@/lib/theme";

// ━━━ TYPES ━━━

type InsurancePlan = "none" | "single" | "family" | "aca" | "private" | "union";
type Schedule = "4x10" | "5x8" | "5x10" | "6x10" | "7x12" | "custom";
type HousingModel = "self" | "company";

interface ConstructionResult {
  location: { zip: string; city: string; state: string };
  gsa: { fiscal_year: number; weekly_max: number; meals_daily: number };
  construction: {
    trade: string;
    schedule: string;
    housing_model: string;
    hourly_rate: number;
    daily_per_diem: number;
    per_diem_days: number;
    straight_hours: number;
    ot_hours: number;
    straight_pay: number;
    ot_pay: number;
    weekly_wage: number;
    weekly_per_diem: number;
    weekly_gross_total: number;
  };
  housing: {
    hud_fmr_1br: number;
    stipend_monthly_est: number;
    stipend_surplus_monthly: number;
  };
  negotiation: { pct_of_max: number };
  insurance: {
    plan: string;
    weekly_mid: number | null;
    source_type: string;
    weekly_min: number | null;
    weekly_max: number | null;
  };
  derived: {
    net_after_insurance_weekly: number;
    gsa_comparison_weekly: number;
  };
  metadata: {
    gsa_fiscal_year: number;
    hud_rent_source: string;
    tax_method: string;
    offer_verdict: {
      stipend_pct_of_gsa: number;
      label: string;
      typical_band: string;
      delta_to_typical_weekly: number;
      target_stipend_weekly: number;
      gsa_comparison_basis: string;
    };
    assumptions: string[];
  };
}

// ━━━ CONSTANTS ━━━

const TRADES = [
  { value: "electrician", label: "Electrician", defaultRate: 35 },
  { value: "pipefitter", label: "Pipefitter", defaultRate: 32 },
  { value: "welder", label: "Welder", defaultRate: 35 },
  { value: "ironworker", label: "Ironworker", defaultRate: 33 },
  { value: "millwright", label: "Millwright", defaultRate: 33 },
  { value: "carpenter", label: "Carpenter", defaultRate: 30 },
  { value: "plumber", label: "Plumber", defaultRate: 32 },
  { value: "hvac", label: "HVAC Tech", defaultRate: 30 },
  { value: "operator", label: "Heavy Equip Op", defaultRate: 30 },
  { value: "sheetmetal", label: "Sheet Metal", defaultRate: 32 },
  { value: "laborer", label: "Laborer", defaultRate: 22 },
  { value: "superintendent", label: "Superintendent", defaultRate: 45 },
  { value: "other", label: "Other", defaultRate: 30 },
];

const SCHEDULES: Array<{ value: Schedule; label: string; hours: number }> = [
  { value: "5x8", label: "5×8", hours: 40 },
  { value: "5x10", label: "5×10", hours: 50 },
  { value: "6x10", label: "6×10", hours: 60 },
  { value: "4x10", label: "4×10", hours: 40 },
  { value: "7x12", label: "7×12", hours: 84 },
];

const AGENCY_CHIPS = [
  "Aerotek",
  "CCS",
  "GRUS",
  "Kodiak",
  "Labor Finders",
  "PeopleReady",
  "Skillit",
  "TradeWorX",
  "Tradesmen Int'l",
  "Trillium",
];

const PLAN_OPTIONS: Array<{ value: InsurancePlan; label: string }> = [
  { value: "none", label: "None / waived" },
  { value: "union", label: "Union" },
  { value: "single", label: "Single" },
  { value: "family", label: "Family" },
  { value: "aca", label: "ACA" },
  { value: "private", label: "Private" },
];

// ━━━ PRIMITIVES ━━━

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
function ProgressBar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.min((value / Math.max(max, 1)) * 100, 100);
  return (
    <div
      style={{
        width: "100%",
        height: "6px",
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

function classifyOffer(pct: number) {
  if (pct >= 95) return { label: "Top", color: T.moneyPositive };
  if (pct >= 85) return { label: "Typical", color: T.primary };
  if (pct >= 80) return { label: "Below Avg", color: T.accent };
  return { label: "Low", color: T.moneyNegative };
}

// ━━━ MAIN ━━━

export default function ConstructionCalculator() {
  const [step, setStep] = useState(0);
  const [zip, setZip] = useState("");
  const [trade, setTrade] = useState("electrician");
  const [schedule, setSchedule] = useState<Schedule>("5x10");
  const [hourlyRate, setHourlyRate] = useState("");
  const [dailyPd, setDailyPd] = useState("");
  const [pdDays, setPdDays] = useState<5 | 6 | 7>(7);
  const [housingModel, setHousingModel] = useState<HousingModel>("self");
  const [agency, setAgency] = useState("");
  const [plan, setPlan] = useState<InsurancePlan>("none");
  const [insOverride, setInsOverride] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [gsaPreview, setGsaPreview] = useState<any>(null);
  const [result, setResult] = useState<ConstructionResult | null>(null);

  // URL prefill
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const z = (sp.get("zip") ?? "").replace(/\D/g, "").slice(0, 5);
    if (z.length === 5) setZip(z);
    if (sp.get("trade")) setTrade(sp.get("trade")!);
    if (sp.get("schedule")) setSchedule(sp.get("schedule") as Schedule);
    if (sp.get("rate")) setHourlyRate(sp.get("rate")!);
    if (sp.get("pd")) setDailyPd(sp.get("pd")!);
    if (sp.get("days")) setPdDays(parseInt(sp.get("days")!) as 5 | 6 | 7);
    if (sp.get("housing")) setHousingModel(sp.get("housing") as HousingModel);
    if (sp.get("agency")) setAgency(sp.get("agency")!);

    if (z.length === 5) {
      void fetchPreview(z);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPreview = async (z: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/lookup-stipend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zip: z,
          mode: "healthcare",
          gross_weekly: 2000,
          hours: 40,
          ingest: false,
          insurance_plan: "none",
        }),
      });
      if (!res.ok) throw new Error("Lookup failed");
      const json = await res.json();
      if (json.success) {
        setGsaPreview(json.data);
        setStep(1);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleZipSubmit = useCallback(async () => {
    if (zip.length !== 5) return;
    await fetchPreview(zip);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zip]);

  const handleDecode = useCallback(async () => {
    const rate = parseFloat(hourlyRate);
    const pd = parseFloat(dailyPd);
    if (!rate || rate < 10) return;
    setLoading(true);
    setError(null);
    try {
      const overrideNum = insOverride.trim() ? parseFloat(insOverride) : null;
      const res = await fetch("/api/v1/lookup-stipend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zip,
          mode: "construction",
          trade,
          schedule,
          hourly_rate: rate,
          daily_per_diem: pd || 0,
          per_diem_days: pdDays,
          housing_model: housingModel,
          agency_name: agency.trim() || null,
          ingest: true,
          insurance_plan: plan,
          insurance_weekly_override: Number.isFinite(overrideNum as number)
            ? overrideNum
            : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed");
      }
      const json = await res.json();
      if (json.success) {
        setResult(json.data as ConstructionResult);
        setStep(2);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [
    zip,
    trade,
    schedule,
    hourlyRate,
    dailyPd,
    pdDays,
    housingModel,
    agency,
    plan,
    insOverride,
  ]);

  const handleReset = useCallback(() => {
    setStep(0);
    setZip("");
    setTrade("electrician");
    setSchedule("5x10");
    setHourlyRate("");
    setDailyPd("");
    setPdDays(7);
    setHousingModel("self");
    setAgency("");
    setPlan("none");
    setInsOverride("");
    setGsaPreview(null);
    setResult(null);
    setError(null);
    if (typeof window !== "undefined")
      window.history.replaceState(
        {},
        "",
        window.location.pathname + "?mode=construction",
      );
  }, []);

  const handleShare = useCallback(async () => {
    if (!result) return;
    const c = result.construction;
    const url = `${window.location.origin}/?mode=construction&zip=${result.location.zip}&trade=${c.trade}&schedule=${c.schedule}&rate=${c.hourly_rate}&pd=${c.daily_per_diem}&days=${c.per_diem_days}&housing=${c.housing_model}${agency ? `&agency=${agency}` : ""}`;
    const text = `PerDiem.fyi — ${c.trade} in ${result.location.zip} · $${c.hourly_rate}/hr + $${c.daily_per_diem}/day PD · ${result.metadata.offer_verdict.stipend_pct_of_gsa}% GSA`;
    if (navigator.share)
      await navigator.share({ title: "PerDiem.fyi", text, url });
    else await navigator.clipboard.writeText(url);
  }, [result, agency]);

  // ━━━ RENDER ━━━

  if (error)
    return (
      <div
        style={{
          background: T.bg,
          minHeight: "100vh",
          color: T.text,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
        }}
      >
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
            {error}
          </p>
          <button
            onClick={handleReset}
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

  if (loading)
    return (
      <div
        style={{
          background: T.bg,
          minHeight: "100vh",
          color: T.text,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
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
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );

  // STEP 0: ZIP
  if (step === 0)
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
            gap: "18px",
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
              }}
            >
              Is this per diem good?
            </div>
            <div
              style={{
                fontFamily: f.sans,
                fontSize: "14px",
                color: T.textSecondary,
                marginTop: "6px",
                lineHeight: 1.5,
              }}
            >
              Construction trades per diem decoded against GSA rates.
            </div>
          </div>
          <div style={{ width: "100%" }}>
            <label
              style={{
                fontFamily: f.sans,
                fontSize: "12px",
                fontWeight: 800,
                color: T.textSecondary,
                display: "block",
                marginBottom: "6px",
              }}
            >
              Jobsite ZIP
            </label>
            <input
              value={zip}
              onChange={(e) =>
                setZip(e.target.value.replace(/\\D/g, "").slice(0, 5))
              }
              onKeyDown={(e) => e.key === "Enter" && handleZipSubmit()}
              inputMode="numeric"
              placeholder="77001"
              autoFocus
              style={{
                width: "100%",
                boxSizing: "border-box",
                fontFamily: f.mono,
                fontSize: "24px",
                fontWeight: 900,
                padding: "14px 16px",
                borderRadius: "10px",
                border: `2px solid ${zip.length === 5 ? T.borderFocus : T.border}`,
                background: T.surface,
                color: T.text,
                outline: "none",
                textAlign: "center",
                letterSpacing: "0.1em",
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
              padding: "12px",
              borderRadius: "10px",
              border: "none",
              background: zip.length === 5 ? T.primary : T.surfaceRaised,
              color: zip.length === 5 ? "#fff" : T.textTertiary,
              cursor: zip.length === 5 ? "pointer" : "default",
            }}
          >
            Next →
          </button>
        </div>
      </div>
    );

  // STEP 1: INPUTS
  if (step === 1 && gsaPreview) {
    const gs = gsaPreview.gsa;
    const tradeObj = TRADES.find((t) => t.value === trade);
    const canDecode = parseFloat(hourlyRate) >= 10;

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

          <Card>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <MicroLabel>GSA per diem ceiling</MicroLabel>
              <GovBadge text={`FY${gs.fiscal_year}`} />
            </div>
            <div
              style={{
                marginTop: "8px",
                fontFamily: f.mono,
                fontSize: "34px",
                fontWeight: 900,
              }}
            >
              ${gs.weekly_max.toLocaleString()}
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
                fontFamily: f.sans,
                fontSize: "13px",
                color: T.textSecondary,
                marginTop: "4px",
              }}
            >
              {gsaPreview.location.city ? `${gsaPreview.location.city}, ` : ""}
              {gsaPreview.location.state}
            </div>
          </Card>

          {/* TRADE */}
          <Card>
            <MicroLabel>Trade</MicroLabel>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                marginTop: "10px",
              }}
            >
              {TRADES.map((t) => (
                <Pill
                  key={t.value}
                  label={t.label}
                  active={trade === t.value}
                  onClick={() => setTrade(t.value)}
                />
              ))}
            </div>
          </Card>

          {/* SCHEDULE */}
          <Card>
            <MicroLabel>Schedule</MicroLabel>
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginTop: "10px",
                flexWrap: "wrap",
              }}
            >
              {SCHEDULES.map((s) => (
                <Pill
                  key={s.value}
                  label={s.label}
                  active={schedule === s.value}
                  onClick={() => setSchedule(s.value)}
                />
              ))}
            </div>
            <div
              style={{
                fontFamily: f.sans,
                fontSize: "11px",
                color: T.textTertiary,
                marginTop: "8px",
              }}
            >
              {SCHEDULES.find((s) => s.value === schedule)?.hours ?? 50} hrs/wk
              · OT at 1.5× after 40hr
            </div>
          </Card>

          {/* HOURLY + PER DIEM */}
          <Card>
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 1 }}>
                <MicroLabel>Hourly rate</MicroLabel>
                <div style={{ position: "relative", marginTop: "8px" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: "10px",
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
                    value={hourlyRate}
                    onChange={(e) =>
                      setHourlyRate(e.target.value.replace(/[^\\d.]/g, ""))
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleDecode()}
                    inputMode="decimal"
                    placeholder={String(tradeObj?.defaultRate ?? 35)}
                    autoFocus
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      fontFamily: f.mono,
                      fontSize: "18px",
                      fontWeight: 900,
                      padding: "12px 12px 12px 30px",
                      borderRadius: "10px",
                      border: `2px solid ${hourlyRate ? T.borderFocus : T.border}`,
                      background: T.surface,
                      color: T.text,
                      outline: "none",
                    }}
                  />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <MicroLabel>Per diem / day</MicroLabel>
                <div style={{ position: "relative", marginTop: "8px" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: "10px",
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
                    value={dailyPd}
                    onChange={(e) =>
                      setDailyPd(e.target.value.replace(/[^\\d.]/g, ""))
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleDecode()}
                    inputMode="decimal"
                    placeholder="120"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      fontFamily: f.mono,
                      fontSize: "18px",
                      fontWeight: 900,
                      padding: "12px 12px 12px 30px",
                      borderRadius: "10px",
                      border: `2px solid ${dailyPd ? T.borderFocus : T.border}`,
                      background: T.surface,
                      color: T.text,
                      outline: "none",
                    }}
                  />
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
              <div>
                <MicroLabel>PD days/wk</MicroLabel>
                <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                  {([5, 6, 7] as const).map((d) => (
                    <Pill
                      key={d}
                      label={`${d}`}
                      active={pdDays === d}
                      onClick={() => setPdDays(d)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <MicroLabel>Housing</MicroLabel>
                <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                  <Pill
                    label="I find my own"
                    active={housingModel === "self"}
                    onClick={() => setHousingModel("self")}
                  />
                  <Pill
                    label="Company provides"
                    active={housingModel === "company"}
                    onClick={() => setHousingModel("company")}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* AGENCY */}
          <Card>
            <MicroLabel>Staffing company</MicroLabel>
            <input
              value={agency}
              onChange={(e) => setAgency(e.target.value)}
              placeholder="Type or tap below"
              style={{
                width: "100%",
                marginTop: "8px",
                boxSizing: "border-box",
                fontFamily: f.sans,
                fontSize: "15px",
                fontWeight: 700,
                padding: "12px",
                borderRadius: "10px",
                border: `2px solid ${agency.trim() ? T.borderFocus : T.border}`,
                background: T.surface,
                color: T.text,
                outline: "none",
              }}
            />
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
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

          {/* INSURANCE */}
          <Card>
            <MicroLabel>Insurance</MicroLabel>
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginTop: "10px",
                flexWrap: "wrap",
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
            {plan === "union" && (
              <div
                style={{
                  fontFamily: f.sans,
                  fontSize: "12px",
                  color: T.primary,
                  marginTop: "8px",
                  padding: "8px",
                  background: T.primaryMuted,
                  borderRadius: "6px",
                }}
              >
                Union trust fund — $0 weekly premium deduction. Funded by
                employer contributions per hour worked.
              </div>
            )}
            {plan !== "none" && plan !== "union" && (
              <div style={{ marginTop: "10px" }}>
                <div
                  style={{
                    fontFamily: f.sans,
                    fontSize: "12px",
                    color: T.textSecondary,
                    marginBottom: "6px",
                  }}
                >
                  Weekly premium override
                </div>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontFamily: f.mono,
                      fontSize: "16px",
                      color: T.textTertiary,
                    }}
                  >
                    $
                  </span>
                  <input
                    value={insOverride}
                    onChange={(e) =>
                      setInsOverride(e.target.value.replace(/[^\\d.]/g, ""))
                    }
                    inputMode="decimal"
                    placeholder="0"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      fontFamily: f.mono,
                      fontSize: "16px",
                      fontWeight: 900,
                      padding: "10px 10px 10px 28px",
                      borderRadius: "8px",
                      border: `1px solid ${T.border}`,
                      background: T.surface,
                      color: T.text,
                      outline: "none",
                    }}
                  />
                </div>
              </div>
            )}
          </Card>

          {/* DECODE */}
          <button
            onClick={handleDecode}
            disabled={!canDecode}
            style={{
              width: "100%",
              fontFamily: f.sans,
              fontSize: "15px",
              fontWeight: 900,
              padding: "14px",
              borderRadius: "10px",
              border: "none",
              background: canDecode ? T.primary : T.surfaceRaised,
              color: canDecode ? "#fff" : T.textTertiary,
              cursor: canDecode ? "pointer" : "default",
            }}
          >
            Decode my offer →
          </button>
        </div>
      </div>
    );
  }

  // STEP 2: RESULTS
  if (step === 2 && result) {
    const r = result;
    const c = r.construction;
    const v = r.metadata.offer_verdict;
    const cls = classifyOffer(v.stipend_pct_of_gsa);
    const tradeLabel =
      TRADES.find((t) => t.value === c.trade)?.label ?? c.trade;
    const delta = Math.round(v.delta_to_typical_weekly);
    const leaving = delta > 0;
    const insLabel =
      PLAN_OPTIONS.find((o) => o.value === plan)?.label ?? "None";
    const insMid = r.insurance.weekly_mid ?? 0;

    return (
      <div
        style={{
          background: T.bg,
          minHeight: "100vh",
          color: T.text,
          padding: "18px 16px 80px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: "460px" }}>
          {/* Sticky header */}
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              background: T.bg,
              padding: "12px 0 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
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

          {/* VERDICT */}
          <Card>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "14px",
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: f.mono,
                    fontSize: "36px",
                    fontWeight: 900,
                    color: cls.color,
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                  }}
                >
                  {v.stipend_pct_of_gsa}%
                </div>
                <div
                  style={{
                    fontFamily: f.sans,
                    fontSize: "14px",
                    color: T.textSecondary,
                    marginTop: "8px",
                  }}
                >
                  {tradeLabel} · {r.location.city ? `${r.location.city}, ` : ""}
                  {r.location.state} · {c.schedule}
                </div>
                {agency.trim() && (
                  <div
                    style={{
                      fontFamily: f.sans,
                      fontSize: "12px",
                      color: T.textTertiary,
                      marginTop: "2px",
                    }}
                  >
                    Agency: {agency}
                  </div>
                )}
              </div>
              <GovBadge text={`GSA FY${r.gsa.fiscal_year}`} />
            </div>

            {/* Waterfall */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span
                  style={{
                    fontFamily: f.sans,
                    fontSize: "13px",
                    color: T.textSecondary,
                  }}
                >
                  Weekly Total
                </span>
                <span
                  style={{
                    fontFamily: f.mono,
                    fontSize: "16px",
                    fontWeight: 900,
                  }}
                >
                  $${c.weekly_gross_total.toLocaleString()}
                </span>
              </div>

              {/* Wages */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
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
                    Base wages ({c.straight_hours}hr × $${c.hourly_rate})
                  </span>
                  <span
                    style={{
                      fontFamily: f.mono,
                      fontSize: "14px",
                      fontWeight: 600,
                    }}
                  >
                    $${c.straight_pay.toLocaleString()}
                  </span>
                </div>
                <ProgressBar
                  value={c.straight_pay}
                  max={c.weekly_gross_total}
                  color={T.textTertiary}
                />
              </div>

              {c.ot_hours > 0 && (
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: f.sans,
                        fontSize: "12px",
                        color: T.accent,
                      }}
                    >
                      OT ({c.ot_hours}hr × $$
                      {Math.round(c.hourly_rate * 1.5 * 100) / 100})
                    </span>
                    <span
                      style={{
                        fontFamily: f.mono,
                        fontSize: "14px",
                        fontWeight: 700,
                        color: T.accent,
                      }}
                    >
                      $${c.ot_pay.toLocaleString()}
                    </span>
                  </div>
                  <ProgressBar
                    value={c.ot_pay}
                    max={c.weekly_gross_total}
                    color={T.accent}
                  />
                </div>
              )}

              {/* Per diem */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "4px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: f.sans,
                      fontSize: "12px",
                      color: T.primary,
                      fontWeight: 700,
                    }}
                  >
                    Per Diem ($${c.daily_per_diem}/day × {c.per_diem_days}d) —
                    tax-free
                  </span>
                  <span
                    style={{
                      fontFamily: f.mono,
                      fontSize: "14px",
                      fontWeight: 700,
                      color: T.primary,
                    }}
                  >
                    $${c.weekly_per_diem.toLocaleString()}
                  </span>
                </div>
                <ProgressBar
                  value={c.weekly_per_diem}
                  max={c.weekly_gross_total}
                  color={T.primary}
                />
                <div
                  style={{
                    fontFamily: f.sans,
                    fontSize: "10px",
                    color: T.textTertiary,
                    marginTop: "4px",
                  }}
                >
                  Federal per diem limit (
                  {c.housing_model === "company" ? "M&IE only" : "full"}): $$
                  {r.derived.gsa_comparison_weekly.toLocaleString()}/wk · Target
                  (90%): $${Math.round(v.target_stipend_weekly)}/wk
                </div>
              </div>

              <div style={{ height: "1px", background: T.borderSubtle }} />

              {insMid > 0 && (
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span
                    style={{
                      fontFamily: f.sans,
                      fontSize: "13px",
                      color: T.moneyNegative,
                    }}
                  >
                    Insurance ({insLabel})
                  </span>
                  <span
                    style={{
                      fontFamily: f.mono,
                      fontSize: "14px",
                      fontWeight: 900,
                      color: T.moneyNegative,
                    }}
                  >
                    −$${Math.round(insMid)}/wk
                  </span>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  background: T.moneyPositiveBg,
                  borderRadius: "8px",
                  border: `1px solid ${T.moneyPositive}20`,
                }}
              >
                <span
                  style={{
                    fontFamily: f.sans,
                    fontSize: "13px",
                    fontWeight: 900,
                    color: T.moneyPositive,
                  }}
                >
                  Net after insurance
                </span>
                <span
                  style={{
                    fontFamily: f.mono,
                    fontSize: "16px",
                    fontWeight: 900,
                    color: T.moneyPositive,
                  }}
                >
                  $$
                  {Math.round(
                    r.derived.net_after_insurance_weekly,
                  ).toLocaleString()}
                  /wk
                </span>
              </div>
            </div>

            <div
              style={{
                fontFamily: f.sans,
                fontSize: "10px",
                color: T.textTertiary,
                marginTop: "10px",
                padding: "6px 8px",
                background: T.surfaceRaised,
                borderRadius: "4px",
                lineHeight: 1.5,
              }}
            >
              {r.metadata.tax_method}
            </div>
          </Card>

          {/* HOUSING */}
          {c.housing_model === "self" && (
            <Card style={{ marginTop: "12px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <MicroLabel>Housing vs. Stipend</MicroLabel>
                <span
                  style={{
                    fontFamily: f.sans,
                    fontSize: "9px",
                    color: T.textTertiary,
                    background: T.surfaceRaised,
                    padding: "2px 6px",
                    borderRadius: "3px",
                  }}
                >
                  {r.metadata.hud_rent_source}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <span
                  style={{
                    fontFamily: f.sans,
                    fontSize: "13px",
                    color: T.textSecondary,
                  }}
                >
                  HUD 1BR Fair Market Rent
                </span>
                <span
                  style={{
                    fontFamily: f.mono,
                    fontSize: "14px",
                    fontWeight: 700,
                  }}
                >
                  $${r.housing.hud_fmr_1br.toLocaleString()}/mo
                </span>
              </div>
              <div
                style={{
                  height: "1px",
                  background: T.borderSubtle,
                  margin: "8px 0",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  background:
                    r.housing.stipend_monthly_est >= r.housing.hud_fmr_1br
                      ? T.moneyPositiveBg
                      : T.moneyNegativeBg,
                  borderRadius: "6px",
                }}
              >
                <span
                  style={{
                    fontFamily: f.sans,
                    fontSize: "13px",
                    fontWeight: 800,
                    color:
                      r.housing.stipend_monthly_est >= r.housing.hud_fmr_1br
                        ? T.moneyPositive
                        : T.moneyNegative,
                  }}
                >
                  Stipend covers{" "}
                  {r.housing.stipend_monthly_est >= r.housing.hud_fmr_1br * 2
                    ? `~${Math.round(r.housing.stipend_monthly_est / Math.max(r.housing.hud_fmr_1br, 1))}×`
                    : `${Math.round((r.housing.stipend_monthly_est / Math.max(r.housing.hud_fmr_1br, 1)) * 100)}% of`}{" "}
                  monthly rent
                </span>
              </div>
            </Card>
          )}

          {/* 1-YEAR RULE WARNING */}
          <Card style={{ marginTop: "12px", borderColor: `${T.accent}40` }}>
            <div
              style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke={T.accent}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginTop: "2px", flexShrink: 0 }}
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <div
                style={{
                  fontFamily: f.sans,
                  fontSize: "12px",
                  color: T.textSecondary,
                  lineHeight: 1.5,
                }}
              >
                <strong style={{ color: T.accent }}>IRS 1-Year Rule:</strong>{" "}
                Per diem is tax-free only if your assignment at this location is
                expected to last under 12 months. Longer projects → per diem
                becomes taxable wages. Consult a tax professional.
              </div>
            </div>
          </Card>

          {/* SHARE + RESET */}
          <button
            onClick={handleShare}
            style={{
              width: "100%",
              marginTop: "16px",
              padding: "14px",
              borderRadius: "10px",
              border: "none",
              background: T.primary,
              color: "#fff",
              fontFamily: f.sans,
              fontSize: "15px",
              fontWeight: 800,
              cursor: "pointer",
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
              stroke="#fff"
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
            Share link (prefilled)
          </button>
          <button
            onClick={handleReset}
            style={{
              width: "100%",
              marginTop: "12px",
              padding: "12px",
              background: "transparent",
              border: "none",
              color: T.textSecondary,
              fontFamily: f.sans,
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "underline",
              textUnderlineOffset: "4px",
            }}
          >
            New lookup
          </button>

          <footer
            style={{
              fontFamily: f.sans,
              fontSize: "10px",
              color: T.textTertiary,
              lineHeight: 1.6,
              padding: "16px 0",
              borderTop: `1px solid ${T.borderSubtle}`,
              marginTop: "12px",
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
            . Housing data from{" "}
            <a
              href="https://www.huduser.gov/portal/datasets/fmr.html"
              style={{ color: T.textTertiary }}
              target="_blank"
              rel="noopener noreferrer"
            >
              HUD FMR
            </a>
            . OT calculated at 1.5× after 40hr/wk per FLSA. Not tax advice. Not
            sponsored by any agency.
          </footer>
        </div>
      </div>
    );
  }

  return null;
}
