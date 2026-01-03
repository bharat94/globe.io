/**
 * Base class for API-backed (dynamic/on-demand) data sources with caching
 */
const IHeatmapSource = require('../interfaces/IHeatmapSource');

class DynamicDataSource extends IHeatmapSource {
  /**
   * @param {Object} options
   * @param {string} options.sourceId - Unique identifier
   * @param {string} options.dataType - Data type ('weather', 'pollution', etc.)
   * @param {Object} options.cacheModel - Mongoose model for caching
   * @param {number[]} options.supportedResolutions - Resolutions this source supports
   */
  constructor(options) {
    super();
    this._sourceId = options.sourceId;
    this._dataType = options.dataType;
    this.cacheModel = options.cacheModel;
    this._supportedResolutions = options.supportedResolutions || [10, 5, 2.5, 2, 1, 0.5];
  }

  get sourceId() {
    return this._sourceId;
  }

  get dataType() {
    return this._dataType;
  }

  get supportedResolutions() {
    return this._supportedResolutions;
  }

  /**
   * Dynamic sources are generally available (API health check can be added)
   */
  async isAvailable() {
    return true;
  }

  /**
   * Get metadata - dynamic sources support wider ranges
   */
  async getMetadata() {
    return {
      minYear: 1940,
      maxYear: new Date().getFullYear(),
      resolutions: this._supportedResolutions
    };
  }

  /**
   * Get cached data for the query
   * @param {Object} query
   * @returns {Promise<{cachedMap: Map, cachedData: Array}>}
   */
  async getFromCache(query) {
    const { year, month } = query;
    const cached = await this.cacheModel.find({ year, month }).lean();
    const cachedMap = new Map();
    cached.forEach(d => cachedMap.set(`${d.lat},${d.lng}`, d));
    return { cachedMap, cachedData: cached };
  }

  /**
   * Save data to cache
   * @param {Array} data
   * @param {Object} query
   */
  async saveToCache(data, query) {
    const { year, month } = query;
    const entries = data.map(d => ({
      lat: d.lat,
      lng: d.lng,
      year,
      month,
      temperature: d.temperature,
      source: this._dataType,
      fetchedAt: new Date()
    }));

    try {
      await this.cacheModel.insertMany(entries, { ordered: false });
    } catch (err) {
      // Ignore duplicate key errors (code 11000)
      if (err.code !== 11000) {
        console.error('Cache insert error:', err.message);
      }
    }
  }

  /**
   * Fetch data from external API - must be implemented by subclass
   * @param {Array} points - Points to fetch
   * @param {number} year
   * @param {number} month
   * @returns {Promise<Array>}
   */
  async fetchFromApi(points, year, month) {
    throw new Error('DynamicDataSource.fetchFromApi must be implemented');
  }

  /**
   * Generate grid points for a viewport
   * @param {number} resolution
   * @param {Object} bounds
   * @param {Function} isLandPoint - Function to check if point is on land
   * @returns {Array<{lat: number, lng: number}>}
   */
  generateViewportGrid(resolution, bounds, isLandPoint) {
    const points = [];
    const startLat = Math.floor(bounds.minLat / resolution) * resolution;
    const startLng = Math.floor(bounds.minLng / resolution) * resolution;

    for (let lat = startLat; lat <= bounds.maxLat; lat += resolution) {
      for (let lng = startLng; lng <= bounds.maxLng; lng += resolution) {
        let normLng = lng;
        if (normLng > 180) normLng -= 360;
        if (normLng < -180) normLng += 360;

        if (isLandPoint(lat, normLng)) {
          points.push({ lat, lng: normLng });
        }
      }
    }
    return points;
  }
}

module.exports = DynamicDataSource;
