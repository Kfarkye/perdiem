BEGIN;
CREATE TABLE IF NOT EXISTS cms_hospitals (
  cms_id TEXT PRIMARY KEY,
  name TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  county TEXT,
  phone TEXT,
  hospital_type TEXT,
  ownership TEXT,
  emergency_services BOOLEAN,
  overall_rating INTEGER,
  latitude NUMERIC,
  longitude NUMERIC
);

INSERT INTO cms_hospitals (cms_id, name, address, city, state, zip, county, phone, hospital_type, ownership, emergency_services, overall_rating, latitude, longitude) VALUES
('240010', 'Mayo Clinic Hospital Rochester', '201 W Center St', 'Rochester', 'MN', '55902', 'Olmsted', '(507) 284-2511', 'Acute Care Hospitals', 'Voluntary non-profit - Private', true, 5, 44.0223, -92.4665),
('360180', 'Cleveland Clinic', '9500 Euclid Ave', 'Cleveland', 'OH', '44195', 'Cuyahoga', '(216) 444-2200', 'Acute Care Hospitals', 'Voluntary non-profit - Private', true, 5, 41.5034, -81.6206),
('220071', 'Massachusetts General Hospital', '55 Fruit St', 'Boston', 'MA', '02114', 'Suffolk', '(617) 726-2000', 'Acute Care Hospitals', 'Voluntary non-profit - Private', true, 5, 42.3626, -71.0694),
('210009', 'Johns Hopkins Hospital', '1800 Orleans St', 'Baltimore', 'MD', '21287', 'Baltimore City', '(410) 955-5000', 'Acute Care Hospitals', 'Voluntary non-profit - Private', true, 5, 39.2973, -76.5902),
('050136', 'UCLA Medical Center', '757 Westwood Plaza', 'Los Angeles', 'CA', '90095', 'Los Angeles', '(310) 825-9111', 'Acute Care Hospitals', 'Government - State', true, 4, 34.0664, -118.4447),
('050441', 'Stanford Hospital', '300 Pasteur Dr', 'Stanford', 'CA', '94305', 'Santa Clara', '(650) 723-4000', 'Acute Care Hospitals', 'Voluntary non-profit - Other', true, 5, 37.4334, -122.1763),
('330214', 'New York-Presbyterian Hospital', '525 E 68th St', 'New York', 'NY', '10065', 'New York', '(212) 746-5454', 'Acute Care Hospitals', 'Voluntary non-profit - Private', true, 4, 40.7645, -73.9531),
('390164', 'Hospital of the University of Pennsylvania', '3400 Spruce St', 'Philadelphia', 'PA', '19104', 'Philadelphia', '(215) 662-4000', 'Acute Care Hospitals', 'Voluntary non-profit - Private', true, 4, 39.9496, -75.1936),
('140088', 'Northwestern Memorial Hospital', '251 E Huron St', 'Chicago', 'IL', '60611', 'Cook', '(312) 926-2000', 'Acute Care Hospitals', 'Voluntary non-profit - Private', true, 5, 41.8953, -87.6202),
('050100', 'UCSF Medical Center', '505 Parnassus Ave', 'San Francisco', 'CA', '94143', 'San Francisco', '(415) 476-1000', 'Acute Care Hospitals', 'Government - State', true, 4, 37.7629, -122.458),
('450054', 'Houston Methodist Hospital', '6565 Fannin St', 'Houston', 'TX', '77030', 'Harris', '(713) 790-3311', 'Acute Care Hospitals', 'Voluntary non-profit - Private', true, 5, 29.7118, -95.3985),
('060014', 'UCHealth University of Colorado Hospital', '12605 E 16th Ave', 'Aurora', 'CO', '80045', 'Adams', '(720) 848-0000', 'Acute Care Hospitals', 'Voluntary non-profit - Private', true, 5, 39.7424, -104.8368),
('330101', 'Mount Sinai Hospital', '1 Gustave L Levy Pl', 'New York', 'NY', '10029', 'New York', '(212) 241-6500', 'Acute Care Hospitals', 'Voluntary non-profit - Private', true, 4, 40.7896, -73.9538),
('230046', 'University of Michigan Hospitals', '1500 E Medical Center Dr', 'Ann Arbor', 'MI', '48109', 'Washtenaw', '(734) 936-4000', 'Acute Care Hospitals', 'Government - State', true, 5, 42.2829, -83.7275),
('340061', 'Duke University Hospital', '2301 Erwin Rd', 'Durham', 'NC', '27710', 'Durham', '(919) 684-8111', 'Acute Care Hospitals', 'Voluntary non-profit - Private', true, 4, 36.0076, -78.9378),
('050117', 'Cedars-Sinai Medical Center', '8700 Beverly Blvd', 'Los Angeles', 'CA', '90048', 'Los Angeles', '(310) 423-3277', 'Acute Care Hospitals', 'Voluntary non-profit - Private', true, 4, 34.0754, -118.3804),
('100007', 'UF Health Shands Hospital', '1600 SW Archer Rd', 'Gainesville', 'FL', '32608', 'Alachua', '(352) 265-0111', 'Acute Care Hospitals', 'Voluntary non-profit - Private', true, 4, 29.6397, -82.3421),
('380026', 'OHSU Hospital', '3181 SW Sam Jackson Park Rd', 'Portland', 'OR', '97239', 'Multnomah', '(503) 494-8311', 'Acute Care Hospitals', 'Government - State', true, 4, 45.4988, -122.6865),
('500008', 'University of Washington Medical Center', '1959 NE Pacific St', 'Seattle', 'WA', '98195', 'King', '(206) 598-3300', 'Acute Care Hospitals', 'Government - State', true, 4, 47.6496, -122.3082),
('440039', 'Vanderbilt University Medical Center', '1211 Medical Center Dr', 'Nashville', 'TN', '37232', 'Davidson', '(615) 322-5000', 'Acute Care Hospitals', 'Voluntary non-profit - Private', true, 4, 36.1408, -86.8016)
ON CONFLICT (cms_id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  zip = EXCLUDED.zip,
  county = EXCLUDED.county,
  phone = EXCLUDED.phone,
  hospital_type = EXCLUDED.hospital_type,
  ownership = EXCLUDED.ownership,
  emergency_services = EXCLUDED.emergency_services,
  overall_rating = EXCLUDED.overall_rating,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude;
COMMIT;
