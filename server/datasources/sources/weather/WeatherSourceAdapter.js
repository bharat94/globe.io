/**
 * Adapter that combines static and dynamic weather sources
 * Uses static (pre-computed) when available, falls back to dynamic (API)
 */
const WeatherStaticSource = require('./WeatherStaticSource');
const WeatherDynamicSource = require('./WeatherDynamicSource');

class WeatherSourceAdapter {
  /**
   * @param {Object} options
   * @param {boolean} [options.preferStatic=true] - Prefer static source when available
   */
  constructor(options = {}) {
    this.staticSource = new WeatherStaticSource();
    this.dynamicSource = new WeatherDynamicSource();
    this.preferStatic = options.preferStatic !== false;
  }

  get sourceId() {
    return 'weather-adapter';
  }

  get dataType() {
    return 'weather';
  }

  get supportedResolutions() {
    // Combine resolutions from both sources (deduplicated, sorted descending)
    const allResolutions = [
      ...this.staticSource.supportedResolutions,
      ...this.dynamicSource.supportedResolutions
    ];
    return [...new Set(allResolutions)].sort((a, b) => b - a);
  }

  /**
   * Check if either source is available
   */
  async isAvailable() {
    const staticAvailable = await this.staticSource.isAvailable();
    const dynamicAvailable = await this.dynamicSource.isAvailable();
    return staticAvailable || dynamicAvailable;
  }

  /**
   * Get combined metadata from both sources
   */
  async getMetadata() {
    const [staticMeta, dynamicMeta] = await Promise.all([
      this.staticSource.getMetadata().catch(() => null),
      this.dynamicSource.getMetadata()
    ]);

    return {
      minYear: staticMeta?.minYear || dynamicMeta.minYear,
      maxYear: staticMeta?.maxYear || dynamicMeta.maxYear,
      supportedResolutions: this.supportedResolutions,
      sources: {
        static: {
          available: !!staticMeta,
          resolutions: this.staticSource.supportedResolutions
        },
        dynamic: {
          available: true,
          resolutions: this.dynamicSource.supportedResolutions
        }
      }
    };
  }

  /**
   * Fetch grid data using best available source
   * @param {Object} query
   * @returns {Promise<Array>}
   */
  async fetchGridData(query) {
    const { resolution } = query;

    // Use static source if it supports this resolution and is preferred
    if (this.preferStatic && this.staticSource.supportsResolution(resolution)) {
      const data = await this.staticSource.fetchGridData(query);
      if (data.length > 0) {
        console.log(`WeatherSourceAdapter: Using static source for ${resolution}° resolution`);
        return data;
      }
      console.log(`WeatherSourceAdapter: Static source empty, falling back to dynamic`);
    }

    // Fall back to dynamic source
    console.log(`WeatherSourceAdapter: Using dynamic source for ${resolution}° resolution`);
    return this.dynamicSource.fetchGridData(query);
  }

  /**
   * Normalize value using static source's normalizer
   */
  normalizeValue(value) {
    return this.staticSource.normalizeValue(value);
  }

  /**
   * Check if a resolution is supported
   */
  supportsResolution(resolution) {
    return this.supportedResolutions.includes(resolution);
  }
}

module.exports = WeatherSourceAdapter;
