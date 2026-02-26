# Market Intelligence: Weekly Pay vs. Housing Cost

## Product Gameplan — v1

---

## Vision

A state-by-state market intelligence page that shows travel healthcare
professionals **where their money goes furthest**. No agency names, no
facility names, no recruiter language. Pure data, neutral tone, built
on verified federal sources.

The single question it answers:
> "If I take an assignment in [State], how much of my paycheck survives housing?"

---

## Phase 1: Data Foundation (Week 1)

### 1A. Housing data (already have)

- [x] HUD FMR by ZIP → state rollup (median 1BR per state)
- [x] GSA per diem rates by destination
- [ ] **Build state summary table**: For each of the 50 states + DC, compute:
  - `median_fmr_1br` — median HUD FMR across all ZIPs in the state
  - `avg_gsa_lodging_daily` — average GSA lodging across all destinations
  - `avg_gsa_meals_daily` — average GSA M&IE across all destinations
  - `gsa_weekly_max` — derived (lodging + meals) × 7

### 1B. Pay data (partially have)

- [x] BLS OES May 2024 national medians (8 specialties seeded)
- [x] BLS OES state-level medians (top states seeded)
- [ ] **Expand BLS state data**: Seed all 50 states for all 8 specialties
  - Source: `oews_state_M2024_dl.xlsx` from BLS
  - Fields needed: `area_title`, `occ_code`, `a_median` (annual median)
  - Convert to weekly: `a_median / 52`
- [ ] **Travel premium multiplier**: Apply a conservative 1.4× to BLS staff
  median to estimate travel contract rates
  - Validate against verified data points:
    - RRT: $1,535 staff × 1.67 = $2,559 travel (actual, verified)
    - Surg Tech: BLS ~$1,100 staff, travel avg $1,304 (~1.19×)
  - Use specialty-specific multipliers where we have real data
  - Default to 1.4× where unverified, clearly label as "estimated"

### 1C. Database migration

```sql
CREATE TABLE IF NOT EXISTS market_state_summary (
  state_abbr TEXT PRIMARY KEY,       -- 'CA', 'WA', etc.
  state_name TEXT NOT NULL,
  median_fmr_1br INTEGER NOT NULL,   -- HUD FMR median 1BR, monthly
  avg_gsa_lodging_daily NUMERIC(8,2),
  avg_gsa_meals_daily NUMERIC(8,2),
  gsa_weekly_max INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- One row per state × specialty
CREATE TABLE IF NOT EXISTS market_pay_by_state (
  state_abbr TEXT NOT NULL,
  specialty TEXT NOT NULL,            -- 'RN', 'PT', 'RT', etc.
  bls_annual_median INTEGER,         -- BLS OES raw
  bls_weekly_staff INTEGER,          -- bls_annual / 52
  travel_weekly_est INTEGER,         -- staff × multiplier
  travel_multiplier NUMERIC(3,2),    -- 1.40 default, override per verified
  is_verified BOOLEAN DEFAULT FALSE, -- true if we have real contract data
  source_note TEXT,                   -- 'BLS OES May 2024' or 'Verified contract avg'
  PRIMARY KEY (state_abbr, specialty)
);
```

---

## Phase 2: API Endpoint (Week 2)

### `GET /api/v1/market/pay-vs-housing`

Query params:

- `state` (optional) — filter to one state
- `specialty` (optional) — filter to one specialty

Response:

```json
{
  "states": [
    {
      "state": "WA",
      "state_name": "Washington",
      "median_rent_monthly": 1268,
      "median_rent_weekly": 293,
      "specialties": [
        {
          "code": "RT",
          "label": "Respiratory Therapist",
          "weekly_staff": 1535,
          "weekly_travel_est": 2559,
          "is_verified": true,
          "surplus_weekly": 2266,
          "gross_survival_pct": 88
        }
      ]
    }
  ],
  "sources": {
    "housing": "HUD FMR FY2026",
    "pay": "BLS OES May 2024",
    "methodology": "Staff median × verified multiplier"
  }
}
```

---

## Phase 3: UI — State Market Page (Week 3)

### Route: `/market/us/[state]`

(Already exists — extend it)

### Design (Ive aesthetic, neutral)

```
MARKET INTELLIGENCE

Washington

HOUSING COST
$1,268 / mo
HUD Fair Market Rent, 1BR

────────────────────

WEEKLY PAY BY SPECIALTY

RT          $2,559      verified
RN          $2,437      est.
PT          $2,720      est.
OT          $2,594      est.
Surg Tech   $1,304      verified

────────────────────

SURPLUS AFTER HOUSING

[bar chart — each specialty shows gross vs rent]

RT  ████████████████████████░░░  88%
RN  ██████████████████████░░░░░  82%
PT  ████████████████████████░░░  89%
CST ██████████████████░░░░░░░░░  61%

────────────────────

Sources
Pay data: Bureau of Labor Statistics, OES May 2024.
Housing: U.S. Department of Housing and Urban Development, FMR FY2026.
Verified rates sourced from anonymized traveler-reported contracts.
```

### Key rules

1. **No agency names** — ever
2. **No facility names** — state level only
3. **"Verified" vs "Estimated"** — clearly labeled, never mixed
4. **Neutral tone** — reads like a federal data report, not a sales tool
5. **All sources cited** — BLS, HUD, GSA with fiscal year
6. **No advice** — just data. The user draws their own conclusions.

---

## Phase 4: National Comparison (Week 4)

### Route: `/market` (already exists — extend)

### Features

1. **State ranking table**: sortable by surplus, rent, pay
2. **Specialty selector**: filter the whole view by RN, RT, PT, etc.
3. **Top 5 / Bottom 5**: auto-highlight best and worst ROI states
4. **Heat map** (stretch): color-code US map by gross survival %

### Data story

- "The top 5 states for [RN] gross survival are..."
- "States where housing consumes more than 40% of gross pay..."
- Zero editorial — let the data tell the story

---

## Phase 5: Verified Data Collection (Ongoing)

### Strategy

1. Every contract that flows through the calculator → anonymous aggregate
2. User-submitted "rate reports" (post-MVP)
3. Convert gray "est." bars to black "verified" bars over time
4. Goal: 80% verified coverage within 6 months

### Privacy

- No PII stored in market tables
- Minimum 3 data points per state/specialty before showing "verified"
- Aggregate only — no individual contract visible

---

## What NOT to build

- ~~Agency comparisons~~ — never
- ~~Facility rankings~~ — too specific, liability risk
- ~~Bill rate data~~ — agency-side, not traveler-facing
- ~~Margin analysis~~ — interesting but inflammatory
- ~~Advice/recommendations~~ — data only, no "you should go to X"

---

## Success metrics

1. **Organic search**: "travel nurse pay [state]" → market page ranks
2. **Time on page**: >60s (users are studying the data)
3. **Calculator conversions**: market page → calculator start rate
4. **Data coverage**: % of states with verified rates

---

## Current verified data points

| Specialty | State | Weekly Travel | Source | Date |
|-----------|-------|--------------|--------|------|
| RRT       | WA    | $2,559       | Contract (×2) | Feb 2026 |
| Surg Tech | CA    | $1,304       | Job board avg (11 listings) | Feb 2026 |

**Next priority: Collect RN, PT, OT verified rates.**
