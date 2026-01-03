/**
 * Dynamic data source for on-demand weather data
 * Fetches from Open-Meteo API and caches in WeatherCache
 */
const DynamicDataSource = require('../DynamicDataSource');
const WeatherCache = require('../../../models/WeatherCache');
const { fetchGridTemperature } = require('../../../services/openMeteo');
const { normalizeTemperature, generateGlobalGrid, isLandPoint } = require('../../../utils/gridUtils');

class WeatherDynamicSource extends DynamicDataSource {
  constructor() {
    super({
      sourceId: 'weather-dynamic',
      dataType: 'weather',
      cacheModel: WeatherCache,
      supportedResolutions: [10, 5, 2.5, 2, 1, 0.5]
    });
  }

  /**
   * Fetch temperature grid data with caching
   * @param {Object} query
   * @returns {Promise<Array>}
   */
  async fetchGridData(query) {
    const { year, month, resolution, bounds } = query;

    // Generate grid points
    const points = bounds
      ? this.generateViewportGrid(resolution, bounds, isLandPoint)
      : generateGlobalGrid(resolution);

    if (points.length === 0) {
      return [];
    }

    // Check cache
    const { cachedMap } = await this.getFromCache({ year, month });

    // Find missing points
    const missingPoints = points.filter(p => !cachedMap.has(`${p.lat},${p.lng}`));

    console.log(`WeatherDynamicSource: ${cachedMap.size} cached, ${missingPoints.length} missing`);

    // Fetch missing from API
    if (missingPoints.length > 0) {
      try {
        const fetched = await fetchGridTemperature(missingPoints, year, month);
        await this.saveToCache(fetched, { year, month });
        fetched.forEach(d => cachedMap.set(`${d.lat},${d.lng}`, d));
      } catch (error) {
        console.error('API fetch error:', error.message);
        // Continue with cached data only
      }
    }

    // Build result from all available data
    return points
      .filter(p => cachedMap.has(`${p.lat},${p.lng}`))
      .map(p => {
        const data = cachedMap.get(`${p.lat},${p.lng}`);
        return {
          lat: p.lat,
          lng: p.lng,
          weight: this.normalizeValue(data.temperature.avg),
          temperature: data.temperature,
          source: 'api-cached'
        };
      });
  }

  /**
   * Normalize temperature to 0-1 range for heatmap
   */
  normalizeValue(value) {
    return normalizeTemperature(value);
  }
}

module.exports = WeatherDynamicSource;
