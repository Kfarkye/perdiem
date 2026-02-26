import pandas as pd
import numpy as np
import urllib.request
import json
import ssl
import certifi

def fetch_all_hospitals():
    base_url = "https://data.cms.gov/provider-data/api/1/datastore/query/xubh-q36u/0"
    limit = 1000
    offset = 0
    all_results = []
    
    ctx = ssl.create_default_context(cafile=certifi.where())
    
    while True:
        url = f"{base_url}?limit={limit}&offset={offset}"
        req = urllib.request.Request(url, headers={"User-Agent": "PerDiem.fyi/1.0"})
        response = urllib.request.urlopen(req, context=ctx)
        
        data = json.loads(response.read().decode("utf-8"))
        results = data.get("results", [])
        
        if not results:
            break
            
        all_results.extend(results)
        print(f"Fetched {len(all_results)} records so far...")
        
        offset += limit
        
    return all_results

def build_facility_matrix():
    print("🚀 Layer 4 Seed: Processing CMS Federal Hospital Data via API...")
    try:
        results = fetch_all_hospitals()
        df = pd.DataFrame(results)

        # Map API keys to expected names
        col_mapping = {
            "facility_id": "facility_id",
            "facility_name": "facility_name",
            "citytown": "city",
            "state": "state",
            "zip_code": "zip_code",
            "hospital_type": "facility_type",
            "hospital_ownership": "ownership",
        }
        
        needed = list(col_mapping.keys())
        hospitals = df[needed].copy()
        hospitals = hospitals.rename(columns=col_mapping)

        # Clean ZIP codes
        hospitals = hospitals.dropna(subset=["zip_code"])
        hospitals["zip_code"] = (
            hospitals["zip_code"]
            .astype(str)
            .str.replace(r"\.0$", "", regex=True)
            .str.strip()
            .apply(lambda x: x.zfill(5))
        )

        # Generate normalized name for fuzzy matching
        hospitals["facility_name_normalized"] = (
            hospitals["facility_name"]
            .str.lower()
            .str.strip()
            .str.replace(r"[^a-z0-9\s]", "", regex=True)
            .str.replace(r"\s+", " ", regex=True)
        )

        # ══════════════════════════════════════════════════════════════
        # STEP 1: Initialize all intelligence columns FIRST
        # ══════════════════════════════════════════════════════════════
        hospitals["health_system"] = None
        hospitals["msp_gatekeeper"] = None
        hospitals["vms_software"] = None
        hospitals["msp_exclusive"] = None
        hospitals["ehr_system"] = None
        hospitals["radius_rule_miles"] = None
        hospitals["msp_notes"] = None

        # ══════════════════════════════════════════════════════════════
        # STEP 2: AHRQ Federal Merge — Run BEFORE the IDN routing loop
        # This populates health_system from the federal parent mapping
        # so that the IDN router can scan it in Step 3.
        # ══════════════════════════════════════════════════════════════
        import os
        ahrq_path = "ahrq_hospital_linkage.csv"
        
        if os.path.exists(ahrq_path):
            print("\n🔗 AHRQ Linkage found. Merging Federal Parent Systems map...")
            try:
                ahrq_df = pd.read_csv(ahrq_path, dtype=str, encoding='utf-8')
            except UnicodeDecodeError:
                ahrq_df = pd.read_csv(ahrq_path, dtype=str, encoding='latin-1')
            print(f"   AHRQ columns: {ahrq_df.columns.tolist()}")
            
            # The actual AHRQ Hospital Linkage file uses 'ccn' and 'health_sys_name'
            ccn_col = "ccn" if "ccn" in ahrq_df.columns else "ID_MCR"
            sys_col = "health_sys_name" if "health_sys_name" in ahrq_df.columns else "SYS_NAME"
            
            if ccn_col in ahrq_df.columns:
                # Force consistent string formatting with leading zeros
                hospitals["facility_id"] = hospitals["facility_id"].astype(str).str.strip()
                ahrq_df[ccn_col] = ahrq_df[ccn_col].astype(str).str.strip()
                
                # Keep only non-null system names
                ahrq_subset = ahrq_df[[ccn_col, sys_col]].dropna(subset=[sys_col])
                
                hospitals = pd.merge(
                    hospitals,
                    ahrq_subset,
                    left_on="facility_id",
                    right_on=ccn_col,
                    how="left"
                )
                hospitals["health_system"] = hospitals[sys_col]
                
                # Clean up merge columns
                drop_cols = [c for c in [ccn_col, sys_col] if c in hospitals.columns and c not in ["health_system"]]
                hospitals = hospitals.drop(columns=drop_cols, errors='ignore')
                
                ahrq_mapped = hospitals["health_system"].notna().sum()
                print(f"   ✅ AHRQ merge tagged {ahrq_mapped} / {len(hospitals)} hospitals with parent system names.")
            else:
                print(f"   ⚠️ AHRQ file found but missing expected columns.")
                print(f"   Available columns: {ahrq_df.columns.tolist()}")
        else:
            print(f"\n⚠️ AHRQ Linkage file not found at '{ahrq_path}'. Proceeding with name-only matching.")

        # ══════════════════════════════════════════════════════════════
        # STEP 3: The IDN Routing Engine — Scans BOTH facility_name
        # AND the AHRQ-populated health_system column
        # ══════════════════════════════════════════════════════════════
        system_map = {
            # Kaiser
            "KAISER": ("Kaiser Permanente", "AMN Healthcare", "SAP Fieldglass", True, "Epic", 50),
            # CommonSpirit (many brand names)
            "COMMONSPIRIT": ("CommonSpirit", "Internal Travel Program", "Internal", True, "Epic", 50),
            "CATHOLIC HEALTH": ("CommonSpirit", "Internal Travel Program", "Internal", True, "Epic", 50),
            "DIGNITY": ("CommonSpirit", "Internal Travel Program", "Internal", True, "Epic", 50),
            "CHI ": ("CommonSpirit", "Internal Travel Program", "Internal", True, "Epic", 50),
            # Tenet
            "TENET": ("Tenet Healthcare", "Trusted Resource Associates", "Internal", True, "Cerner", None),
            # Ascension
            "ASCENSION": ("Ascension", "Ascension Travel Program", "Internal", True, "Epic", None),
            # Advocate / Atrium
            "ADVOCATE": ("Advocate Health", "AtriumWORKS", "Internal", True, "Epic", None),
            "ATRIUM": ("Advocate Health", "AtriumWORKS", "Internal", True, "Epic", None),
            # HCA Empire
            "HCA": ("HCA Healthcare", "HealthTrust", "Internal", True, "Epic", 50),
            "HOSPITAL CORPORATION": ("HCA Healthcare", "HealthTrust", "Internal", True, "Epic", 50),
            "TRISTAR": ("HCA Healthcare", "HealthTrust", "Internal", True, "Epic", 50),
            "LIFEPOINT": ("LifePoint Health", "HealthTrust", "Unknown", True, "Mixed", 50),
            "SCION": ("ScionHealth", "HealthTrust", "Unknown", True, "Mixed", 50),
            "COMMUNITY HEALTH SYSTEM": ("CHS", "HealthTrust", "Unknown", True, "Cerner", 50),
            # Aya Monopolies
            "PROVIDENCE": ("Providence", "Aya Healthcare", "LotusOne", True, "Epic", 50),
            "SUTTER": ("Sutter Health", "Aya Healthcare", "LotusOne", True, "Epic", None),
            "LCMC": ("LCMC Health", "Aya Healthcare", "LotusOne", True, "Epic", None),
            "ALLEGHENY": ("Allegheny Health Network", "Aya Healthcare", "LotusOne", True, "Epic", None),
            # AMN Monopolies
            "ADVENTHEALTH": ("AdventHealth", "AMN Healthcare", "ShiftWise", True, "Epic", None),
            "TRINITY": ("Trinity Health", "FirstChoice (Internal) / AMN", "ShiftWise Flex", False, "Epic", None),
            "GEISINGER": ("Geisinger", "AMN Healthcare", "ShiftWise", True, "Epic", None),
            "ALLINA": ("Allina Health", "AMN Healthcare", "ShiftWise", True, "Epic", None),
            "FAIRVIEW": ("M Health Fairview", "AMN Healthcare", "ShiftWise", True, "Epic", None),
            # Neutrals / Hybrids / Mega-Regionals
            "INTERMOUNTAIN": ("Intermountain", "Magnit", "Vendor Neutral", False, "Epic", None),
            "BANNER": ("Banner Health", "Banner Staffing (Hybrid)", "Internal", False, "Cerner", 50),
            "MERCY": ("Mercy", "Trusted Health / Flex Team", "App-Based", False, "Epic", None),
            "BON SECOURS": ("Mercy", "Trusted Health / Flex Team", "App-Based", False, "Epic", None),
            "CHRISTUS": ("Christus Health", "Unknown", "Unknown", False, "Epic", None),
            "UPMC": ("UPMC", "UPMC Travel Staffing (Internal)", "Internal", True, "Epic", 75),
            "OCHSNER": ("Ochsner Health", "Ochsner In-House Agency", "Internal", True, "Epic", None),
            "MAYO": ("Mayo Clinic", "Mayo Clinic Travel Program", "Internal", True, "Epic", None),
            "STANFORD": ("Stanford Health Care", "Unknown", "Unknown", False, "Epic", 75),
            "BJC ": ("BJC HealthCare", "Unknown", "Unknown", False, "Epic", 100),
        }

        print("\n💉 Injecting Master Maps (MSP/VMS conflicts/EMR)...")
        
        def apply_intelligence(row):
            # CRITICAL: Scan BOTH the facility name AND the AHRQ parent system
            fac_name = str(row.get("facility_name", "")).upper()
            sys_name = str(row.get("health_system", "")).upper()
            name_check = f"{fac_name} ||| {sys_name}"
            
            # Guard: don't misroute "Mercy Children's" or "Providence Mercy"
            if "MERCY" in fac_name and any(x in fac_name for x in ["PROVIDENCE", "CHILDREN"]):
                return row 
            
            for key, (sys, msp, vms, excl, ehr, radius) in system_map.items():
                if key in name_check:
                    # Only overwrite health_system if we have a more specific name
                    row["health_system"] = sys
                    row["msp_gatekeeper"] = msp
                    row["vms_software"] = vms
                    row["msp_exclusive"] = excl
                    row["ehr_system"] = ehr
                    row["radius_rule_miles"] = radius
                    
                    notes = []
                    if msp == "Aya Healthcare" and vms == "LotusOne":
                        notes.append("WARNING: Aya owns both the contract and the software (LotusOne). Outside agencies face a sub-vendor penalty unless the role is hard-to-fill (where penalties may be waived to speed up hiring).")
                    if msp == "AMN Healthcare" and "ShiftWise" in vms:
                        notes.append("WARNING: AMN owns both the contract and the software (ShiftWise). Outside agencies face a sub-vendor penalty unless the role is hard-to-fill (where penalties may be waived to speed up hiring).")
                    if msp == "Magnit":
                        notes.append("NEUTRAL: Vendor-neutral MSP. Safe to use boutique agencies.")
                    if "Internal" in str(msp):
                        notes.append("INTERNAL: Facility prioritizes direct W-2 travelers. Agencies are back-up only, often used for hard-to-fill roles.")
                        
                    if notes:
                        row["msp_notes"] = " | ".join(notes)
                    break 
            
            # EMR Fallbacks for unmapped hospitals
            if pd.isna(row.get("ehr_system")) or row.get("ehr_system") is None:
                if row.get("facility_type") == "Critical Access Hospitals":
                    row["ehr_system"] = "Meditech / Cerner CommunityWorks"
                    
            return row

        hospitals = hospitals.apply(apply_intelligence, axis=1)

        # ══════════════════════════════════════════════════════════════
        # STEP 4: Export
        # ══════════════════════════════════════════════════════════════
        hospitals["data_source"] = "cms_gov"
        hospitals["confidence"] = "high"

        output_file = "layer4_facilities_FINAL.csv"
        hospitals.to_csv(output_file, index=False)

        print(f"\n✅ SUCCESS: Formatted and enriched {len(hospitals)} US hospitals into {output_file}")
        
        mapped_count = hospitals['health_system'].notna().sum()
        mapped_msp = hospitals['msp_gatekeeper'].notna().sum()
        mapped_emr = hospitals['ehr_system'].notna().sum()
        print(f"📊 Health System tagged: {mapped_count} / {len(hospitals)} ({mapped_count/len(hospitals)*100:.1f}%)")
        print(f"📊 MSP Gatekeeper tagged: {mapped_msp} / {len(hospitals)} ({mapped_msp/len(hospitals)*100:.1f}%)")
        print(f"📊 EMR tagged: {mapped_emr} / {len(hospitals)} ({mapped_emr/len(hospitals)*100:.1f}%)")
        print("\nBreakdown by EMR:")
        print(hospitals['ehr_system'].value_counts().to_string())
        print("\nBreakdown by Gatekeeper:")
        print(hospitals['msp_gatekeeper'].value_counts().head(15).to_string())
        print("\nBreakdown by Health System (Top 20):")
        print(hospitals['health_system'].value_counts().head(20).to_string())

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    build_facility_matrix()
