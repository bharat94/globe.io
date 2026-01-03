/**
 * Open-Meteo Historical Weather API Data Source
 * https://open-meteo.com/en/docs/historical-weather-api
 *
 * Free tier: 10,000 requests/day
 * Batch: up to 100 coordinates per request
 */

const config = require('../config');

const ARCHIVE_API_URL = 'https://archive-api.open-meteo.com/v1/archive';

class OpenMeteoSource {
  constructor(options = {}) {
    this.retryConfig = options.retry || config.RETRY;
  }

  /**
   * Get start and end dates for a given year/month
   */
  getMonthDateRange(year, month) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
    return { startDate, endDate };
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Fetch temperature data for a batch of coordinates
   * @param {Array} points - Array of {lat, lng} objects
   * @param {number} year - Year (2000-2024)
   * @param {number} month - Month (1-12)
   * @returns {Promise<Array>} Array of {lat, lng, temperature: {avg, min, max}}
   */
  async fetchTemperature(points, year, month) {
    if (points.length === 0) return [];

    const { startDate, endDate } = this.getMonthDateRange(year, month);

    // Prepare batch coordinates
    const latitudes = points.map(p => p.lat).join(',');
    const longitudes = points.map(p => p.lng).join(',');

    const url = `${ARCHIVE_API_URL}?latitude=${latitudes}&longitude=${longitudes}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_mean,temperature_2m_max,temperature_2m_min&timezone=GMT`;

    // Fetch with retry
    let lastError;
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const response = await fetch(url);

        if (!response.ok) {
          const errorText = await response.text();

          // Check for hourly rate limit - requires long pause
          if (response.status === 429 && errorText.includes('Hourly')) {
            const hourlyBackoff = 30 * 60 * 1000; // 30 minutes
            console.warn(`⚠️  HOURLY rate limit hit! Pausing for 30 minutes...`);
            console.warn(`   Will resume at: ${new Date(Date.now() + hourlyBackoff).toLocaleTimeString()}`);
            await this.sleep(hourlyBackoff);
            continue;
          }

          // Check if retryable (minutely limit or server errors)
          if (
            this.retryConfig.retryableStatusCodes.includes(response.status) &&
            attempt < this.retryConfig.maxRetries
          ) {
            const backoff = this.retryConfig.backoffMs[attempt] || 15000;
            console.warn(`API error ${response.status}, retrying in ${backoff}ms...`);
            await this.sleep(backoff);
            continue;
          }

          throw new Error(`Open-Meteo API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return this.parseTemperatureResponse(points, data);
      } catch (error) {
        lastError = error;

        // Network errors are retryable
        if (error.name === 'TypeError' && attempt < this.retryConfig.maxRetries) {
          const backoff = this.retryConfig.backoffMs[attempt] || 15000;
          console.warn(`Network error, retrying in ${backoff}ms...`);
          await this.sleep(backoff);
          continue;
        }

        throw error;
      }
    }

    throw lastError;
  }

  /**
   * Parse temperature response from Open-Meteo API
   */
  parseTemperatureResponse(points, data) {
    // Handle single point response (different structure)
    if (points.length === 1) {
      const daily = data.daily;
      if (!daily) return [];

      const avgTemps = daily.temperature_2m_mean || [];
      const minTemps = daily.temperature_2m_min || [];
      const maxTemps = daily.temperature_2m_max || [];

      // Calculate monthly averages
      const validAvg = avgTemps.filter(t => t !== null);
      const validMin = minTemps.filter(t => t !== null);
      const validMax = maxTemps.filter(t => t !== null);

      if (validAvg.length === 0) return [];

      const avg = validAvg.reduce((sum, t) => sum + t, 0) / validAvg.length;
      const min = validMin.length > 0 ? Math.min(...validMin) : avg;
      const max = validMax.length > 0 ? Math.max(...validMax) : avg;

      return [{
        lat: points[0].lat,
        lng: points[0].lng,
        temperature: {
          avg: Math.round(avg * 10) / 10,
          min: Math.round(min * 10) / 10,
          max: Math.round(max * 10) / 10
        }
      }];
    }

    // Handle batch response (array of results)
    const results = [];

    for (let i = 0; i < points.length; i++) {
      const locationData = data[i];
      if (!locationData || !locationData.daily) {
        continue;
      }

      const daily = locationData.daily;
      const avgTemps = daily.temperature_2m_mean || [];
      const minTemps = daily.temperature_2m_min || [];
      const maxTemps = daily.temperature_2m_max || [];

      // Calculate monthly averages
      const validAvgTemps = avgTemps.filter(t => t !== null);
      const validMinTemps = minTemps.filter(t => t !== null);
      const validMaxTemps = maxTemps.filter(t => t !== null);

      if (validAvgTemps.length === 0) continue;

      const avg = validAvgTemps.reduce((sum, t) => sum + t, 0) / validAvgTemps.length;
      const min = validMinTemps.length > 0 ? Math.min(...validMinTemps) : avg;
      const max = validMaxTemps.length > 0 ? Math.max(...validMaxTemps) : avg;

      results.push({
        lat: points[i].lat,
        lng: points[i].lng,
        temperature: {
          avg: Math.round(avg * 10) / 10,
          min: Math.round(min * 10) / 10,
          max: Math.round(max * 10) / 10
        }
      });
    }

    return results;
  }

  /**
   * Fetch precipitation data for a batch of coordinates
   * (Placeholder for future implementation)
   */
  async fetchPrecipitation(points, year, month) {
    throw new Error('Precipitation fetching not yet implemented');
  }
}

module.exports = OpenMeteoSource;
