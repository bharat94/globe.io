/**
 * Aurora/Space Weather types for northern/southern lights visualization
 */

export interface AuroraPoint {
  lat: number;
  lng: number;
  probability: number; // 0-100 aurora visibility probability
}

export interface SpaceWeather {
  kpIndex: number;
  kpTimestamp: string | null;
  forecast: string;
  viewingLatitude: string;
  scale: {
    value: number;
    description: string;
  };
}

export interface AuroraForecast {
  observationTime: string;
  forecastTime: string;
  points: AuroraPoint[];
  metadata: {
    totalPoints: number;
    maxProbability: number;
    timestamp: string;
  };
}

export interface AuroraMetadata {
  totalPoints: number;
  maxProbability: number;
  lastUpdated: string;
  kpIndex: number;
  forecast: string;
}

// Aurora probability color scale (green gradient)
export const AURORA_COLORS = {
  low: '#1a472a',      // Dark green (10-30%)
  medium: '#2d7a3e',   // Medium green (30-50%)
  high: '#3daa52',     // Bright green (50-70%)
  veryHigh: '#7cfc00', // Lime green (70-90%)
  extreme: '#adff2f',  // Yellow-green (90-100%)
};

/**
 * Get aurora color based on probability
 */
export function getAuroraColor(probability: number): string {
  if (probability >= 90) return AURORA_COLORS.extreme;
  if (probability >= 70) return AURORA_COLORS.veryHigh;
  if (probability >= 50) return AURORA_COLORS.high;
  if (probability >= 30) return AURORA_COLORS.medium;
  return AURORA_COLORS.low;
}

/**
 * Get Kp index color
 */
export function getKpColor(kpIndex: number): string {
  if (kpIndex >= 7) return '#ff0000'; // Red - extreme
  if (kpIndex >= 5) return '#ff6600'; // Orange - high
  if (kpIndex >= 4) return '#ffcc00'; // Yellow - moderate
  if (kpIndex >= 3) return '#99cc00'; // Yellow-green - active
  return '#00cc00'; // Green - quiet
}
