/**
 * Adapter that combines static and dynamic weather sources
 * Uses static (pre-computed) when available, falls back to dynamic (API)
 * Quota-aware: prefers interpolation over API when quota is low
 */
const WeatherStaticSource = require('./WeatherStaticSource');
const WeatherDynamicSource = require('./WeatherDynamicSource');
const apiQuota = require('../../../services/apiQuota');

// Threshold below which we prefer interpolation over API calls
const LOW_QUOTA_THRESHOLD = 500;

class WeatherSourceAdapter {
  /**
   * @param {Object} options
   * @param {boolean} [options.preferStatic=true] - Prefer static source when available
   * @param {boolean} [options.allowInterpolation=true] - Allow interpolation from coarser data
   */
  constructor(options = {}) {
    this.staticSource = new WeatherStaticSource();
    this.dynamicSource = new WeatherDynamicSource();
    this.preferStatic = options.preferStatic !== false;
    this.allowInterpolation = options.allowInterpolation !== false;
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
   * Strategy:
   * 1. If static has pre-computed data at this resolution -> use it
   * 2. If quota is low and interpolation allowed -> interpolate from static
   * 3. If quota available -> use dynamic (API)
   * 4. Fallback to interpolation
   * @param {Object} query
   * @returns {Promise<Array>}
   */
  async fetchGridData(query) {
    const { resolution } = query;
    const quotaStatus = apiQuota.getStatus();
    const isLowQuota = quotaStatus.remaining < LOW_QUOTA_THRESHOLD;

    // 1. Try static with pre-computed data first
    if (this.preferStatic && this.staticSource.hasPrecomputedData(resolution)) {
      const data = await this.staticSource.fetchPrecomputed(query);
      if (data.length > 0) {
        console.log(`WeatherSourceAdapter: Using pre-computed data for ${resolution}°`);
        return data;
      }
    }

    // 2. If quota is low, prefer interpolation over API
    if (isLowQuota && this.allowInterpolation) {
      console.log(`WeatherSourceAdapter: Low quota (${quotaStatus.remaining}), using interpolation for ${resolution}°`);
      const interpolated = await this.staticSource.fetchInterpolated(query);
      if (interpolated.length > 0) {
        return interpolated;
      }
    }

    // 3. Try dynamic source if we have quota
    if (!isLowQuota || !this.allowInterpolation) {
      try {
        console.log(`WeatherSourceAdapter: Using dynamic source for ${resolution}° (quota: ${quotaStatus.remaining})`);
        const data = await this.dynamicSource.fetchGridData(query);
        // Record API usage (estimate based on points)
        const requestsMade = Math.ceil(data.length / 100);
        apiQuota.recordRequests(requestsMade);
        if (data.length > 0) {
          return data;
        }
      } catch (error) {
        console.warn(`WeatherSourceAdapter: Dynamic source failed: ${error.message}`);
      }
    }

    // 4. Final fallback: try interpolation
    if (this.allowInterpolation) {
      console.log(`WeatherSourceAdapter: Fallback to interpolation for ${resolution}°`);
      return this.staticSource.fetchInterpolated(query);
    }

    return [];
  }

  /**
   * Get current API quota status
   */
  getQuotaStatus() {
    return apiQuota.getStatus();
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
