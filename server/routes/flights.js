/**
 * Flights API Routes
 * Fetches real-time flight data from OpenSky Network API
 */
const express = require('express');
const router = express.Router();

// OpenSky Network API (public, no auth required for limited data)
const OPENSKY_API = 'https://opensky-network.org/api/states/all';

// Cache for flight data (10 second TTL - OpenSky updates every ~10 seconds)
let cache = {
  data: null,
  timestamp: 0
};
const CACHE_TTL = 10 * 1000; // 10 seconds

// Altitude color scale (in meters)
const ALTITUDE_COLORS = [
  { threshold: 0, color: '#4CAF50' },
  { threshold: 1000, color: '#8BC34A' },
  { threshold: 3000, color: '#FFEB3B' },
  { threshold: 6000, color: '#FF9800' },
  { threshold: 9000, color: '#FF5722' },
  { threshold: 12000, color: '#9C27B0' },
];

function getAltitudeColor(altitude) {
  for (let i = ALTITUDE_COLORS.length - 1; i >= 0; i--) {
    if (altitude >= ALTITUDE_COLORS[i].threshold) {
      return ALTITUDE_COLORS[i].color;
    }
  }
  return ALTITUDE_COLORS[0].color;
}

/**
 * GET /api/flights
 * Returns current flight positions worldwide
 * Query params:
 *   - bounds: optional bounding box (lamin,lomin,lamax,lomax)
 */
router.get('/', async (req, res) => {
  try {
    // Check cache
    const now = Date.now();
    if (cache.data && (now - cache.timestamp) < CACHE_TTL) {
      console.log('Flights: serving cached data');
      return res.json(cache.data);
    }

    console.log('Flights: fetching from OpenSky Network...');

    // Build API URL with optional bounds
    let apiUrl = OPENSKY_API;
    if (req.query.bounds) {
      const [lamin, lomin, lamax, lomax] = req.query.bounds.split(',').map(Number);
      apiUrl += `?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`;
    }

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      // OpenSky rate limits at ~10 requests per 10 seconds for unauthenticated users
      if (response.status === 429) {
        console.log('Flights: rate limited, serving stale cache');
        if (cache.data) {
          return res.json(cache.data);
        }
        throw new Error('Rate limited by OpenSky API');
      }
      throw new Error(`OpenSky API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Transform OpenSky state vectors to our format
    // State vector indices: https://openskynetwork.github.io/opensky-api/rest.html#all-state-vectors
    const flights = (data.states || [])
      .filter(state => state[5] !== null && state[6] !== null) // Must have coordinates
      .map(state => {
        const altitude = state[7] || state[13] || 0; // baro_altitude or geo_altitude
        return {
          icao24: state[0],
          callsign: state[1]?.trim() || null,
          originCountry: state[2],
          lng: state[5],
          lat: state[6],
          altitude: altitude,
          geoAltitude: state[13] || altitude,
          velocity: state[9] || 0,
          heading: state[10] || 0,
          verticalRate: state[11] || 0,
          onGround: state[8] || false,
          lastContact: state[4],
          // Computed fields
          color: getAltitudeColor(altitude),
          altitudeFt: Math.round(altitude * 3.28084),
          speedKnots: Math.round((state[9] || 0) * 1.94384)
        };
      });

    const result = {
      flights,
      metadata: {
        totalFlights: flights.length,
        timestamp: new Date().toISOString(),
        dataSource: 'OpenSky Network'
      }
    };

    // Update cache
    cache = {
      data: result,
      timestamp: now
    };

    console.log(`Flights: fetched ${flights.length} aircraft`);
    res.json(result);

  } catch (error) {
    console.error('Flights API error:', error.message);

    // Return cached data if available
    if (cache.data) {
      console.log('Flights: serving stale cache due to error');
      return res.json(cache.data);
    }

    res.status(500).json({
      error: error.message,
      flights: [],
      metadata: {
        totalFlights: 0,
        timestamp: new Date().toISOString(),
        dataSource: 'OpenSky Network'
      }
    });
  }
});

/**
 * GET /api/flights/:icao24
 * Get details for a specific aircraft
 */
router.get('/:icao24', async (req, res) => {
  try {
    const { icao24 } = req.params;

    // For now, find in cache
    if (cache.data) {
      const flight = cache.data.flights.find(f => f.icao24 === icao24);
      if (flight) {
        return res.json(flight);
      }
    }

    res.status(404).json({ error: 'Aircraft not found' });
  } catch (error) {
    console.error('Flight details error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Track cache (30 second TTL - tracks update less frequently)
const trackCache = new Map();
const TRACK_CACHE_TTL = 30 * 1000;

/**
 * GET /api/flights/:icao24/track
 * Get flight track/trajectory for a specific aircraft
 */
router.get('/:icao24/track', async (req, res) => {
  try {
    const { icao24 } = req.params;
    const now = Date.now();

    // Check track cache
    const cached = trackCache.get(icao24);
    if (cached && (now - cached.timestamp) < TRACK_CACHE_TTL) {
      console.log(`Flights: serving cached track for ${icao24}`);
      return res.json(cached.data);
    }

    console.log(`Flights: fetching track for ${icao24}...`);

    // Fetch track from OpenSky - use time=0 for current track
    const trackUrl = `https://opensky-network.org/api/tracks/all?icao24=${icao24}&time=0`;

    const response = await fetch(trackUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.log('Flights: track rate limited, serving stale cache');
        if (cached) {
          return res.json(cached.data);
        }
        return res.json({ icao24, callsign: null, path: [] });
      }
      if (response.status === 404) {
        // No track available for this aircraft
        return res.json({ icao24, callsign: null, path: [] });
      }
      throw new Error(`OpenSky Track API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform track data
    // OpenSky track path format: [[time, lat, lng, baro_altitude, heading, on_ground], ...]
    const path = (data.path || []).map(point => ({
      time: point[0],
      lat: point[1],
      lng: point[2],
      altitude: point[3] || 0,
      heading: point[4] || 0,
      onGround: point[5] || false
    }));

    const result = {
      icao24: data.icao24 || icao24,
      callsign: data.callsign?.trim() || null,
      startTime: data.startTime,
      endTime: data.endTime,
      path
    };

    // Update cache
    trackCache.set(icao24, {
      data: result,
      timestamp: now
    });

    // Clean old cache entries
    for (const [key, value] of trackCache.entries()) {
      if (now - value.timestamp > TRACK_CACHE_TTL * 10) {
        trackCache.delete(key);
      }
    }

    console.log(`Flights: fetched track for ${icao24} with ${path.length} waypoints`);
    res.json(result);

  } catch (error) {
    console.error('Flight track error:', error.message);

    // Return empty track on error
    res.json({
      icao24: req.params.icao24,
      callsign: null,
      path: []
    });
  }
});

module.exports = router;
