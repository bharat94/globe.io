/**
 * Population API Routes
 * Provides country-level population data over time
 */
const express = require('express');
const router = express.Router();
const PopulationData = require('../models/PopulationData');

/**
 * GET /api/population/years
 * Returns available year range
 */
router.get('/years', async (req, res) => {
  try {
    const stats = await PopulationData.aggregate([
      {
        $group: {
          _id: null,
          minYear: { $min: '$year' },
          maxYear: { $max: '$year' }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.json({ minYear: 1960, maxYear: 2023 });
    }

    res.json({
      minYear: stats[0].minYear,
      maxYear: stats[0].maxYear
    });
  } catch (error) {
    console.error('Error fetching population years:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/population/data/:year
 * Returns population data for all countries in a given year
 * Used for globe visualization (bubbles sized by population)
 */
router.get('/data/:year', async (req, res) => {
  try {
    const year = parseInt(req.params.year);

    if (isNaN(year) || year < 1960 || year > 2100) {
      return res.status(400).json({ message: 'Invalid year' });
    }

    const data = await PopulationData.find({ year })
      .select('countryCode countryCode3 countryName lat lng population')
      .lean();

    // Calculate max population for normalization
    const maxPopulation = Math.max(...data.map(d => d.population));

    // Transform to visualization format
    const result = data.map(d => ({
      countryCode: d.countryCode,
      countryCode3: d.countryCode3,
      name: d.countryName,
      lat: d.lat,
      lng: d.lng,
      population: d.population,
      // Normalized weight for bubble sizing (0-1 scale, using sqrt for better distribution)
      weight: Math.sqrt(d.population / maxPopulation),
      // Formatted population string
      populationFormatted: formatPopulation(d.population)
    }));

    console.log(`Population: year=${year}, countries=${result.length}`);
    res.json(result);
  } catch (error) {
    console.error('Error fetching population data:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/population/country/:code
 * Returns population history for a specific country
 */
router.get('/country/:code', async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();

    const data = await PopulationData.find({ countryCode: code })
      .select('year population')
      .sort({ year: 1 })
      .lean();

    if (data.length === 0) {
      return res.status(404).json({ message: 'Country not found' });
    }

    // Get country info from first record
    const countryInfo = await PopulationData.findOne({ countryCode: code })
      .select('countryName countryCode3 lat lng')
      .lean();

    res.json({
      countryCode: code,
      countryCode3: countryInfo.countryCode3,
      name: countryInfo.countryName,
      lat: countryInfo.lat,
      lng: countryInfo.lng,
      history: data.map(d => ({
        year: d.year,
        population: d.population,
        populationFormatted: formatPopulation(d.population)
      }))
    });
  } catch (error) {
    console.error('Error fetching country population:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/population/country/:code/details
 * Returns detailed demographic data for a country from World Bank API
 * Fetches: gender split, age distribution, urban/rural, life expectancy, growth rate
 */
router.get('/country/:code/details', async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const year = parseInt(req.query.year) || 2020;

    // Get basic country info from our DB
    const countryInfo = await PopulationData.findOne({ countryCode: code, year })
      .select('countryName countryCode3 population')
      .lean();

    if (!countryInfo) {
      return res.status(404).json({ message: 'Country not found' });
    }

    // World Bank indicators to fetch
    const indicators = {
      'SP.POP.TOTL.FE.ZS': 'femalePercent',      // Female population %
      'SP.POP.0014.TO.ZS': 'ages0to14',          // Ages 0-14 %
      'SP.POP.1564.TO.ZS': 'ages15to64',         // Ages 15-64 %
      'SP.POP.65UP.TO.ZS': 'ages65plus',         // Ages 65+ %
      'SP.DYN.LE00.IN': 'lifeExpectancy',        // Life expectancy
      'SP.URB.TOTL.IN.ZS': 'urbanPercent',       // Urban population %
      'SP.POP.GROW': 'growthRate',               // Annual growth rate %
      'EN.POP.DNST': 'density',                  // Population density
      'SP.DYN.TFRT.IN': 'fertilityRate',         // Fertility rate
    };

    // Fetch all indicators in parallel
    const indicatorCodes = Object.keys(indicators);
    const fetchPromises = indicatorCodes.map(async (indicator) => {
      try {
        const url = `https://api.worldbank.org/v2/country/${code}/indicator/${indicator}?format=json&date=${year}`;
        const response = await fetch(url);
        if (!response.ok) return null;
        const data = await response.json();
        if (data && data[1] && data[1][0] && data[1][0].value !== null) {
          return { key: indicators[indicator], value: data[1][0].value };
        }
        return null;
      } catch {
        return null;
      }
    });

    const results = await Promise.all(fetchPromises);

    // Build demographics object
    const demographics = {};
    results.forEach(result => {
      if (result) {
        demographics[result.key] = result.value;
      }
    });

    // Calculate derived values
    if (demographics.femalePercent) {
      demographics.malePercent = 100 - demographics.femalePercent;
    }
    if (demographics.urbanPercent) {
      demographics.ruralPercent = 100 - demographics.urbanPercent;
    }

    // Get population history for sparkline
    const history = await PopulationData.find({ countryCode: code })
      .select('year population')
      .sort({ year: 1 })
      .lean();

    res.json({
      countryCode: code,
      countryCode3: countryInfo.countryCode3,
      name: countryInfo.countryName,
      year,
      population: countryInfo.population,
      populationFormatted: formatPopulation(countryInfo.population),
      demographics,
      history: history.map(h => ({
        year: h.year,
        population: h.population
      }))
    });
  } catch (error) {
    console.error('Error fetching country details:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/population/top/:year
 * Returns top N countries by population for a given year
 */
router.get('/top/:year', async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    const limit = parseInt(req.query.limit) || 10;

    const data = await PopulationData.find({ year })
      .sort({ population: -1 })
      .limit(limit)
      .select('countryCode countryName population')
      .lean();

    res.json(data.map((d, i) => ({
      rank: i + 1,
      countryCode: d.countryCode,
      name: d.countryName,
      population: d.population,
      populationFormatted: formatPopulation(d.population)
    })));
  } catch (error) {
    console.error('Error fetching top populations:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/population/stats
 * Returns overall statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await PopulationData.aggregate([
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          minYear: { $min: '$year' },
          maxYear: { $max: '$year' },
          countries: { $addToSet: '$countryCode' }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.json({
        totalRecords: 0,
        countries: 0,
        minYear: null,
        maxYear: null
      });
    }

    res.json({
      totalRecords: stats[0].totalRecords,
      countries: stats[0].countries.length,
      minYear: stats[0].minYear,
      maxYear: stats[0].maxYear
    });
  } catch (error) {
    console.error('Error fetching population stats:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Format population number for display
 */
function formatPopulation(pop) {
  if (pop >= 1e9) {
    return (pop / 1e9).toFixed(2) + 'B';
  } else if (pop >= 1e6) {
    return (pop / 1e6).toFixed(1) + 'M';
  } else if (pop >= 1e3) {
    return (pop / 1e3).toFixed(0) + 'K';
  }
  return pop.toString();
}

module.exports = router;
