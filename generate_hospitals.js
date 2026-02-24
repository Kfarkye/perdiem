const fs = require('fs');

const hospitals = [
    { id: '240010', name: 'Mayo Clinic Hospital Rochester', address: '201 W Center St', city: 'Rochester', state: 'MN', zip: '55902', county: 'Olmsted', phone: '(507) 284-2511', type: 'Acute Care Hospitals', ownership: 'Voluntary non-profit - Private', er: true, rating: 5, lat: 44.0223, lon: -92.4665 },
    { id: '360180', name: 'Cleveland Clinic', address: '9500 Euclid Ave', city: 'Cleveland', state: 'OH', zip: '44195', county: 'Cuyahoga', phone: '(216) 444-2200', type: 'Acute Care Hospitals', ownership: 'Voluntary non-profit - Private', er: true, rating: 5, lat: 41.5034, lon: -81.6206 },
    { id: '220071', name: 'Massachusetts General Hospital', address: '55 Fruit St', city: 'Boston', state: 'MA', zip: '02114', county: 'Suffolk', phone: '(617) 726-2000', type: 'Acute Care Hospitals', ownership: 'Voluntary non-profit - Private', er: true, rating: 5, lat: 42.3626, lon: -71.0694 },
    { id: '210009', name: 'Johns Hopkins Hospital', address: '1800 Orleans St', city: 'Baltimore', state: 'MD', zip: '21287', county: 'Baltimore City', phone: '(410) 955-5000', type: 'Acute Care Hospitals', ownership: 'Voluntary non-profit - Private', er: true, rating: 5, lat: 39.2973, lon: -76.5902 },
    { id: '050136', name: 'UCLA Medical Center', address: '757 Westwood Plaza', city: 'Los Angeles', state: 'CA', zip: '90095', county: 'Los Angeles', phone: '(310) 825-9111', type: 'Acute Care Hospitals', ownership: 'Government - State', er: true, rating: 4, lat: 34.0664, lon: -118.4447 },
    { id: '050441', name: 'Stanford Hospital', address: '300 Pasteur Dr', city: 'Stanford', state: 'CA', zip: '94305', county: 'Santa Clara', phone: '(650) 723-4000', type: 'Acute Care Hospitals', ownership: 'Voluntary non-profit - Other', er: true, rating: 5, lat: 37.4334, lon: -122.1763 },
    { id: '330214', name: 'New York-Presbyterian Hospital', address: '525 E 68th St', city: 'New York', state: 'NY', zip: '10065', county: 'New York', phone: '(212) 746-5454', type: 'Acute Care Hospitals', ownership: 'Voluntary non-profit - Private', er: true, rating: 4, lat: 40.7645, lon: -73.9531 },
    { id: '390164', name: 'Hospital of the University of Pennsylvania', address: '3400 Spruce St', city: 'Philadelphia', state: 'PA', zip: '19104', county: 'Philadelphia', phone: '(215) 662-4000', type: 'Acute Care Hospitals', ownership: 'Voluntary non-profit - Private', er: true, rating: 4, lat: 39.9496, lon: -75.1936 },
    { id: '140088', name: 'Northwestern Memorial Hospital', address: '251 E Huron St', city: 'Chicago', state: 'IL', zip: '60611', county: 'Cook', phone: '(312) 926-2000', type: 'Acute Care Hospitals', ownership: 'Voluntary non-profit - Private', er: true, rating: 5, lat: 41.8953, lon: -87.6202 },
    { id: '050100', name: 'UCSF Medical Center', address: '505 Parnassus Ave', city: 'San Francisco', state: 'CA', zip: '94143', county: 'San Francisco', phone: '(415) 476-1000', type: 'Acute Care Hospitals', ownership: 'Government - State', er: true, rating: 4, lat: 37.7629, lon: -122.4580 },
    { id: '450054', name: 'Houston Methodist Hospital', address: '6565 Fannin St', city: 'Houston', state: 'TX', zip: '77030', county: 'Harris', phone: '(713) 790-3311', type: 'Acute Care Hospitals', ownership: 'Voluntary non-profit - Private', er: true, rating: 5, lat: 29.7118, lon: -95.3985 },
    { id: '060014', name: 'UCHealth University of Colorado Hospital', address: '12605 E 16th Ave', city: 'Aurora', state: 'CO', zip: '80045', county: 'Adams', phone: '(720) 848-0000', type: 'Acute Care Hospitals', ownership: 'Voluntary non-profit - Private', er: true, rating: 5, lat: 39.7424, lon: -104.8368 },
    { id: '330101', name: 'Mount Sinai Hospital', address: '1 Gustave L Levy Pl', city: 'New York', state: 'NY', zip: '10029', county: 'New York', phone: '(212) 241-6500', type: 'Acute Care Hospitals', ownership: 'Voluntary non-profit - Private', er: true, rating: 4, lat: 40.7896, lon: -73.9538 },
    { id: '230046', name: 'University of Michigan Hospitals', address: '1500 E Medical Center Dr', city: 'Ann Arbor', state: 'MI', zip: '48109', county: 'Washtenaw', phone: '(734) 936-4000', type: 'Acute Care Hospitals', ownership: 'Government - State', er: true, rating: 5, lat: 42.2829, lon: -83.7275 },
    { id: '340061', name: 'Duke University Hospital', address: '2301 Erwin Rd', city: 'Durham', state: 'NC', zip: '27710', county: 'Durham', phone: '(919) 684-8111', type: 'Acute Care Hospitals', ownership: 'Voluntary non-profit - Private', er: true, rating: 4, lat: 36.0076, lon: -78.9378 },
    { id: '050117', name: 'Cedars-Sinai Medical Center', address: '8700 Beverly Blvd', city: 'Los Angeles', state: 'CA', zip: '90048', county: 'Los Angeles', phone: '(310) 423-3277', type: 'Acute Care Hospitals', ownership: 'Voluntary non-profit - Private', er: true, rating: 4, lat: 34.0754, lon: -118.3804 },
    { id: '100007', name: 'UF Health Shands Hospital', address: '1600 SW Archer Rd', city: 'Gainesville', state: 'FL', zip: '32608', county: 'Alachua', phone: '(352) 265-0111', type: 'Acute Care Hospitals', ownership: 'Voluntary non-profit - Private', er: true, rating: 4, lat: 29.6397, lon: -82.3421 },
    { id: '380026', name: 'OHSU Hospital', address: '3181 SW Sam Jackson Park Rd', city: 'Portland', state: 'OR', zip: '97239', county: 'Multnomah', phone: '(503) 494-8311', type: 'Acute Care Hospitals', ownership: 'Government - State', er: true, rating: 4, lat: 45.4988, lon: -122.6865 },
    { id: '500008', name: 'University of Washington Medical Center', address: '1959 NE Pacific St', city: 'Seattle', state: 'WA', zip: '98195', county: 'King', phone: '(206) 598-3300', type: 'Acute Care Hospitals', ownership: 'Government - State', er: true, rating: 4, lat: 47.6496, lon: -122.3082 },
    { id: '440039', name: 'Vanderbilt University Medical Center', address: '1211 Medical Center Dr', city: 'Nashville', state: 'TN', zip: '37232', county: 'Davidson', phone: '(615) 322-5000', type: 'Acute Care Hospitals', ownership: 'Voluntary non-profit - Private', er: true, rating: 4, lat: 36.1408, lon: -86.8016 }
];

const unique = new Map();
hospitals.forEach(h => unique.set(h.id, h));

const values = Array.from(unique.values()).map(h => {
    return `('${h.id}', '${h.name.replace(/'/g, "''")}', '${h.address.replace(/'/g, "''")}', '${h.city.replace(/'/g, "''")}', '${h.state}', '${h.zip}', '${h.county.replace(/'/g, "''")}', '${h.phone}', '${h.type}', '${h.ownership.replace(/'/g, "''")}', ${h.er}, ${h.rating}, ${h.lat}, ${h.lon})`;
});

let sql = `BEGIN;
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
${values.join(',\n')}
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
`;

fs.writeFileSync('insert_hospitals.sql', sql);
console.log('Done: insert_hospitals.sql generated with ' + unique.size + ' records.');
