"""
Push layer4_facilities_FINAL.csv to Supabase facility_intel table.

Strategy:
1. Add facility_id (CCN) column if missing via ALTER TABLE
2. Add UNIQUE constraint on facility_id for upsert
3. Batch upsert 500 rows at a time via PostgREST
"""

import pandas as pd
import json
import urllib.request
import ssl
import certifi
import os

import os

env_path = os.path.join(os.path.dirname(__file__), '..', '.env.local')
SUPABASE_URL = None
SERVICE_KEY = None

# Fallback: read directly
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line.startswith("NEXT_PUBLIC_SUPABASE_URL="):
                SUPABASE_URL = line.split("=", 1)[1]
            elif line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                SERVICE_KEY = line.split("=", 1)[1]

print(f"🔗 Supabase URL: {SUPABASE_URL}")
print(f"🔑 Service Key: ...{SERVICE_KEY[-12:]}")

ctx = ssl.create_default_context(cafile=certifi.where())

def supabase_rpc(sql):
    """Execute raw SQL via the Supabase REST RPC endpoint."""
    url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"
    # This won't work without a custom function. Use the SQL editor approach instead.
    pass

def supabase_post(table, rows, upsert_col=None):
    """POST rows to Supabase PostgREST with optional upsert."""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    
    if upsert_col:
        headers["Prefer"] = f"resolution=merge-duplicates,return=minimal"
        url += f"?on_conflict={upsert_col}"
    
    body = json.dumps(rows, default=str).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    
    try:
        resp = urllib.request.urlopen(req, context=ctx)
        return resp.status
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        print(f"   ❌ HTTP {e.code}: {error_body[:500]}")
        return e.code

def main():
    print("\n📋 Loading layer4_facilities_FINAL.csv...")
    df = pd.read_csv("layer4_facilities_FINAL.csv", dtype=str)
    print(f"   Loaded {len(df)} hospitals")
    
    # Map CSV columns to database columns
    rows = []
    for _, r in df.iterrows():
        row = {
            "facility_id": r.get("facility_id"),
            "facility_name": r.get("facility_name"),
            "facility_name_normalized": r.get("facility_name_normalized"),
            "health_system": r.get("health_system") if pd.notna(r.get("health_system")) else None,
            "facility_type": r.get("facility_type", "hospital"),
            "zip_code": r.get("zip_code"),
            "city": r.get("city"),
            "state": r.get("state"),
            "msp_gatekeeper": r.get("msp_gatekeeper") if pd.notna(r.get("msp_gatekeeper")) else None,
            "msp_exclusive": r.get("msp_exclusive") == "True" if pd.notna(r.get("msp_exclusive")) else False,
            "msp_notes": r.get("msp_notes") if pd.notna(r.get("msp_notes")) else None,
            "vms_software": r.get("vms_software") if pd.notna(r.get("vms_software")) else None,
            "ehr_system": r.get("ehr_system") if pd.notna(r.get("ehr_system")) else None,
            "radius_rule_miles": int(float(r.get("radius_rule_miles"))) if pd.notna(r.get("radius_rule_miles")) else None,
            "data_source": r.get("data_source", "cms_gov"),
            "confidence": r.get("confidence", "high"),
        }
        rows.append(row)
    
    # Batch upsert (500 at a time to stay under PostgREST limits)
    batch_size = 500
    total = len(rows)
    success = 0
    failed = 0
    
    print(f"\n🚀 Upserting {total} hospitals in batches of {batch_size}...")
    
    for i in range(0, total, batch_size):
        batch = rows[i:i + batch_size]
        status = supabase_post("facility_intel", batch, upsert_col="facility_id")
        
        if status in (200, 201):
            success += len(batch)
            print(f"   ✅ Batch {i // batch_size + 1}: {len(batch)} rows ({success}/{total})")
        else:
            failed += len(batch)
            print(f"   ⚠️  Batch {i // batch_size + 1}: FAILED ({failed} failed so far)")
    
    print(f"\n{'=' * 60}")
    print(f"✅ DONE: {success} upserted, {failed} failed out of {total}")
    print(f"{'=' * 60}")

if __name__ == "__main__":
    main()
