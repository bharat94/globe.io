/**
 * Static data source for pre-computed weather/temperature data
 * Reads from TemperatureData model (populated by ingestion framework)
 * Supports interpolation from coarser resolutions when fine data unavailable
 */
const StaticDataSource = require('../StaticDataSource');
const TemperatureData = require('../../../models/TemperatureData');
const { normalizeTemperature, generateGlobalGrid } = require('../../../utils/gridUtils');
const { interpolateTemperatureGrid, getCoarserResolution } = require('../../../utils/interpolation');

// All resolutions we can provide (via direct data or interpolation)
const ALL_RESOLUTIONS = [10, 5, 2.5, 2, 1, 0.5];
// Resolutions that have actual pre-computed data
const PRECOMPUTED_RESOLUTIONS = [10, 5, 2.5];

class WeatherStaticSource extends StaticDataSource {
  constructor() {
    super({
      sourceId: 'weather-static',
      dataType: 'weather',
      model: TemperatureData,
      supportedResolutions: ALL_RESOLUTIONS // Now supports all via interpolation
    });
    this.precomputedResolutions = PRECOMPUTED_RESOLUTIONS;
  }

  /**
   * Check if we have pre-computed data for this resolution
   */
  hasPrecomputedData(resolution) {
    return this.precomputedResolutions.includes(resolution);
  }

  /**
   * Fetch temperature grid data from pre-computed database
   * Falls back to interpolation from coarser resolution if needed
   * @param {Object} query
   * @returns {Promise<Array>}
   */
  async fetchGridData(query) {
    const { year, month, resolution, bounds } = query;

    // If we have pre-computed data at this resolution, use it
    if (this.hasPrecomputedData(resolution)) {
      return this.fetchPrecomputed(query);
    }

    // Otherwise, interpolate from coarser resolution
    return this.fetchInterpolated(query);
  }

  /**
   * Fetch directly from pre-computed data
   */
  async fetchPrecomputed(query) {
    const { year, month, resolution, bounds } = query;

    const dbQuery = this.buildQuery({ year, month, resolution });
    let data = await this.model.find(dbQuery).lean();

    if (bounds) {
      data = this.filterByBounds(data, bounds);
    }

    return data.map(d => ({
      lat: d.lat,
      lng: d.lng,
      weight: this.normalizeValue(d.temperature.avg),
      temperature: d.temperature,
      source: 'precomputed'
    }));
  }

  /**
   * Interpolate from coarser resolution data
   */
  async fetchInterpolated(query) {
    const { year, month, resolution, bounds } = query;

    // Find the coarsest available resolution to interpolate from
    const sourceResolution = this.findBestSourceResolution(resolution);
    if (!sourceResolution) {
      console.warn(`No source data available for interpolation at ${resolution}°`);
      return [];
    }

    // Fetch source data
    const sourceQuery = { year, month, resolution: sourceResolution };
    const sourceData = await this.model.find(this.buildQuery(sourceQuery)).lean();

    if (sourceData.length === 0) {
      return [];
    }

    // Build lookup map for source data
    const sourceMap = new Map();
    sourceData.forEach(d => {
      sourceMap.set(`${d.lat},${d.lng}`, d);
    });

    // Generate target grid points
    let targetPoints = this.generateTargetGrid(resolution, bounds);

    // Interpolate
    const interpolated = interpolateTemperatureGrid(targetPoints, sourceMap, sourceResolution);

    // Transform to heatmap format
    return interpolated.map(d => ({
      lat: d.lat,
      lng: d.lng,
      weight: this.normalizeValue(d.temperature.avg),
      temperature: d.temperature,
      source: `interpolated-from-${sourceResolution}deg`
    }));
  }

  /**
   * Find best available source resolution for interpolation
   */
  findBestSourceResolution(targetResolution) {
    // Find the smallest pre-computed resolution that's larger than target
    for (const res of this.precomputedResolutions.sort((a, b) => a - b)) {
      if (res > targetResolution) {
        return res;
      }
    }
    // Fall back to coarsest available
    return this.precomputedResolutions[this.precomputedResolutions.length - 1];
  }

  /**
   * Generate grid points for target resolution
   */
  generateTargetGrid(resolution, bounds) {
    if (bounds) {
      const points = [];
      for (let lat = bounds.minLat; lat <= bounds.maxLat; lat += resolution) {
        for (let lng = bounds.minLng; lng <= bounds.maxLng; lng += resolution) {
          points.push({ lat, lng });
        }
      }
      return points;
    }
    return generateGlobalGrid(resolution);
  }

  /**
   * Normalize temperature to 0-1 range for heatmap
   * Scale: -40°C (0) to +45°C (1)
   */
  normalizeValue(value) {
    return normalizeTemperature(value);
  }
}

module.exports = WeatherStaticSource;
