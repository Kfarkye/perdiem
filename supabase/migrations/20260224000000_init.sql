-- PerDiem.fyi Database Schema
-- Run these migrations in order on your Supabase instance.
-- All tables have RLS enabled with appropriate policies.

-- ━━━ 1. GSA RATES ━━━
CREATE TABLE IF NOT EXISTS public.gsa_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fiscal_year INT NOT NULL,
  state VARCHAR(2) NOT NULL,
  city TEXT NOT NULL,
  county TEXT NOT NULL,
  destination_id TEXT,
  oct NUMERIC(8,2), nov NUMERIC(8,2), dec_ NUMERIC(8,2),
  jan NUMERIC(8,2), feb NUMERIC(8,2), mar NUMERIC(8,2),
  apr NUMERIC(8,2), may NUMERIC(8,2), jun NUMERIC(8,2),
  jul NUMERIC(8,2), aug NUMERIC(8,2), sep NUMERIC(8,2),
  meals_daily NUMERIC(8,2) NOT NULL,
  max_lodging NUMERIC(8,2) GENERATED ALWAYS AS (
    GREATEST(oct, nov, dec_, jan, feb, mar, apr, may, jun, jul, aug, sep)
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(fiscal_year, state, county)
);

CREATE INDEX IF NOT EXISTS idx_gsa_rates_state_county ON public.gsa_rates(state, county);
CREATE INDEX IF NOT EXISTS idx_gsa_rates_fiscal_year ON public.gsa_rates(fiscal_year);

ALTER TABLE public.gsa_rates ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public read access" ON public.gsa_rates FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ━━━ 2. ZIP-COUNTY CROSSWALK ━━━
CREATE TABLE IF NOT EXISTS public.zip_county_crosswalk (
  zip VARCHAR(5) PRIMARY KEY,
  county TEXT NOT NULL,
  state VARCHAR(2) NOT NULL,
  city TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_zip_county_state ON public.zip_county_crosswalk(state, county);

ALTER TABLE public.zip_county_crosswalk ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public read access" ON public.zip_county_crosswalk FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ━━━ 3. HUD FAIR MARKET RENTS ━━━
CREATE TABLE IF NOT EXISTS public.hud_fmr (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fiscal_year INT NOT NULL,
  zip VARCHAR(5) NOT NULL,
  state VARCHAR(2) NOT NULL,
  county TEXT,
  metro_area TEXT,
  fmr_studio NUMERIC(8,2),
  fmr_1br NUMERIC(8,2),
  fmr_2br NUMERIC(8,2),
  fmr_3br NUMERIC(8,2),
  fmr_4br NUMERIC(8,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(fiscal_year, zip)
);

CREATE INDEX IF NOT EXISTS idx_hud_fmr_zip ON public.hud_fmr(zip);

ALTER TABLE public.hud_fmr ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public read access" ON public.hud_fmr FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ━━━ 4. FACILITIES ━━━
CREATE TABLE IF NOT EXISTS public.facilities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  npi VARCHAR(10),
  address TEXT,
  city TEXT NOT NULL,
  state VARCHAR(2) NOT NULL,
  zip VARCHAR(10) NOT NULL,
  county TEXT,
  facility_type TEXT,
  bed_count INT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  cms_certification_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_facilities_state_city ON public.facilities(state, city);
CREATE INDEX IF NOT EXISTS idx_facilities_zip ON public.facilities(zip);

ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public read access" ON public.facilities FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ━━━ 5. PAY REPORTS ━━━
CREATE TABLE IF NOT EXISTS public.pay_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  zip VARCHAR(5) NOT NULL,
  state VARCHAR(2) NOT NULL,
  county TEXT,
  city TEXT,
  specialty TEXT DEFAULT 'RN',
  weekly_gross NUMERIC(10,2) NOT NULL,
  hours_per_week INT DEFAULT 36,
  agency_name TEXT,
  facility_name TEXT,
  stipend_weekly NUMERIC(10,2),
  taxable_hourly NUMERIC(8,2),
  contract_length_weeks INT DEFAULT 13,
  is_local BOOLEAN DEFAULT false,
  source TEXT DEFAULT 'calculator',
  session_id TEXT,
  ip_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pay_reports_zip ON public.pay_reports(zip);
CREATE INDEX IF NOT EXISTS idx_pay_reports_state_county ON public.pay_reports(state, county);
CREATE INDEX IF NOT EXISTS idx_pay_reports_specialty ON public.pay_reports(specialty);
CREATE INDEX IF NOT EXISTS idx_pay_reports_created ON public.pay_reports(created_at DESC);

ALTER TABLE public.pay_reports ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public insert" ON public.pay_reports FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Public read aggregates only" ON public.pay_reports FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ━━━ 6. MARKET SNAPSHOTS ━━━
CREATE TABLE IF NOT EXISTS public.market_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  state VARCHAR(2) NOT NULL,
  county TEXT NOT NULL,
  city TEXT,
  specialty TEXT DEFAULT 'RN',

  -- GSA data
  gsa_fiscal_year INT,
  gsa_lodging_daily NUMERIC(8,2),
  gsa_meals_daily NUMERIC(8,2),
  gsa_weekly_total NUMERIC(8,2),
  gsa_monthly_total NUMERIC(8,2),

  -- Housing index
  housing_studio_avg NUMERIC(8,2),
  housing_1br_avg NUMERIC(8,2),
  housing_2br_avg NUMERIC(8,2),
  housing_1br_median NUMERIC(8,2),
  housing_listings_count INT,

  -- Pay intelligence
  pay_weekly_median NUMERIC(8,2),
  pay_weekly_p25 NUMERIC(8,2),
  pay_weekly_p75 NUMERIC(8,2),
  pay_report_count INT DEFAULT 0,
  agency_count INT DEFAULT 0,

  -- Derived
  stipend_surplus_monthly NUMERIC(8,2),

  -- Meta
  snapshot_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(state, county, specialty, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_market_snapshots_lookup ON public.market_snapshots(state, county, specialty);

ALTER TABLE public.market_snapshots ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public read access" ON public.market_snapshots FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
