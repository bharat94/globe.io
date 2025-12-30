/**
 * Grid utilities for generating global land point grids
 * Used by ingestion framework and weather routes
 */

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
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean}
 */
function isLandPoint(lat, lng) {
  return CONTINENTAL_BOUNDS.some(
    (bounds) =>
      lat >= bounds.minLat &&
      lat <= bounds.maxLat &&
      lng >= bounds.minLng &&
      lng <= bounds.maxLng
  );
}

/**
 * Generate a global grid of land points at specified resolution
 * @param {number} resolution - Grid spacing in degrees (default 10)
 * @param {Object} viewport - Optional viewport bounds { minLat, maxLat, minLng, maxLng }
 * @returns {Array<{lat: number, lng: number}>} Array of land grid points
 */
function generateGlobalGrid(resolution = 10, viewport = null) {
  const points = [];

  // Default bounds: -60 to 70 lat (excludes Antarctica and extreme Arctic)
  const minLat = viewport?.minLat ?? -60;
  const maxLat = viewport?.maxLat ?? 70;
  const minLng = viewport?.minLng ?? -180;
  const maxLng = viewport?.maxLng ?? 180;

  for (let lat = minLat; lat <= maxLat; lat += resolution) {
    for (let lng = minLng; lng < maxLng; lng += resolution) {
      if (isLandPoint(lat, lng)) {
        points.push({ lat, lng });
      }
    }
  }

  return points;
}

/**
 * Get the number of grid points for a given resolution
 * @param {number} resolution - Grid spacing in degrees
 * @returns {number} Number of points
 */
function getGridPointCount(resolution = 10) {
  return generateGlobalGrid(resolution).length;
}

/**
 * Generate year-month pairs for a date range
 * @param {number} yearStart - Start year (inclusive)
 * @param {number} yearEnd - End year (inclusive)
 * @returns {Array<{year: number, month: number}>}
 */
function generateYearMonths(yearStart, yearEnd) {
  const yearMonths = [];
  for (let year = yearStart; year <= yearEnd; year++) {
    for (let month = 1; month <= 12; month++) {
      yearMonths.push({ year, month });
    }
  }
  return yearMonths;
}

/**
 * Normalize temperature to 0-1 range for heatmap visualization
 * @param {number} temp - Temperature in Celsius
 * @returns {number} Normalized value between 0 and 1
 */
function normalizeTemperature(temp) {
  const min = -40;
  const max = 45;
  return Math.max(0, Math.min(1, (temp - min) / (max - min)));
}

module.exports = {
  CONTINENTAL_BOUNDS,
  isLandPoint,
  generateGlobalGrid,
  getGridPointCount,
  generateYearMonths,
  normalizeTemperature
};
