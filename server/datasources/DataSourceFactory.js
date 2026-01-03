/**
 * Factory for creating data source instances
 * Supports registration of new source types for extensibility
 */
const WeatherSourceAdapter = require('./sources/weather/WeatherSourceAdapter');

class DataSourceFactory {
  static sources = {
    weather: WeatherSourceAdapter
    // Future: pollution: PollutionSourceAdapter
    // Future: flights: FlightsSourceAdapter
  };

  /**
   * Create a data source instance
   * @param {string} dataType - Type of data source ('weather', 'pollution', etc.)
   * @param {Object} [options] - Configuration options passed to source constructor
   * @returns {IHeatmapSource}
   */
  static create(dataType, options = {}) {
    const SourceClass = this.sources[dataType];
    if (!SourceClass) {
      throw new Error(
        `Unknown data source type: ${dataType}. Available: ${this.getAvailableTypes().join(', ')}`
      );
    }
    return new SourceClass(options);
  }

  /**
   * Register a new data source type
   * @param {string} dataType - Type identifier
   * @param {Class} SourceClass - Class that implements IHeatmapSource
   */
  static register(dataType, SourceClass) {
    this.sources[dataType] = SourceClass;
  }

  /**
   * Get list of available data types
   * @returns {string[]}
   */
  static getAvailableTypes() {
    return Object.keys(this.sources);
  }

  /**
   * Check if a data type is supported
   * @param {string} dataType
   * @returns {boolean}
   */
  static isSupported(dataType) {
    return dataType in this.sources;
  }
}

module.exports = DataSourceFactory;
