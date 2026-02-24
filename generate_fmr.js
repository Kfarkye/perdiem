const fs = require('fs');

const fmr = [
    { fips: '06037', state: 'CA', county: 'Los Angeles County', metro: 'Los Angeles-Long Beach-Glendale, CA HUD Metro FMR Area', studio: 1714, br1: 1957, br2: 2470 },
    { fips: '17031', state: 'IL', county: 'Cook County', metro: 'Chicago-Joliet-Naperville, IL HUD Metro FMR Area', studio: 1391, br1: 1533, br2: 1774 },
    { fips: '48201', state: 'TX', county: 'Harris County', metro: 'Houston-The Woodlands-Sugar Land, TX HUD Metro FMR Area', studio: 1118, br1: 1215, br2: 1445 },
    { fips: '04013', state: 'AZ', county: 'Maricopa County', metro: 'Phoenix-Mesa-Scottsdale, AZ MSA', studio: 1398, br1: 1526, br2: 1815 },
    { fips: '06073', state: 'CA', county: 'San Diego County', metro: 'San Diego-Carlsbad, CA MSA', studio: 1980, br1: 2196, br2: 2843 },
    { fips: '06059', state: 'CA', county: 'Orange County', metro: 'Santa Ana-Anaheim-Irvine, CA HUD Metro FMR Area', studio: 2167, br1: 2362, br2: 2865 },
    { fips: '12086', state: 'FL', county: 'Miami-Dade County', metro: 'Miami-Miami Beach-Kendall, FL HUD Metro FMR Area', studio: 1690, br1: 1888, br2: 2275 },
    { fips: '48113', state: 'TX', county: 'Dallas County', metro: 'Dallas, TX HUD Metro FMR Area', studio: 1251, br1: 1374, br2: 1636 },
    { fips: '36047', state: 'NY', county: 'Kings County', metro: 'New York, NY HUD Metro FMR Area', studio: 2420, br1: 2516, br2: 2862 },
    { fips: '53033', state: 'WA', county: 'King County', metro: 'Seattle-Bellevue, WA HUD Metro FMR Area', studio: 1837, br1: 1957, br2: 2334 },
    { fips: '32003', state: 'NV', county: 'Clark County', metro: 'Las Vegas-Henderson-Paradise, NV MSA', studio: 1176, br1: 1326, br2: 1572 },
    { fips: '36081', state: 'NY', county: 'Queens County', metro: 'New York, NY HUD Metro FMR Area', studio: 2420, br1: 2516, br2: 2862 },
    { fips: '48439', state: 'TX', county: 'Tarrant County', metro: 'Fort Worth-Arlington, TX HUD Metro FMR Area', studio: 1243, br1: 1332, br2: 1599 },
    { fips: '12011', state: 'FL', county: 'Broward County', metro: 'Fort Lauderdale, FL HUD Metro FMR Area', studio: 1515, br1: 1690, br2: 2057 },
    { fips: '36061', state: 'NY', county: 'New York County', metro: 'New York, NY HUD Metro FMR Area', studio: 2420, br1: 2516, br2: 2862 },
    { fips: '26163', state: 'MI', county: 'Wayne County', metro: 'Detroit-Warren-Livonia, MI HUD Metro FMR Area', studio: 878, br1: 1017, br2: 1251 },
    { fips: '12099', state: 'FL', county: 'Palm Beach County', metro: 'West Palm Beach-Boca Raton, FL HUD Metro FMR Area', studio: 1551, br1: 1735, br2: 2137 },
    { fips: '42101', state: 'PA', county: 'Philadelphia County', metro: 'Philadelphia-Camden-Wilmington, PA-NJ-DE-MD MSA', studio: 1146, br1: 1279, br2: 1547 },
    { fips: '24033', state: 'MD', county: 'Prince George\'s County', metro: 'Washington-Arlington-Alexandria, DC-VA-MD HUD Metro FMR Area', studio: 1655, br1: 1734, br2: 1968 },
    { fips: '06001', state: 'CA', county: 'Alameda County', metro: 'Oakland-Fremont, CA HUD Metro FMR Area', studio: 1888, br1: 2099, br2: 2552 },
    { fips: '13121', state: 'GA', county: 'Fulton County', metro: 'Atlanta-Sandy Springs-Roswell, GA HUD Metro FMR Area', studio: 1476, br1: 1555, br2: 1785 },
    { fips: '06085', state: 'CA', county: 'Santa Clara County', metro: 'San Jose-Sunnyvale-Santa Clara, CA HUD Metro FMR Area', studio: 2419, br1: 2616, br2: 3042 },
    { fips: '36005', state: 'NY', county: 'Bronx County', metro: 'New York, NY HUD Metro FMR Area', studio: 2420, br1: 2516, br2: 2862 },
    { fips: '48029', state: 'TX', county: 'Bexar County', metro: 'San Antonio-New Braunfels, TX HUD Metro FMR Area', studio: 1024, br1: 1121, br2: 1339 }
];

const unique = new Map();
fmr.forEach(f => unique.set(f.fips, f));

const values = Array.from(unique.values()).map(f => {
    return `('${f.fips}', '${f.state}', '${f.county.replace(/'/g, "''")}', '${f.metro.replace(/'/g, "''")}', ${f.studio}, ${f.br1}, ${f.br2}, 2025)`;
});

let sql = `BEGIN;
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
${values.join(',\n')}
ON CONFLICT (fips_code) DO UPDATE SET
  state = EXCLUDED.state,
  county = EXCLUDED.county,
  metro_area = EXCLUDED.metro_area,
  fmr_studio = EXCLUDED.fmr_studio,
  fmr_1br = EXCLUDED.fmr_1br,
  fmr_2br = EXCLUDED.fmr_2br,
  fiscal_year = EXCLUDED.fiscal_year;
COMMIT;
`;

fs.writeFileSync('insert_fmr.sql', sql);
console.log('Done: insert_fmr.sql generated with ' + unique.size + ' records.');
