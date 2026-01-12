/**
 * Airport database and lookup utilities
 * Used to determine flight origin/destination from track coordinates
 */

export interface Airport {
  code: string;      // IATA code
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
}

// Major world airports database (top ~200 by traffic)
export const AIRPORTS: Airport[] = [
  // North America
  { code: 'ATL', name: 'Hartsfield-Jackson', city: 'Atlanta', country: 'US', lat: 33.6407, lng: -84.4277 },
  { code: 'LAX', name: 'Los Angeles Intl', city: 'Los Angeles', country: 'US', lat: 33.9425, lng: -118.4081 },
  { code: 'ORD', name: "O'Hare Intl", city: 'Chicago', country: 'US', lat: 41.9742, lng: -87.9073 },
  { code: 'DFW', name: 'Dallas/Fort Worth', city: 'Dallas', country: 'US', lat: 32.8998, lng: -97.0403 },
  { code: 'DEN', name: 'Denver Intl', city: 'Denver', country: 'US', lat: 39.8561, lng: -104.6737 },
  { code: 'JFK', name: 'John F Kennedy', city: 'New York', country: 'US', lat: 40.6413, lng: -73.7781 },
  { code: 'SFO', name: 'San Francisco Intl', city: 'San Francisco', country: 'US', lat: 37.6213, lng: -122.379 },
  { code: 'SEA', name: 'Seattle-Tacoma', city: 'Seattle', country: 'US', lat: 47.4502, lng: -122.3088 },
  { code: 'LAS', name: 'McCarran Intl', city: 'Las Vegas', country: 'US', lat: 36.0840, lng: -115.1537 },
  { code: 'MCO', name: 'Orlando Intl', city: 'Orlando', country: 'US', lat: 28.4312, lng: -81.3081 },
  { code: 'EWR', name: 'Newark Liberty', city: 'Newark', country: 'US', lat: 40.6895, lng: -74.1745 },
  { code: 'MIA', name: 'Miami Intl', city: 'Miami', country: 'US', lat: 25.7959, lng: -80.2870 },
  { code: 'PHX', name: 'Phoenix Sky Harbor', city: 'Phoenix', country: 'US', lat: 33.4373, lng: -112.0078 },
  { code: 'IAH', name: 'George Bush', city: 'Houston', country: 'US', lat: 29.9902, lng: -95.3368 },
  { code: 'BOS', name: 'Logan Intl', city: 'Boston', country: 'US', lat: 42.3656, lng: -71.0096 },
  { code: 'MSP', name: 'Minneapolis-St Paul', city: 'Minneapolis', country: 'US', lat: 44.8848, lng: -93.2223 },
  { code: 'DTW', name: 'Detroit Metro', city: 'Detroit', country: 'US', lat: 42.2162, lng: -83.3554 },
  { code: 'PHL', name: 'Philadelphia Intl', city: 'Philadelphia', country: 'US', lat: 39.8729, lng: -75.2437 },
  { code: 'LGA', name: 'LaGuardia', city: 'New York', country: 'US', lat: 40.7769, lng: -73.8740 },
  { code: 'BWI', name: 'Baltimore-Washington', city: 'Baltimore', country: 'US', lat: 39.1774, lng: -76.6684 },
  { code: 'DCA', name: 'Reagan National', city: 'Washington', country: 'US', lat: 38.8512, lng: -77.0402 },
  { code: 'IAD', name: 'Dulles Intl', city: 'Washington', country: 'US', lat: 38.9531, lng: -77.4565 },
  { code: 'SAN', name: 'San Diego Intl', city: 'San Diego', country: 'US', lat: 32.7338, lng: -117.1933 },
  { code: 'TPA', name: 'Tampa Intl', city: 'Tampa', country: 'US', lat: 27.9755, lng: -82.5332 },
  { code: 'PDX', name: 'Portland Intl', city: 'Portland', country: 'US', lat: 45.5898, lng: -122.5951 },
  { code: 'SLC', name: 'Salt Lake City', city: 'Salt Lake City', country: 'US', lat: 40.7899, lng: -111.9791 },
  { code: 'HNL', name: 'Honolulu Intl', city: 'Honolulu', country: 'US', lat: 21.3187, lng: -157.9225 },
  { code: 'AUS', name: 'Austin-Bergstrom', city: 'Austin', country: 'US', lat: 30.1975, lng: -97.6664 },
  { code: 'YYZ', name: 'Toronto Pearson', city: 'Toronto', country: 'CA', lat: 43.6777, lng: -79.6248 },
  { code: 'YVR', name: 'Vancouver Intl', city: 'Vancouver', country: 'CA', lat: 49.1967, lng: -123.1815 },
  { code: 'YUL', name: 'Montreal Trudeau', city: 'Montreal', country: 'CA', lat: 45.4706, lng: -73.7408 },
  { code: 'MEX', name: 'Mexico City Intl', city: 'Mexico City', country: 'MX', lat: 19.4363, lng: -99.0721 },
  { code: 'CUN', name: 'Cancun Intl', city: 'Cancun', country: 'MX', lat: 21.0365, lng: -86.8771 },

  // Europe
  { code: 'LHR', name: 'Heathrow', city: 'London', country: 'GB', lat: 51.4700, lng: -0.4543 },
  { code: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'FR', lat: 49.0097, lng: 2.5479 },
  { code: 'AMS', name: 'Schiphol', city: 'Amsterdam', country: 'NL', lat: 52.3105, lng: 4.7683 },
  { code: 'FRA', name: 'Frankfurt', city: 'Frankfurt', country: 'DE', lat: 50.0379, lng: 8.5622 },
  { code: 'IST', name: 'Istanbul', city: 'Istanbul', country: 'TR', lat: 41.2753, lng: 28.7519 },
  { code: 'MAD', name: 'Barajas', city: 'Madrid', country: 'ES', lat: 40.4983, lng: -3.5676 },
  { code: 'BCN', name: 'El Prat', city: 'Barcelona', country: 'ES', lat: 41.2974, lng: 2.0833 },
  { code: 'FCO', name: 'Fiumicino', city: 'Rome', country: 'IT', lat: 41.8003, lng: 12.2389 },
  { code: 'LGW', name: 'Gatwick', city: 'London', country: 'GB', lat: 51.1537, lng: -0.1821 },
  { code: 'MUC', name: 'Munich', city: 'Munich', country: 'DE', lat: 48.3537, lng: 11.7750 },
  { code: 'ZRH', name: 'Zurich', city: 'Zurich', country: 'CH', lat: 47.4647, lng: 8.5492 },
  { code: 'ORY', name: 'Orly', city: 'Paris', country: 'FR', lat: 48.7262, lng: 2.3652 },
  { code: 'DUB', name: 'Dublin', city: 'Dublin', country: 'IE', lat: 53.4264, lng: -6.2499 },
  { code: 'VIE', name: 'Vienna', city: 'Vienna', country: 'AT', lat: 48.1103, lng: 16.5697 },
  { code: 'CPH', name: 'Copenhagen', city: 'Copenhagen', country: 'DK', lat: 55.6180, lng: 12.6508 },
  { code: 'OSL', name: 'Gardermoen', city: 'Oslo', country: 'NO', lat: 60.1976, lng: 11.1004 },
  { code: 'ARN', name: 'Arlanda', city: 'Stockholm', country: 'SE', lat: 59.6498, lng: 17.9238 },
  { code: 'HEL', name: 'Vantaa', city: 'Helsinki', country: 'FI', lat: 60.3172, lng: 24.9633 },
  { code: 'LIS', name: 'Lisbon', city: 'Lisbon', country: 'PT', lat: 38.7756, lng: -9.1354 },
  { code: 'ATH', name: 'Athens Intl', city: 'Athens', country: 'GR', lat: 37.9364, lng: 23.9445 },
  { code: 'BRU', name: 'Brussels', city: 'Brussels', country: 'BE', lat: 50.9010, lng: 4.4856 },
  { code: 'WAW', name: 'Chopin', city: 'Warsaw', country: 'PL', lat: 52.1657, lng: 20.9671 },
  { code: 'PRG', name: 'Vaclav Havel', city: 'Prague', country: 'CZ', lat: 50.1008, lng: 14.2600 },

  // Asia
  { code: 'PEK', name: 'Beijing Capital', city: 'Beijing', country: 'CN', lat: 40.0799, lng: 116.6031 },
  { code: 'HND', name: 'Haneda', city: 'Tokyo', country: 'JP', lat: 35.5494, lng: 139.7798 },
  { code: 'PVG', name: 'Pudong', city: 'Shanghai', country: 'CN', lat: 31.1443, lng: 121.8083 },
  { code: 'HKG', name: 'Hong Kong Intl', city: 'Hong Kong', country: 'HK', lat: 22.3080, lng: 113.9185 },
  { code: 'ICN', name: 'Incheon', city: 'Seoul', country: 'KR', lat: 37.4602, lng: 126.4407 },
  { code: 'SIN', name: 'Changi', city: 'Singapore', country: 'SG', lat: 1.3644, lng: 103.9915 },
  { code: 'BKK', name: 'Suvarnabhumi', city: 'Bangkok', country: 'TH', lat: 13.6900, lng: 100.7501 },
  { code: 'NRT', name: 'Narita', city: 'Tokyo', country: 'JP', lat: 35.7720, lng: 140.3929 },
  { code: 'DEL', name: 'Indira Gandhi', city: 'Delhi', country: 'IN', lat: 28.5562, lng: 77.1000 },
  { code: 'CAN', name: 'Baiyun', city: 'Guangzhou', country: 'CN', lat: 23.3924, lng: 113.2988 },
  { code: 'KUL', name: 'Kuala Lumpur', city: 'Kuala Lumpur', country: 'MY', lat: 2.7456, lng: 101.7099 },
  { code: 'CGK', name: 'Soekarno-Hatta', city: 'Jakarta', country: 'ID', lat: -6.1256, lng: 106.6559 },
  { code: 'MNL', name: 'Ninoy Aquino', city: 'Manila', country: 'PH', lat: 14.5086, lng: 121.0197 },
  { code: 'BOM', name: 'Chhatrapati Shivaji', city: 'Mumbai', country: 'IN', lat: 19.0896, lng: 72.8656 },
  { code: 'TPE', name: 'Taoyuan', city: 'Taipei', country: 'TW', lat: 25.0797, lng: 121.2342 },
  { code: 'SZX', name: 'Shenzhen Bao\'an', city: 'Shenzhen', country: 'CN', lat: 22.6393, lng: 113.8106 },
  { code: 'CTU', name: 'Chengdu Shuangliu', city: 'Chengdu', country: 'CN', lat: 30.5785, lng: 103.9471 },
  { code: 'SHA', name: 'Hongqiao', city: 'Shanghai', country: 'CN', lat: 31.1979, lng: 121.3363 },

  // Middle East
  { code: 'DXB', name: 'Dubai Intl', city: 'Dubai', country: 'AE', lat: 25.2532, lng: 55.3657 },
  { code: 'DOH', name: 'Hamad Intl', city: 'Doha', country: 'QA', lat: 25.2609, lng: 51.6138 },
  { code: 'AUH', name: 'Abu Dhabi', city: 'Abu Dhabi', country: 'AE', lat: 24.4330, lng: 54.6511 },
  { code: 'JED', name: 'King Abdulaziz', city: 'Jeddah', country: 'SA', lat: 21.6796, lng: 39.1565 },
  { code: 'RUH', name: 'King Khalid', city: 'Riyadh', country: 'SA', lat: 24.9576, lng: 46.6988 },
  { code: 'TLV', name: 'Ben Gurion', city: 'Tel Aviv', country: 'IL', lat: 32.0055, lng: 34.8854 },
  { code: 'AMM', name: 'Queen Alia', city: 'Amman', country: 'JO', lat: 31.7226, lng: 35.9932 },
  { code: 'CAI', name: 'Cairo Intl', city: 'Cairo', country: 'EG', lat: 30.1219, lng: 31.4056 },

  // Oceania
  { code: 'SYD', name: 'Kingsford Smith', city: 'Sydney', country: 'AU', lat: -33.9399, lng: 151.1753 },
  { code: 'MEL', name: 'Melbourne', city: 'Melbourne', country: 'AU', lat: -37.6690, lng: 144.8410 },
  { code: 'BNE', name: 'Brisbane', city: 'Brisbane', country: 'AU', lat: -27.3942, lng: 153.1218 },
  { code: 'AKL', name: 'Auckland', city: 'Auckland', country: 'NZ', lat: -37.0082, lng: 174.7850 },
  { code: 'PER', name: 'Perth', city: 'Perth', country: 'AU', lat: -31.9385, lng: 115.9672 },

  // South America
  { code: 'GRU', name: 'Guarulhos', city: 'Sao Paulo', country: 'BR', lat: -23.4356, lng: -46.4731 },
  { code: 'EZE', name: 'Ministro Pistarini', city: 'Buenos Aires', country: 'AR', lat: -34.8222, lng: -58.5358 },
  { code: 'BOG', name: 'El Dorado', city: 'Bogota', country: 'CO', lat: 4.7016, lng: -74.1469 },
  { code: 'LIM', name: 'Jorge Chavez', city: 'Lima', country: 'PE', lat: -12.0219, lng: -77.1143 },
  { code: 'SCL', name: 'Arturo Merino', city: 'Santiago', country: 'CL', lat: -33.3930, lng: -70.7858 },
  { code: 'GIG', name: 'Galeao', city: 'Rio de Janeiro', country: 'BR', lat: -22.8100, lng: -43.2506 },

  // Africa
  { code: 'JNB', name: "O.R. Tambo", city: 'Johannesburg', country: 'ZA', lat: -26.1392, lng: 28.2460 },
  { code: 'CPT', name: 'Cape Town', city: 'Cape Town', country: 'ZA', lat: -33.9715, lng: 18.6021 },
  { code: 'ADD', name: 'Bole', city: 'Addis Ababa', country: 'ET', lat: 8.9779, lng: 38.7993 },
  { code: 'NBO', name: 'Jomo Kenyatta', city: 'Nairobi', country: 'KE', lat: -1.3192, lng: 36.9278 },
  { code: 'CMN', name: 'Mohammed V', city: 'Casablanca', country: 'MA', lat: 33.3675, lng: -7.5900 },
  { code: 'LOS', name: 'Murtala Muhammed', city: 'Lagos', country: 'NG', lat: 6.5774, lng: 3.3212 },
];

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find the nearest airport to given coordinates
 * @param lat Latitude
 * @param lng Longitude
 * @param maxDistance Maximum distance in km to consider (default 50km)
 * @returns Nearest airport or null if none within maxDistance
 */
export function findNearestAirport(
  lat: number,
  lng: number,
  maxDistance: number = 50
): Airport | null {
  let nearest: Airport | null = null;
  let minDistance = Infinity;

  for (const airport of AIRPORTS) {
    const distance = haversineDistance(lat, lng, airport.lat, airport.lng);
    if (distance < minDistance && distance <= maxDistance) {
      minDistance = distance;
      nearest = airport;
    }
  }

  return nearest;
}

/**
 * Determine origin and destination airports from flight track
 * @param path Array of track points with lat, lng, altitude, onGround
 * @returns Object with origin and destination airports (or null if not determinable)
 */
export function determineFlightRoute(
  path: Array<{ lat: number; lng: number; altitude: number; onGround: boolean }>
): { origin: Airport | null; destination: Airport | null } {
  if (!path || path.length < 2) {
    return { origin: null, destination: null };
  }

  // Find first point (preferably on ground or low altitude)
  let originPoint = path[0];
  for (const point of path) {
    if (point.onGround || point.altitude < 500) {
      originPoint = point;
      break;
    }
  }

  // Find last point (preferably on ground or low altitude)
  let destinationPoint = path[path.length - 1];
  for (let i = path.length - 1; i >= 0; i--) {
    if (path[i].onGround || path[i].altitude < 500) {
      destinationPoint = path[i];
      break;
    }
  }

  // Look up nearest airports
  const origin = findNearestAirport(originPoint.lat, originPoint.lng);
  const destination = findNearestAirport(destinationPoint.lat, destinationPoint.lng);

  return { origin, destination };
}
