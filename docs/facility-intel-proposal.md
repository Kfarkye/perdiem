# Layer 4: Facility Intelligence — Proposed Schema & Seed Strategy
>
> **Status:** AWAITING APPROVAL  
> **Last Updated:** 2026-02-25  
> **Sources:** Agency websites, Reddit r/TravelNursing, BluePipes, HealthTrust, hospital system career pages

---

## 1. Proposed Table: `facility_intel`

```sql
CREATE TABLE facility_intel (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Identity
  facility_name     TEXT NOT NULL,              -- e.g. "Banner Desert Medical Center"
  facility_name_normalized TEXT,                -- Cleaned/lowered for fuzzy matching
  health_system     TEXT,                       -- e.g. "Banner Health", "HCA", "Tenet", "CommonSpirit"
  facility_type     TEXT DEFAULT 'hospital',    -- 'hospital', 'ltac', 'rehab', 'snf', 'clinic', 'outpatient'

  -- Location (ties to Layers 1 & 2)
  zip_code          TEXT NOT NULL,              -- PRIMARY LINK to zip_housing_costs + gsa_zip_mappings
  city              TEXT,
  state             TEXT NOT NULL,              -- 2-letter code
  address           TEXT,

  -- MSP Gatekeeper
  msp_gatekeeper    TEXT,                       -- e.g. "HealthTrust", "AMN", "Aya", "Medical Solutions"
  msp_exclusive     BOOLEAN DEFAULT FALSE,      -- true = ONLY this MSP can submit candidates
  msp_notes         TEXT,                       -- e.g. "All agencies must submit through HealthTrust VMS"

  -- VMS Software
  vms_software      TEXT,                       -- e.g. "ShiftWise", "Medefis", "Fieldglass", "StafferLink"
  vms_notes         TEXT,

  -- Facility Rules (raw + structured)
  facility_rules_raw TEXT,                      -- Free-text from user submissions
  max_rto_days      INT,                        -- Max requested time off days allowed
  block_scheduling  BOOLEAN,                    -- Does the facility allow block scheduling?
  float_required    BOOLEAN,                    -- Must float to other units?
  ehr_system        TEXT,                       -- e.g. "Epic", "Cerner", "Meditech"
  orientation_days  INT,                        -- Days of orientation before starting
  parking_cost_monthly NUMERIC(6,2),            -- If parking isn't free

  -- Metadata
  data_source       TEXT DEFAULT 'crowdsourced', -- 'crowdsourced', 'research', 'verified'
  confidence        TEXT DEFAULT 'low',         -- 'high', 'medium', 'low'
  report_count      INT DEFAULT 0,              -- How many users have submitted data for this facility
  source_urls       TEXT[],
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes
  CONSTRAINT fk_zip FOREIGN KEY (zip_code) REFERENCES zip_housing_costs(zip) ON DELETE SET NULL
);

-- Indexes for fast lookup
CREATE INDEX idx_facility_zip ON facility_intel(zip_code);
CREATE INDEX idx_facility_state ON facility_intel(state);
CREATE INDEX idx_facility_system ON facility_intel(health_system);
CREATE INDEX idx_facility_msp ON facility_intel(msp_gatekeeper);
CREATE INDEX idx_facility_name_norm ON facility_intel(facility_name_normalized);

-- Enable trigram similarity for fuzzy matching on facility names
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_facility_trgm ON facility_intel USING gin (facility_name_normalized gin_trgm_ops);
```

---

## 2. Major Health System → MSP → VMS Mapping

This is the backbone data. When a nurse types "Banner Desert" in the calculator, we can immediately tell them which agency controls submissions.

### Verified Mappings

| Health System | # Hospitals | MSP Gatekeeper | VMS Software | Exclusive? | Source | Confidence |
|---|---|---|---|---|---|---|
| **HCA Healthcare** | ~180+ | **HealthTrust Workforce Solutions** | Proprietary (formerly Parallon) | ✅ Yes | healthtrustpg.com, whatisbluesky.com | 🟢 High |
| **CommonSpirit Health** | ~140+ | **Internal travel program** | Not confirmed | N/A (direct hire) | commonspirit.careers | 🟢 High |
| **Tenet Healthcare** | ~60+ | **Trusted Resource Associates** (internal) | Not confirmed | N/A (internal pool) | tenethealth.com | 🟢 High |
| **Banner Health** | ~30+ | **Banner Staffing Services** (internal) + external agencies | Not confirmed | Partial — internal pool first | bannerhealth.com | 🟡 Medium |
| **Kaiser Permanente** | ~39 | **AMN Healthcare** | **SAP Fieldglass** | ✅ Yes | bluepipes.com, trustedhealth.com | 🟢 High |

### Key Findings

**1. HCA = HealthTrust — the biggest gatekeeper in the industry** [healthtrustpg.com]

- HealthTrust calls itself the "industry's largest vendor-neutral healthcare MSP program in North America"
- All HCA temp staffing flows through HealthTrust's VMS
- They claim 3–8% cost savings for hospitals via their vendor-funded model
- This means: if a nurse wants to work at an HCA facility, their agency MUST be credentialed with HealthTrust. Not all agencies are.

**2. AMN owns both ShiftWise and Medefis** [amnhealthcare.com]

- AMN acquired ShiftWise in 2013 and Medefis subsequently
- This creates a potential conflict of interest: AMN runs the VMS that competing agencies must submit through
- BluePipes.com has noted this concern publicly [bluepipes.com]
- Kaiser uses AMN + Fieldglass, meaning AMN controls access to 39+ Kaiser hospitals

**3. CommonSpirit and Tenet run internal travel programs** [commonspirit.careers, tenethealth.com]

- These health systems hire travel nurses directly (W-2) rather than through agencies
- This is a growing trend post-pandemic as systems try to reduce agency dependency
- For PerDiem.fyi, this means: the "agency" field might be "Direct/CommonSpirit" or "Direct/Tenet"

**4. Banner Health uses a hybrid model** [bannerhealth.com]

- "Banner Staffing Services" handles internal registry + travel
- They also contract with external agencies
- No confirmed VMS platform for external vendors

---

## 3. VMS Software Landscape

| VMS | Owner | Key Clients | Market Position |
|---|---|---|---|
| **ShiftWise Flex** | AMN Healthcare | Wide adoption, integrates with AMN Passport app | Major — recognized as "Major Contender" |
| **Medefis** | AMN Healthcare | Vendor-neutral MSP platform | Mid-tier — neutrality questioned due to AMN ownership |
| **SAP Fieldglass** | SAP | Kaiser (via AMN), enterprise clients | Largest by gross spend globally |
| **StafferLink** | Smartlinx (acquired) | Per diem, contract, travel scheduling | Niche — focused on senior care |

---

## 4. Facility Rules — What Reddit Says Nurses Care About

From r/TravelNursing research, these are the facility-level data points nurses search for before accepting a contract:

| Rule | Why It Matters | Frequency on Reddit |
|---|---|---|
| **EHR System** (Epic vs. Cerner) | Determines onboarding time + comfort level. Epic-only nurses won't take Cerner facilities. | 🔥 Very High |
| **Float Policy** | "Must float to 3+ units" is a dealbreaker for many. | 🔥 Very High |
| **Block Scheduling** | Nurses want 3-on/4-off. Facilities that don't allow it lose candidates. | 🟡 Medium |
| **Orientation Length** | 1–2 days vs. 5+ days of unpaid orientation is a cost issue. | 🟡 Medium |
| **Parking Cost** | Downtown hospitals can charge $200+/mo. Hidden cost. | 🟡 Medium |
| **RTO (Requested Time Off)** | Some facilities allow 0 RTO days on 13-week contracts. | 🟡 Medium |
| **DNR (Do Not Rehire) Lists** | Health systems maintain blacklists. Nurses want to know if a system has aggressive DNR policies. | 🔴 Sensitive |
| **Double-Submit Rules** | Submitting through 2 agencies = both get rejected. | 🔥 Very High |

---

## 5. Seed Strategy

### Phase A: Schema + Empty Table (Now)

- Create the `facility_intel` table
- Enable `pg_trgm` for fuzzy matching
- No seed data yet — the table is populated by:

### Phase B: Crowdsourced Collection (Soon)

- The calculator already collects `facility_name` (raw text)
- When a user submits: attempt fuzzy match against existing `facility_intel` rows
- If no match: create a new row with `data_source = 'crowdsourced'`, `confidence = 'low'`
- If match: increment `report_count`, append any new rules data

### Phase C: Research Seeding (Later)

- Manually seed the top 50 health systems with MSP/VMS data from verified sources
- Start with: HCA (HealthTrust), Kaiser (AMN/Fieldglass), CommonSpirit (internal), Tenet (internal), Banner (hybrid)
- Populate ZIP codes from CMS Hospital Compare data or similar public datasets

### Phase D: Fuzzy Match Engine (Future)

- Use `pg_trgm` similarity scoring to match raw `facility_name` input to normalized rows
- Threshold: `similarity(input, facility_name_normalized) > 0.3`
- Present top 3 matches to the user for confirmation

---

## 6. How This Connects to Existing Layers

```
Layer 1: GSA Rates (gsa_rates + gsa_zip_mappings)
    ↓ zip_code
Layer 2: Housing Costs (zip_housing_costs — ZORI + HUD FMR)
    ↓ zip_code
Layer 3: Agency Intel (agency_insurance_intel — insurance, bridge, costs)
    ↓ agency_name
Layer 4: Facility Intel (facility_intel) ← THIS TABLE
    ↑ zip_code (links to housing)
    ↑ msp_gatekeeper (links to agency)
    ↑ facility_name (collected from calculator)
```

**The ZIP code is the join key that makes everything work.** When a user enters:

- **ZIP 85202** → We know Banner Desert Medical Center is there
- → We know the GSA rate for Mesa, AZ
- → We know the ZORI rent is $X/mo
- → We know Banner uses Banner Staffing Services (internal MSP)
- → We know the break-even % for that market

---

## 7. Approval Checklist

- [ ] `facility_intel` schema looks correct
- [ ] Foreign key to `zip_housing_costs` is acceptable
- [ ] MSP/VMS research findings are accurate
- [ ] Phase A (empty table) is approved to create now
- [ ] Phase B (crowdsource from calculator) approach is approved
- [ ] `pg_trgm` extension is approved for fuzzy matching
