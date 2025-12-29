/**
 * Open-Meteo Historical Weather API Service
 * https://open-meteo.com/en/docs/historical-weather-api
 *
 * Free tier: 10,000 requests/day
 * Batch: up to 100 coordinates per request
 */

const ARCHIVE_API_URL = 'https://archive-api.open-meteo.com/v1/archive';
const BATCH_SIZE = 50; // Conservative batch size to avoid timeouts

/**
 * Get start and end dates for a given year/month
 */
function getMonthDateRange(year, month) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
  return { startDate, endDate };
}

/**
 * Fetch temperature data for a batch of coordinates
 * @param {Array} points - Array of {lat, lng} objects
 * @param {number} year - Year (2000-2024)
 * @param {number} month - Month (1-12)
 * @returns {Promise<Array>} Array of {lat, lng, temperature: {avg, min, max}}
 */
async function fetchBatchTemperature(points, year, month) {
  if (points.length === 0) return [];

  const { startDate, endDate } = getMonthDateRange(year, month);

  // Prepare batch coordinates
  const latitudes = points.map(p => p.lat).join(',');
  const longitudes = points.map(p => p.lng).join(',');

  const url = `${ARCHIVE_API_URL}?latitude=${latitudes}&longitude=${longitudes}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_mean,temperature_2m_max,temperature_2m_min&timezone=auto`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Open-Meteo API error:', response.status, errorText);
      throw new Error(`Open-Meteo API error: ${response.status}`);
    }

    const data = await response.json();

    // Handle single point response (different structure)
    if (points.length === 1) {
      const daily = data.daily;
      if (!daily) return [];

      const avgTemps = daily.temperature_2m_mean || [];
      const minTemps = daily.temperature_2m_min || [];
      const maxTemps = daily.temperature_2m_max || [];

      // Calculate monthly averages
      const avg = avgTemps.reduce((sum, t) => sum + (t || 0), 0) / avgTemps.length;
      const min = Math.min(...minTemps.filter(t => t !== null));
      const max = Math.max(...maxTemps.filter(t => t !== null));

      return [{
        lat: points[0].lat,
        lng: points[0].lng,
        temperature: {
          avg: Math.round(avg * 10) / 10,
          min: Math.round(min * 10) / 10,
          max: Math.round(max * 10) / 10
        }
      }];
    }

    // Handle batch response (array of results)
    const results = [];

    for (let i = 0; i < points.length; i++) {
      const locationData = data[i];
      if (!locationData || !locationData.daily) {
        console.warn(`No data for point ${i}: ${points[i].lat}, ${points[i].lng}`);
        continue;
      }

      const daily = locationData.daily;
      const avgTemps = daily.temperature_2m_mean || [];
      const minTemps = daily.temperature_2m_min || [];
      const maxTemps = daily.temperature_2m_max || [];

      // Calculate monthly averages
      const validAvgTemps = avgTemps.filter(t => t !== null);
      const validMinTemps = minTemps.filter(t => t !== null);
      const validMaxTemps = maxTemps.filter(t => t !== null);

      if (validAvgTemps.length === 0) continue;

      const avg = validAvgTemps.reduce((sum, t) => sum + t, 0) / validAvgTemps.length;
      const min = validMinTemps.length > 0 ? Math.min(...validMinTemps) : avg;
      const max = validMaxTemps.length > 0 ? Math.max(...validMaxTemps) : avg;

      results.push({
        lat: points[i].lat,
        lng: points[i].lng,
        temperature: {
          avg: Math.round(avg * 10) / 10,
          min: Math.round(min * 10) / 10,
          max: Math.round(max * 10) / 10
        }
      });
    }

    return results;
  } catch (error) {
    console.error('Error fetching from Open-Meteo:', error.message);
    throw error;
  }
}

/**
 * Fetch temperature data for multiple points, batching as needed
 * @param {Array} points - Array of {lat, lng} objects
 * @param {number} year - Year (2000-2024)
 * @param {number} month - Month (1-12)
 * @returns {Promise<Array>} Array of {lat, lng, temperature: {avg, min, max}}
 */
async function fetchGridTemperature(points, year, month) {
  const results = [];

  // Process in batches
  for (let i = 0; i < points.length; i += BATCH_SIZE) {
    const batch = points.slice(i, i + BATCH_SIZE);
    console.log(`Fetching batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(points.length / BATCH_SIZE)} (${batch.length} points)`);

    try {
      const batchResults = await fetchBatchTemperature(batch, year, month);
      results.push(...batchResults);

      // Small delay between batches to be nice to the API
      if (i + BATCH_SIZE < points.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`Error fetching batch starting at index ${i}:`, error.message);
      // Continue with other batches even if one fails
    }
  }

  return results;
}

module.exports = {
  fetchBatchTemperature,
  fetchGridTemperature,
  BATCH_SIZE
};
