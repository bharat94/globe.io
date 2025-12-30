/**
 * Ingestion framework configuration
 */

module.exports = {
  // Supported data types
  DATA_TYPES: ['temperature', 'precipitation', 'humidity', 'airQuality'],

  // Supported resolutions (in degrees)
  RESOLUTIONS: [10, 5, 2.5, 2, 1, 0.5],

  // Pre-computed resolutions (stored in database)
  PRECOMPUTED_RESOLUTIONS: [10, 5, 2.5],

  // Year range for historical data
  DEFAULT_YEAR_START: 2000,
  DEFAULT_YEAR_END: 2024,

  // API rate limiting (Open-Meteo free tier)
  RATE_LIMIT: {
    maxRequestsPerDay: 10000,
    safeRequestsPerDay: 9000,  // Buffer for errors/retries
    minDelayBetweenRequestsMs: 100,
    batchSize: 50  // Coordinates per API request
  },

  // Retry configuration
  RETRY: {
    maxRetries: 3,
    backoffMs: [1000, 5000, 15000],
    retryableStatusCodes: [429, 500, 502, 503, 504]
  },

  // Database connection
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/globe-io',

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};
