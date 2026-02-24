BEGIN;
CREATE TABLE IF NOT EXISTS hud_fmr (
  fips_code TEXT PRIMARY KEY,
  state TEXT,
  county TEXT,
  metro_area TEXT,
  fmr_studio INTEGER,
  fmr_1br INTEGER,
  fmr_2br INTEGER,
  fiscal_year INTEGER DEFAULT 2025
);

INSERT INTO hud_fmr (fips_code, state, county, metro_area, fmr_studio, fmr_1br, fmr_2br, fiscal_year) VALUES
('06037', 'CA', 'Los Angeles County', 'Los Angeles-Long Beach-Glendale, CA HUD Metro FMR Area', 1714, 1957, 2470, 2025),
('17031', 'IL', 'Cook County', 'Chicago-Joliet-Naperville, IL HUD Metro FMR Area', 1391, 1533, 1774, 2025),
('48201', 'TX', 'Harris County', 'Houston-The Woodlands-Sugar Land, TX HUD Metro FMR Area', 1118, 1215, 1445, 2025),
('04013', 'AZ', 'Maricopa County', 'Phoenix-Mesa-Scottsdale, AZ MSA', 1398, 1526, 1815, 2025),
('06073', 'CA', 'San Diego County', 'San Diego-Carlsbad, CA MSA', 1980, 2196, 2843, 2025),
('06059', 'CA', 'Orange County', 'Santa Ana-Anaheim-Irvine, CA HUD Metro FMR Area', 2167, 2362, 2865, 2025),
('12086', 'FL', 'Miami-Dade County', 'Miami-Miami Beach-Kendall, FL HUD Metro FMR Area', 1690, 1888, 2275, 2025),
('48113', 'TX', 'Dallas County', 'Dallas, TX HUD Metro FMR Area', 1251, 1374, 1636, 2025),
('36047', 'NY', 'Kings County', 'New York, NY HUD Metro FMR Area', 2420, 2516, 2862, 2025),
('53033', 'WA', 'King County', 'Seattle-Bellevue, WA HUD Metro FMR Area', 1837, 1957, 2334, 2025),
('32003', 'NV', 'Clark County', 'Las Vegas-Henderson-Paradise, NV MSA', 1176, 1326, 1572, 2025),
('36081', 'NY', 'Queens County', 'New York, NY HUD Metro FMR Area', 2420, 2516, 2862, 2025),
('48439', 'TX', 'Tarrant County', 'Fort Worth-Arlington, TX HUD Metro FMR Area', 1243, 1332, 1599, 2025),
('12011', 'FL', 'Broward County', 'Fort Lauderdale, FL HUD Metro FMR Area', 1515, 1690, 2057, 2025),
('36061', 'NY', 'New York County', 'New York, NY HUD Metro FMR Area', 2420, 2516, 2862, 2025),
('26163', 'MI', 'Wayne County', 'Detroit-Warren-Livonia, MI HUD Metro FMR Area', 878, 1017, 1251, 2025),
('12099', 'FL', 'Palm Beach County', 'West Palm Beach-Boca Raton, FL HUD Metro FMR Area', 1551, 1735, 2137, 2025),
('42101', 'PA', 'Philadelphia County', 'Philadelphia-Camden-Wilmington, PA-NJ-DE-MD MSA', 1146, 1279, 1547, 2025),
('24033', 'MD', 'Prince George''s County', 'Washington-Arlington-Alexandria, DC-VA-MD HUD Metro FMR Area', 1655, 1734, 1968, 2025),
('06001', 'CA', 'Alameda County', 'Oakland-Fremont, CA HUD Metro FMR Area', 1888, 2099, 2552, 2025),
('13121', 'GA', 'Fulton County', 'Atlanta-Sandy Springs-Roswell, GA HUD Metro FMR Area', 1476, 1555, 1785, 2025),
('06085', 'CA', 'Santa Clara County', 'San Jose-Sunnyvale-Santa Clara, CA HUD Metro FMR Area', 2419, 2616, 3042, 2025),
('36005', 'NY', 'Bronx County', 'New York, NY HUD Metro FMR Area', 2420, 2516, 2862, 2025),
('48029', 'TX', 'Bexar County', 'San Antonio-New Braunfels, TX HUD Metro FMR Area', 1024, 1121, 1339, 2025)
ON CONFLICT (fips_code) DO UPDATE SET
  state = EXCLUDED.state,
  county = EXCLUDED.county,
  metro_area = EXCLUDED.metro_area,
  fmr_studio = EXCLUDED.fmr_studio,
  fmr_1br = EXCLUDED.fmr_1br,
  fmr_2br = EXCLUDED.fmr_2br,
  fiscal_year = EXCLUDED.fiscal_year;
COMMIT;
