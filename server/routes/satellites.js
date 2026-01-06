/**
 * Satellite API routes
 * Fetches TLE data from CelesTrak and serves to frontend
 */
const express = require('express');
const router = express.Router();

// CelesTrak TLE data URLs
const TLE_SOURCES = {
  iss: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle',
  starlink: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle',
  gps: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=gps-ops&FORMAT=tle',
  weather: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=weather&FORMAT=tle',
  science: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=science&FORMAT=tle',
  active: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle'
};

// Cache for TLE data (refresh every 4 hours)
const CACHE_TTL = 4 * 60 * 60 * 1000;
const cache = {
  data: null,
  timestamp: 0
};

/**
 * Parse TLE text into satellite objects
 */
function parseTLEData(tleText, category) {
  const lines = tleText.trim().split('\n');
  const satellites = [];

  for (let i = 0; i < lines.length; i += 3) {
    if (i + 2 >= lines.length) break;

    const name = lines[i].trim();
    const line1 = lines[i + 1].trim();
    const line2 = lines[i + 2].trim();

    // Validate TLE format
    if (!line1.startsWith('1 ') || !line2.startsWith('2 ')) continue;

    // Extract NORAD ID from line 1
    const noradId = line1.substring(2, 7).trim();

    satellites.push({
      id: noradId,
      name: name,
      category: category,
      tle: {
        line1: line1,
        line2: line2
      }
    });
  }

  return satellites;
}

/**
 * Fetch TLE data from CelesTrak
 */
async function fetchTLEData(category, url) {
  try {
    console.log(`Satellites: Fetching ${category} from CelesTrak...`);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`CelesTrak returned ${response.status}`);
    }

    const text = await response.text();
    const satellites = parseTLEData(text, category);
    console.log(`Satellites: ${satellites.length} ${category} satellites loaded`);
    return satellites;
  } catch (error) {
    console.error(`Satellites: Error fetching ${category}:`, error.message);
    return [];
  }
}

/**
 * Fetch all satellite data (with caching)
 */
async function getAllSatellites() {
  const now = Date.now();

  // Return cached data if still valid
  if (cache.data && (now - cache.timestamp) < CACHE_TTL) {
    console.log('Satellites: Using cached data');
    return cache.data;
  }

  console.log('Satellites: Refreshing data from CelesTrak...');

  // Fetch ISS specifically (it's in the stations group)
  const issData = await fetchTLEData('iss', TLE_SOURCES.iss);
  // Filter to just ISS (ZARYA)
  const iss = issData.filter(s =>
    s.name.toUpperCase().includes('ISS') ||
    s.name.toUpperCase().includes('ZARYA')
  ).slice(0, 1);

  // Fetch other categories (limit each to avoid overwhelming the frontend)
  const [starlink, gps, weather, science] = await Promise.all([
    fetchTLEData('starlink', TLE_SOURCES.starlink).then(s => s.slice(0, 100)), // Limit Starlink
    fetchTLEData('gps', TLE_SOURCES.gps),
    fetchTLEData('weather', TLE_SOURCES.weather).then(s => s.slice(0, 30)),
    fetchTLEData('science', TLE_SOURCES.science).then(s => s.slice(0, 20))
  ]);

  const allSatellites = [
    ...iss.map(s => ({ ...s, category: 'iss' })),
    ...starlink,
    ...gps,
    ...weather,
    ...science
  ];

  // Update cache
  cache.data = {
    satellites: allSatellites,
    metadata: {
      totalCount: allSatellites.length,
      categories: {
        iss: iss.length,
        starlink: starlink.length,
        gps: gps.length,
        weather: weather.length,
        science: science.length
      },
      lastUpdated: new Date().toISOString()
    }
  };
  cache.timestamp = now;

  console.log(`Satellites: Total ${allSatellites.length} satellites cached`);
  return cache.data;
}

/**
 * GET /api/satellites
 * Returns all satellites with TLE data
 */
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const data = await getAllSatellites();

    if (category && category !== 'all') {
      const filtered = data.satellites.filter(s => s.category === category);
      return res.json({
        satellites: filtered,
        metadata: {
          ...data.metadata,
          totalCount: filtered.length
        }
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Satellites API error:', error);
    res.status(500).json({ error: 'Failed to fetch satellite data' });
  }
});

/**
 * GET /api/satellites/categories
 * Returns available categories and counts
 */
router.get('/categories', async (req, res) => {
  try {
    const data = await getAllSatellites();
    res.json({
      categories: data.metadata.categories,
      lastUpdated: data.metadata.lastUpdated
    });
  } catch (error) {
    console.error('Satellites categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

/**
 * GET /api/satellites/:id
 * Returns a specific satellite by NORAD ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getAllSatellites();

    const satellite = data.satellites.find(s => s.id === id);

    if (!satellite) {
      return res.status(404).json({ error: 'Satellite not found' });
    }

    res.json(satellite);
  } catch (error) {
    console.error('Satellite detail error:', error);
    res.status(500).json({ error: 'Failed to fetch satellite' });
  }
});

module.exports = router;
