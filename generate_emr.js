const fs = require('fs');

const emrs = [
    { id: '240010', vendor: 'Epic', product: 'EpicCare', year: 2018, source: 'KLAS', confidence: 'confirmed' }, // Mayo Clinic
    { id: '360180', vendor: 'Epic', product: 'EpicCare', year: 2005, source: 'Press Release', confidence: 'confirmed' }, // Cleveland Clinic
    { id: '220071', vendor: 'Epic', product: 'EpicCare', year: 2015, source: 'Press Release', confidence: 'confirmed' }, // MGH (Partners HealthCare/Mass General Brigham)
    { id: '210009', vendor: 'Epic', product: 'EpicCare', year: 2013, source: 'Press Release', confidence: 'confirmed' }, // Johns Hopkins
    { id: '050136', vendor: 'Epic', product: 'EpicCare', year: 2013, source: 'Press Release', confidence: 'confirmed' }, // UCLA
    { id: '050441', vendor: 'Epic', product: 'EpicCare', year: 2008, source: 'KLAS', confidence: 'confirmed' }, // Stanford
    { id: '330214', vendor: 'Epic', product: 'EpicCare', year: 2020, source: 'Press Release', confidence: 'confirmed' }, // NYP
    { id: '390164', vendor: 'Epic', product: 'EpicCare', year: 2008, source: 'KLAS', confidence: 'confirmed' }, // Penn Med
    { id: '140088', vendor: 'Epic', product: 'EpicCare', year: 2018, source: 'Self-reported', confidence: 'confirmed' }, // Northwestern
    { id: '050100', vendor: 'Epic', product: 'APeX', year: 2012, source: 'Self-reported', confidence: 'confirmed' }, // UCSF
    { id: '450054', vendor: 'Epic', product: 'EpicCare', year: 2016, source: 'Press Release', confidence: 'confirmed' }, // Houston Methodist
    { id: '060014', vendor: 'Epic', product: 'EpicCare', year: 2011, source: 'KLAS', confidence: 'confirmed' }, // UCHealth
    { id: '330101', vendor: 'Epic', product: 'EpicCare', year: 2016, source: 'KLAS', confidence: 'confirmed' }, // Mount Sinai
    { id: '230046', vendor: 'Epic', product: 'MiChart', year: 2012, source: 'Self-reported', confidence: 'confirmed' }, // UMich
    { id: '340061', vendor: 'Epic', product: 'Maestro Care', year: 2014, source: 'Self-reported', confidence: 'confirmed' }, // Duke
    { id: '050117', vendor: 'Epic', product: 'CS-Link', year: 2012, source: 'Self-reported', confidence: 'confirmed' }, // Cedars Sinai
    { id: '100007', vendor: 'Epic', product: 'EpicCare', year: 2011, source: 'Press Release', confidence: 'confirmed' }, // UF Health
    { id: '380026', vendor: 'Epic', product: 'Epic OHSU', year: 2006, source: 'Self-reported', confidence: 'confirmed' }, // OHSU
    { id: '500008', vendor: 'Epic', product: 'EpicCare', year: 2021, source: 'Press Release', confidence: 'confirmed' }, // UW
    { id: '440039', vendor: 'Epic', product: 'eStar', year: 2017, source: 'Press Release', confidence: 'confirmed' } // Vanderbilt
];

const unique = new Map();
emrs.forEach(e => unique.set(e.id, e));

const values = Array.from(unique.values()).map(e => {
    return `('${e.id}', '${e.vendor.replace(/'/g, "''")}', '${e.product.replace(/'/g, "''")}', ${e.year}, '${e.source.replace(/'/g, "''")}', '${e.confidence}')`;
});

let sql = `BEGIN;
CREATE TABLE IF NOT EXISTS hospital_emr (
  cms_id TEXT REFERENCES cms_hospitals(cms_id),
  emr_vendor TEXT,
  emr_product TEXT,
  go_live_year INTEGER,
  source TEXT,
  confidence TEXT CHECK (confidence IN ('confirmed', 'likely', 'unverified')),
  PRIMARY KEY (cms_id)
);

INSERT INTO hospital_emr (cms_id, emr_vendor, emr_product, go_live_year, source, confidence) VALUES
${values.join(',\n')}
ON CONFLICT (cms_id) DO UPDATE SET
  emr_vendor = EXCLUDED.emr_vendor,
  emr_product = EXCLUDED.emr_product,
  go_live_year = EXCLUDED.go_live_year,
  source = EXCLUDED.source,
  confidence = EXCLUDED.confidence;
COMMIT;
`;

fs.writeFileSync('insert_emr.sql', sql);
console.log('Done: insert_emr.sql generated with ' + unique.size + ' records.');
