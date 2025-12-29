const express = require('express');
const router = express.Router();
const WeatherData = require('../models/WeatherData');

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
