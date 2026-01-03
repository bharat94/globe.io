const express = require('express');
const router = express.Router();
const WeatherData = require('../models/WeatherData');
const DataService = require('../datasources/DataService');
const { normalizeTemperature } = require('../utils/gridUtils');

// GET available years range
router.get('/years', async (req, res) => {
  try {
    const metadata = await DataService.getMetadata('weather');
    res.json({
      minYear: metadata.minYear,
      maxYear: metadata.maxYear
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET global grid data for a specific year and month
// Supports query params: resolution (default 10), minLat, maxLat, minLng, maxLng
// Uses DataService which automatically selects static or dynamic source
router.get('/grid/:year/:month', async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);
    const resolution = parseFloat(req.query.resolution) || 10;

    // Validate year range
    if (year < 1940 || year > new Date().getFullYear()) {
      return res.status(400).json({ message: 'Year out of range (1940-present)' });
    }

    // Validate resolution
    const validResolutions = [10, 5, 2.5, 2, 1, 0.5];
    const actualResolution = validResolutions.includes(resolution) ? resolution : 10;

    // Parse optional viewport bounds
    const bounds = req.query.minLat ? {
      minLat: parseFloat(req.query.minLat),
      maxLat: parseFloat(req.query.maxLat),
      minLng: parseFloat(req.query.minLng),
      maxLng: parseFloat(req.query.maxLng)
    } : null;

    // Use DataService to fetch data (handles static vs dynamic selection)
    const data = await DataService.fetchGridData('weather', {
      year,
      month,
      resolution: actualResolution,
      bounds
    });

    console.log(`Grid: resolution=${actualResolution}°, points=${data.length}, bounds=${!!bounds}`);
    res.json(data);
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
