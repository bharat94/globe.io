export interface GridPoint {
  lat: number;
  lng: number;
}

// Continental bounding boxes for land detection
const CONTINENTAL_BOUNDS = [
  // North America
  { minLat: 15, maxLat: 70, minLng: -170, maxLng: -50 },
  // Central America & Caribbean
  { minLat: 7, maxLat: 25, minLng: -120, maxLng: -60 },
  // South America
  { minLat: -55, maxLat: 15, minLng: -80, maxLng: -35 },
  // Europe
  { minLat: 35, maxLat: 70, minLng: -10, maxLng: 40 },
  // Africa
  { minLat: -35, maxLat: 37, minLng: -20, maxLng: 55 },
  // Middle East
  { minLat: 12, maxLat: 42, minLng: 25, maxLng: 65 },
  // Asia (main)
  { minLat: 5, maxLat: 75, minLng: 60, maxLng: 145 },
  // Southeast Asia & Indonesia
  { minLat: -10, maxLat: 25, minLng: 95, maxLng: 140 },
  // Japan & Korea
  { minLat: 30, maxLat: 45, minLng: 125, maxLng: 145 },
  // Australia
  { minLat: -45, maxLat: -10, minLng: 110, maxLng: 155 },
  // New Zealand
  { minLat: -47, maxLat: -34, minLng: 166, maxLng: 179 },
  // India subcontinent
  { minLat: 5, maxLat: 35, minLng: 68, maxLng: 98 },
  // UK & Ireland
  { minLat: 50, maxLat: 60, minLng: -11, maxLng: 2 },
  // Scandinavia
  { minLat: 55, maxLat: 71, minLng: 4, maxLng: 32 },
  // Russia (eastern)
  { minLat: 40, maxLat: 75, minLng: 140, maxLng: 180 },
  // Alaska extension
  { minLat: 55, maxLat: 70, minLng: -180, maxLng: -130 },
];

/**
 * Check if a point is likely on land using continental bounding boxes
 */
export const isLandPoint = (lat: number, lng: number): boolean => {
  return CONTINENTAL_BOUNDS.some(
    (bounds) =>
      lat >= bounds.minLat &&
      lat <= bounds.maxLat &&
      lng >= bounds.minLng &&
      lng <= bounds.maxLng
  );
};

/**
 * Generate a global grid of land points at specified resolution
 * @param resolution - Grid spacing in degrees (default 10)
 * @returns Array of land grid points
 */
export const generateGlobalGrid = (resolution: number = 10): GridPoint[] => {
  const points: GridPoint[] = [];

  // Lat range: -60 to 70 (excludes Antarctica and extreme Arctic)
  // Lng range: -180 to 180
  for (let lat = -60; lat <= 70; lat += resolution) {
    for (let lng = -180; lng < 180; lng += resolution) {
      if (isLandPoint(lat, lng)) {
        points.push({ lat, lng });
      }
    }
  }

  return points;
};

/**
 * Get the number of grid points for a given resolution
 */
export const getGridPointCount = (resolution: number = 10): number => {
  return generateGlobalGrid(resolution).length;
};
