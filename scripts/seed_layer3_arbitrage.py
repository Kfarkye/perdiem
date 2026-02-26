import pandas as pd
import numpy as np
import random

def build_arbitrage_engine():
    print("🚀 Initiating Arbitrage Engine: Layer 3 (Pay & Margin Math)...\n")

    # ====================================================================
    # 1. LOAD YOUR EXISTING HOUSING DATA (Layers 1 & 2)
    # 👇 UNCOMMENT THE LINE BELOW WHEN USING YOUR REAL 38K ROW CSV 👇
    # df_housing = pd.read_csv('zip_housing_costs.csv', dtype={'zip_code': str})
    
    # 👇 DELETE THIS MOCK DATA BLOCK ONCE YOU UNCOMMENT THE LINE ABOVE 👇
    df_housing = pd.DataFrame({
        'zip_code': ['85202', '10001', '33101', '97213', '75201', '44101'],
        'city': ['Mesa', 'New York', 'Miami', 'Portland', 'Dallas', 'Cleveland'],
        'state': ['AZ', 'NY', 'FL', 'OR', 'TX', 'OH'],
        'gsa_monthly_stipend': [4500, 5200, 4800, 3900, 4200, 3100], 
        'zillow_observed_rent': [2100, 4800, 3400, 2200, 2300, 1400] 
    })
    # ====================================================================

    # Force strict string typing on zip codes to prevent Pandas merge crashes
    df_housing['zip_code'] = df_housing['zip_code'].astype(str).str.zfill(5)

    # 2. SYNTHESIZE ACTIVE JOB FEEDS (Layer 3 Seed)
    professions = [
        ("RN", "ICU", 2100, 2600), 
        ("Allied", "Cath Lab Tech", 2400, 3200), 
        ("RN", "MedSurg", 1800, 2300),
        ("Allied", "Rad Tech", 1900, 2400)
    ]
    
    mock_jobs = []
    for _ in range(500): 
        prof = random.choice(professions)
        is_sub_vendor = random.choice([True, False]) # Simulating the MSP Trap
        mock_jobs.append({
            "zip_code": random.choice(df_housing['zip_code'].tolist()),
            "profession": prof[0],
            "specialty": prof[1],
            "is_sub_vendor": is_sub_vendor,
            "gross_weekly_pay": round(random.uniform(prof[2], prof[3]), 2)
        })
    df_jobs = pd.DataFrame(mock_jobs)
    
    # Enforce string zip code on generated data
    df_jobs['zip_code'] = df_jobs['zip_code'].astype(str).str.zfill(5)

    # 3. MERGE THE DATA (Link the job offer to the absolute truth of the housing market)
    df_market = pd.merge(df_jobs, df_housing, on='zip_code', how='inner')

    # -----------------------------------------------------------------
    # 4. THE CLEAN ROOM MATH (State Margins + Sub-Vendor Penalty)
    # -----------------------------------------------------------------
    # Using 28% assumed baseline margin (from NY State audits)
    BASELINE_MARGIN = 0.28 
    
    # Sub-Vendor Penalty: MSP skims an extra 4% off the top if the nurse uses an outside agency
    df_market['actual_margin_taken'] = np.where(df_market['is_sub_vendor'], BASELINE_MARGIN + 0.04, BASELINE_MARGIN)

    # Reverse engineer the Hospital's Hourly Bill Rate
    df_market['implied_weekly_bill'] = df_market['gross_weekly_pay'] / (1 - df_market['actual_margin_taken'])
    df_market['est_hourly_bill_rate'] = (df_market['implied_weekly_bill'] / 36).round(2)

    # -----------------------------------------------------------------
    # 5. THE TRAVELER'S ROI MATH (Fixed to Weekly)
    # -----------------------------------------------------------------
    WEEKS_PER_MONTH = 4.33
    
    # We must convert monthly Zillow and GSA to Weekly to match the paycheck!
    df_market['weekly_rent_cost'] = (df_market['zillow_observed_rent'] / WEEKS_PER_MONTH).round(2)
    df_market['weekly_stipend_max'] = (df_market['gsa_monthly_stipend'] / WEEKS_PER_MONTH).round(2)

    # Rent Burden % = How much of my weekly tax-free stipend goes to my landlord?
    df_market['rent_burden_pct'] = ((df_market['weekly_rent_cost'] / df_market['weekly_stipend_max']) * 100).round(1)
    
    # Net Tax-Free Cash = What the nurse actually pockets weekly after rent
    df_market['weekly_pocketed_cash'] = (df_market['weekly_stipend_max'] - df_market['weekly_rent_cost']).round(2)

    # 6. OUTPUT THE INSIGHTS 
    df_market = df_market.sort_values(by='weekly_pocketed_cash', ascending=False)
    
    # Format for clean console printing
    pd.options.display.float_format = '${:,.2f}'.format

    print("💰 TOP ARBITRAGE MARKETS (High Pocketed Cash, Low Rent Burden):")
    arbitrage = df_market[df_market['rent_burden_pct'] < 55].drop_duplicates(subset=['city', 'specialty'])
    print(arbitrage[['city', 'specialty', 'is_sub_vendor', 'gross_weekly_pay', 'est_hourly_bill_rate', 'weekly_pocketed_cash', 'rent_burden_pct']].head(5).to_string(index=False))
    
    print("\n🚨 DANGER ZONES (Rent eats the majority of the stipend):")
    danger = df_market[df_market['rent_burden_pct'] > 85].drop_duplicates(subset=['city', 'specialty'])
    print(danger[['city', 'specialty', 'is_sub_vendor', 'gross_weekly_pay', 'est_hourly_bill_rate', 'weekly_pocketed_cash', 'rent_burden_pct']].head(5).to_string(index=False))

    # Export to database to populate your State Market Pages
    df_market.to_csv("layer3_market_analysis_SEED.csv", index=False)
    print("\n✅ Saved 500 validated market payloads to 'layer3_market_analysis_SEED.csv'")

if __name__ == "__main__":
    build_arbitrage_engine()
