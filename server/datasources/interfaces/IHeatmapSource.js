/**
 * Interface for heatmap data sources
 * Provides contract for grid-based visualization data (temperature, pollution, etc.)
 */
class IHeatmapSource {
  /**
   * @returns {string} Unique identifier for this source
   */
  get sourceId() {
    throw new Error('IHeatmapSource.sourceId must be implemented');
  }

  /**
   * @returns {string} Data type this source provides ('weather', 'pollution', etc.)
   */
  get dataType() {
    throw new Error('IHeatmapSource.dataType must be implemented');
  }

  /**
   * @returns {number[]} Supported grid resolutions in degrees
   */
  get supportedResolutions() {
    throw new Error('IHeatmapSource.supportedResolutions must be implemented');
  }

  /**
   * Check if the source is available and healthy
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    throw new Error('IHeatmapSource.isAvailable must be implemented');
  }

  /**
   * Get metadata about available data
   * @returns {Promise<{minYear: number, maxYear: number, resolutions: number[]}>}
   */
  async getMetadata() {
    throw new Error('IHeatmapSource.getMetadata must be implemented');
  }

  /**
   * Fetch heatmap grid data
   * @param {Object} query
   * @param {number} query.year
   * @param {number} query.month
   * @param {number} query.resolution - Grid resolution in degrees
   * @param {Object} [query.bounds] - Optional viewport bounds
   * @param {number} [query.bounds.minLat]
   * @param {number} [query.bounds.maxLat]
   * @param {number} [query.bounds.minLng]
   * @param {number} [query.bounds.maxLng]
   * @returns {Promise<Array<{lat: number, lng: number, weight: number, [key: string]: any}>>}
   */
  async fetchGridData(query) {
    throw new Error('IHeatmapSource.fetchGridData must be implemented');
  }

  /**
   * Normalize a raw value to 0-1 weight for heatmap rendering
   * @param {number} value - Raw data value
   * @returns {number} Normalized weight between 0 and 1
   */
  normalizeValue(value) {
    throw new Error('IHeatmapSource.normalizeValue must be implemented');
  }

  /**
   * Check if this source supports a specific resolution
   * @param {number} resolution
   * @returns {boolean}
   */
  supportsResolution(resolution) {
    return this.supportedResolutions.includes(resolution);
  }
}

module.exports = IHeatmapSource;
