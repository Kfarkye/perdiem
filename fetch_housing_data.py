#!/usr/bin/env python3
"""
HUD SAFMR & Zillow ZORI Housing Data Extraction Pipeline
Dependencies: pip install pandas requests openpyxl
"""

import os
import sys
import json
import logging
import random
import re
from datetime import datetime, timezone
from io import BytesIO, StringIO

import pandas as pd
import requests

# --- CONFIGURATION & LOGGING ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')

HUD_SAFMR_URL = "https://www.huduser.gov/portal/datasets/fmr/fmr2026/fy2026_safmrs.xlsx"
ZILLOW_ZORI_URL = "https://files.zillowstatic.com/research/public_csvs/zori/Zip_zori_uc_sfrcondomfr_sm_sa_month.csv"
OUTPUT_SQL_FILE = "insert_zip_housing.sql"
HUD_VERSION = "FY2026"


def fallback_mock_generator():
    """Generates a realistic 38,601-row mock SQL file strictly for isolated CI/CD testing."""
    metro_areas = [
        "New York-Newark-Jersey City, NY-NJ-PA HUD Metro FMR Area",
        "Los Angeles-Long Beach-Anaheim, CA HUD Metro FMR Area",
        "Chicago-Naperville-Elgin, IL-IN-WI HUD Metro FMR Area",
        "Dallas-Fort Worth-Arlington, TX HUD Metro FMR Area"
    ]

    pulled_at = datetime.now(timezone.utc).isoformat()
    urls_json = json.dumps({"hud": HUD_SAFMR_URL, "zori": ZILLOW_ZORI_URL}).replace("'", "''")

    with open(OUTPUT_SQL_FILE, 'w', encoding='utf-8') as f:
        _write_sql_headers(f)

        rows = []
        random.seed(42)
        # Starting at 00501 (Lowest actual USPS ZIP bound)
        for i in range(501, 39102):
            zip_code = str(i).zfill(5)
            metro = random.choice(metro_areas).ljust(75)

            studio = random.randint(800, 2000)
            br1 = studio + random.randint(100, 300)
            br2 = br1 + random.randint(100, 300)
            br3 = br2 + random.randint(200, 400)
            br4 = br3 + random.randint(200, 500)
            zori = f"{br1 + random.uniform(-100, 500):.2f}" if random.random() > 0.3 else "NULL"

            escaped_metro = metro.strip().replace("'", "''")

            rows.append(
                f"  ('{zip_code}', '{escaped_metro}', {studio}, {br1}, {br2}, {br3}, {br4}, {zori}, "
                f"'{HUD_VERSION}', 'mock-ci-run', '{pulled_at}', '{urls_json}', true)"
            )

        _write_sql_batches(f, rows)
        f.write("COMMIT;\n")


def fetch_hud_safmr():
    logging.info(f"Fetching HUD SAFMR {HUD_VERSION} from {HUD_SAFMR_URL}...")
    response = requests.get(HUD_SAFMR_URL, timeout=15)
    response.raise_for_status()
    df = pd.read_excel(BytesIO(response.content))

    # Standardize headers (handle \r\n or double spaces HUD might use)
    df.columns = [re.sub(r'\s+', ' ', str(c).strip().lower()) for c in df.columns]

    # Drop empty Excel rows parsed as "00nan" string literals to prevent PK pollution
    if 'zip code' not in df.columns:
        raise ValueError("HUD SAFMR schema changed: 'zip code' column missing.")
    df = df.dropna(subset=['zip code'])

    # CRITICAL FIX 1: Explicitly strip floats (.0) so 'astype(str)' doesn't block zfill padding
    zip_col = df['zip code'].astype(str).str.replace(r'\.0$', '', regex=True).str.zfill(5)

    hud_df = pd.DataFrame({
        'zip': zip_col,
        'metro_area': df.get('hud metro fair market rent area name', ''),
        # Coerce handles instances where HUD accidentally leaves text/dashes in numeric columns
        'fmr_studio': pd.to_numeric(df.get('safmr 0br'), errors='coerce'),
        'fmr_1br': pd.to_numeric(df.get('safmr 1br'), errors='coerce'),
        'fmr_2br': pd.to_numeric(df.get('safmr 2br'), errors='coerce'),
        'fmr_3br': pd.to_numeric(df.get('safmr 3br'), errors='coerce'),
        'fmr_4br': pd.to_numeric(df.get('safmr 4br'), errors='coerce')
    })

    # CRITICAL FIX 3: Prevent PostgreSQL duplicate constraint crash on cross-county ZIPs
    original_len = len(hud_df)
    hud_df = hud_df.drop_duplicates(subset=['zip'], keep='first')
    if len(hud_df) < original_len:
        logging.info(f"Deduplicated {original_len - len(hud_df)} cross-county ZIP codes from HUD payload.")

    return hud_df


def fetch_zillow_zori():
    logging.info(f"Fetching Zillow ZORI from {ZILLOW_ZORI_URL}...")
    headers = {"User-Agent": "Mozilla/5.0"}
    response = requests.get(ZILLOW_ZORI_URL, timeout=15, headers=headers)
    response.raise_for_status()
    df = pd.read_csv(StringIO(response.text))

    # Strict regex avoids crashing on metadata columns (e.g., '2020 Census Tract')
    date_columns = [col for col in df.columns if re.match(r'^20\d{2}-\d{2}-\d{2}$', str(col))]
    if not date_columns:
        raise ValueError("Could not locate any YYYY-MM-DD date columns in Zillow CSV.")
    latest_month_col = sorted(date_columns)[-1]
    logging.info(f"Detected latest ZORI month: {latest_month_col}")

    if 'RegionName' not in df.columns:
        raise ValueError("Zillow ZORI schema changed: 'RegionName' column missing.")
    df = df.dropna(subset=['RegionName'])

    zori_df = pd.DataFrame({
        'zip': df['RegionName'].astype(str).str.replace(r'\.0$', '', regex=True).str.zfill(5),
        'zori_rent': pd.to_numeric(df[latest_month_col], errors='coerce')
    })

    return zori_df.drop_duplicates(subset=['zip'], keep='first'), latest_month_col


def _write_sql_headers(f):
    f.write("-- Auto-generated by fetch_housing_data.py\n")
    f.write("-- COMPLIANCE NOTICE: Zillow Research data (ZORI) is intended for non-commercial, academic, and media use.\n")
    f.write("-- Embedding this into a commercial SaaS product typically requires a formal API licensing agreement.\n")
    f.write("-- Consult Legal regarding a Zillow Bridge Interactive or Enterprise data agreement before commercial launch.\n\n")

    # CRITICAL FIX 4: Ensure atomic all-or-nothing execution
    f.write("BEGIN;\n\n")

    f.write("CREATE TABLE IF NOT EXISTS zip_housing_costs (\n")
    f.write("  zip TEXT PRIMARY KEY,\n")
    f.write("  metro_area TEXT,\n")
    f.write("  fmr_studio INTEGER,\n")
    f.write("  fmr_1br INTEGER,\n")
    f.write("  fmr_2br INTEGER,\n")
    f.write("  fmr_3br INTEGER,\n")
    f.write("  fmr_4br INTEGER,\n")
    f.write("  zori_rent NUMERIC\n")
    f.write(");\n\n")

    # CRITICAL FIX 5: Seamlessly apply schema updates if DB is already running the old 8-column schema
    f.write("ALTER TABLE zip_housing_costs ADD COLUMN IF NOT EXISTS hud_version TEXT;\n")
    f.write("ALTER TABLE zip_housing_costs ADD COLUMN IF NOT EXISTS zori_as_of_month TEXT;\n")
    f.write("ALTER TABLE zip_housing_costs ADD COLUMN IF NOT EXISTS pulled_at TEXT;\n")
    f.write("ALTER TABLE zip_housing_costs ADD COLUMN IF NOT EXISTS source_urls TEXT;\n")
    f.write("ALTER TABLE zip_housing_costs ADD COLUMN IF NOT EXISTS is_mock BOOLEAN DEFAULT FALSE;\n\n")


def _write_sql_batches(f, rows):
    for i in range(0, len(rows), 1000):
        batch = rows[i:i+1000]
        f.write("INSERT INTO zip_housing_costs (zip, metro_area, fmr_studio, fmr_1br, fmr_2br, fmr_3br, fmr_4br, zori_rent, hud_version, zori_as_of_month, pulled_at, source_urls, is_mock) VALUES\n")
        f.write(",\n".join(batch))
        f.write("\nON CONFLICT (zip) DO UPDATE SET\n")
        f.write("  metro_area = EXCLUDED.metro_area,\n")
        f.write("  fmr_studio = EXCLUDED.fmr_studio,\n")
        f.write("  fmr_1br = EXCLUDED.fmr_1br,\n")
        f.write("  fmr_2br = EXCLUDED.fmr_2br,\n")
        f.write("  fmr_3br = EXCLUDED.fmr_3br,\n")
        f.write("  fmr_4br = EXCLUDED.fmr_4br,\n")
        f.write("  zori_rent = EXCLUDED.zori_rent,\n")
        f.write("  hud_version = EXCLUDED.hud_version,\n")
        f.write("  zori_as_of_month = EXCLUDED.zori_as_of_month,\n")
        f.write("  pulled_at = EXCLUDED.pulled_at,\n")
        f.write("  source_urls = EXCLUDED.source_urls,\n")
        f.write("  is_mock = EXCLUDED.is_mock;\n\n")


def generate_sql_seed(merged_df, zori_month):
    logging.info(f"Writing idempotent SQL seed file: {OUTPUT_SQL_FILE}...")
    pulled_at = datetime.now(timezone.utc).isoformat()
    urls_json = json.dumps({"hud": HUD_SAFMR_URL, "zori": ZILLOW_ZORI_URL}).replace("'", "''")

    with open(OUTPUT_SQL_FILE, 'w', encoding='utf-8') as f:
        _write_sql_headers(f)

        records = merged_df.to_dict(orient='records')
        rows = []
        for row in records:
            zip_val = str(row['zip'])

            metro_raw = row['metro_area']
            if pd.isna(metro_raw) or str(metro_raw).strip().lower() == 'nan':
                metro_str = 'NULL'
            else:
                metro_str = f"'{str(metro_raw).replace(chr(39), chr(39)*2)}'"

            s = int(row['fmr_studio']) if pd.notna(row['fmr_studio']) else 'NULL'
            b1 = int(row['fmr_1br']) if pd.notna(row['fmr_1br']) else 'NULL'
            b2 = int(row['fmr_2br']) if pd.notna(row['fmr_2br']) else 'NULL'
            b3 = int(row['fmr_3br']) if pd.notna(row['fmr_3br']) else 'NULL'
            b4 = int(row['fmr_4br']) if pd.notna(row['fmr_4br']) else 'NULL'
            z = round(row['zori_rent'], 2) if pd.notna(row['zori_rent']) else 'NULL'

            # Semantically clean: if Zillow rent is NULL, the "as of" date shouldn't be populated for that row
            zori_month_val = f"'{zori_month}'" if z != 'NULL' else 'NULL'

            rows.append(
                f"  ('{zip_val}', {metro_str}, {s}, {b1}, {b2}, {b3}, {b4}, {z}, "
                f"'{HUD_VERSION}', {zori_month_val}, '{pulled_at}', '{urls_json}', false)"
            )

        _write_sql_batches(f, rows)
        f.write("COMMIT;\n")

    logging.info("SQL generation complete.")


def main():
    try:
        hud_df = fetch_hud_safmr()
        zori_df, zori_month = fetch_zillow_zori()

        logging.info("Merging datasets via Left Join (retaining HUD baseline)...")
        merged_df = pd.merge(hud_df, zori_df, on='zip', how='left')

        if len(merged_df) < 25000:
            logging.error(f"Merged HUD row count unusually low: {len(merged_df)}. Aborting.")
            sys.exit(1)

        # CRITICAL FIX 2: Validate that the Zillow merge actually worked (prevents silent left-join failures)
        zori_match_count = merged_df['zori_rent'].notna().sum()
        logging.info(f"Successfully matched Zillow data for {zori_match_count} ZIP codes.")
        if zori_match_count < 2000:
            logging.error(f"Zillow join failed: Only matched {zori_match_count} ZIPs with Market Rent. Aborting.")
            sys.exit(1)

        generate_sql_seed(merged_df, zori_month)

    except requests.exceptions.RequestException as e:
        is_ci = os.environ.get("CI", "").lower() == "true"
        allow_mock = os.environ.get("ALLOW_MOCK_FALLBACK", "").lower() == "true"

        if is_ci and allow_mock:
            logging.warning("Offline network detected in CI environment. Generating mock SQL seed...")
            fallback_mock_generator()
        else:
            logging.error(f"Network error fetching housing data: {e}")
            logging.error("FAIL CLOSED: Pipeline aborted to prevent synthetic data poisoning in production.")
            logging.error("To permit mock data in isolated testing, set CI=true and ALLOW_MOCK_FALLBACK=true.")
            sys.exit(1)
    except Exception as e:
        logging.error(f"ETL Failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
