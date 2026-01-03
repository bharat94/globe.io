/**
 * Earthquake API Routes
 * Fetches real-time seismic data from USGS Earthquake API
 */
const express = require('express');
const router = express.Router();

// USGS Earthquake API base URL
const USGS_API = 'https://earthquake.usgs.gov/fdsnws/event/1/query';

// Cache for earthquake data (5 minute TTL)
let cache = {
  data: null,
  timestamp: 0,
  timeRange: null
};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * GET /api/earthquakes
 * Returns earthquake data for specified time range
 * Query params:
 *   - range: 'hour' | 'day' | 'week' | 'month' (default: 'day')
 *   - minmagnitude: minimum magnitude (default: 2.5)
 */
router.get('/', async (req, res) => {
  try {
    const range = req.query.range || 'day';
    const minMagnitude = parseFloat(req.query.minmagnitude) || 2.5;

    // Check cache
    const now = Date.now();
    if (cache.data && cache.timeRange === range && (now - cache.timestamp) < CACHE_TTL) {
      console.log(`Earthquakes: serving cached data (${range})`);
      return res.json(cache.data);
    }

    // Calculate time range
    const endTime = new Date();
    const startTime = new Date();
    switch (range) {
      case 'hour':
        startTime.setHours(startTime.getHours() - 1);
        break;
      case 'day':
        startTime.setDate(startTime.getDate() - 1);
        break;
      case 'week':
        startTime.setDate(startTime.getDate() - 7);
        break;
      case 'month':
        startTime.setMonth(startTime.getMonth() - 1);
        break;
      default:
        startTime.setDate(startTime.getDate() - 1);
    }

    // Fetch from USGS
    const url = `${USGS_API}?format=geojson&starttime=${startTime.toISOString()}&endtime=${endTime.toISOString()}&minmagnitude=${minMagnitude}&orderby=time`;

    console.log(`Earthquakes: fetching from USGS (${range}, mag >= ${minMagnitude})`);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`USGS API error: ${response.status}`);
    }

    const usgsData = await response.json();

    // Transform to our format
    const earthquakes = usgsData.features.map(feature => {
      const props = feature.properties;
      const coords = feature.geometry.coordinates;

      return {
        id: feature.id,
        lat: coords[1],
        lng: coords[0],
        depth: coords[2], // km below surface
        magnitude: props.mag,
        place: props.place,
        time: props.time,
        timeAgo: getTimeAgo(props.time),
        url: props.url,
        felt: props.felt, // Number of "felt" reports
        tsunami: props.tsunami === 1,
        significance: props.sig, // 0-1000 significance score
        type: props.type,
        // Calculated fields for visualization
        weight: normalizeWeight(props.mag),
        depthCategory: getDepthCategory(coords[2]),
        color: getDepthColor(coords[2]),
        isRecent: (Date.now() - props.time) < 3600000, // Less than 1 hour old
      };
    });

    // Build response
    const result = {
      earthquakes,
      metadata: {
        count: earthquakes.length,
        timeRange: range,
        minMagnitude,
        generated: new Date().toISOString(),
        title: usgsData.metadata?.title || `Earthquakes (${range})`
      }
    };

    // Update cache
    cache = {
      data: result,
      timestamp: now,
      timeRange: range
    };

    console.log(`Earthquakes: ${earthquakes.length} events returned`);
    res.json(result);
  } catch (error) {
    console.error('Earthquake API error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/earthquakes/significant
 * Returns significant earthquakes from the past 30 days
 */
router.get('/significant', async (req, res) => {
  try {
    const url = `${USGS_API}?format=geojson&starttime=${getDateDaysAgo(30)}&minmagnitude=6&orderby=magnitude`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`USGS API error: ${response.status}`);
    }

    const usgsData = await response.json();

    const earthquakes = usgsData.features.slice(0, 10).map(feature => {
      const props = feature.properties;
      const coords = feature.geometry.coordinates;

      return {
        id: feature.id,
        lat: coords[1],
        lng: coords[0],
        depth: coords[2],
        magnitude: props.mag,
        place: props.place,
        time: props.time,
        timeAgo: getTimeAgo(props.time),
        significance: props.sig,
      };
    });

    res.json({ earthquakes });
  } catch (error) {
    console.error('Significant earthquakes error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/earthquakes/:id
 * Returns detailed info for a specific earthquake
 */
router.get('/:id', async (req, res) => {
  try {
    const url = `${USGS_API}?format=geojson&eventid=${req.params.id}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`USGS API error: ${response.status}`);
    }

    const usgsData = await response.json();

    if (!usgsData.features || usgsData.features.length === 0) {
      return res.status(404).json({ message: 'Earthquake not found' });
    }

    const feature = usgsData.features[0];
    const props = feature.properties;
    const coords = feature.geometry.coordinates;

    res.json({
      id: feature.id,
      lat: coords[1],
      lng: coords[0],
      depth: coords[2],
      magnitude: props.mag,
      magnitudeType: props.magType,
      place: props.place,
      time: props.time,
      timeAgo: getTimeAgo(props.time),
      url: props.url,
      felt: props.felt,
      cdi: props.cdi, // Community intensity
      mmi: props.mmi, // Modified Mercalli Intensity
      tsunami: props.tsunami === 1,
      significance: props.sig,
      type: props.type,
      status: props.status,
      sources: props.sources,
    });
  } catch (error) {
    console.error('Earthquake detail error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Helper functions

function getTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function getDateDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

function normalizeWeight(magnitude) {
  // Magnitude is logarithmic, so use exponential scaling
  // Mag 2.5 -> 0.1, Mag 5 -> 0.3, Mag 7 -> 0.7, Mag 9 -> 1.0
  return Math.min(1, Math.pow(10, (magnitude - 2) / 4) / 10);
}

function getDepthCategory(depth) {
  if (depth < 70) return 'shallow';
  if (depth < 300) return 'intermediate';
  return 'deep';
}

function getDepthColor(depth) {
  // Shallow = red/orange, Intermediate = yellow/green, Deep = blue/purple
  if (depth < 30) return '#ff4444';
  if (depth < 70) return '#ff8800';
  if (depth < 150) return '#ffcc00';
  if (depth < 300) return '#44cc44';
  if (depth < 500) return '#4488ff';
  return '#8844ff';
}

module.exports = router;
