/**
 * Flight data types for real-time aircraft tracking
 */

// Flight category type for filtering
export type FlightCategory = 'commercial' | 'cargo' | 'private' | 'military' | 'other';

// Category display configuration
export const FLIGHT_CATEGORIES: Record<FlightCategory, {
  name: string;
  color: string;
  icon: string;
  description: string;
}> = {
  commercial: {
    name: 'Commercial',
    color: '#4FC3F7',
    icon: '✈️',
    description: 'Passenger airlines'
  },
  cargo: {
    name: 'Cargo',
    color: '#FFA726',
    icon: '📦',
    description: 'Freight carriers'
  },
  private: {
    name: 'Private',
    color: '#AB47BC',
    icon: '🛩️',
    description: 'General aviation'
  },
  military: {
    name: 'Military',
    color: '#66BB6A',
    icon: '🎖️',
    description: 'Military aircraft'
  },
  other: {
    name: 'Other',
    color: '#78909C',
    icon: '❓',
    description: 'Unclassified'
  }
};

// Major commercial airline ICAO prefixes (3-letter codes)
export const COMMERCIAL_PREFIXES: string[] = [
  // US Major Airlines
  'AAL', 'UAL', 'DAL', 'SWA', 'ASA', 'JBU', 'NKS', 'FFT', 'HAL',
  // US Regional
  'SKW', 'RPA', 'ENY', 'ASH', 'JIA', 'CPZ', 'GJS', 'PDT',
  // European Major
  'BAW', 'DLH', 'AFR', 'KLM', 'IBE', 'AZA', 'SAS', 'FIN', 'TAP', 'AUA', 'SWR', 'BEL',
  // European Low Cost
  'EZY', 'RYR', 'WZZ', 'EJU', 'VLG', 'NOZ',
  // Asian Major
  'ANA', 'JAL', 'CPA', 'SIA', 'THA', 'MAS', 'KAL', 'AAR', 'EVA', 'CAL', 'CES', 'CSN', 'CCA', 'HVN',
  'PAL', 'VJC', 'JSA', 'TGW', 'AIQ', 'AXM',
  // Middle Eastern
  'UAE', 'ETD', 'QTR', 'THY', 'MEA', 'GFA', 'KAC', 'SVA', 'RJA', 'MSR',
  // Oceania
  'QFA', 'ANZ', 'VOZ', 'JST', 'FJI',
  // Latin America
  'LAN', 'TAM', 'AVA', 'AMX', 'GLO', 'AEA', 'ARG', 'CMP', 'SKU',
  // Canada
  'ACA', 'WJA', 'TSC', 'JZA',
  // African
  'SAA', 'ETH', 'RAM', 'MSC', 'KQA'
];

// Cargo airline ICAO prefixes
export const CARGO_PREFIXES: string[] = [
  'FDX', 'UPS', 'ABX', 'GTI', 'CLX', 'CAO', 'SQC', 'BOX', 'GEC', 'ADB',
  'KER', 'ICL', 'PAC', 'NCR', 'CKS', 'AHK', 'MPH', 'MAS', 'SRN'
];

// Military callsign patterns
export const MILITARY_PATTERNS: RegExp[] = [
  /^RCH\d/i,      // USAF REACH flights (heavy transports)
  /^RRR\d/i,      // USAF tankers
  /^DUKE\d/i,     // Various military
  /^NAVY\d/i,     // US Navy
  /^ARMY\d/i,     // US Army
  /^EVAC\d/i,     // Medical evacuation
  /^SAM\d/i,      // Special Air Mission
  /^EXEC\d/i,     // Executive flights
  /^TOPCAT/i,     // Military trainer
  /^VIPER\d/i,    // Fighter jets
  /^COBRA\d/i,    // Military
  /^HAWK\d/i,     // Military
  /^BOLT\d/i,     // Military
  /^\d{5}$/,      // 5-digit numeric (common military)
];

// Private/General aviation patterns
export const PRIVATE_PATTERNS: RegExp[] = [
  /^N\d{1,5}[A-Z]{0,2}$/i,   // US N-numbers (N12345, N123AB)
  /^G-[A-Z]{4}$/i,            // UK registrations
  /^C-[FG][A-Z]{3}$/i,        // Canada registrations
  /^VH-[A-Z]{3}$/i,           // Australia registrations
  /^D-[A-Z]{4}$/i,            // Germany registrations
  /^F-[A-Z]{4}$/i,            // France registrations
  /^I-[A-Z]{4}$/i,            // Italy registrations
  /^EC-[A-Z]{3}$/i,           // Spain registrations
  /^PH-[A-Z]{3}$/i,           // Netherlands registrations
  /^HB-[A-Z]{3}$/i,           // Switzerland registrations
  /^OE-[A-Z]{3}$/i,           // Austria registrations
  /^SE-[A-Z]{3}$/i,           // Sweden registrations
  /^LN-[A-Z]{3}$/i,           // Norway registrations
  /^OH-[A-Z]{3}$/i,           // Finland registrations
  /^OO-[A-Z]{3}$/i,           // Belgium registrations
  /^CS-[A-Z]{3}$/i,           // Portugal registrations
  /^ZK-[A-Z]{3}$/i,           // New Zealand registrations
  /^JA\d{4}$/i,               // Japan registrations
  /^HL\d{4}$/i,               // Korea registrations
  /^B-\d{4}$/i,               // Taiwan/China registrations
  /^9V-[A-Z]{3}$/i,           // Singapore registrations
  /^VT-[A-Z]{3}$/i,           // India registrations
  /^A6-[A-Z]{3}$/i,           // UAE registrations
  /^A7-[A-Z]{3}$/i,           // Qatar registrations
];

/**
 * Categorize a flight based on its callsign
 */
export function categorizeFlightByCallsign(callsign: string | null): FlightCategory {
  if (!callsign) return 'other';

  const trimmed = callsign.trim().toUpperCase();
  if (!trimmed) return 'other';

  // Check military patterns first (they can have varied formats)
  for (const pattern of MILITARY_PATTERNS) {
    if (pattern.test(trimmed)) return 'military';
  }

  // Extract 3-letter prefix for airline matching
  const prefix = trimmed.slice(0, 3);

  // Check commercial airlines
  if (COMMERCIAL_PREFIXES.includes(prefix)) return 'commercial';

  // Check cargo carriers
  if (CARGO_PREFIXES.includes(prefix)) return 'cargo';

  // Check private/GA patterns
  for (const pattern of PRIVATE_PATTERNS) {
    if (pattern.test(trimmed)) return 'private';
  }

  // Default to other
  return 'other';
}

/**
 * Get color for a flight category
 */
export function getCategoryColor(category: FlightCategory): string {
  return FLIGHT_CATEGORIES[category]?.color || FLIGHT_CATEGORIES.other.color;
}

export interface FlightTrackPoint {
  lat: number;
  lng: number;
  altitude: number;
  time: number;
  heading: number;
  onGround: boolean;
}

export interface FlightTrack {
  icao24: string;
  callsign: string | null;
  startTime?: number;
  endTime?: number;
  path: FlightTrackPoint[];
}

export interface Flight {
  icao24: string;           // Unique aircraft identifier (24-bit ICAO address)
  callsign: string | null;  // Flight number/callsign
  originCountry: string;    // Country of registration
  lat: number;              // Latitude in degrees
  lng: number;              // Longitude in degrees
  altitude: number;         // Barometric altitude in meters
  geoAltitude: number;      // Geometric altitude in meters
  velocity: number;         // Ground speed in m/s
  heading: number;          // True heading in degrees (clockwise from north)
  verticalRate: number;     // Vertical rate in m/s (positive = ascending)
  onGround: boolean;        // Whether aircraft is on ground
  lastContact: number;      // Unix timestamp of last position update
  // Computed fields for display
  color: string;            // Color based on altitude
  altitudeFt: number;       // Altitude in feet for display
  speedKnots: number;       // Speed in knots for display
  category: FlightCategory; // Flight category (commercial, cargo, private, military, other)
}

export interface FlightMetadata {
  totalFlights: number;
  timestamp: string;
  dataSource: string;
}

export interface FlightsResponse {
  flights: Flight[];
  metadata: FlightMetadata;
}

// Altitude color scale (in meters)
export const ALTITUDE_COLORS: { threshold: number; color: string; label: string }[] = [
  { threshold: 0, color: '#4CAF50', label: 'Ground' },
  { threshold: 1000, color: '#8BC34A', label: '< 3,000 ft' },
  { threshold: 3000, color: '#FFEB3B', label: '3,000 - 10,000 ft' },
  { threshold: 6000, color: '#FF9800', label: '10,000 - 20,000 ft' },
  { threshold: 9000, color: '#FF5722', label: '20,000 - 30,000 ft' },
  { threshold: 12000, color: '#9C27B0', label: '> 30,000 ft' },
];

/**
 * Get color for a given altitude
 */
export function getAltitudeColor(altitude: number): string {
  for (let i = ALTITUDE_COLORS.length - 1; i >= 0; i--) {
    if (altitude >= ALTITUDE_COLORS[i].threshold) {
      return ALTITUDE_COLORS[i].color;
    }
  }
  return ALTITUDE_COLORS[0].color;
}

/**
 * Convert meters to feet
 */
export function metersToFeet(meters: number): number {
  return Math.round(meters * 3.28084);
}

/**
 * Convert m/s to knots
 */
export function msToKnots(ms: number): number {
  return Math.round(ms * 1.94384);
}

/**
 * Get altitude band label
 */
export function getAltitudeBand(altitude: number): string {
  const feet = metersToFeet(altitude);
  if (feet < 1000) return 'Ground Level';
  if (feet < 10000) return 'Low Altitude';
  if (feet < 25000) return 'Medium Altitude';
  return 'High Altitude';
}

/**
 * Format flight callsign for display
 */
export function formatCallsign(callsign: string | null): string {
  if (!callsign) return 'Unknown';
  return callsign.trim().toUpperCase();
}
