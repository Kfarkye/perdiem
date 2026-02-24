const fs = require('fs');

const taxes = [
    { code: 'AL', name: 'Alabama', tax: true, rate: 5.0, brackets: 3, notes: 'Deducts federal tax' },
    { code: 'AK', name: 'Alaska', tax: false, rate: 0, brackets: 0, notes: 'No income tax' },
    { code: 'AZ', name: 'Arizona', tax: true, rate: 2.5, brackets: 1, notes: 'Flat tax' },
    { code: 'AR', name: 'Arkansas', tax: true, rate: 3.9, brackets: 3, notes: 'Graduated' },
    { code: 'CA', name: 'California', tax: true, rate: 13.3, brackets: 9, notes: 'Includes 1% surcharge' },
    { code: 'CO', name: 'Colorado', tax: true, rate: 4.40, brackets: 1, notes: 'Flat tax' },
    { code: 'CT', name: 'Connecticut', tax: true, rate: 6.99, brackets: 7, notes: 'Graduated' },
    { code: 'DE', name: 'Delaware', tax: true, rate: 6.6, brackets: 6, notes: 'Graduated' },
    { code: 'FL', name: 'Florida', tax: false, rate: 0, brackets: 0, notes: 'No income tax' },
    { code: 'GA', name: 'Georgia', tax: true, rate: 5.49, brackets: 1, notes: 'Flat tax starting 2024' },
    { code: 'HI', name: 'Hawaii', tax: true, rate: 11.0, brackets: 12, notes: 'High top rate' },
    { code: 'ID', name: 'Idaho', tax: true, rate: 5.8, brackets: 1, notes: 'Flat tax' },
    { code: 'IL', name: 'Illinois', tax: true, rate: 4.95, brackets: 1, notes: 'Flat tax' },
    { code: 'IN', name: 'Indiana', tax: true, rate: 3.05, brackets: 1, notes: 'Flat tax, decreasing' },
    { code: 'IA', name: 'Iowa', tax: true, rate: 5.7, brackets: 3, notes: 'Transitioning to flat tax' },
    { code: 'KS', name: 'Kansas', tax: true, rate: 5.7, brackets: 3, notes: 'Graduated' },
    { code: 'KY', name: 'Kentucky', tax: true, rate: 4.0, brackets: 1, notes: 'Flat tax' },
    { code: 'LA', name: 'Louisiana', tax: true, rate: 4.25, brackets: 3, notes: 'Graduated' },
    { code: 'ME', name: 'Maine', tax: true, rate: 7.15, brackets: 3, notes: 'Graduated' },
    { code: 'MD', name: 'Maryland', tax: true, rate: 5.75, brackets: 8, notes: 'Local taxes also apply' },
    { code: 'MA', name: 'Massachusetts', tax: true, rate: 9.0, brackets: 2, notes: '5% base + 4% millionaires tax' },
    { code: 'MI', name: 'Michigan', tax: true, rate: 4.25, brackets: 1, notes: 'Flat tax' },
    { code: 'MN', name: 'Minnesota', tax: true, rate: 9.85, brackets: 4, notes: 'Graduated' },
    { code: 'MS', name: 'Mississippi', tax: true, rate: 4.0, brackets: 1, notes: 'Flat tax' },
    { code: 'MO', name: 'Missouri', tax: true, rate: 4.8, brackets: 8, notes: 'Graduated' },
    { code: 'MT', name: 'Montana', tax: true, rate: 5.9, brackets: 2, notes: 'Graduated' },
    { code: 'NE', name: 'Nebraska', tax: true, rate: 5.84, brackets: 4, notes: 'Decreasing gradually' },
    { code: 'NV', name: 'Nevada', tax: false, rate: 0, brackets: 0, notes: 'No income tax' },
    { code: 'NH', name: 'New Hampshire', tax: false, rate: 3.0, brackets: 1, notes: 'Interest and dividends only, phasing out' },
    { code: 'NJ', name: 'New Jersey', tax: true, rate: 10.75, brackets: 7, notes: 'Graduated' },
    { code: 'NM', name: 'New Mexico', tax: true, rate: 5.9, brackets: 4, notes: 'Graduated' },
    { code: 'NY', name: 'New York', tax: true, rate: 10.9, brackets: 9, notes: 'Local taxes for NYC/Yonkers' },
    { code: 'NC', name: 'North Carolina', tax: true, rate: 4.5, brackets: 1, notes: 'Flat tax' },
    { code: 'ND', name: 'North Dakota', tax: true, rate: 2.5, brackets: 3, notes: 'Graduated' },
    { code: 'OH', name: 'Ohio', tax: true, rate: 3.5, brackets: 3, notes: 'Graduated' },
    { code: 'OK', name: 'Oklahoma', tax: true, rate: 4.75, brackets: 6, notes: 'Graduated' },
    { code: 'OR', name: 'Oregon', tax: true, rate: 9.9, brackets: 4, notes: 'High rate' },
    { code: 'PA', name: 'Pennsylvania', tax: true, rate: 3.07, brackets: 1, notes: 'Flat tax, local taxes apply' },
    { code: 'RI', name: 'Rhode Island', tax: true, rate: 5.99, brackets: 3, notes: 'Graduated' },
    { code: 'SC', name: 'South Carolina', tax: true, rate: 6.4, brackets: 3, notes: 'Graduated' },
    { code: 'SD', name: 'South Dakota', tax: false, rate: 0, brackets: 0, notes: 'No income tax' },
    { code: 'TN', name: 'Tennessee', tax: false, rate: 0, brackets: 0, notes: 'No income tax' },
    { code: 'TX', name: 'Texas', tax: false, rate: 0, brackets: 0, notes: 'No income tax' },
    { code: 'UT', name: 'Utah', tax: true, rate: 4.65, brackets: 1, notes: 'Flat tax' },
    { code: 'VT', name: 'Vermont', tax: true, rate: 8.75, brackets: 4, notes: 'Graduated' },
    { code: 'VA', name: 'Virginia', tax: true, rate: 5.75, brackets: 4, notes: 'Graduated' },
    { code: 'WA', name: 'Washington', tax: false, rate: 7.0, brackets: 1, notes: 'Capital gains over 250k only, no wage tax' },
    { code: 'WV', name: 'West Virginia', tax: true, rate: 5.12, brackets: 5, notes: 'Graduated' },
    { code: 'WI', name: 'Wisconsin', tax: true, rate: 7.65, brackets: 4, notes: 'Graduated' },
    { code: 'WY', name: 'Wyoming', tax: false, rate: 0, brackets: 0, notes: 'No income tax' },
    { code: 'DC', name: 'District of Columbia', tax: true, rate: 10.75, brackets: 7, notes: 'Graduated' }
];

const unique = new Map();
taxes.forEach(t => unique.set(t.code, t));

const values = Array.from(unique.values()).map(t => {
    return `('${t.code}', '${t.name}', ${t.tax}, ${t.rate}, ${t.brackets}, '${t.notes.replace(/'/g, "''")}', 2025)`;
});

let sql = `BEGIN;
CREATE TABLE IF NOT EXISTS state_income_tax (
  state_code TEXT PRIMARY KEY,
  state_name TEXT,
  has_income_tax BOOLEAN,
  top_marginal_rate NUMERIC,
  brackets INTEGER,
  notes TEXT,
  fiscal_year INTEGER DEFAULT 2025
);

INSERT INTO state_income_tax (state_code, state_name, has_income_tax, top_marginal_rate, brackets, notes, fiscal_year) VALUES
${values.join(',\n')}
ON CONFLICT (state_code) DO UPDATE SET
  has_income_tax = EXCLUDED.has_income_tax,
  top_marginal_rate = EXCLUDED.top_marginal_rate,
  brackets = EXCLUDED.brackets,
  notes = EXCLUDED.notes,
  fiscal_year = EXCLUDED.fiscal_year;
COMMIT;
`;

fs.writeFileSync('insert_taxes.sql', sql);
console.log('Done: insert_taxes.sql generated with 51 states.');
