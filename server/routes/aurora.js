/**
 * Aurora/Space Weather API Routes
 * Fetches aurora forecast and space weather data from NOAA SWPC
 */
const express = require('express');
const router = express.Router();

// NOAA Space Weather Prediction Center APIs
const AURORA_FORECAST_URL = 'https://services.swpc.noaa.gov/json/ovation_aurora_latest.json';
const KP_INDEX_URL = 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json';

// Cache for aurora data (15 minute TTL - NOAA updates every 30 min)
let auroraCache = {
  data: null,
  timestamp: 0
};

let kpCache = {
  data: null,
  timestamp: 0
};

const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

/**
 * GET /api/aurora/forecast
 * Returns aurora probability grid
 */
router.get('/forecast', async (req, res) => {
  try {
    const now = Date.now();

    // Check cache
    if (auroraCache.data && (now - auroraCache.timestamp) < CACHE_TTL) {
      console.log('Aurora: serving cached forecast');
      return res.json(auroraCache.data);
    }

    console.log('Aurora: fetching forecast from NOAA SWPC...');

    const response = await fetch(AURORA_FORECAST_URL, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`NOAA API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform NOAA ovation data to our format
    // NOAA format: { "Observation Time": "...", "Forecast Time": "...", "coordinates": [[long, lat, aurora_power], ...] }
    const points = (data.coordinates || []).map(coord => ({
      lng: coord[0],
      lat: coord[1],
      probability: Math.min(100, Math.round(coord[2] * 10)) // Aurora power to probability 0-100
    })).filter(p =>
      // Filter to polar regions where aurora is visible
      Math.abs(p.lat) > 45 && p.probability > 5
    );

    const result = {
      observationTime: data['Observation Time'],
      forecastTime: data['Forecast Time'],
      points,
      metadata: {
        totalPoints: points.length,
        maxProbability: Math.max(...points.map(p => p.probability)),
        timestamp: new Date().toISOString()
      }
    };

    // Update cache
    auroraCache = {
      data: result,
      timestamp: now
    };

    console.log(`Aurora: fetched ${points.length} aurora points`);
    res.json(result);

  } catch (error) {
    console.error('Aurora forecast error:', error.message);

    // Return cached data if available
    if (auroraCache.data) {
      return res.json(auroraCache.data);
    }

    res.status(500).json({
      error: error.message,
      points: [],
      metadata: { totalPoints: 0, timestamp: new Date().toISOString() }
    });
  }
});

/**
 * GET /api/aurora/weather
 * Returns current space weather conditions (Kp index, solar wind, etc.)
 */
router.get('/weather', async (req, res) => {
  try {
    const now = Date.now();

    // Check cache
    if (kpCache.data && (now - kpCache.timestamp) < CACHE_TTL) {
      console.log('Aurora: serving cached Kp data');
      return res.json(kpCache.data);
    }

    console.log('Aurora: fetching Kp index from NOAA SWPC...');

    const response = await fetch(KP_INDEX_URL, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`NOAA Kp API error: ${response.status}`);
    }

    const data = await response.json();

    // NOAA format historically was array of arrays [timestamp, kp_value, ...] with header row.
    // Current API returns array of objects {time_tag, Kp, ...}. Handle both.
    let latestKp = null;
    let kpValue = 0;
    if (Array.isArray(data) && data.length > 1) {
      // Detect format: object array vs array-of-arrays
      const isObjectFormat = typeof data[1] === 'object' && !Array.isArray(data[1]) && 'Kp' in data[1];
      if (isObjectFormat) {
        // Object format: find last valid Kp
        for (let i = data.length - 1; i >= 0; i--) {
          const row = data[i];
          if (!row || row.Kp === undefined || row.Kp === null) continue;
          const v = parseFloat(row.Kp);
          if (!isNaN(v)) {
            latestKp = [row.time_tag, String(row.Kp)];
            kpValue = v;
            break;
          }
        }
      } else {
        // Legacy array format: array of [timestamp, kp_value, kp_type, observed_or_predicted]
        // First row is headers, data starts from index 1. Find last valid numeric Kp.
        for (let i = data.length - 1; i >= 1; i--) {
          const row = data[i];
          if (!row || row.length < 2) continue;
          if (String(row[0]).toLowerCase().includes('time_tag')) continue;
          const v = parseFloat(row[1]);
          if (!isNaN(v)) {
            latestKp = row;
            kpValue = v;
            break;
          }
        }
        if (!latestKp && data.length > 1) {
          for (let i = 1; i < data.length; i++) {
            const row = data[i];
            const v = parseFloat(row?.[1]);
            if (!isNaN(v)) {
              latestKp = row;
              kpValue = v;
              break;
            }
          }
        }
      }
    }
    if (!latestKp) {
      console.warn('Aurora: No valid Kp value found, data rows:', data?.length);
    }

    // Determine aurora visibility forecast based on Kp
    let forecast = 'Low';
    let viewingLatitude = 'Above 70°';

    if (kpValue >= 7) {
      forecast = 'Extreme';
      viewingLatitude = 'Above 40°';
    } else if (kpValue >= 6) {
      forecast = 'Very High';
      viewingLatitude = 'Above 45°';
    } else if (kpValue >= 5) {
      forecast = 'High';
      viewingLatitude = 'Above 50°';
    } else if (kpValue >= 4) {
      forecast = 'Moderate';
      viewingLatitude = 'Above 55°';
    } else if (kpValue >= 3) {
      forecast = 'Active';
      viewingLatitude = 'Above 60°';
    }

    const result = {
      kpIndex: latestKp ? kpValue : null,
      kpTimestamp: latestKp ? latestKp[0] : null,
      forecast: latestKp ? forecast : 'Unknown',
      viewingLatitude: latestKp ? viewingLatitude : 'N/A',
      // Kp scale description
      scale: {
        value: latestKp ? kpValue : null,
        description: latestKp ? getKpDescription(kpValue) : 'Data unavailable'
      },
      metadata: {
        source: 'NOAA SWPC',
        timestamp: new Date().toISOString()
      }
    };

    // Update cache
    kpCache = {
      data: result,
      timestamp: now
    };

    console.log(`Aurora: Kp index = ${kpValue}`);
    res.json(result);

  } catch (error) {
    console.error('Kp index error:', error.message);

    // Return cached data if available
    if (kpCache.data) {
      return res.json(kpCache.data);
    }

    res.status(500).json({
      error: error.message,
      kpIndex: 0,
      forecast: 'Unknown'
    });
  }
});

/**
 * GET /api/aurora
 * Returns combined aurora forecast and space weather
 */
router.get('/', async (req, res) => {
  try {
    // Fetch both in parallel
    const [forecastRes, weatherRes] = await Promise.all([
      fetch(`http://localhost:${process.env.PORT || 3001}/api/aurora/forecast`),
      fetch(`http://localhost:${process.env.PORT || 3001}/api/aurora/weather`)
    ]);

    const forecast = await forecastRes.json();
    const weather = await weatherRes.json();

    res.json({
      forecast: forecast.points || [],
      weather,
      metadata: {
        forecastTime: forecast.forecastTime,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Aurora combined error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

function getKpDescription(kp) {
  if (kp >= 9) return 'G5 Extreme Storm';
  if (kp >= 8) return 'G4 Severe Storm';
  if (kp >= 7) return 'G3 Strong Storm';
  if (kp >= 6) return 'G2 Moderate Storm';
  if (kp >= 5) return 'G1 Minor Storm';
  if (kp >= 4) return 'Active';
  if (kp >= 3) return 'Unsettled';
  if (kp >= 2) return 'Quiet';
  return 'Very Quiet';
}

module.exports = router;
