/**
 * Rate limiter for API requests
 * Handles daily limits and delays between requests
 */

class RateLimiter {
  constructor(options = {}) {
    this.maxRequestsPerDay = options.maxRequestsPerDay || 9000;
    this.minDelayMs = options.minDelayMs || 100;

    this.requestCount = 0;
    this.dayStart = this.getStartOfDay();
    this.lastRequestTime = 0;
  }

  /**
   * Get start of current day (UTC)
   */
  getStartOfDay() {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).getTime();
  }

  /**
   * Check if we've crossed into a new day
   */
  isNewDay() {
    return this.getStartOfDay() > this.dayStart;
  }

  /**
   * Reset daily counter
   */
  resetDailyCount() {
    this.requestCount = 0;
    this.dayStart = this.getStartOfDay();
    console.log('[RateLimiter] Daily counter reset');
  }

  /**
   * Get milliseconds until next day (UTC)
   */
  getTimeUntilNextDay() {
    const now = Date.now();
    const nextDay = this.dayStart + 24 * 60 * 60 * 1000;
    return Math.max(0, nextDay - now);
  }

  /**
   * Sleep for specified milliseconds
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current request count
   */
  getRequestCount() {
    return this.requestCount;
  }

  /**
   * Get remaining requests for today
   */
  getRemainingRequests() {
    if (this.isNewDay()) {
      this.resetDailyCount();
    }
    return this.maxRequestsPerDay - this.requestCount;
  }

  /**
   * Check if we can make more requests today
   */
  canMakeRequest() {
    if (this.isNewDay()) {
      this.resetDailyCount();
    }
    return this.requestCount < this.maxRequestsPerDay;
  }

  /**
   * Wait until we can make a request, respecting rate limits
   * @returns {Promise<void>}
   */
  async throttle() {
    // Check if we've crossed into a new day
    if (this.isNewDay()) {
      this.resetDailyCount();
    }

    // Check daily limit
    if (this.requestCount >= this.maxRequestsPerDay) {
      const waitTime = this.getTimeUntilNextDay();
      const waitMinutes = Math.ceil(waitTime / 1000 / 60);
      console.log(`[RateLimiter] Daily limit reached (${this.requestCount}/${this.maxRequestsPerDay}). Waiting ${waitMinutes} minutes until reset...`);
      await this.sleep(waitTime + 1000); // Add 1 second buffer
      this.resetDailyCount();
    }

    // Ensure minimum delay between requests
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    if (timeSinceLastRequest < this.minDelayMs) {
      await this.sleep(this.minDelayMs - timeSinceLastRequest);
    }

    // Record request
    this.requestCount++;
    this.lastRequestTime = Date.now();
  }

  /**
   * Record a failed request (decrements counter for retry)
   */
  recordFailure() {
    if (this.requestCount > 0) {
      this.requestCount--;
    }
  }

  /**
   * Get status summary
   */
  getStatus() {
    return {
      requestCount: this.requestCount,
      maxRequestsPerDay: this.maxRequestsPerDay,
      remaining: this.getRemainingRequests(),
      percentUsed: ((this.requestCount / this.maxRequestsPerDay) * 100).toFixed(1)
    };
  }
}

module.exports = RateLimiter;
