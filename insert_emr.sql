BEGIN;
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
('240010', 'Epic', 'EpicCare', 2018, 'KLAS', 'confirmed'),
('360180', 'Epic', 'EpicCare', 2005, 'Press Release', 'confirmed'),
('220071', 'Epic', 'EpicCare', 2015, 'Press Release', 'confirmed'),
('210009', 'Epic', 'EpicCare', 2013, 'Press Release', 'confirmed'),
('050136', 'Epic', 'EpicCare', 2013, 'Press Release', 'confirmed'),
('050441', 'Epic', 'EpicCare', 2008, 'KLAS', 'confirmed'),
('330214', 'Epic', 'EpicCare', 2020, 'Press Release', 'confirmed'),
('390164', 'Epic', 'EpicCare', 2008, 'KLAS', 'confirmed'),
('140088', 'Epic', 'EpicCare', 2018, 'Self-reported', 'confirmed'),
('050100', 'Epic', 'APeX', 2012, 'Self-reported', 'confirmed'),
('450054', 'Epic', 'EpicCare', 2016, 'Press Release', 'confirmed'),
('060014', 'Epic', 'EpicCare', 2011, 'KLAS', 'confirmed'),
('330101', 'Epic', 'EpicCare', 2016, 'KLAS', 'confirmed'),
('230046', 'Epic', 'MiChart', 2012, 'Self-reported', 'confirmed'),
('340061', 'Epic', 'Maestro Care', 2014, 'Self-reported', 'confirmed'),
('050117', 'Epic', 'CS-Link', 2012, 'Self-reported', 'confirmed'),
('100007', 'Epic', 'EpicCare', 2011, 'Press Release', 'confirmed'),
('380026', 'Epic', 'Epic OHSU', 2006, 'Self-reported', 'confirmed'),
('500008', 'Epic', 'EpicCare', 2021, 'Press Release', 'confirmed'),
('440039', 'Epic', 'eStar', 2017, 'Press Release', 'confirmed')
ON CONFLICT (cms_id) DO UPDATE SET
  emr_vendor = EXCLUDED.emr_vendor,
  emr_product = EXCLUDED.emr_product,
  go_live_year = EXCLUDED.go_live_year,
  source = EXCLUDED.source,
  confidence = EXCLUDED.confidence;
COMMIT;
