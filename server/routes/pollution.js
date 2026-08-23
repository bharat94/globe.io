/**
 * Pollution/Air Quality API routes
 * Fetches data from Open-Meteo Air Quality API with caching
 */
const express = require('express');
const router = express.Router();

// Open-Meteo Air Quality API base URL
const API_BASE = 'https://air-quality-api.open-meteo.com/v1/air-quality';

// Cache settings
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const cache = {
  grid: null,
  timestamp: 0
};

// Progress tracking for long-running fetches
const fetchProgress = {
  isLoading: false,
  current: 0,
  total: 0,
  startTime: null
};

// Grid configuration for global coverage
const GRID_CONFIG = {
  latMin: -60,
  latMax: 70,
  lngMin: -180,
  lngMax: 180,
  resolution: 15 // 15 degree grid = fewer points, avoids rate limits
};

/**
 * Get AQI category from value
 */
function getAQICategory(aqi) {
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
function getAQIColor(aqi) {
  const colors = {
    good: '#00E400',
    moderate: '#FFFF00',
    unhealthy_sensitive: '#FF7E00',
    unhealthy: '#FF0000',
    very_unhealthy: '#8F3F97',
    hazardous: '#7E0023'
  };
  return colors[getAQICategory(aqi)];
}

/**
 * Normalize AQI to 0-1 weight
 */
function normalizeAQI(aqi) {
  const clamped = Math.max(0, Math.min(500, aqi));
  return Math.log(clamped + 1) / Math.log(501);
}

/**
 * Fetch air quality data for a single location with retry on 429
 */
async function fetchLocationData(lat, lng, retries = 1) {
  const url = `${API_BASE}?latitude=${lat}&longitude=${lng}&current=us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,dust,uv_index`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 429 && retries > 0) {
        // Rate limited — wait 1.2s and retry once
        await new Promise(r => setTimeout(r, 1200));
        return fetchLocationData(lat, lng, retries - 1);
      }
      throw new Error(`Open-Meteo returned ${response.status}`);
    }

    const data = await response.json();
    const current = data.current;

    if (!current || current.us_aqi === undefined) {
      return null;
    }

    const aqi = current.us_aqi || 0;

    return {
      lat,
      lng,
      aqi,
      category: getAQICategory(aqi),
      color: getAQIColor(aqi),
      weight: normalizeAQI(aqi),
      pollutants: {
        pm2_5: current.pm2_5 || null,
        pm10: current.pm10 || null,
        carbon_monoxide: current.carbon_monoxide || null,
        nitrogen_dioxide: current.nitrogen_dioxide || null,
        sulphur_dioxide: current.sulphur_dioxide || null,
        ozone: current.ozone || null,
        dust: current.dust || null,
        uv_index: current.uv_index || null
      }
    };
  } catch (error) {
    console.error(`Pollution: Error fetching ${lat},${lng}:`, error.message);
    return null;
  }
}

/**
 * Generate grid points for global coverage
 */
function generateGridPoints(resolution) {
  const points = [];
  const { latMin, latMax, lngMin, lngMax } = GRID_CONFIG;

  for (let lat = latMin; lat <= latMax; lat += resolution) {
    for (let lng = lngMin; lng < lngMax; lng += resolution) {
      points.push({ lat, lng });
    }
  }

  return points;
}

/**
 * Fetch global air quality grid data
 */
async function fetchGlobalGrid(resolution = 10) {
  const now = Date.now();

  // Return cached data if valid
  if (cache.grid && (now - cache.timestamp) < CACHE_TTL) {
    console.log('Pollution: Using cached grid data');
    return cache.grid;
  }

  console.log(`Pollution: Fetching global grid at ${resolution}° resolution...`);

  const gridPoints = generateGridPoints(resolution);
  console.log(`Pollution: Fetching ${gridPoints.length} points...`);

  // Initialize progress tracking
  fetchProgress.isLoading = true;
  fetchProgress.current = 0;
  fetchProgress.total = gridPoints.length;
  fetchProgress.startTime = Date.now();

  // Fetch in batches to avoid overwhelming the API
  // Tuned for Open-Meteo rate limits: 10 concurrent max, moderate delay
  const BATCH_SIZE = 10;
  const BATCH_DELAY = 250; // 250ms between batches
  const results = [];

  for (let i = 0; i < gridPoints.length; i += BATCH_SIZE) {
    const batch = gridPoints.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(p => fetchLocationData(p.lat, p.lng))
    );
    results.push(...batchResults.filter(r => r !== null));

    // Update progress
    fetchProgress.current = Math.min(i + BATCH_SIZE, gridPoints.length);

    // Delay between batches to respect rate limits
    if (i + BATCH_SIZE < gridPoints.length) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
    }
  }

  // Mark loading complete
  fetchProgress.isLoading = false;
  console.log(`Pollution: ${results.length} valid data points fetched`);

  // Update cache
  cache.grid = {
    data: results,
    metadata: {
      totalPoints: results.length,
      resolution,
      lastUpdated: new Date().toISOString(),
      dataSource: 'Open-Meteo Air Quality API'
    }
  };
  cache.timestamp = now;

  return cache.grid;
}

/**
 * GET /api/pollution/grid
 * Returns global air quality grid data
 */
router.get('/grid', async (req, res) => {
  try {
    const resolution = parseInt(req.query.resolution) || 10;
    const data = await fetchGlobalGrid(resolution);
    res.json(data);
  } catch (error) {
    console.error('Pollution grid error:', error);
    res.status(500).json({ error: 'Failed to fetch pollution data' });
  }
});

// Export helpers for pre-warming and testing
router.fetchGlobalGrid = fetchGlobalGrid;
router.cache = cache;

/**
 * GET /api/pollution/location
 * Returns detailed air quality for a specific location
 */
router.get('/location', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const data = await fetchLocationData(lat, lng);

    if (!data) {
      return res.status(404).json({ error: 'No data available for this location' });
    }

    // Add timestamp and dominant pollutant
    const pollutants = data.pollutants;
    let dominantPollutant = 'PM2.5';
    let maxValue = pollutants.pm2_5 || 0;

    if ((pollutants.pm10 || 0) > maxValue) {
      dominantPollutant = 'PM10';
      maxValue = pollutants.pm10;
    }
    if ((pollutants.ozone || 0) > maxValue * 2) { // O3 thresholds are different
      dominantPollutant = 'Ozone';
    }

    res.json({
      ...data,
      dominantPollutant,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Pollution location error:', error);
    res.status(500).json({ error: 'Failed to fetch location data' });
  }
});

/**
 * GET /api/pollution/progress
 * Returns current fetch progress
 */
router.get('/progress', (req, res) => {
  const progress = fetchProgress.isLoading
    ? Math.round((fetchProgress.current / fetchProgress.total) * 100)
    : 100;

  res.json({
    isLoading: fetchProgress.isLoading,
    progress,
    current: fetchProgress.current,
    total: fetchProgress.total,
    elapsedMs: fetchProgress.startTime ? Date.now() - fetchProgress.startTime : 0
  });
});

/**
 * GET /api/pollution/refresh
 * Force refresh of cached data
 */
router.get('/refresh', async (req, res) => {
  try {
    // Clear cache
    cache.grid = null;
    cache.timestamp = 0;

    // Fetch fresh data
    const data = await fetchGlobalGrid(10);
    res.json({
      message: 'Cache refreshed',
      totalPoints: data.metadata.totalPoints
    });
  } catch (error) {
    console.error('Pollution refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh data' });
  }
});

module.exports = router;
