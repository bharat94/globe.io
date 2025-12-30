/**
 * Temperature Data Ingester
 * Fetches historical temperature data from Open-Meteo and stores in TemperatureData model
 */

const BaseIngester = require('../framework/BaseIngester');
const TemperatureData = require('../../models/TemperatureData');
const OpenMeteoSource = require('../sources/OpenMeteoSource');

class TemperatureIngester extends BaseIngester {
  constructor() {
    super({
      dataType: 'temperature',
      model: TemperatureData,
      batchSize: 50
    });

    this.source = new OpenMeteoSource();
  }

  /**
   * Fetch temperature data from Open-Meteo API
   * @param {Array} points - Array of {lat, lng} objects
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @returns {Promise<Array>} Raw temperature data
   */
  async fetchData(points, year, month) {
    return await this.source.fetchTemperature(points, year, month);
  }

  /**
   * Transform raw temperature data to TemperatureData model format
   * @param {Array} rawData - Raw data from Open-Meteo
   * @param {number} resolution - Grid resolution in degrees
   * @param {number} year - Year
   * @param {number} month - Month
   * @returns {Array} Documents ready for database insertion
   */
  transformData(rawData, resolution, year, month) {
    return rawData.map(point => ({
      lat: point.lat,
      lng: point.lng,
      resolution,
      year,
      month,
      temperature: {
        avg: point.temperature.avg,
        min: point.temperature.min,
        max: point.temperature.max
      },
      source: 'open-meteo',
      ingestedAt: new Date()
    }));
  }
}

module.exports = TemperatureIngester;
