# PerDiem.fyi — Gameplan

## Thesis

Every decision in travel healthcare is made without housing cost data.
Housing is the second biggest factor in the process.
That's the gap.

## The Chain

```
Hospital → pays bill rate → Agency → sets pay package → Recruiter presents it → Nurse evaluates it
```

- **Agency** sets bill rate, margin, stipend split, insurance. Prices the stipend off **policy ceilings** (GSA lodging limits, internal caps, margin constraints) — not off observed market rent. Their housing input is a proxy, not a market signal.
- **Recruiter** works for the agency. Presents the package. Zero pricing authority. Uses housing data to advise and steer.
- **Nurse** evaluates the offer against where they'll actually live.

## The Blind Spot

| Actor | What They Know | What They Don't Know |
|---|---|---|
| Agency | Bill rate, margin, stipend structure, compliance. Prices stipend off GSA policy ceilings and internal caps. | What furnished short-term housing actually costs. Their "housing" number is derived from policy, not from observed rent. It doesn't track real rent volatility. |
| Recruiter | The package, nurse preferences, anecdotal market sense | Actual housing cost data to advise with |
| Nurse | Their gross offer, what they paid LAST time | What housing costs at the NEW location |

Housing is the #2 factor. Nobody has the data. Every decision is made blind.
The agency's housing input is a policy proxy. The real market number doesn't exist in the workflow.

## What PerDiem Is

**The housing cost data layer for travel healthcare.**

Not a calculator. Not a job board. The data that's missing from every decision in the chain.

## Core Concepts (Must Stay Separate in UI)

| Concept | What It Is | Source | Nature |
|---|---|---|---|
| **Stipend Policy Max** | The ceiling the agency can pay tax-free, derived from GSA rules | GSA per diem rates (FY2026, 297 localities) | **Hard cap** — federal policy, not negotiable |
| **Travel Rent Estimate** | What furnished short-term housing actually costs for a 13-week stay | HUD FMR × furnished multiplier band (1.20 / 1.35 / 1.50) | **Soft estimate** — market signal, presented as a range |
| **Spread** | Policy max minus travel rent estimate | Derived | **Decision output** — the routing metric |

The product edge: show policy max alongside estimated travel rent. The spread becomes an actionable routing metric. Recruiters stop negotiating a single offer and start selecting geography.

## The Hero Number

```
GROSS WEEKLY PAY − TRAVEL RENT ESTIMATE = WHAT YOU KEEP
```

Travel Rent Estimate is a **band, not a point:**

```
Estimated 13-week housing cost for ZIP 07030:
  Budget:    $1,740/mo  (HUD FMR × 1.20)
  Mid-range: $1,958/mo  (HUD FMR × 1.35)
  Furnished: $2,175/mo  (HUD FMR × 1.50)
```

Never show a single rent number without context. Always a band with labeled tiers.

## How Each Persona Uses It

| Persona | How They Use PerDiem | Example |
|---|---|---|
| **Nurse** | Evaluate: "Is this offer good for THIS location?" | Plugs in ZIP → sees gross vs housing cost |
| **Recruiter** | Advise: "Stipends here are higher and cost of living is lower — this is where you maximize" | Steers nurse toward best-spread markets. Both sides win. |
| **Agency** | Price: inform stipend construction with actual housing data | Uses market data to set competitive packages (would never build this publicly themselves) |

## The Recruiter Use Case (Corrected)

Recruiters don't say: *"Your stipend is 82.6% of GSA max."*

Recruiters say: *"Stipends in Boise are higher than Portland and cost of living is actually lower — this is where you'd maximize."*

That's advisory, not defensive. Benefits both sides:

- Nurse keeps more money
- Recruiter fills the assignment

## Why Nobody Else Will Build This

| Potential Competitor | Why They Won't |
|---|---|
| Agencies (Aya, Trusted, Host) | Would reveal margin structure. They'll use the data, never publish it. |
| Job boards (Vivian, Wanderly) | Index jobs, not housing. Orthogonal to their model. |
| Zillow / Apartments.com | Have rent data but zero understanding of stipends, GSA, or 13-week contracts. |
| GSA.gov / HUD.gov | Publish raw data. Will never build a product. |

PerDiem sits in the gap between all of these.

## The Two Product Modes

| Mode | User | Question |
|---|---|---|
| **Evaluate** | Nurse with offer in hand | "Is this specific offer good for this location?" |
| **Explore** | Nurse shopping / Recruiter advising | "Where's the best spread?" |

Both need the same data: GSA rates + housing cost. Single-ZIP vs. cross-market.

## The Spread Metric

```
SPREAD = Stipend Policy Max − (Travel Rent Estimate / 4.33)
```

Computed at three sensitivity tiers:

```
Spread (budget):    Policy Max − (HUD × 1.20 / 4.33)
Spread (mid-range): Policy Max − (HUD × 1.35 / 4.33)
Spread (furnished): Policy Max − (HUD × 1.50 / 4.33)
```

Markets ranked by spread = the recruiter's advisory tool.
High policy max + low travel rent = best spread for the nurse.

The spread is the routing metric. It answers: *"Where do I keep the most money after housing?"*

## Data Priority

| # | What | Current | Target | Why |
|---|---|---|---|---|
| P0 | HUD FMR coverage | 36 metros | 800+ counties | Baseline for Travel Rent Estimate band. Everything downstream is blocked. |
| P1 | Furnished multiplier band | None | Three tiers: 1.20 / 1.35 / 1.50 | HUD FMR is unfurnished long-term. Travel nurses pay furnished short-term. Show as a sensitivity band, not a point. |
| P2 | Observed rent source | None | Scraped or partner data (Furnished Finder, Airbnb, etc.) | Tightens the band and increases trust. HUD stays baseline; observed rent calibrates. |
| P3 | Crowdsourced actuals via `pay_reports` | 0 rows | Growing | What nurses actually paid. Proprietary data. Over time replaces estimates. |
| P4 | Market pages ranked by spread | State pages exist, no spread | Spread-ranked localities at 3 tiers | The URL the recruiter texts to the nurse. |

## Monetization Path

| Phase | Audience | Model |
|---|---|---|
| Phase 1 | Nurses | Free. SEO traffic. Build trust. |
| Phase 2 | Recruiters | Free. Organic. They share links — zero CAC growth loop. |
| Phase 3 | Agencies | Paid API / data feed. Housing cost by ZIP for package pricing. |

## Moat Over Time

```
Year 1: Federal data (GSA + HUD) — public but unassembled
Year 2: Crowdsourced actuals — "What did a travel nurse actually pay in ZIP X for 13 weeks?"
Year 3: Proprietary housing cost data for travel healthcare — nobody else collects this
```

## One Rule

Same data, same truth, all personas. Never gate information or show different views. The moment transparency breaks, the product is dead.

## UI Language Rules

1. **Never call the housing number "rent."** Call it "Travel Rent Estimate" — it's a band, not a fact.
2. **Never show a single housing number.** Always three tiers (budget / mid-range / furnished).
3. **Always label the GSA number as a policy ceiling.** "Stipend Policy Max (GSA FY2026)" — not "what you should get."
4. **Spread is a decision output.** Show it after both inputs are visible. Never lead with spread alone.
5. **Source everything.** Every number gets a footnote: HUD FMR FY20XX, GSA Per Diem FY20XX, or "Reported by N nurses."

## Confidence

```json
{
  "confidence": 0.88,
  "assumptions": [
    "Agency package construction is constrained primarily by bill rate, margin, taxable minimums, and GSA rules",
    "Agency-side housing inputs are not continuously updated from furnished short-term market comps"
  ],
  "verdict": "proceed",
  "gaps": [
    "Lock the housing estimate multiplier and publish a sensitivity band",
    "Add an observed-rent dataset to replace or calibrate HUD-only estimates",
    "Finalize copy that explicitly separates policy max vs market estimate"
  ]
}
```

---

*Sourced from nurse conversations, Feb 2025.*
*Corrected framing: agencies price off policy ceilings, not observed rent.*
*No code changes. Gameplan only.*
