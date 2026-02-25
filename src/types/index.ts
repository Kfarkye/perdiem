// ━━━ PERDIEM.FYI TYPE DEFINITIONS ━━━

// ── Database Row Types ──

export interface GsaRate {
    id: string;
    fiscal_year: number;
    state: string;
    city: string;
    county: string;
    destination_id: string | null;
    oct: number | null;
    nov: number | null;
    dec_: number | null;
    jan: number | null;
    feb: number | null;
    mar: number | null;
    apr: number | null;
    may: number | null;
    jun: number | null;
    jul: number | null;
    aug: number | null;
    sep: number | null;
    meals_daily: number;
    max_lodging: number;
    created_at: string;
}

export interface ZipCountyCrosswalk {
    zip: string;
    county: string;
    state: string;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
    created_at: string;
}

export interface HudFmr {
    id: string;
    fiscal_year: number;
    zip: string;
    state: string;
    county: string | null;
    metro_area: string | null;
    fmr_studio: number | null;
    fmr_1br: number | null;
    fmr_2br: number | null;
    fmr_3br: number | null;
    fmr_4br: number | null;
    created_at: string;
}

export interface Facility {
    id: string;
    name: string;
    npi: string | null;
    address: string | null;
    city: string;
    state: string;
    zip: string;
    county: string | null;
    facility_type: string | null;
    bed_count: number | null;
    latitude: number | null;
    longitude: number | null;
    cms_certification_number: string | null;
    created_at: string;
}

export interface PayReport {
    id: string;
    zip: string;
    state: string;
    county: string | null;
    city: string | null;
    specialty: string;
    weekly_gross: number;
    hours_per_week: number;
    agency_name: string | null;
    facility_name: string | null;
    stipend_weekly: number | null;
    taxable_hourly: number | null;
    contract_length_weeks: number;
    is_local: boolean;
    source: string;
    session_id: string | null;
    ip_hash: string | null;
    created_at: string;
}

export interface MarketSnapshot {
    id: string;
    state: string;
    county: string;
    city: string | null;
    specialty: string;
    gsa_fiscal_year: number | null;
    gsa_lodging_daily: number | null;
    gsa_meals_daily: number | null;
    gsa_weekly_total: number | null;
    gsa_monthly_total: number | null;
    housing_studio_avg: number | null;
    housing_1br_avg: number | null;
    housing_2br_avg: number | null;
    housing_1br_median: number | null;
    housing_listings_count: number | null;
    pay_weekly_median: number | null;
    pay_weekly_p25: number | null;
    pay_weekly_p75: number | null;
    pay_report_count: number;
    agency_count: number;
    stipend_surplus_monthly: number | null;
    snapshot_date: string;
    created_at: string;
}

// ── Calculator Types ──

export interface LocationData {
    zip: string;
    city: string;
    county: string;
    state: string;
    latitude?: number;
    longitude?: number;
}

export interface GsaData {
    fiscal_year: number;
    lodging_daily: number;
    meals_daily: number;
    weekly_max: number;
    monthly_max: number;
    city?: string;
    county?: string;
}

export interface PayBreakdown {
    weekly_gross: number;
    hours: number;
    stipend_weekly: number;
    taxable_weekly: number;
    taxable_hourly: number;
    tax_estimate_weekly: number;
    net_weekly: number;
}

export interface HousingData {
    hud_fmr_1br: number;
    stipend_monthly_est: number;
    stipend_surplus_monthly: number;
}

export interface NegotiationBandData {
    pct_70: number;
    pct_80: number;
    pct_95: number;
    pct_100: number;
    your_stipend: number;
    pct_of_max: number;
}

export interface ContractProjection {
    weeks: number;
    gross: number;
    net_estimate: number;
    tax_free_total: number;
}

export interface AgencyComparison {
    name: string;
    avg_weekly: number;
    report_count: number;
    stipend_pct: number;
}

export interface CalculatorResult {
    location: LocationData;
    gsa: GsaData;
    breakdown: PayBreakdown;
    housing: HousingData;
    negotiation: NegotiationBandData;
    contract_13wk: ContractProjection;
    agencies: AgencyComparison[];
}

// ── Market Page Types ──

export interface MarketPageData {
    location: {
        state: string;
        state_name: string;
        county: string;
        city: string;
        slug: string;
    };
    specialty: string;
    gsa: GsaData;
    housing: {
        studio_avg: number | null;
        one_bed_avg: number | null;
        two_bed_avg: number | null;
        one_bed_median: number | null;
        listings_count: number | null;
    };
    pay: {
        weekly_median: number | null;
        weekly_p25: number | null;
        weekly_p75: number | null;
        report_count: number;
    };
    agencies: AgencyComparison[];
    facilities: Pick<Facility, "name" | "city" | "facility_type" | "bed_count">[];
    stipend_surplus_monthly: number | null;
    snapshot_date: string;
}

// ── API Response Types ──

export interface LookupStipendRequest {
    zip: string;
    weekly_gross: number;
    hours?: number;
}

export interface LookupStipendResponse {
    location: LocationData;
    gsa: GsaData;
    breakdown: PayBreakdown;
    housing: HousingData;
    negotiation: NegotiationBandData;
    contract_13wk: ContractProjection;
}

// ── Theme ──

export interface ThemeTokens {
    readonly bg: string;
    readonly surface: string;
    readonly surfaceRaised: string;
    readonly surfaceInset: string;
    readonly border: string;
    readonly borderSubtle: string;
    readonly borderFocus: string;
    readonly text: string;
    readonly textSecondary: string;
    readonly textTertiary: string;
    readonly primary: string;
    readonly primaryHover: string;
    readonly primaryMuted: string;
    readonly primaryBorder: string;
    readonly moneyPositive: string;
    readonly moneyPositiveBg: string;
    readonly moneyNegative: string;
    readonly moneyNegativeBg: string;
    readonly accent: string;
    readonly accentMuted: string;
    readonly accentBorder: string;
    readonly info: string;
    readonly infoBg: string;
}
