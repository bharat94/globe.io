/**
 * Progress tracker for ingestion jobs
 * Handles logging, progress display, and timing
 */

class ProgressTracker {
  constructor(options = {}) {
    this.dataType = options.dataType || 'unknown';
    this.resolution = options.resolution;
    this.totalMonths = options.totalMonths || 0;
    this.totalPoints = options.totalPoints || 0;

    this.completedMonths = 0;
    this.processedPoints = 0;
    this.apiCalls = 0;
    this.errors = 0;

    this.startTime = null;
    this.lastLogTime = 0;
    this.logIntervalMs = options.logIntervalMs || 5000; // Log every 5 seconds max
  }

  /**
   * Start tracking
   */
  start() {
    this.startTime = Date.now();
    this.log(`Starting ingestion: ${this.dataType} @ ${this.resolution}° resolution`);
    this.log(`Total: ${this.totalMonths} months, ~${this.totalPoints} points per month`);
  }

  /**
   * Format timestamp for logging
   */
  timestamp() {
    return new Date().toISOString().replace('T', ' ').substring(0, 19);
  }

  /**
   * Log a message with timestamp and data type
   */
  log(message) {
    console.log(`[${this.timestamp()}] [${this.dataType}] ${message}`);
  }

  /**
   * Log an error
   */
  error(message, err = null) {
    console.error(`[${this.timestamp()}] [${this.dataType}] ERROR: ${message}`);
    if (err) {
      console.error(err.stack || err.message || err);
    }
    this.errors++;
  }

  /**
   * Record progress for a completed month
   */
  recordMonthComplete(year, month, pointsProcessed, apiCallsMade) {
    this.completedMonths++;
    this.processedPoints += pointsProcessed;
    this.apiCalls += apiCallsMade;

    // Log progress periodically
    const now = Date.now();
    if (now - this.lastLogTime >= this.logIntervalMs) {
      this.logProgress(year, month);
      this.lastLogTime = now;
    }
  }

  /**
   * Log current progress
   */
  logProgress(year, month) {
    const percent = ((this.completedMonths / this.totalMonths) * 100).toFixed(1);
    const elapsed = this.getElapsedTime();
    const eta = this.getETA();

    this.log(
      `Progress: ${this.completedMonths}/${this.totalMonths} months (${percent}%) | ` +
      `Points: ${this.processedPoints.toLocaleString()} | ` +
      `API calls: ${this.apiCalls.toLocaleString()} | ` +
      `Elapsed: ${elapsed} | ETA: ${eta}`
    );

    if (year && month) {
      this.log(`Checkpoint: ${year}-${String(month).padStart(2, '0')}`);
    }
  }

  /**
   * Get elapsed time as formatted string
   */
  getElapsedTime() {
    if (!this.startTime) return '0s';

    const elapsed = Date.now() - this.startTime;
    return this.formatDuration(elapsed);
  }

  /**
   * Get estimated time remaining
   */
  getETA() {
    if (!this.startTime || this.completedMonths === 0) return 'calculating...';

    const elapsed = Date.now() - this.startTime;
    const avgTimePerMonth = elapsed / this.completedMonths;
    const remaining = (this.totalMonths - this.completedMonths) * avgTimePerMonth;

    return this.formatDuration(remaining);
  }

  /**
   * Format duration in human-readable format
   */
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Log completion summary
   */
  complete() {
    const elapsed = this.getElapsedTime();
    const pointsPerSecond = this.processedPoints / ((Date.now() - this.startTime) / 1000);

    this.log('='.repeat(60));
    this.log('INGESTION COMPLETE');
    this.log('='.repeat(60));
    this.log(`Data type: ${this.dataType}`);
    this.log(`Resolution: ${this.resolution}°`);
    this.log(`Total months: ${this.completedMonths}`);
    this.log(`Total points: ${this.processedPoints.toLocaleString()}`);
    this.log(`Total API calls: ${this.apiCalls.toLocaleString()}`);
    this.log(`Errors: ${this.errors}`);
    this.log(`Duration: ${elapsed}`);
    this.log(`Average: ${pointsPerSecond.toFixed(1)} points/second`);
    this.log('='.repeat(60));
  }

  /**
   * Get summary object
   */
  getSummary() {
    return {
      dataType: this.dataType,
      resolution: this.resolution,
      completedMonths: this.completedMonths,
      totalMonths: this.totalMonths,
      processedPoints: this.processedPoints,
      apiCalls: this.apiCalls,
      errors: this.errors,
      elapsed: this.getElapsedTime(),
      percentComplete: ((this.completedMonths / this.totalMonths) * 100).toFixed(1)
    };
  }
}

module.exports = ProgressTracker;
