const fs = require('fs');

async function main() {
  console.log('Fetching GSA ZIP codes...');
  const res = await fetch('https://api.gsa.gov/travel/perdiem/v2/rates/conus/zipcodes/2026?api_key=DEMO_KEY');
  let data;
  try {
    data = await res.json();
  } catch (e) {
    console.error('Failed to parse JSON', e);
    return;
  }

  // The API might return an array or { rates: [...] }
  // The logs showed the array is at data.rates[0].rate OR `data` is an array.
  // Wait, the previous log was:
  // `Failed to load rates structure [ { Zip: '...' }, ... ]`
  // so `data` might be the object, but if `process.stdout` prints it... Let's find the array.

  let rateArray = [];
  if (Array.isArray(data)) {
    rateArray = data;
  } else if (data.rates && Array.isArray(data.rates)) {
    rateArray = data.rates[0]?.rate || data.rates;
  } else {
    // If it's a deeply nested structure like the previous attempt logged:
    console.error("Unknown structure:", typeof data);
    return;
  }

  const seenZips = new Set();
  const values = [];

  for (const entry of rateArray) {
    const zip = entry.Zip || entry.zip;
    if (!zip) continue;
    if (seenZips.has(zip)) continue;
    seenZips.add(zip);

    const did = (entry.DID || entry.destination_id || '')?.toString().replace(/'/g, "''");
    const state = (entry.ST || entry.state || '')?.toString().replace(/'/g, "''");

    // city/county are not in THIS endpoint usually, but let's check uppercase vs lowercase
    const city = (entry.City || entry.city || '')?.toString().replace(/'/g, "''");
    const county = (entry.County || entry.county || '')?.toString().replace(/'/g, "''");

    values.push(`('${zip}', '${did}', '${state}', '${city}', '${county}', 2026)`);
  }

  console.log(`Deduped to ${values.length} ZIPs. Writing SQL...`);

  const CHUNK_SIZE = 5000;
  let sql = 'BEGIN;\n';
  sql += 'DELETE FROM gsa_zip_mappings WHERE fiscal_year = 2026;\n'; // ensure idempotency
  for (let i = 0; i < values.length; i += CHUNK_SIZE) {
    const chunk = values.slice(i, i + CHUNK_SIZE);
    sql += `INSERT INTO gsa_zip_mappings (zip, destination_id, state, city, county, fiscal_year) VALUES\n`;
    sql += chunk.join(',\n');
    sql += `\nON CONFLICT (zip) DO NOTHING;\n`;
  }
  sql += 'COMMIT;\n';

  fs.writeFileSync('insert_zips.sql', sql);
  console.log('Done: insert_zips.sql generated.');
}

main().catch(console.error);
