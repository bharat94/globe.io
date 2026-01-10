/**
 * Flight data types for real-time aircraft tracking
 */

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
