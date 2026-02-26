-- ============================================================
-- PerDiem.fyi — MSP Market Control Intelligence (INTERNAL ONLY)
-- This data is NEVER exposed to the public UI or API.
-- Purpose: Track which markets have MSP-controlled rates
-- to identify compression hotspots and negotiation dead zones.
-- ============================================================

-- ━━━ MSP PRESENCE BY FACILITY/SYSTEM ━━━
CREATE TABLE IF NOT EXISTS _internal_msp_control (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_name TEXT NOT NULL,
    facility_city TEXT,
    facility_state VARCHAR(2) NOT NULL,
    facility_zip VARCHAR(5),
    health_system TEXT,                   -- e.g. 'Providence'
    msp_vendor TEXT NOT NULL,             -- e.g. 'Aya Healthcare'
    msp_type VARCHAR(20) NOT NULL         -- 'sole_source' | 'preferred' | 'panel'
        CHECK (msp_type IN ('sole_source', 'preferred', 'panel')),
    bill_rate_locked BOOLEAN DEFAULT TRUE, -- MSP controls bill rate
    base_bill_rate NUMERIC(8,2),          -- locked bill rate if known
    specialties_affected TEXT[],           -- array: {'RN','RRT','CST'}
    rate_compression_pct NUMERIC(5,2),    -- estimated % below non-MSP market
    notes TEXT,
    source TEXT NOT NULL,                  -- 'contract_review' | 'recruiter_intel'
    verified_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ━━━ MSP HOTSPOT SUMMARY (materialized view) ━━━
-- Aggregates MSP presence by state to identify compression zones
CREATE TABLE IF NOT EXISTS _internal_msp_hotspots (
    state_abbr VARCHAR(2) PRIMARY KEY,
    state_name TEXT NOT NULL,
    total_msp_facilities INTEGER DEFAULT 0,
    sole_source_count INTEGER DEFAULT 0,  -- worst: one MSP controls all
    avg_bill_rate NUMERIC(8,2),
    avg_compression_pct NUMERIC(5,2),
    dominant_msp TEXT,                     -- most common MSP in state
    hotspot_score INTEGER DEFAULT 0       -- 1-10, higher = more compressed
        CHECK (hotspot_score BETWEEN 0 AND 10),
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- No RLS needed — these tables should NEVER be accessible from frontend.
-- Only service_role can read/write.
ALTER TABLE _internal_msp_control ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON _internal_msp_control
    FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE _internal_msp_hotspots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON _internal_msp_hotspots
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Explicitly deny anon/authenticated access
-- (belt and suspenders — RLS already blocks, but be explicit)
REVOKE ALL ON _internal_msp_control FROM anon, authenticated;
REVOKE ALL ON _internal_msp_hotspots FROM anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_msp_state ON _internal_msp_control(facility_state);
CREATE INDEX IF NOT EXISTS idx_msp_vendor ON _internal_msp_control(msp_vendor);
CREATE INDEX IF NOT EXISTS idx_msp_system ON _internal_msp_control(health_system);

-- ━━━ SEED: Known MSP-controlled facilities ━━━
INSERT INTO _internal_msp_control
    (facility_name, facility_city, facility_state, facility_zip,
     health_system, msp_vendor, msp_type, bill_rate_locked,
     base_bill_rate, specialties_affected, rate_compression_pct,
     notes, source)
VALUES
    (
        'Providence Kadlec Regional Medical Center',
        'Richland', 'WA', '99352',
        'Providence Health & Services',
        'Aya Healthcare',
        'sole_source',
        TRUE,
        100.00,
        ARRAY['RRT','RN','CST'],
        NULL, -- TBD: need non-MSP comparison data
        'Verified: 2 RRT contracts (Feb 2026) show identical packages ($2,559/wk, $29.09 base, $95 OT, $100 bill). Rate is facility-locked, not individually negotiable.',
        'contract_review'
    )
ON CONFLICT DO NOTHING;

-- ━━━ SEED: Known MSP hotspot intel ━━━
INSERT INTO _internal_msp_hotspots
    (state_abbr, state_name, total_msp_facilities, sole_source_count,
     avg_bill_rate, dominant_msp, hotspot_score, notes)
VALUES
    ('WA', 'Washington', 1, 1, 100.00, 'Aya Healthcare', 5,
     'Providence system confirmed Aya sole-source MSP. Kadlec verified. Other Providence facilities in WA likely same arrangement.')
ON CONFLICT (state_abbr) DO NOTHING;
