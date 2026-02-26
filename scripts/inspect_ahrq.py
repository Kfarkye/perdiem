import pandas as pd

try:
    df = pd.read_excel('ahrq_hospital_linkage.xlsx', dtype=str)
    print("Hospital Linkage Columns:")
    print(df.columns.tolist())
    print("\nFirst row:")
    print(df.iloc[0].to_dict())
    
    sys_df = pd.read_excel('ahrq_systems.xlsx', dtype=str)
    print("\nSystem Linkage Columns:")
    print(sys_df.columns.tolist())
    print("\nFirst row:")
    print(sys_df.iloc[0].to_dict())
except Exception as e:
    print(f"Error: {e}")
