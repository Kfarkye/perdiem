// ━━━ FINANCIAL CALCULATIONS UNIT TESTS ━━━
// PROOF: Validates MONEY risk — per diem math, tax estimates, net take-home.
// Run: npx tsx src/lib/__tests__/financials.test.ts

import {
    deriveGsaTotals,
    derivePayBreakdown,
    deriveHousingData,
    deriveNegotiationBands,
    deriveContractProjection,
    deriveFinancials,
} from "../financials";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
    if (condition) {
        passed++;
        console.log(`  ✓ ${message}`);
    } else {
        failed++;
        console.error(`  ✗ FAIL: ${message}`);
    }
}

function assertEq(actual: number, expected: number, message: string) {
    if (actual === expected) {
        passed++;
        console.log(`  ✓ ${message}: ${actual}`);
    } else {
        failed++;
        console.error(`  ✗ FAIL: ${message}: expected ${expected}, got ${actual}`);
    }
}

// ━━━ TEST: GSA Totals ━━━
console.log("\n🧮 GSA Totals");
{
    const gsa = deriveGsaTotals(156, 86, 2026);
    assertEq(gsa.weekly_max, 1694, "weekly_max = (156+86)*7");
    assertEq(gsa.monthly_max, 7260, "monthly_max = (156+86)*30");
    assertEq(gsa.fiscal_year, 2026, "fiscal_year passthrough");
    assertEq(gsa.lodging_daily, 156, "lodging_daily passthrough");
    assertEq(gsa.meals_daily, 86, "meals_daily passthrough");
}

// ━━━ TEST: Pay Breakdown ━━━
console.log("\n💰 Pay Breakdown");
{
    const b = derivePayBreakdown(2500, 1694, 36);
    assertEq(b.weekly_gross, 2500, "weekly_gross");
    assertEq(b.stipend_weekly, 1694, "stipend_weekly = min(gross, gsa)");
    assertEq(b.taxable_weekly, 806, "taxable_weekly = 2500 - 1694");
    assertEq(b.taxable_hourly, 22.39, "taxable_hourly = 806/36");
    assertEq(b.tax_estimate_weekly, 161.2, "tax_estimate = 806 * 0.20");
    assertEq(b.net_weekly, 2338.8, "net_weekly = 2500 - 161.2");
}

// ━━━ TEST: Gross below GSA ceiling ━━━
console.log("\n💰 Gross Below GSA");
{
    const b = derivePayBreakdown(1500, 1694, 36);
    assertEq(b.stipend_weekly, 1500, "stipend capped at gross");
    assertEq(b.taxable_weekly, 0, "no taxable when gross < GSA");
    assertEq(b.tax_estimate_weekly, 0, "no tax when no taxable");
    assertEq(b.net_weekly, 1500, "net = gross when fully tax-free");
}

// ━━━ TEST: Housing Data ━━━
console.log("\n🏠 Housing Data");
{
    const h = deriveHousingData(156, 86, 2140);
    assertEq(h.hud_fmr_1br, 2140, "HUD FMR passthrough");
    assertEq(h.stipend_surplus_monthly, 5120, "surplus = (156+86)*30 - 2140");
}

// ━━━ TEST: Negative surplus ━━━
console.log("\n🏠 Housing Negative Surplus");
{
    const h = deriveHousingData(100, 30, 5000);
    assertEq(h.stipend_surplus_monthly, -1100, "negative surplus when rent > stipend");
}

// ━━━ TEST: Negotiation Bands ━━━
console.log("\n📊 Negotiation Bands");
{
    const n = deriveNegotiationBands(1694, 1694);
    assertEq(n.pct_70, 1186, "70% band");
    assertEq(n.pct_80, 1355, "80% band");
    assertEq(n.pct_95, 1609, "95% band");
    assertEq(n.pct_of_max, 100, "100% of max");
}

// ━━━ TEST: Partial stipend ━━━
console.log("\n📊 Negotiation — Partial Stipend");
{
    const n = deriveNegotiationBands(1694, 1355);
    assertEq(n.pct_of_max, 80, "80% of max");
}

// ━━━ TEST: Contract Projection ━━━
console.log("\n📋 Contract Projection");
{
    const b = derivePayBreakdown(2500, 1694, 36);
    const c = deriveContractProjection(b);
    assertEq(c.weeks, 13, "13-week default");
    assertEq(c.gross, 32500, "gross = 2500 * 13");
    assertEq(c.tax_free_total, 22022, "tax_free = 1694 * 13");
    assertEq(c.net_estimate, 30404, "net = 2338.8 * 13");
}

// ━━━ TEST: Full Pipeline ━━━
console.log("\n🔗 Full Pipeline (deriveFinancials)");
{
    const result = deriveFinancials(2500, 36, 156, 86, 2026, 2140);
    assertEq(result.gsa.weekly_max, 1694, "pipeline: GSA weekly");
    assertEq(result.breakdown.net_weekly, 2338.8, "pipeline: net weekly");
    assertEq(result.housing.stipend_surplus_monthly, 5120, "pipeline: surplus");
    assertEq(result.negotiation.pct_of_max, 100, "pipeline: pct of max");
    assertEq(result.contract_13wk.net_estimate, 30404, "pipeline: contract net");
}

// ━━━ INVARIANT: net <= gross always ━━━
console.log("\n🔒 Invariants");
{
    const testCases = [
        { gross: 2500, gsa: 1694, hours: 36 },
        { gross: 1500, gsa: 1694, hours: 36 },
        { gross: 5000, gsa: 1200, hours: 48 },
        { gross: 800, gsa: 3000, hours: 24 },
        { gross: 0, gsa: 1694, hours: 36 },
    ];
    for (const tc of testCases) {
        const b = derivePayBreakdown(tc.gross, tc.gsa, tc.hours);
        assert(
            b.net_weekly <= b.weekly_gross,
            `net(${b.net_weekly}) <= gross(${b.weekly_gross})`
        );
        assert(
            b.taxable_weekly >= 0,
            `taxable(${b.taxable_weekly}) >= 0 for gross=${tc.gross}`
        );
        assert(
            b.stipend_weekly <= b.weekly_gross,
            `stipend(${b.stipend_weekly}) <= gross(${b.weekly_gross})`
        );
        assert(
            b.tax_estimate_weekly >= 0,
            `tax(${b.tax_estimate_weekly}) >= 0`
        );
    }
}

// ━━━ SUMMARY ━━━
console.log(`\n━━━ RESULTS: ${passed} passed, ${failed} failed ━━━`);
if (failed > 0) {
    process.exit(1);
}
