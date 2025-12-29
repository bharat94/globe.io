const express = require('express');
const router = express.Router();
const WeatherData = require('../models/WeatherData');
const WeatherCache = require('../models/WeatherCache');
const { fetchGridTemperature } = require('../services/openMeteo');

// Continental bounding boxes for land detection (same as frontend)
const CONTINENTAL_BOUNDS = [
  { minLat: 15, maxLat: 70, minLng: -170, maxLng: -50 },    // North America
  { minLat: 7, maxLat: 25, minLng: -120, maxLng: -60 },     // Central America
  { minLat: -55, maxLat: 15, minLng: -80, maxLng: -35 },    // South America
  { minLat: 35, maxLat: 70, minLng: -10, maxLng: 40 },      // Europe
  { minLat: -35, maxLat: 37, minLng: -20, maxLng: 55 },     // Africa
  { minLat: 12, maxLat: 42, minLng: 25, maxLng: 65 },       // Middle East
  { minLat: 5, maxLat: 75, minLng: 60, maxLng: 145 },       // Asia
  { minLat: -10, maxLat: 25, minLng: 95, maxLng: 140 },     // Southeast Asia
  { minLat: 30, maxLat: 45, minLng: 125, maxLng: 145 },     // Japan & Korea
  { minLat: -45, maxLat: -10, minLng: 110, maxLng: 155 },   // Australia
  { minLat: -47, maxLat: -34, minLng: 166, maxLng: 179 },   // New Zealand
  { minLat: 5, maxLat: 35, minLng: 68, maxLng: 98 },        // India
  { minLat: 50, maxLat: 60, minLng: -11, maxLng: 2 },       // UK & Ireland
  { minLat: 55, maxLat: 71, minLng: 4, maxLng: 32 },        // Scandinavia
  { minLat: 40, maxLat: 75, minLng: 140, maxLng: 180 },     // Russia (east)
  { minLat: 55, maxLat: 70, minLng: -180, maxLng: -130 },   // Alaska
];

const isLandPoint = (lat, lng) => {
  return CONTINENTAL_BOUNDS.some(b =>
    lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng
  );
};

const generateGlobalGrid = (resolution = 10) => {
  const points = [];
  for (let lat = -60; lat <= 70; lat += resolution) {
    for (let lng = -180; lng < 180; lng += resolution) {
      if (isLandPoint(lat, lng)) {
        points.push({ lat, lng });
      }
    }
  }
  return points;
};

// Normalize temperature to 0-1 range for heatmap
const normalizeTemperature = (temp) => {
  const min = -40;
  const max = 45;
  return Math.max(0, Math.min(1, (temp - min) / (max - min)));
};

// GET available years range
router.get('/years', async (req, res) => {
  try {
    const result = await WeatherData.aggregate([
      {
        $group: {
          _id: null,
          minYear: { $min: '$year' },
          maxYear: { $max: '$year' }
        }
      }
    ]);

    if (result.length === 0) {
      return res.json({ minYear: 2000, maxYear: 2024 });
    }

    res.json({
      minYear: result[0].minYear,
      maxYear: result[0].maxYear
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET global grid data for a specific year and month (fetches from Open-Meteo)
router.get('/grid/:year/:month', async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);

    // Validate year range (Open-Meteo historical data availability)
    if (year < 1940 || year > new Date().getFullYear()) {
      return res.status(400).json({ message: 'Year out of range (1940-present)' });
    }

    // Generate all grid points
    const allGridPoints = generateGlobalGrid(10);
    console.log(`Grid has ${allGridPoints.length} land points`);

    // Check cache for existing data
    const cachedData = await WeatherCache.find({ year, month });
    const cachedMap = new Map();
    cachedData.forEach(d => {
      cachedMap.set(`${d.lat},${d.lng}`, d);
    });

    // Find points that need fetching
    const missingPoints = allGridPoints.filter(p => !cachedMap.has(`${p.lat},${p.lng}`));

    console.log(`Found ${cachedData.length} cached, ${missingPoints.length} missing`);

    // Fetch missing points from Open-Meteo
    if (missingPoints.length > 0) {
      console.log(`Fetching ${missingPoints.length} points from Open-Meteo...`);

      try {
        const fetchedData = await fetchGridTemperature(missingPoints, year, month);

        // Save to cache
        if (fetchedData.length > 0) {
          const cacheEntries = fetchedData.map(d => ({
            lat: d.lat,
            lng: d.lng,
            year,
            month,
            temperature: d.temperature,
            source: 'open-meteo',
            fetchedAt: new Date()
          }));

          // Use insertMany with ordered: false to continue on duplicates
          try {
            await WeatherCache.insertMany(cacheEntries, { ordered: false });
            console.log(`Cached ${cacheEntries.length} new entries`);
          } catch (insertError) {
            // Ignore duplicate key errors, log others
            if (insertError.code !== 11000) {
              console.error('Cache insert error:', insertError.message);
            }
          }

          // Add to our result map
          fetchedData.forEach(d => {
            cachedMap.set(`${d.lat},${d.lng}`, d);
          });
        }
      } catch (fetchError) {
        console.error('Open-Meteo fetch error:', fetchError.message);
        // Continue with cached data only
      }
    }

    // Build response with all available data
    const heatmapData = [];
    allGridPoints.forEach(point => {
      const data = cachedMap.get(`${point.lat},${point.lng}`);
      if (data && data.temperature) {
        heatmapData.push({
          lat: point.lat,
          lng: point.lng,
          weight: normalizeTemperature(data.temperature.avg),
          temperature: data.temperature
        });
      }
    });

    console.log(`Returning ${heatmapData.length} heatmap points`);
    res.json(heatmapData);
  } catch (error) {
    console.error('Grid endpoint error:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET heatmap data for a specific year and month
router.get('/heatmap/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;

    const data = await WeatherData.find({
      year: parseInt(year),
      month: parseInt(month)
    }).select('location temperature cityName country');

    // Transform to heatmap format with normalized weights
    const heatmapData = data.map(d => ({
      lat: d.location.coordinates[1],
      lng: d.location.coordinates[0],
      weight: normalizeTemperature(d.temperature.avg),
      cityName: d.cityName,
      country: d.country,
      temperature: d.temperature
    }));

    res.json(heatmapData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all weather data for a specific year and month
router.get('/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;

    const data = await WeatherData.find({
      year: parseInt(year),
      month: parseInt(month)
    }).select('-__v -createdAt -updatedAt');

    // Transform to frontend format
    const transformedData = data.map(d => ({
      lat: d.location.coordinates[1],
      lng: d.location.coordinates[0],
      cityName: d.cityName,
      country: d.country,
      year: d.year,
      month: d.month,
      temperature: d.temperature,
      precipitation: d.precipitation,
      humidity: d.humidity,
      climateZone: d.climateZone
    }));

    res.json(transformedData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET weather data for a specific location (history)
router.get('/location/:lat/:lng', async (req, res) => {
  try {
    const { lat, lng } = req.params;
    const { year } = req.query;

    // Find nearest location within ~100km
    const query = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: 100000 // 100km
        }
      }
    };

    if (year) {
      query.year = parseInt(year);
    }

    const data = await WeatherData.find(query)
      .sort({ year: -1, month: 1 })
      .limit(120); // Max 10 years of monthly data

    // Transform data
    const transformedData = data.map(d => ({
      lat: d.location.coordinates[1],
      lng: d.location.coordinates[0],
      cityName: d.cityName,
      country: d.country,
      year: d.year,
      month: d.month,
      temperature: d.temperature,
      precipitation: d.precipitation,
      humidity: d.humidity,
      climateZone: d.climateZone
    }));

    res.json(transformedData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET weather trend for a city across years (for mini chart)
router.get('/trend/:cityName', async (req, res) => {
  try {
    const { cityName } = req.params;
    const { startYear = 2000, endYear = 2024 } = req.query;

    const data = await WeatherData.find({
      cityName: cityName,
      year: { $gte: parseInt(startYear), $lte: parseInt(endYear) }
    })
      .select('year month temperature')
      .sort({ year: 1, month: 1 });

    // Calculate yearly averages for the trend
    const yearlyData = {};
    data.forEach(d => {
      if (!yearlyData[d.year]) {
        yearlyData[d.year] = { temps: [], year: d.year };
      }
      yearlyData[d.year].temps.push(d.temperature.avg);
    });

    const trendData = Object.values(yearlyData).map(y => ({
      year: y.year,
      avgTemp: y.temps.reduce((a, b) => a + b, 0) / y.temps.length
    }));

    res.json(trendData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
