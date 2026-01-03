/**
 * High-level service for data access
 * Provides unified interface for all data types
 */
const DataSourceFactory = require('./DataSourceFactory');

class DataService {
  constructor() {
    // Cache of instantiated sources
    this.sources = new Map();
  }

  /**
   * Get or create a data source instance
   * @param {string} dataType
   * @param {Object} [options]
   * @returns {IHeatmapSource}
   */
  getSource(dataType, options = {}) {
    const key = `${dataType}-${JSON.stringify(options)}`;
    if (!this.sources.has(key)) {
      this.sources.set(key, DataSourceFactory.create(dataType, options));
    }
    return this.sources.get(key);
  }

  /**
   * Fetch grid data for any heatmap source
   * @param {string} dataType
   * @param {Object} query - { year, month, resolution, bounds? }
   * @returns {Promise<Array>}
   */
  async fetchGridData(dataType, query) {
    const source = this.getSource(dataType);
    return source.fetchGridData(query);
  }

  /**
   * Get metadata for a data type
   * @param {string} dataType
   * @returns {Promise<Object>}
   */
  async getMetadata(dataType) {
    const source = this.getSource(dataType);
    return source.getMetadata();
  }

  /**
   * Check if a data source is available
   * @param {string} dataType
   * @returns {Promise<boolean>}
   */
  async isAvailable(dataType) {
    const source = this.getSource(dataType);
    return source.isAvailable();
  }

  /**
   * Get all available data types
   * @returns {string[]}
   */
  getAvailableTypes() {
    return DataSourceFactory.getAvailableTypes();
  }

  /**
   * Clear cached source instances
   */
  clearCache() {
    this.sources.clear();
  }
}

// Export singleton instance
module.exports = new DataService();
