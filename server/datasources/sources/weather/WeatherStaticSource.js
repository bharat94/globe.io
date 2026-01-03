/**
 * Static data source for pre-computed weather/temperature data
 * Reads from TemperatureData model (populated by ingestion framework)
 */
const StaticDataSource = require('../StaticDataSource');
const TemperatureData = require('../../../models/TemperatureData');
const { normalizeTemperature } = require('../../../utils/gridUtils');

class WeatherStaticSource extends StaticDataSource {
  constructor() {
    super({
      sourceId: 'weather-static',
      dataType: 'weather',
      model: TemperatureData,
      supportedResolutions: [10, 5, 2.5]
    });
  }

  /**
   * Fetch temperature grid data from pre-computed database
   * @param {Object} query
   * @returns {Promise<Array>}
   */
  async fetchGridData(query) {
    const { year, month, resolution, bounds } = query;

    // Query pre-computed data
    const dbQuery = this.buildQuery({ year, month, resolution });
    let data = await this.model.find(dbQuery).lean();

    // Apply viewport filter if bounds provided
    if (bounds) {
      data = this.filterByBounds(data, bounds);
    }

    // Transform to heatmap format
    return data.map(d => ({
      lat: d.lat,
      lng: d.lng,
      weight: this.normalizeValue(d.temperature.avg),
      temperature: d.temperature,
      source: 'precomputed'
    }));
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
