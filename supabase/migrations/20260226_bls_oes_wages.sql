-- ============================================================
-- PerDiem.fyi — BLS OES Wage Intelligence (Layer 5)
-- Source: Bureau of Labor Statistics, Occupational Employment
--         and Wage Statistics, May 2024 release
-- ============================================================

CREATE TABLE IF NOT EXISTS bls_oes_wages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    soc_code VARCHAR(10) NOT NULL,
    occupation_title TEXT NOT NULL,
    perdiem_profession VARCHAR(20) NOT NULL,
    area_type VARCHAR(10) NOT NULL DEFAULT 'national',
    area_name TEXT NOT NULL DEFAULT 'National',
    state VARCHAR(2),
    total_employment INT,
    wage_pct10 NUMERIC(10,2),
    wage_pct25 NUMERIC(10,2),
    wage_median NUMERIC(10,2),
    wage_pct75 NUMERIC(10,2),
    wage_pct90 NUMERIC(10,2),
    wage_mean NUMERIC(10,2),
    hourly_mean NUMERIC(8,2),
    hourly_median NUMERIC(8,2),
    staff_weekly_median NUMERIC(8,2) GENERATED ALWAYS AS (
        ROUND(wage_median / 52, 2)
    ) STORED,
    survey_period VARCHAR(20) NOT NULL DEFAULT 'May 2024',
    data_source TEXT NOT NULL DEFAULT 'BLS OEWS',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(soc_code, area_type, area_name, survey_period)
);

CREATE INDEX IF NOT EXISTS idx_bls_profession ON bls_oes_wages(perdiem_profession);
CREATE INDEX IF NOT EXISTS idx_bls_state ON bls_oes_wages(state);
CREATE INDEX IF NOT EXISTS idx_bls_soc ON bls_oes_wages(soc_code);

ALTER TABLE bls_oes_wages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON bls_oes_wages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Service role full" ON bls_oes_wages FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT SELECT ON bls_oes_wages TO anon, authenticated;
GRANT ALL ON bls_oes_wages TO service_role;

-- ━━━ SEED: National-level (BLS May 2024) ━━━
INSERT INTO bls_oes_wages
    (soc_code, occupation_title, perdiem_profession, area_type, area_name,
     total_employment, wage_pct10, wage_pct25, wage_median, wage_pct75, wage_pct90, wage_mean,
     hourly_mean, hourly_median)
VALUES
    ('29-1141','Registered Nurses','RN','national','National',
     3450400,64280,75810,87900,109990,135120,94480,45.42,42.26),
    ('29-1123','Physical Therapists','PT','national','National',
     248630,74420,83470,101020,117190,132500,102400,49.23,48.57),
    ('29-1126','Respiratory Therapists','RRT','national','National',
     140400,60250,69580,79830,95930,109240,81580,39.22,38.38),
    ('29-2034','Radiologic Technologists','RAD','national','National',
     228800,52360,66810,77660,91830,106990,79770,38.35,37.34),
    ('29-1122','Occupational Therapists','OT','national','National',
     143600,66430,77180,96370,110560,127530,96930,46.60,46.33),
    ('29-1127','Speech-Language Pathologists','SLP','national','National',
     170200,55940,68710,89290,107870,131060,92860,44.64,42.93),
    ('29-2061','Licensed Practical Nurses','LPN','national','National',
     658240,37190,42550,51850,60830,67960,52560,25.27,24.93),
    ('31-1131','Nursing Assistants','CNA','national','National',
     1393400,27460,30810,36220,41270,47350,37080,17.83,17.42),
    ('31-9097','Phlebotomists','PHLEB','national','National',
     146800,34860,39190,43660,50360,57750,45750,22.00,20.99)
ON CONFLICT (soc_code, area_type, area_name, survey_period) DO NOTHING;

-- ━━━ SEED: Top-paying states (BLS May 2024) ━━━
INSERT INTO bls_oes_wages
    (soc_code, occupation_title, perdiem_profession, area_type, area_name, state,
     wage_mean, hourly_mean)
VALUES
    ('29-1141','Registered Nurses','RN','state','California','CA',137690,66.20),
    ('29-1141','Registered Nurses','RN','state','Hawaii','HI',120450,57.91),
    ('29-1141','Registered Nurses','RN','state','Oregon','OR',110340,53.05),
    ('29-1141','Registered Nurses','RN','state','Washington','WA',108760,52.29),
    ('29-1141','Registered Nurses','RN','state','Massachusetts','MA',107430,51.65),
    ('29-1123','Physical Therapists','PT','state','California','CA',120970,58.16),
    ('29-1123','Physical Therapists','PT','state','Nevada','NV',113700,54.66),
    ('29-1123','Physical Therapists','PT','state','Alaska','AK',113190,54.42),
    ('29-1123','Physical Therapists','PT','state','District of Columbia','DC',109970,52.87),
    ('29-1123','Physical Therapists','PT','state','New Jersey','NJ',109470,52.63),
    ('29-1126','Respiratory Therapists','RRT','state','California','CA',102450,49.25),
    ('29-1126','Respiratory Therapists','RRT','state','New York','NY',98760,47.48),
    ('29-1126','Respiratory Therapists','RRT','state','Hawaii','HI',96540,46.41),
    ('29-1126','Respiratory Therapists','RRT','state','Nevada','NV',95320,45.83),
    ('29-1126','Respiratory Therapists','RRT','state','Massachusetts','MA',94110,45.25),
    ('29-2034','Radiologic Technologists','RAD','state','California','CA',105680,50.81),
    ('29-2034','Radiologic Technologists','RAD','state','Hawaii','HI',102960,49.50),
    ('29-2034','Radiologic Technologists','RAD','state','Massachusetts','MA',95430,45.88),
    ('29-2034','Radiologic Technologists','RAD','state','Oregon','OR',94110,45.25),
    ('29-2034','Radiologic Technologists','RAD','state','Washington','WA',92870,44.65)
ON CONFLICT (soc_code, area_type, area_name, survey_period) DO NOTHING;
