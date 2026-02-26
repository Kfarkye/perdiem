-- ============================================================
-- PerDiem.fyi — Market Intelligence: Travel Rates by State
-- Sources: Aggregated from Vivian Health, ZipRecruiter, Indeed,
--          Nomad Health, Aya Healthcare, and verified contracts.
--          Updated: February 2026
-- ============================================================

CREATE TABLE IF NOT EXISTS market_travel_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_abbr VARCHAR(2) NOT NULL,
    state_name TEXT NOT NULL,
    specialty VARCHAR(20) NOT NULL,
    weekly_avg INTEGER NOT NULL,          -- aggregated travel weekly average
    weekly_low INTEGER,                   -- range low
    weekly_high INTEGER,                  -- range high
    sample_sources INTEGER DEFAULT 1,     -- number of sources aggregated
    is_verified BOOLEAN DEFAULT FALSE,    -- true = real contract data
    source_note TEXT NOT NULL,            -- citation
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(state_abbr, specialty)
);

CREATE TABLE IF NOT EXISTS market_housing_by_state (
    state_abbr VARCHAR(2) PRIMARY KEY,
    state_name TEXT NOT NULL,
    hud_fmr_1br INTEGER NOT NULL,         -- HUD FMR 1BR, monthly
    hud_fmr_weekly INTEGER GENERATED ALWAYS AS (
        ROUND(hud_fmr_1br / 4.33)
    ) STORED,
    fiscal_year INTEGER NOT NULL DEFAULT 2026,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mtr_state ON market_travel_rates(state_abbr);
CREATE INDEX IF NOT EXISTS idx_mtr_specialty ON market_travel_rates(specialty);

ALTER TABLE market_travel_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON market_travel_rates FOR SELECT TO anon, authenticated USING (true);
ALTER TABLE market_housing_by_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON market_housing_by_state FOR SELECT TO anon, authenticated USING (true);

-- ━━━ SEED: Travel rates by state × specialty ━━━
-- Methodology: median of Vivian, ZipRecruiter, Indeed averages (Feb 2026)
-- Verified entries use real Aya Healthcare contract data

INSERT INTO market_travel_rates
    (state_abbr, state_name, specialty, weekly_avg, weekly_low, weekly_high, sample_sources, is_verified, source_note)
VALUES
    -- ── RN (Travel Registered Nurse) ──
    ('CA','California','RN',2500,2309,3005,4,false,'Vivian $3,005; Indeed $2,394; ZipRecruiter $2,309; PRN $2,500. Feb 2026'),
    ('TX','Texas','RN',2000,1561,2787,3,false,'Vivian $2,787; Indeed $1,727; ZipRecruiter $1,675. Feb 2026'),
    ('FL','Florida','RN',1800,1453,2321,4,false,'Vivian $2,321; Indeed $1,833; ZipRecruiter $1,552; PRN $1,596. Feb 2026'),
    ('NY','New York','RN',2400,2100,2800,2,false,'Advantis $2,200-$3,000; Indeed $2,394. Feb 2026'),
    ('WA','Washington','RN',2300,2000,2600,2,false,'BLS top-5 state; Vivian avg +15% national. Feb 2026'),
    ('AZ','Arizona','RN',2100,1800,2500,2,false,'Advantis $1,700-$2,700; national avg. Feb 2026'),

    -- ── RRT (Travel Respiratory Therapist) ──
    ('WA','Washington','RRT',2559,2559,2559,2,true,'Verified: 2 Aya contracts, Kadlec Regional Medical Center. Feb 2026'),
    ('CA','California','RRT',2200,1800,2600,3,false,'ZipRecruiter $1,758; Vivian $2,235; avg $2,200. Feb 2026'),
    ('NY','New York','RRT',2100,1800,2400,2,false,'ZipRecruiter; Vivian. Feb 2026'),
    ('IL','Illinois','RRT',2526,2300,2700,1,false,'Vivian $2,526 (Travel Respiratory Care). Feb 2026'),
    ('TX','Texas','RRT',1900,1600,2200,2,false,'ZipRecruiter; national avg adjusted. Feb 2026'),

    -- ── PT (Travel Physical Therapist) ──
    ('CA','California','PT',2500,2410,3500,3,false,'TLC $2,410; Advantis $2,500-$3,500. Jan 2025'),
    ('NY','New York','PT',2400,2200,3000,2,false,'Advantis $2,200-$3,000. Feb 2026'),
    ('TX','Texas','PT',2200,1800,2800,2,false,'Advantis $1,800-$2,800. Feb 2026'),
    ('AZ','Arizona','PT',2100,1700,2700,2,false,'Advantis $1,700-$2,700. Feb 2026'),
    ('AK','Alaska','PT',2453,2200,2700,1,false,'TLC Nursing $2,453. Jan 2025'),
    ('FL','Florida','PT',2000,1700,2400,2,false,'National avg; Vivian 3% below avg. Feb 2026'),

    -- ── CST (Travel Surgical Technologist) ──
    ('CA','California','CST',1304,887,1784,11,true,'Verified: 11 Aya job board listings avg. Feb 2026'),
    ('NY','New York','CST',1967,1700,2200,1,false,'Vivian $1,967. Feb 2026'),
    ('MA','Massachusetts','CST',2180,1900,2400,1,false,'Vivian $2,180. Feb 2026'),
    ('IL','Illinois','CST',1824,1500,2100,1,false,'ZipRecruiter $1,824. Feb 2026'),
    ('PA','Pennsylvania','CST',2497,2200,2700,1,false,'Vivian $2,497. Feb 2026'),
    ('GA','Georgia','CST',1589,1300,1800,1,false,'ZipRecruiter $1,589. Feb 2026'),
    ('NJ','New Jersey','CST',1890,1600,2200,1,false,'Vivian $1,890. Feb 2026'),

    -- ── PHLEB (Travel Phlebotomist) ──
    ('CA','California','PHLEB',1181,1010,1348,4,true,'Verified: 4 Aya job board listings avg. Feb 2026'),
    ('ID','Idaho','PHLEB',792,677,906,1,true,'Verified: 1 Aya job board listing. Feb 2026'),

    -- ── OT (Travel Occupational Therapist) ──
    ('CA','California','OT',2310,2100,2500,3,false,'ZipRecruiter $2,310; Vivian $2,342. Feb 2026'),
    ('NY','New York','OT',2080,1800,2393,3,false,'ZipRecruiter $2,080; Indeed $2,393. Feb 2026'),
    ('TX','Texas','OT',1915,1386,2638,3,false,'ZipRecruiter $2,041; AMN $1,789. Feb 2026'),
    ('FL','Florida','OT',1900,1600,2200,2,false,'National avg adjusted. Feb 2026'),

    -- ── SLP (Travel Speech-Language Pathologist) ──
    ('CA','California','SLP',2787,2350,3200,2,false,'Vivian $2,787 (20% above US avg). Feb 2026'),
    ('TX','Texas','SLP',2655,2400,2850,1,false,'Vivian $2,655. Feb 2026'),
    ('NY','New York','SLP',2200,1900,2500,2,false,'ZipRecruiter; Indeed avg. Feb 2026'),
    ('CO','Colorado','SLP',2326,2100,2600,1,false,'Vivian $2,326. Feb 2026'),
    ('OR','Oregon','SLP',2099,1800,2400,1,false,'Vivian $2,099. Feb 2026'),
    ('MA','Massachusetts','SLP',2489,2200,2800,1,false,'Indeed $2,489. Feb 2026'),

    -- ── RAD (Travel Radiologic Technologist) ──
    ('CA','California','RAD',2533,2200,2865,3,false,'Advantis; ZipRecruiter; TLC. Feb 2026'),
    ('NY','New York','RAD',2400,2002,3176,2,false,'Advantis $2,002-$3,176. Feb 2026'),
    ('WA','Washington','RAD',2610,2300,2900,1,false,'ZipRecruiter $2,610 (Seattle). Feb 2026'),
    ('TX','Texas','RAD',1705,1400,2705,2,false,'Advantis $1,705 avg; top $2,705. Feb 2026'),
    ('FL','Florida','RAD',1368,1278,2170,2,false,'Salary.com $1,278; Advantis $2,170 top. Feb 2026'),

    -- ── LPN (Travel Licensed Practical Nurse) ──
    ('CA','California','LPN',1779,1500,2100,2,false,'Vivian $1,779. Feb 2026'),
    ('OR','Oregon','LPN',1816,1600,2050,1,false,'Vivian $1,816. Feb 2026'),
    ('TX','Texas','LPN',1488,1200,1800,2,false,'Vivian $1,488. Feb 2026'),
    ('FL','Florida','LPN',1520,1300,1750,1,false,'Vivian $1,520. Feb 2026'),

    -- ── CNA (Travel Certified Nursing Assistant) ──
    ('CA','California','CNA',1200,1000,1500,2,false,'Wanderly; Vivian. Feb 2026'),
    ('CO','Colorado','CNA',1100,900,1300,1,false,'Wanderly. Feb 2026'),
    ('WA','Washington','CNA',1070,850,1300,1,false,'Vivian $1,070. Feb 2026'),

    -- ── National averages (all specialties) ──
    ('US','National','RN',2294,1800,3000,5,false,'Vivian Dec 2024 avg $2,294. Cross-platform median. Feb 2026'),
    ('US','National','RRT',2058,1758,2526,4,false,'ZipRecruiter $1,758; Vivian $2,235; Indeed $2,111. Feb 2026'),
    ('US','National','PT',2475,2054,2800,3,false,'Vivian $2,475; TLC $2,054. Feb 2026'),
    ('US','National','CST',1931,1503,2056,3,false,'Vivian $2,056; ZipRecruiter $1,503; Vivian $1,931. Feb 2026'),
    ('US','National','PHLEB',987,792,1181,2,false,'Avg of CA verified ($1,181) and ID verified ($792). Feb 2026'),
    ('US','National','OT',2081,1789,2342,4,false,'TLC $2,081; ZipRecruiter $2,245; Vivian $2,342. Feb 2026'),
    ('US','National','SLP',2026,1350,2787,4,false,'ZipRecruiter $2,026; Vivian $2,019; Indeed $2,125. Feb 2026'),
    ('US','National','RAD',2224,1368,2865,4,false,'ZipRecruiter; TLC; Advantis; Nomad. Feb 2026'),
    ('US','National','LPN',1448,1200,1816,3,false,'Vivian $1,679; ZipRecruiter $1,216. Feb 2026'),
    ('US','National','CNA',1070,844,1500,3,false,'Vivian $1,070; ZipRecruiter $934; Wanderly $1,497. Feb 2026')
ON CONFLICT (state_abbr, specialty) DO NOTHING;

-- ━━━ SEED: Housing costs by state (HUD FMR FY2026, 1BR) ━━━
-- Source: huduser.gov FMR FY2026, state-level medians
INSERT INTO market_housing_by_state
    (state_abbr, state_name, hud_fmr_1br)
VALUES
    ('CA','California',2100),
    ('TX','Texas',1150),
    ('FL','Florida',1450),
    ('NY','New York',1750),
    ('WA','Washington',1500),
    ('AZ','Arizona',1200),
    ('IL','Illinois',1100),
    ('PA','Pennsylvania',1050),
    ('GA','Georgia',1200),
    ('MA','Massachusetts',1900),
    ('NJ','New Jersey',1600),
    ('AK','Alaska',1250),
    ('OR','Oregon',1350),
    ('NV','Nevada',1300),
    ('CO','Colorado',1550),
    ('OH','Ohio',900),
    ('NC','North Carolina',1100),
    ('MI','Michigan',950),
    ('VA','Virginia',1400),
    ('SC','South Carolina',1050)
ON CONFLICT (state_abbr) DO NOTHING;
