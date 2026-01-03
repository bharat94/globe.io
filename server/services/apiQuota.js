/**
 * API Quota Tracker
 * Tracks daily API usage and provides quota-aware request management
 */

const DAILY_LIMIT = 10000;
const SAFETY_BUFFER = 1000; // Reserve for real-time requests
const EFFECTIVE_LIMIT = DAILY_LIMIT - SAFETY_BUFFER;

class ApiQuotaTracker {
  constructor() {
    this.resetIfNewDay();
  }

  /**
   * Reset counter if it's a new day
   */
  resetIfNewDay() {
    const today = new Date().toISOString().split('T')[0];

    if (this.currentDate !== today) {
      this.currentDate = today;
      this.requestCount = 0;
      this.lastReset = new Date();
      console.log(`API quota reset for ${today}. Limit: ${EFFECTIVE_LIMIT} requests.`);
    }
  }

  /**
   * Record API requests made
   * @param {number} count - Number of requests made
   */
  recordRequests(count = 1) {
    this.resetIfNewDay();
    this.requestCount += count;
  }

  /**
   * Get remaining quota for today
   * @returns {number}
   */
  getRemainingQuota() {
    this.resetIfNewDay();
    return Math.max(0, EFFECTIVE_LIMIT - this.requestCount);
  }

  /**
   * Check if we have quota available
   * @param {number} needed - Number of requests needed
   * @returns {boolean}
   */
  hasQuota(needed = 1) {
    return this.getRemainingQuota() >= needed;
  }

  /**
   * Get quota status
   * @returns {Object}
   */
  getStatus() {
    this.resetIfNewDay();
    return {
      date: this.currentDate,
      used: this.requestCount,
      remaining: this.getRemainingQuota(),
      limit: EFFECTIVE_LIMIT,
      percentUsed: Math.round((this.requestCount / EFFECTIVE_LIMIT) * 100)
    };
  }

  /**
   * Calculate how many points we can fetch given remaining quota
   * @param {number} pointsPerRequest - Points per API request (default 100)
   * @returns {number}
   */
  getMaxFetchablePoints(pointsPerRequest = 100) {
    return this.getRemainingQuota() * pointsPerRequest;
  }
}

// Singleton instance
module.exports = new ApiQuotaTracker();
