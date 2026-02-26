import pandas as pd

# Load the core facility list (has facility_id which is actually the CMS Certification Number)
facilities = pd.read_csv('scripts/layer4_facilities_FINAL.csv')

# Load the AHRQ linkage file (has ccn which matches facility_id)
ahrq = pd.read_csv('/Users/k.far.88/Downloads/chsp-hospital-linkage-2023.csv', dtype={'ccn': str}, encoding='latin-1')

# Ensure join keys are strings and padded correctly
facilities['facility_id'] = facilities['facility_id'].astype(str).str.zfill(6)
ahrq['ccn'] = ahrq['ccn'].astype(str).str.zfill(6)

# Perform the hidden join you didn't realize you had
enriched = pd.merge(
    facilities,
    ahrq[['ccn', 'hos_beds', 'hos_dsch', 'corp_parent_name', 'hos_net_revenue', 'hos_ucburden']],
    left_on='facility_id',
    right_on='ccn',
    how='inner'
)

# Show the highest value hidden insights
top_insights = enriched.sort_values('hos_beds', ascending=False)[
    ['facility_name', 'state', 'hos_beds', 'hos_dsch', 'corp_parent_name', 'hos_net_revenue']
]

print("Joined", len(enriched), "facilities with AHRQ financial/operational data.")
print("\nTop 5 Facilities by Bed Count (Demand Signal) with Corporate Parent (MSP Proxy):")
print(top_insights.head().to_string(index=False))

enriched.to_csv('scripts/enriched_facilities_intel.csv', index=False)
