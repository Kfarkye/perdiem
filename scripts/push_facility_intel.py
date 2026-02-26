#!/usr/bin/env python3
"""
Supabase PostgREST Upsert — facility_intel (Idempotent & Bulletproof)

Reads a CSV and batch upserts into public.facility_intel using facility_id as the conflict key.
Automatically sanitizes headers, maps IDs, and safely handles rate limits.
"""

from __future__ import annotations

import csv
import json
import os
import sys
import time
import random
import urllib.request
import urllib.error
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

DEFAULT_ENV_PATHS = [
    ".env.local", ".env",
    os.path.join(os.path.dirname(__file__), '..', '.env.local'),
    os.path.join(os.path.dirname(__file__), '..', '.env'),
]
DEFAULT_BATCH_SIZE = 500
DEFAULT_TIMEOUT_SECS = 60

# Candidate CSV headers for the primary unique ID
FACILITY_ID_KEYS = [
    "facility_id", "ccn", "cms_ccn", "provider_id", "providerid"
]

def load_dotenv_if_present() -> None:
    """Minimal .env loader."""
    for p in DEFAULT_ENV_PATHS:
        fp = Path(p)
        if not fp.exists(): continue
        for line in fp.read_text(encoding="utf-8").splitlines():
            s = line.strip()
            if not s or s.startswith("#") or "=" not in s: continue
            k, v = s.split("=", 1)
            k = k.strip()
            v = v.strip().strip('"').strip("'")
            if k and k not in os.environ:
                os.environ[k] = v

def env(name: str, required: bool = True) -> str:
    v = os.environ.get(name, "").strip()
    if required and not v:
        raise SystemExit(f"❌ Missing required env var: {name}")
    return v

def pick_key() -> str:
    # Always prefer service role for backend bulk imports to bypass RLS
    k = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if k: return k
    return env("SUPABASE_ANON_KEY", required=True)

def sanitize_key(k: str) -> str:
    """Converts 'Health System' -> 'health_system'"""
    return k.strip().lower().replace(" ", "_").replace("-", "_")

def build_payload(row: Dict[str, str]) -> Optional[Dict[str, Any]]:
    # 1. Sanitize keys and convert empty strings to None (SQL NULL)
    clean_row: Dict[str, Any] = {}
    for k, v in row.items():
        if not k: continue
        clean_k = sanitize_key(k)
        clean_v = v.strip() if isinstance(v, str) else v
        clean_row[clean_k] = clean_v if clean_v else None

    # 2. Extract Facility ID cleanly
    fid = None
    for k in FACILITY_ID_KEYS:
        if clean_row.get(k):
            fid = clean_row[k]
            break

    if not fid:
        return None # Skip rows without a usable ID

    payload = dict(clean_row)

    # 3. Enforce the standard ID key
    payload["facility_id"] = str(fid)
    
    # 4. Strip out redundant ID keys so Supabase doesn't throw a schema missing column error
    for k in FACILITY_ID_KEYS:
        if k in payload and k != "facility_id":
            payload.pop(k, None)

    # 5. Type cast known numerics
    if "radius_rule_miles" in payload and payload["radius_rule_miles"] is not None:
        try:
            payload["radius_rule_miles"] = int(float(payload["radius_rule_miles"]))
        except ValueError:
            payload.pop("radius_rule_miles", None)

    # 6. Type cast booleans
    for bool_key in ["msp_exclusive", "block_scheduling", "float_required"]:
        if bool_key in payload and payload[bool_key] is not None:
            payload[bool_key] = str(payload[bool_key]).lower() in ("true", "1", "yes")

    # 7. Keep ehr_system as-is (DB column is ehr_system, not emr)

    # 8. Strip columns that don't exist in the facility_intel schema
    VALID_COLUMNS = {
        "facility_id", "facility_name", "facility_name_normalized",
        "health_system", "facility_type", "zip_code", "city", "state",
        "address", "msp_gatekeeper", "msp_exclusive", "msp_notes",
        "vms_software", "vms_notes", "facility_rules_raw", "max_rto_days",
        "block_scheduling", "float_required", "ehr_system", "orientation_days",
        "parking_cost_monthly", "data_source", "confidence", "report_count",
        "source_urls", "radius_rule_miles",
    }
    payload = {k: v for k, v in payload.items() if k in VALID_COLUMNS}

    return payload

def postgrest_upsert(
    supabase_url: str,
    api_key: str,
    table: str,
    rows: List[Dict[str, Any]],
    on_conflict: str = "facility_id",
) -> Tuple[int, str]:
    """Sends batch upsert via Supabase REST API."""
    url = f"{supabase_url.rstrip('/')}/rest/v1/{table}?on_conflict={on_conflict}"
    body = json.dumps(rows).encode("utf-8")

    req = urllib.request.Request(url=url, data=body, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("apikey", api_key)
    req.add_header("Authorization", f"Bearer {api_key}")
    req.add_header("Prefer", "resolution=merge-duplicates,return=minimal")

    try:
        with urllib.request.urlopen(req, timeout=DEFAULT_TIMEOUT_SECS) as resp:
            return resp.getcode(), resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", errors="replace")
    except Exception as e:
        return 0, repr(e)

def chunked(items: List[Any], n: int) -> List[List[Any]]:
    return [items[i:i+n] for i in range(0, len(items), n)]

def main() -> int:
    load_dotenv_if_present()
    
    # Support both SUPABASE_URL and NEXT_PUBLIC_SUPABASE_URL
    supabase_url = os.environ.get("SUPABASE_URL", "").strip()
    if not supabase_url:
        supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").strip()
    if not supabase_url:
        raise SystemExit("❌ Missing required env var: SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL")
    
    api_key = pick_key()

    csv_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("layer4_facilities_FINAL.csv")
    if not csv_path.exists():
        print(f"❌ CSV not found: {csv_path}", file=sys.stderr)
        return 2

    built: List[Dict[str, Any]] = []
    skipped_no_id = 0

    print(f"⏳ Reading CSV: {csv_path}...")
    with csv_path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            payload = build_payload(row)
            if payload is None:
                skipped_no_id += 1
                continue
            built.append(payload)

    total = len(built)
    print(f"📊 Rows parsed successfully: {total} (Skipped missing IDs: {skipped_no_id})")
    if total == 0:
        return 1

    # Debug: print first payload to verify column mapping
    print(f"\n🔍 Sample payload (row 1):")
    print(json.dumps(built[0], indent=2, default=str))
    print()

    batches = chunked(built, DEFAULT_BATCH_SIZE)
    updated, failed_batches = 0, 0

    print(f"🚀 Pushing to Supabase in {len(batches)} batches...")
    for i, batch in enumerate(batches, start=1):
        attempt = 0
        while True:
            attempt += 1
            code, msg = postgrest_upsert(supabase_url, api_key, "facility_intel", batch)

            if code in (200, 201, 204):
                updated += len(batch)
                print(f"✅ [{i}/{len(batches)}] Upsert OK: +{len(batch)} rows (Total: {updated}/{total})")
                break

            if code in (429, 500, 502, 503, 504) and attempt <= 6:
                backoff = min(30.0, (2 ** (attempt - 1)) + random.random())
                print(f"⚠️ [{i}/{len(batches)}] Rate limit/Server error (HTTP {code}). Retrying in {backoff:.1f}s...")
                time.sleep(backoff)
                continue

            failed_batches += 1
            print(f"❌ [{i}/{len(batches)}] FAILED (HTTP {code})")
            print(f"Error Details: {msg[:1000]}")
            break

    print("\n" + "=" * 50)
    print(f"🎯 UPSERT COMPLETE")
    print(f"Rows Target:  {total}")
    print(f"Rows Success: {updated}")
    print(f"Failed Batches: {failed_batches}")
    print("=" * 50 + "\n")

    return 1 if failed_batches > 0 else 0

if __name__ == "__main__":
    raise SystemExit(main())
