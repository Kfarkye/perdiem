const fs = require('fs');

const states = [
    { code: 'AL', name: 'Alabama', member: true, date: '2020-01-01', walk: false },
    { code: 'AK', name: 'Alaska', member: false, date: null, walk: false },
    { code: 'AZ', name: 'Arizona', member: true, date: '2002-07-01', walk: true },
    { code: 'AR', name: 'Arkansas', member: true, date: '2000-07-01', walk: false },
    { code: 'CA', name: 'California', member: false, date: null, walk: false },
    { code: 'CO', name: 'Colorado', member: true, date: '2007-10-01', walk: true },
    { code: 'CT', name: 'Connecticut', member: false, date: null, walk: false },
    { code: 'DE', name: 'Delaware', member: true, date: '2000-07-01', walk: true },
    { code: 'FL', name: 'Florida', member: true, date: '2018-01-19', walk: false },
    { code: 'GA', name: 'Georgia', member: true, date: '2018-01-19', walk: false },
    { code: 'HI', name: 'Hawaii', member: false, date: null, walk: false },
    { code: 'ID', name: 'Idaho', member: true, date: '2001-07-01', walk: true },
    { code: 'IL', name: 'Illinois', member: false, date: null, walk: false },
    { code: 'IN', name: 'Indiana', member: true, date: '2020-07-01', walk: false },
    { code: 'IA', name: 'Iowa', member: true, date: '2000-07-01', walk: false },
    { code: 'KS', name: 'Kansas', member: true, date: '2019-07-01', walk: false },
    { code: 'KY', name: 'Kentucky', member: true, date: '2007-06-01', walk: false },
    { code: 'LA', name: 'Louisiana', member: true, date: '2019-07-01', walk: true },
    { code: 'ME', name: 'Maine', member: true, date: '2001-07-01', walk: false },
    { code: 'MD', name: 'Maryland', member: true, date: '1999-07-01', walk: true },
    { code: 'MA', name: 'Massachusetts', member: false, date: null, walk: false },
    { code: 'MI', name: 'Michigan', member: false, date: null, walk: false },
    { code: 'MN', name: 'Minnesota', member: false, date: null, walk: false },
    { code: 'MS', name: 'Mississippi', member: true, date: '2001-07-01', walk: false },
    { code: 'MO', name: 'Missouri', member: true, date: '2010-06-01', walk: true },
    { code: 'MT', name: 'Montana', member: true, date: '2015-10-01', walk: false },
    { code: 'NE', name: 'Nebraska', member: true, date: '2001-01-01', walk: false },
    { code: 'NV', name: 'Nevada', member: false, date: null, walk: false },
    { code: 'NH', name: 'New Hampshire', member: true, date: '2006-01-01', walk: false },
    { code: 'NJ', name: 'New Jersey', member: true, date: '2021-11-15', walk: false },
    { code: 'NM', name: 'New Mexico', member: true, date: '2004-01-01', walk: false },
    { code: 'NY', name: 'New York', member: false, date: null, walk: false },
    { code: 'NC', name: 'North Carolina', member: true, date: '2000-07-01', walk: false },
    { code: 'ND', name: 'North Dakota', member: true, date: '2004-01-01', walk: false },
    { code: 'OH', name: 'Ohio', member: true, date: '2023-01-01', walk: false },
    { code: 'OK', name: 'Oklahoma', member: true, date: '2018-01-19', walk: false },
    { code: 'OR', name: 'Oregon', member: false, date: null, walk: false },
    { code: 'PA', name: 'Pennsylvania', member: true, date: '2023-09-05', walk: false },
    { code: 'RI', name: 'Rhode Island', member: true, date: '2024-01-01', walk: false },
    { code: 'SC', name: 'South Carolina', member: true, date: '2006-02-01', walk: true },
    { code: 'SD', name: 'South Dakota', member: true, date: '2001-01-01', walk: false },
    { code: 'TN', name: 'Tennessee', member: true, date: '2003-07-01', walk: false },
    { code: 'TX', name: 'Texas', member: true, date: '2000-01-01', walk: false },
    { code: 'UT', name: 'Utah', member: true, date: '2000-01-01', walk: false },
    { code: 'VT', name: 'Vermont', member: true, date: '2022-02-01', walk: false },
    { code: 'VA', name: 'Virginia', member: true, date: '2005-01-01', walk: false },
    { code: 'WA', name: 'Washington', member: true, date: '2023-07-24', walk: false },
    { code: 'WV', name: 'West Virginia', member: true, date: '2018-01-19', walk: false },
    { code: 'WI', name: 'Wisconsin', member: true, date: '2000-01-01', walk: false },
    { code: 'WY', name: 'Wyoming', member: true, date: '2018-01-19', walk: false },
    { code: 'DC', name: 'District of Columbia', member: false, date: null, walk: false },
    { code: 'GU', name: 'Guam', member: true, date: '2022-01-01', walk: false },
    { code: 'VI', name: 'Virgin Islands', member: true, date: '2022-01-01', walk: false }
];

// Deduplicate
const unique = new Map();
states.forEach(s => unique.set(s.code, s));

const values = Array.from(unique.values()).map(s => {
    const dateStr = s.date ? `'${s.date}'` : 'NULL';
    return `('${s.code}', '${s.name}', ${s.member}, ${dateStr}, ${s.walk}, now())`;
});

let sql = `
-- Nurse Licensure Compact (NLC) States Seed
BEGIN;

CREATE TABLE IF NOT EXISTS nlc_compact_states (
  state_code TEXT PRIMARY KEY,
  state_name TEXT,
  compact_member BOOLEAN,
  effective_date DATE,
  walk_through BOOLEAN,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO nlc_compact_states (state_code, state_name, compact_member, effective_date, walk_through, updated_at) VALUES
${values.join(',\n')}
ON CONFLICT (state_code) DO UPDATE SET
  state_name = EXCLUDED.state_name,
  compact_member = EXCLUDED.compact_member,
  effective_date = EXCLUDED.effective_date,
  walk_through = EXCLUDED.walk_through,
  updated_at = EXCLUDED.updated_at;

COMMIT;
`;

fs.writeFileSync('insert_nlc.sql', sql);
console.log('Successfully generated insert_nlc.sql with ' + unique.size + ' states.');
