/**
 * Pollution/Air Quality types
 */

// AQI categories based on US EPA standards
export type AQICategory = 'good' | 'moderate' | 'unhealthy_sensitive' | 'unhealthy' | 'very_unhealthy' | 'hazardous';

export interface AQICategoryConfig {
  name: string;
  range: [number, number];
  color: string;
  description: string;
}

export const AQI_CATEGORIES: Record<AQICategory, AQICategoryConfig> = {
  good: {
    name: 'Good',
    range: [0, 50],
    color: '#00E400',
    description: 'Air quality is satisfactory, little or no risk'
  },
  moderate: {
    name: 'Moderate',
    range: [51, 100],
    color: '#FFFF00',
    description: 'Acceptable; moderate health concern for sensitive people'
  },
  unhealthy_sensitive: {
    name: 'Unhealthy for Sensitive Groups',
    range: [101, 150],
    color: '#FF7E00',
    description: 'Sensitive groups may experience health effects'
  },
  unhealthy: {
    name: 'Unhealthy',
    range: [151, 200],
    color: '#FF0000',
    description: 'Everyone may begin to experience health effects'
  },
  very_unhealthy: {
    name: 'Very Unhealthy',
    range: [201, 300],
    color: '#8F3F97',
    description: 'Health alert: everyone may experience serious effects'
  },
  hazardous: {
    name: 'Hazardous',
    range: [301, 500],
    color: '#7E0023',
    description: 'Health emergency: entire population affected'
  }
};

// Individual pollutant measurements
export interface PollutantData {
  pm2_5: number | null;      // PM2.5 (μg/m³)
  pm10: number | null;       // PM10 (μg/m³)
  carbon_monoxide: number | null;  // CO (μg/m³)
  nitrogen_dioxide: number | null; // NO2 (μg/m³)
  sulphur_dioxide: number | null;  // SO2 (μg/m³)
  ozone: number | null;      // O3 (μg/m³)
  dust: number | null;       // Dust (μg/m³)
  uv_index: number | null;   // UV Index
}

// Air quality data point for heatmap
export interface PollutionDataPoint {
  lat: number;
  lng: number;
  aqi: number;              // US AQI value
  category: AQICategory;
  pollutants: PollutantData;
  weight: number;           // Normalized 0-1 for heatmap
  color: string;
}

// Detailed location data when clicked
export interface PollutionLocationData {
  lat: number;
  lng: number;
  aqi: number;
  category: AQICategory;
  pollutants: PollutantData;
  dominantPollutant: string;
  timestamp: string;
}

// API response metadata
export interface PollutionMetadata {
  totalPoints: number;
  resolution: number;
  lastUpdated: string;
  dataSource: string;
}

/**
 * Get AQI category from AQI value
 */
export function getAQICategory(aqi: number): AQICategory {
  if (aqi <= 50) return 'good';
  if (aqi <= 100) return 'moderate';
  if (aqi <= 150) return 'unhealthy_sensitive';
  if (aqi <= 200) return 'unhealthy';
  if (aqi <= 300) return 'very_unhealthy';
  return 'hazardous';
}

/**
 * Get color for AQI value
 */
export function getAQIColor(aqi: number): string {
  const category = getAQICategory(aqi);
  return AQI_CATEGORIES[category].color;
}

/**
 * Normalize AQI to 0-1 weight for heatmap
 * Using log scale since most values cluster in lower ranges
 */
export function normalizeAQI(aqi: number): number {
  // Clamp to valid range
  const clamped = Math.max(0, Math.min(500, aqi));
  // Log scale normalization for better visualization
  return Math.log(clamped + 1) / Math.log(501);
}
