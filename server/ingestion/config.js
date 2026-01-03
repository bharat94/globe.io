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
    minDelayBetweenRequestsMs: 1500,  // 1.5 seconds between batches to avoid rate limits
    batchSize: 100  // Coordinates per API request (Open-Meteo max is 100)
  },

  // Retry configuration
  RETRY: {
    maxRetries: 5,
    backoffMs: [5000, 15000, 30000, 60000, 120000],  // More aggressive backoff
    retryableStatusCodes: [429, 500, 502, 503, 504]
  },

  // Database connection
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/globe-io',

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};
