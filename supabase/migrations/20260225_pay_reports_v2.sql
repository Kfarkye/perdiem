-- ============================================================
-- PerDiem.fyi — Layer 3 & 4 Schema Migration
-- Date: 2026-02-25
-- ============================================================

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. REPLACE pay_reports (only 16 test rows — safe)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DROP TABLE IF EXISTS pay_reports CASCADE;

CREATE TABLE pay_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- ── Layer 1 & 2 Linkage ──
    zip_code VARCHAR(10) NOT NULL,

    -- ── Financials (User Input) ──
    gross_weekly_pay NUMERIC(10, 2) NOT NULL,
    hourly_taxable NUMERIC(10, 2),
    hours_per_week SMALLINT DEFAULT 36,
    insurance_plan VARCHAR(20) DEFAULT 'none',     -- none, single, family, aca, private

    -- ── Job Details ──
    profession VARCHAR(50) NOT NULL,               -- RN, PT, OT, SLP, RT, LPN/LVN, CNA, etc.
    specialty VARCHAR(100),                         -- ICU, ER, Cath Lab, Med-Surg, NICU, etc.
    contract_type VARCHAR(20) DEFAULT 'new',        -- new, extension, local, per_diem, strike

    -- ── Layer 4 Linkage (raw, unvalidated) ──
    agency_name_raw VARCHAR(255),
    facility_name_raw VARCHAR(255),

    -- ── Silent Bill Rate Intelligence (5-tier margin model) ──
    -- These are NEVER exposed in frontend or API responses.
    -- Formula: gross_weekly_pay / (1 - margin)
    implied_bill_rate_13 NUMERIC(10, 2),            -- Best case: transparent agency, 13% margin
    implied_bill_rate_20 NUMERIC(10, 2),            -- Tech-forward agency (Nomad, Trusted), ~20%
    implied_bill_rate_25 NUMERIC(10, 2),            -- Industry average, ~25%
    implied_bill_rate_30 NUMERIC(10, 2),            -- Large MSP agency (AMN, Aya), ~30%
    implied_bill_rate_35 NUMERIC(10, 2),            -- Crisis/strike staffing (Fastaff), ~35%

    -- ── Rental Linkage (calculated at insert from zip_housing_costs) ──
    zori_monthly_at_insert NUMERIC(10, 2),          -- Zillow rent snapshot at time of report
    hud_fmr_at_insert NUMERIC(10, 2),               -- HUD Fair Market Rent snapshot
    gsa_monthly_lodging_at_insert NUMERIC(10, 2),   -- GSA max lodging × 30 snapshot
    rent_burden_pct NUMERIC(5, 2),                  -- (zori / gsa_monthly_lodging) × 100

    -- ── Licensing Cost (ties to dietitian licensing project) ──
    licensing_cost_est NUMERIC(8, 2),               -- Estimated state licensing cost for this profession
    licensing_state VARCHAR(2),                     -- State the license applies to (may differ from ZIP state)

    -- ── Metadata ──
    session_hash VARCHAR(255),
    ip_hash VARCHAR(255),
    is_seed_data BOOLEAN DEFAULT false,
    source VARCHAR(50) DEFAULT 'calculator',        -- calculator, seed, import, api
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_pr_zip ON pay_reports(zip_code);
CREATE INDEX idx_pr_profession ON pay_reports(profession);
CREATE INDEX idx_pr_specialty ON pay_reports(specialty);
CREATE INDEX idx_pr_agency ON pay_reports(agency_name_raw);
CREATE INDEX idx_pr_facility ON pay_reports(facility_name_raw);
CREATE INDEX idx_pr_created ON pay_reports(created_at DESC);

-- RLS — allow anon insert (calculator), service_role full access
ALTER TABLE pay_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts" ON pay_reports
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Service role full access" ON pay_reports
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Read access for aggregations (no PII columns exposed via views)
CREATE POLICY "Allow authenticated reads" ON pay_reports
    FOR SELECT TO authenticated USING (true);


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. AGENCY INSURANCE INTEL (Layer 3)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS agency_insurance_intel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_name TEXT NOT NULL UNIQUE,               -- Matches AGENCY_CHIPS in calculator
    day_one BOOLEAN NOT NULL,
    waiting_days INT DEFAULT 0,
    bridge_days INT DEFAULT 0,
    bridge_condition TEXT,
    weekly_cost_single_low NUMERIC(6, 2),
    weekly_cost_single_high NUMERIC(6, 2),
    network_type TEXT,                              -- PPO, HMO, HDHP
    carrier TEXT,                                   -- Cigna, Aetna, Anthem, UHC
    dental_vision BOOLEAN DEFAULT true,
    opt_out_weekly_est NUMERIC(6, 2),
    data_year INT NOT NULL,
    confidence TEXT NOT NULL DEFAULT 'medium',       -- high, medium, low
    source_urls TEXT[],
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE agency_insurance_intel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON agency_insurance_intel
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Service role full" ON agency_insurance_intel
    FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. FACILITY INTEL (Layer 4)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS facility_intel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    facility_name TEXT NOT NULL,
    facility_name_normalized TEXT,
    health_system TEXT,
    facility_type TEXT DEFAULT 'hospital',

    -- Location (ties to Layers 1 & 2)
    zip_code TEXT NOT NULL,
    city TEXT,
    state TEXT NOT NULL,
    address TEXT,

    -- MSP Gatekeeper
    msp_gatekeeper TEXT,
    msp_exclusive BOOLEAN DEFAULT false,
    msp_notes TEXT,

    -- VMS Software
    vms_software TEXT,
    vms_notes TEXT,

    -- Facility Rules
    facility_rules_raw TEXT,
    max_rto_days INT,
    block_scheduling BOOLEAN,
    float_required BOOLEAN,
    ehr_system TEXT,
    orientation_days INT,
    parking_cost_monthly NUMERIC(6, 2),

    -- Metadata
    data_source TEXT DEFAULT 'crowdsourced',
    confidence TEXT DEFAULT 'low',
    report_count INT DEFAULT 0,
    source_urls TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_fi_zip ON facility_intel(zip_code);
CREATE INDEX idx_fi_state ON facility_intel(state);
CREATE INDEX idx_fi_system ON facility_intel(health_system);
CREATE INDEX idx_fi_msp ON facility_intel(msp_gatekeeper);
CREATE INDEX idx_fi_name_trgm ON facility_intel USING gin (facility_name_normalized gin_trgm_ops);

-- RLS
ALTER TABLE facility_intel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON facility_intel
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Service role full" ON facility_intel
    FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. SEED AGENCY INSURANCE INTEL (10 agencies)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO agency_insurance_intel
    (agency_name, day_one, waiting_days, bridge_days, bridge_condition,
     weekly_cost_single_low, weekly_cost_single_high, network_type, carrier,
     dental_vision, opt_out_weekly_est, data_year, confidence, notes)
VALUES
    ('AMN', false, 30, 25,
     'Next assignment must begin within 25 days (per 2025 Benefits Guide)',
     NULL, NULL, 'HDHP/PPO/Preventative', NULL,
     true, NULL, 2025, 'medium',
     'Only agency with confirmed waiting period. Free preventative plan starts in 1-2 weeks; full PPO up to 30-day wait.'),

    ('Aya', true, 0, 0,
     'No bridge. Recruiter may extend 1-2 weeks at discretion if next contract signed.',
     17.00, 150.00, 'PPO', 'Aetna',
     true, 150.00, 2024, 'high',
     'Most expensive insurance. Cost not itemized on paystubs — recruiters quote two pay rates (with/without). Acquiring Cross Country (Q3 2025).'),

    ('Cross Country', true, 0, 28,
     'Historical: next contract must be signed. Unverified for 2024+.',
     NULL, NULL, 'Multiple', NULL,
     true, NULL, 2024, 'low',
     '28-day gap claim from 2019 Reddit only. Being acquired by Aya. Official site does not publish bridge terms.'),

    ('Fastaff', true, 0, 0,
     'Employment ends when assignment ends per employee handbook.',
     NULL, NULL, NULL, NULL,
     true, NULL, 2024, 'medium',
     'Crisis/strike agency. High pay rates offset lack of gap coverage. Handbook language explicit: employment completed once assignment ends.'),

    ('FlexCare', true, 0, 30,
     'Must remain active with agency and meet eligibility requirements.',
     45.00, 75.00, NULL, NULL,
     true, NULL, 2024, 'medium',
     'Weekly cost figures are industry estimates (nomadicare.com), not FlexCare-specific. Bridge policy from official FAQ.'),

    ('Host', true, 0, 30,
     'Assignments must be less than 30 days apart. Official policy on hosthealthcare.com.',
     NULL, NULL, NULL, NULL,
     true, NULL, 2025, 'high',
     'One of the clearest bridge policies. Also offers 401k matching, free CEUs, $1K-$2K referral bonuses.'),

    ('Medical Solutions', true, 0, 0,
     'No bridge. Coverage ends when assignment ends. Offers supplemental gap products (accident/disability) but NOT medical continuation.',
     10.00, 21.00, 'PPO', 'Cigna',
     true, NULL, 2024, 'high',
     'Cheapest published insurance in the industry ($10-21/wk). Zero gap coverage is the tradeoff.'),

    ('Nomad', true, 0, 14,
     'Next Nomad assignment must begin within 14 days of previous ending.',
     NULL, NULL, 'PPO', 'Anthem/UHC',
     true, NULL, 2024, 'high',
     'Tech-forward marketplace. Anthem/UHC network can be state-restrictive. 14-day bridge is shorter than Host/TNAA (30d).'),

    ('TNAA', true, 0, 30,
     'Next TNAA assignment must be booked before current ends, start within 30 days.',
     0.00, 19.00, 'PPO (Base + Buy-Up), HDHP, HSA', 'Cigna',
     true, NULL, 2024, 'high',
     'Best-in-class combo: $0/wk base PPO + 30-day bridge + Cigna. Pricing from 2018 guide — likely higher now but TNAA says below national average.'),

    ('Trusted', true, 0, 30,
     'Tiered: ≤7d auto-continue; same month active; ≤30d active through end of month. Pre-pay option available.',
     NULL, NULL, 'PPO', 'Cigna',
     true, NULL, 2025, 'high',
     'Most transparent bridge policy. Three tiers give max flexibility. Committed to 1 month of coverage if next assignment is with Trusted.')
ON CONFLICT (agency_name) DO NOTHING;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 5. GRANT PERMISSIONS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GRANT SELECT ON pay_reports TO anon, authenticated;
GRANT INSERT ON pay_reports TO anon;
GRANT ALL ON pay_reports TO service_role;

GRANT SELECT ON agency_insurance_intel TO anon, authenticated;
GRANT ALL ON agency_insurance_intel TO service_role;

GRANT SELECT ON facility_intel TO anon, authenticated;
GRANT ALL ON facility_intel TO service_role;
