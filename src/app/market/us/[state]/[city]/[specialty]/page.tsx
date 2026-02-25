export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { STATE_NAMES, slugify } from "@/lib/gsa";
import { deriveGsaTotals } from "@/lib/financials";
import { generateAllStructuredData } from "@/lib/structured-data";
import MarketPageComponent from "@/components/market-page";
import type { MarketPageData, AgencyComparison } from "@/types";

interface SpecialtyPageProps {
  params: Promise<{ state: string; city: string; specialty: string }>;
}

async function getMarketData(
  state: string,
  citySlug: string,
  specialtySlug: string,
): Promise<MarketPageData | null> {
  const stateUpper = state.toUpperCase();
  const stateName = STATE_NAMES[stateUpper];
  if (!stateName) return null;

  const cityName = citySlug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const specialtyName = specialtySlug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  // Fetch snapshot
  const { data: snapshot } = await supabase
    .from("market_snapshots")
    .select("*")
    .eq("state", stateUpper)
    .or(`city.ilike.%${cityName}%,county.ilike.%${cityName}%`)
    .ilike("specialty", specialtyName)
    .single();

  if (!snapshot) return null;

  // Fetch agency comparison
  const { data: agencies } = await supabase
    .from("pay_reports")
    .select("agency_name, weekly_gross")
    .eq("state", stateUpper)
    .or(`city.ilike.%${cityName}%,county.ilike.%${cityName}%`)
    .ilike("specialty", specialtyName)
    .not("agency_name", "is", null);

  // Aggregate agencies
  const agencyMap = new Map<
    string,
    { total: number; count: number; stipends: number[] }
  >();
  for (const r of agencies ?? []) {
    if (!r.agency_name) continue;
    const existing = agencyMap.get(r.agency_name) ?? {
      total: 0,
      count: 0,
      stipends: [],
    };
    existing.total += r.weekly_gross;
    existing.count++;
    agencyMap.set(r.agency_name, existing);
  }

  const gsaWeekly = snapshot.gsa_weekly_total ?? 0;
  const agencyList: AgencyComparison[] = Array.from(agencyMap.entries())
    .map(([name, agg]) => {
      const avgWeekly = Math.round(agg.total / agg.count);
      return {
        name,
        avg_weekly: avgWeekly,
        report_count: agg.count,
        stipend_pct:
          gsaWeekly > 0 ? Math.round((avgWeekly / gsaWeekly) * 100) : 0,
      };
    })
    .sort((a, b) => b.report_count - a.report_count)
    .slice(0, 10);

  // Fetch facilities
  const { data: facilities } = await supabase
    .from("facilities")
    .select("name, city, facility_type, bed_count")
    .eq("state", stateUpper)
    .or(`city.ilike.%${cityName}%,county.ilike.%${cityName}%`)
    .limit(6);

  const gsa = deriveGsaTotals(
    snapshot.gsa_lodging_daily ?? 0,
    snapshot.gsa_meals_daily ?? 0,
    snapshot.gsa_fiscal_year ?? 2026,
  );

  return {
    location: {
      state: stateUpper,
      state_name: stateName,
      county: snapshot.county,
      city: snapshot.city ?? snapshot.county,
      slug: citySlug,
    },
    specialty: specialtyName,
    gsa,
    housing: {
      studio_avg: snapshot.housing_studio_avg,
      one_bed_avg: snapshot.housing_1br_avg,
      two_bed_avg: snapshot.housing_2br_avg,
      one_bed_median: snapshot.housing_1br_median,
      listings_count: snapshot.housing_listings_count,
    },
    pay: {
      weekly_median: snapshot.pay_weekly_median,
      weekly_p25: snapshot.pay_weekly_p25,
      weekly_p75: snapshot.pay_weekly_p75,
      report_count: snapshot.pay_report_count ?? 0,
    },
    agencies: agencyList,
    facilities: facilities ?? [],
    stipend_surplus_monthly: snapshot.stipend_surplus_monthly,
    snapshot_date: snapshot.snapshot_date,
  };
}

export async function generateMetadata({
  params,
}: SpecialtyPageProps): Promise<Metadata> {
  const { state, city, specialty } = await params;
  const data = await getMarketData(state, city, specialty);
  if (!data) return {};

  return {
    title: `${data.specialty} Pay in ${data.location.city}, ${data.location.state} — What You Should Actually Make | PerDiem`,
    description: `${data.specialty} travel nurses in ${data.location.city} — GSA per diem: $${data.gsa.weekly_max}/week. ${data.pay.report_count > 0 ? `Median pay: $${data.pay.weekly_median}/wk from ${data.pay.report_count} nurse reports.` : "Use the calculator to see your breakdown."}`,
    openGraph: {
      title: `${data.specialty} in ${data.location.city}, ${data.location.state} · PerDiem.fyi`,
      description: `$${data.gsa.weekly_max}/wk per diem ceiling${data.pay.weekly_median ? ` · $${data.pay.weekly_median}/wk median` : ""} · ${data.pay.report_count} reports`,
    },
  };
}

export const revalidate = 3600; // ISR: revalidate every hour

export default async function SpecialtyPage({ params }: SpecialtyPageProps) {
  const { state, city, specialty } = await params;
  const data = await getMarketData(state, city, specialty);
  if (!data) notFound();

  const structuredData = generateAllStructuredData(data);

  return (
    <>
      {structuredData.map((json, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: json }}
        />
      ))}
      <MarketPageComponent data={data} />
    </>
  );
}
