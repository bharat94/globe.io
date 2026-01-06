/**
 * Satellite types for orbital visualization
 */

export type SatelliteCategory = 'iss' | 'starlink' | 'gps' | 'weather' | 'science' | 'other';

export interface TLEData {
  line1: string;
  line2: string;
}

export interface Satellite {
  id: string;
  name: string;
  category: SatelliteCategory;
  tle: TLEData;
  // Calculated real-time position
  lat?: number;
  lng?: number;
  alt?: number; // Altitude in km
  velocity?: number; // km/s
}

export interface SatellitePosition {
  id: string;
  lat: number;
  lng: number;
  alt: number; // Globe radius units (alt / EARTH_RADIUS)
  velocity: number;
  name: string;
  category: SatelliteCategory;
  color: string;
}

export interface SatelliteMetadata {
  totalCount: number;
  categories: {
    [key in SatelliteCategory]?: number;
  };
  lastUpdated: string;
}

export interface OrbitPath {
  satellite: Satellite;
  positions: Array<{ lat: number; lng: number; alt: number }>;
}

// Category display config
export const SATELLITE_CATEGORIES: Record<SatelliteCategory, {
  name: string;
  color: string;
  icon: string;
  description: string;
}> = {
  iss: {
    name: 'ISS',
    color: '#FFD700',
    icon: '🛸',
    description: 'International Space Station'
  },
  starlink: {
    name: 'Starlink',
    color: '#00BFFF',
    icon: '📡',
    description: 'SpaceX internet constellation'
  },
  gps: {
    name: 'GPS',
    color: '#32CD32',
    icon: '🛰️',
    description: 'Navigation satellites'
  },
  weather: {
    name: 'Weather',
    color: '#FF6B6B',
    icon: '🌦️',
    description: 'Meteorological satellites'
  },
  science: {
    name: 'Science',
    color: '#9B59B6',
    icon: '🔬',
    description: 'Research & observation'
  },
  other: {
    name: 'Other',
    color: '#95A5A6',
    icon: '✨',
    description: 'Miscellaneous satellites'
  }
};

// Earth radius in km (for altitude calculations)
export const EARTH_RADIUS_KM = 6371;
