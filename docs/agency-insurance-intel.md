# Agency Insurance Intel — Proposed Database Seed
>
> **Status:** AWAITING APPROVAL  
> **Last Updated:** 2026-02-25  
> **Sources:** Agency websites, Reddit r/TravelNursing, Vivian, AllNurses, ExplainMyBenefits

---

## 1. Proposed Table: `agency_insurance_intel`

```sql
CREATE TABLE agency_insurance_intel (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_name   TEXT NOT NULL UNIQUE,       -- matches AGENCY_CHIPS in calculator
  day_one       BOOLEAN NOT NULL,           -- true = benefits start day 1
  waiting_days  INT DEFAULT 0,              -- days before full coverage activates (0 = day 1)
  bridge_days   INT DEFAULT 0,              -- max gap days with continued coverage
  bridge_condition TEXT,                    -- e.g. "next contract must be signed before current ends"
  weekly_cost_single_low   NUMERIC(6,2),   -- lowest weekly premium (single, base plan)
  weekly_cost_single_high  NUMERIC(6,2),   -- highest weekly premium (single, buy-up plan)
  network_type  TEXT,                       -- 'PPO', 'HMO', 'HDHP', or carrier name
  carrier       TEXT,                       -- e.g. 'Cigna', 'Aetna', 'Anthem', 'UHC'
  dental_vision BOOLEAN DEFAULT TRUE,       -- includes dental + vision
  opt_out_weekly_est NUMERIC(6,2),         -- estimated weekly pay increase if declining insurance
  data_year     INT NOT NULL,               -- year the data was sourced/verified
  confidence    TEXT NOT NULL DEFAULT 'medium', -- 'high', 'medium', 'low'
  source_urls   TEXT[],                     -- citation URLs
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 2. Proposed Seed Data (10 Agencies)

### AMN Healthcare

| Field | Value |
|---|---|
| `agency_name` | AMN |
| `day_one` | **false** |
| `waiting_days` | **30** (preventative plan: 7–14 days; full PPO: up to 30 days) |
| `bridge_days` | **25** |
| `bridge_condition` | Next assignment must begin within 25 days of last (per 2025 Benefits Guide) |
| `weekly_cost_single_low` | — (not published) |
| `weekly_cost_single_high` | — (not published) |
| `network_type` | Consumer Choice (HDHP), PPO, Preventative |
| `carrier` | Not confirmed publicly |
| `dental_vision` | true |
| `opt_out_weekly_est` | — (not published) |
| `data_year` | 2025 |
| `confidence` | **medium** |
| `sources` | amnhealthcare.com, reddit.com, indeed.com, scribd.com (2025 Benefits Guide) |
| `notes` | Only agency with a confirmed waiting period. Preventative tier is free and faster to activate. Full PPO has a 30-day wait, which is a significant disadvantage for short (8-week) contracts. |

---

### Aya Healthcare

| Field | Value |
|---|---|
| `agency_name` | Aya |
| `day_one` | **true** |
| `waiting_days` | 0 |
| `bridge_days` | **0** |
| `bridge_condition` | No bridge. Recruiter may extend 1–2 weeks at discretion if next Aya contract is signed. Not guaranteed. |
| `weekly_cost_single_low` | **$17** (Aetna PPO base, 2021 data) |
| `weekly_cost_single_high` | **$150** (recent Reddit reports, 2023–2024) |
| `network_type` | PPO |
| `carrier` | **Aetna** |
| `dental_vision` | true |
| `opt_out_weekly_est` | **~$150** (implicit — pay quote is ~$150/wk higher without insurance) |
| `data_year` | 2024 |
| `confidence` | **high** |
| `sources` | ayahealthcare.com, reddit.com (multiple threads), travelingwithjuls.com, scribd.com |
| `notes` | Most expensive insurance among major agencies. Cost is not itemized on paystubs — recruiters quote two pay rates (with/without). No automatic gap bridge is the #1 complaint on Reddit. |

---

### Cross Country

| Field | Value |
|---|---|
| `agency_name` | Cross Country |
| `day_one` | **true** |
| `waiting_days` | 0 |
| `bridge_days` | **~28** (historical, unconfirmed for 2024+) |
| `bridge_condition` | Next contract must be signed. Some nurses report first-of-month cutoffs creating unexpected gaps. |
| `weekly_cost_single_low` | — (not published) |
| `weekly_cost_single_high` | — (not published) |
| `network_type` | Multiple options |
| `carrier` | Not confirmed publicly |
| `dental_vision` | true |
| `opt_out_weekly_est` | — (not published) |
| `data_year` | 2024 |
| `confidence` | **low** |
| `sources` | crosscountry.com, allnurses.com, reddit.com (2019 thread) |
| `notes` | The 28-day gap claim comes from a single 2019 Reddit thread. Cross Country's official site does not publish bridge terms. Recruiter-dependent. Needs direct verification. |

---

### Fastaff

| Field | Value |
|---|---|
| `agency_name` | Fastaff |
| `day_one` | **true** |
| `waiting_days` | 0 |
| `bridge_days` | **0** |
| `bridge_condition` | Employee handbook states employment ends when assignment ends. No bridge. |
| `weekly_cost_single_low` | — (not published) |
| `weekly_cost_single_high` | — (not published) |
| `network_type` | Not confirmed |
| `carrier` | Not confirmed |
| `dental_vision` | true |
| `opt_out_weekly_est` | — (not published) |
| `data_year` | 2024 |
| `confidence` | **medium** |
| `sources` | fastaff.com (employee handbook), faststafftravelnursing.com |
| `notes` | Rapid-response/crisis agency. High pay rates likely offset the lack of gap coverage. Handbook language is explicit: "employment is completed once assignment ends." |

---

### FlexCare

| Field | Value |
|---|---|
| `agency_name` | FlexCare |
| `day_one` | **true** |
| `waiting_days` | 0 |
| `bridge_days` | **30** |
| `bridge_condition` | Must remain active with the agency and meet eligibility requirements |
| `weekly_cost_single_low` | **~$45** (industry estimate) |
| `weekly_cost_single_high` | **~$75** (industry estimate) |
| `network_type` | Not confirmed |
| `carrier` | Not confirmed |
| `dental_vision` | true |
| `opt_out_weekly_est` | — (not published) |
| `data_year` | 2024 |
| `confidence` | **medium** |
| `sources` | flexcarestaff.com, nomadicare.com (industry-wide cost estimate) |
| `notes` | Weekly cost figures are industry estimates from nomadicare.com, not FlexCare-specific. Bridge policy is from their official FAQ. |

---

### Host Healthcare

| Field | Value |
|---|---|
| `agency_name` | Host |
| `day_one` | **true** |
| `waiting_days` | 0 |
| `bridge_days` | **30** |
| `bridge_condition` | Assignments must be less than 30 days apart. Officially published on hosthealthcare.com. |
| `weekly_cost_single_low` | — (not published) |
| `weekly_cost_single_high` | — (not published) |
| `network_type` | Not confirmed |
| `carrier` | Not confirmed |
| `dental_vision` | true |
| `opt_out_weekly_est` | — (not published) |
| `data_year` | 2025 |
| `confidence` | **high** |
| `sources` | hosthealthcare.com/benefits (primary source) |
| `notes` | One of the clearest and most nurse-friendly bridge policies. Explicitly states "less than 30 days apart" on their official benefits page. Also offers 401k matching, free CEUs, and $1,000–$2,000 referral bonuses. |

---

### Medical Solutions

| Field | Value |
|---|---|
| `agency_name` | Medical Solutions |
| `day_one` | **true** |
| `waiting_days` | 0 (retroactive to start date if enrolled within 14 days) |
| `bridge_days` | **0** |
| `bridge_condition` | No bridge. Coverage ends when assignment ends. Offers voluntary gap protection products (disability, critical illness, accident) but not medical continuity. |
| `weekly_cost_single_low` | **$10** |
| `weekly_cost_single_high` | **$21** |
| `network_type` | PPO |
| `carrier` | **Cigna** |
| `dental_vision` | true |
| `opt_out_weekly_est` | — (not published) |
| `data_year` | 2024 |
| `confidence` | **high** |
| `sources` | medicalsolutions.com (multiple pages, primary source) |
| `notes` | Cheapest published insurance in the industry ($10–21/wk). Excellent for on-assignment coverage. Zero gap coverage is the tradeoff. They market "gap protection" but these are supplemental products (accident/disability), NOT medical insurance continuation. |

---

### Nomad Health

| Field | Value |
|---|---|
| `agency_name` | Nomad |
| `day_one` | **true** |
| `waiting_days` | 0 |
| `bridge_days` | **14** |
| `bridge_condition` | Next Nomad assignment must begin within 14 days of previous ending |
| `weekly_cost_single_low` | — (not published, offers low/high premium tiers) |
| `weekly_cost_single_high` | — (not published) |
| `network_type` | PPO |
| `carrier` | **Anthem / UnitedHealthcare** |
| `dental_vision` | true |
| `opt_out_weekly_est` | — (not published) |
| `data_year` | 2024 |
| `confidence` | **high** |
| `sources` | nomadhealth.com (primary source, multiple pages) |
| `notes` | Tech-forward marketplace model. 14-day bridge is shorter than Host/TNAA/FlexCare (30 days) but better than Aya/Fastaff (0 days). Anthem/UHC network can be state-restrictive in some markets — less portable than Cigna PPOs. |

---

### TNAA (Travel Nurse Across America)

| Field | Value |
|---|---|
| `agency_name` | TNAA |
| `day_one` | **true** |
| `waiting_days` | 0 |
| `bridge_days` | **30** |
| `bridge_condition` | Next TNAA assignment must be booked before current assignment ends, and must start within 30 days |
| `weekly_cost_single_low` | **$0** (PPO Base, 2018 data — $3,000 deductible) |
| `weekly_cost_single_high` | **$19** (PPO Buy-Up, 2018 data — $1,000 deductible) |
| `network_type` | PPO (Base + Buy-Up tiers), HDHP, HSA |
| `carrier` | **Cigna** |
| `dental_vision` | true |
| `opt_out_weekly_est` | — (not published) |
| `data_year` | 2024 (bridge policy); 2018 (pricing — likely higher now) |
| `confidence` | **high** (bridge policy); **low** (pricing) |
| `sources` | tnaa.com (multiple pages), explainmybenefits.com (2018 guide) |
| `notes` | Best-in-class combination: $0/wk base plan + 30-day bridge + Cigna PPO. Pricing is from 2018 and almost certainly higher now, but TNAA states they negotiate to keep premiums "below the national average." The $0 base plan had a $3,000 deductible, which is standard for HDHPs. Reddit sentiment is overwhelmingly positive about TNAA insurance. |

---

### Trusted Health

| Field | Value |
|---|---|
| `agency_name` | Trusted |
| `day_one` | **true** |
| `waiting_days` | 0 |
| `bridge_days` | **30** |
| `bridge_condition` | Tiered: ≤7 days = auto-continue; same month = active; ≤30 days = active through end of month. Pre-pay option available. |
| `weekly_cost_single_low` | — (not published) |
| `weekly_cost_single_high` | — (not published) |
| `network_type` | PPO |
| `carrier` | **Cigna** |
| `dental_vision` | true |
| `opt_out_weekly_est` | — (not published) |
| `data_year` | 2025 |
| `confidence` | **high** |
| `sources` | trustedhealth.com (primary source, multiple pages including FAQ) |
| `notes` | Most transparent bridge policy in the industry. Three tiers (≤7d auto, same-month, ≤30d with pre-pay) give nurses maximum flexibility. Also committed to providing a month of coverage if the next assignment is with Trusted. Cigna PPO provides nationwide portability. |

---

## 3. Summary Ranking (by insurance value to the clinician)

| Rank | Agency | Bridge | Cost/wk | Day 1 | Overall Grade |
|---|---|---|---|---|---|
| 🥇 | **TNAA** | 30 days | $0–$19 (2018) | ✅ | **A+** |
| 🥈 | **Trusted** | 30 days (tiered) | Unknown | ✅ | **A** |
| 🥉 | **Host** | 30 days | Unknown | ✅ | **A** |
| 4 | **FlexCare** | 30 days | ~$45–75 | ✅ | **A−** |
| 5 | **Medical Solutions** | 0 days | $10–21 | ✅ | **B+** (cheapest, no bridge) |
| 6 | **AMN** | 25 days | Unknown | ⚠️ 30-day wait | **B** |
| 7 | **Nomad** | 14 days | Unknown | ✅ | **B** |
| 8 | **Cross Country** | ~28 days (unverified) | Unknown | ✅ | **B−** |
| 9 | **Aya** | 0 days | $17–150 | ✅ | **C+** (expensive, no bridge) |
| 10 | **Fastaff** | 0 days | Unknown | ✅ | **C** (crisis agency, high pay offsets) |

---

## 4. Data Gaps Requiring Crowdsourced Verification

These fields have `NULL` values that could be filled by user submissions in future versions of the calculator:

| Agency | Missing Data |
|---|---|
| AMN | Weekly cost, carrier, opt-out amount |
| Cross Country | Weekly cost, carrier, actual bridge days, opt-out amount |
| Fastaff | Weekly cost, carrier, opt-out amount |
| FlexCare | Carrier, exact weekly cost (only industry estimate) |
| Host | Weekly cost, carrier, opt-out amount |
| Nomad | Weekly cost, opt-out amount |
| TNAA | **Current** weekly cost (2018 data is stale) |
| Trusted | Weekly cost, opt-out amount |

---

## 5. Approval Checklist

- [ ] Schema looks correct
- [ ] Seed data is accurate enough to ship
- [ ] Confidence ratings are acceptable (some `low` fields present)
- [ ] Agency names match `AGENCY_CHIPS` in calculator (`AMN`, `Aya`, `Cross Country`, `Fastaff`, `FlexCare`, `Host`, `Medical Solutions`, `Nomad`, `TNAA`, `Trusted`)
- [ ] Ready to run SQL migration
