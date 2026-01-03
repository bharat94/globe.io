/**
 * Base class for database-backed (static/pre-computed) data sources
 */
const IHeatmapSource = require('../interfaces/IHeatmapSource');

class StaticDataSource extends IHeatmapSource {
  /**
   * @param {Object} options
   * @param {string} options.sourceId - Unique identifier
   * @param {string} options.dataType - Data type ('weather', 'pollution', etc.)
   * @param {Object} options.model - Mongoose model for data access
   * @param {number[]} options.supportedResolutions - Resolutions this source supports
   */
  constructor(options) {
    super();
    this._sourceId = options.sourceId;
    this._dataType = options.dataType;
    this.model = options.model;
    this._supportedResolutions = options.supportedResolutions || [];
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
   * Check if database connection is healthy
   */
  async isAvailable() {
    try {
      await this.model.findOne().lean();
      return true;
    } catch (error) {
      console.error(`StaticDataSource ${this.sourceId} unavailable:`, error.message);
      return false;
    }
  }

  /**
   * Get metadata about available data (year range, resolutions)
   */
  async getMetadata() {
    const result = await this.model.aggregate([
      {
        $group: {
          _id: null,
          minYear: { $min: '$year' },
          maxYear: { $max: '$year' },
          resolutions: { $addToSet: '$resolution' }
        }
      }
    ]);

    if (result.length === 0) {
      return {
        minYear: 2000,
        maxYear: 2024,
        resolutions: this._supportedResolutions
      };
    }

    return {
      minYear: result[0].minYear,
      maxYear: result[0].maxYear,
      resolutions: result[0].resolutions.sort((a, b) => b - a)
    };
  }

  /**
   * Build MongoDB query from request parameters
   * @param {Object} query
   * @returns {Object} MongoDB query object
   */
  buildQuery(query) {
    const { year, month, resolution } = query;
    return { year, month, resolution };
  }

  /**
   * Apply viewport filtering to results
   * @param {Array} data
   * @param {Object} bounds
   * @returns {Array}
   */
  filterByBounds(data, bounds) {
    if (!bounds) return data;

    return data.filter(d =>
      d.lat >= bounds.minLat &&
      d.lat <= bounds.maxLat &&
      d.lng >= bounds.minLng &&
      d.lng <= bounds.maxLng
    );
  }
}

module.exports = StaticDataSource;
