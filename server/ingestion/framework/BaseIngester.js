/**
 * Base ingester class - template for all data type ingesters
 * Handles common logic: batching, checkpointing, progress tracking, resumability
 */

const RateLimiter = require('./RateLimiter');
const ProgressTracker = require('./ProgressTracker');
const IngestionJob = require('../../models/IngestionJob');
const { generateGlobalGrid, generateYearMonths } = require('../../utils/gridUtils');
const config = require('../config');

class BaseIngester {
  constructor(options = {}) {
    this.dataType = options.dataType;
    this.model = options.model;
    this.batchSize = options.batchSize || config.RATE_LIMIT.batchSize;

    this.rateLimiter = new RateLimiter({
      maxRequestsPerDay: config.RATE_LIMIT.safeRequestsPerDay,
      minDelayMs: config.RATE_LIMIT.minDelayBetweenRequestsMs
    });

    this.progressTracker = null;
    this.job = null;
  }

  /**
   * Main ingestion entry point
   * @param {Object} options - Ingestion options
   * @param {number} options.resolution - Grid resolution in degrees
   * @param {number} options.yearStart - Start year
   * @param {number} options.yearEnd - End year
   * @param {boolean} options.dryRun - If true, don't actually fetch/save data
   * @param {string} options.resumeJobId - Resume a specific job
   */
  async ingest(options) {
    const { resolution, yearStart, yearEnd, dryRun, resumeJobId } = options;

    // Generate grid points and year-months
    const points = generateGlobalGrid(resolution);
    const yearMonths = generateYearMonths(yearStart, yearEnd);

    console.log(`\nIngestion Plan:`);
    console.log(`  Data type: ${this.dataType}`);
    console.log(`  Resolution: ${resolution}°`);
    console.log(`  Year range: ${yearStart}-${yearEnd}`);
    console.log(`  Grid points: ${points.length}`);
    console.log(`  Total months: ${yearMonths.length}`);
    console.log(`  Estimated records: ${(points.length * yearMonths.length).toLocaleString()}`);
    console.log(`  Estimated API calls: ${Math.ceil(points.length / this.batchSize) * yearMonths.length}`);
    console.log('');

    if (dryRun) {
      console.log('[DRY RUN] No data will be fetched or saved.');
      return;
    }

    // Initialize or resume job
    this.job = await this.initializeJob({
      resolution,
      yearStart,
      yearEnd,
      resumeJobId,
      totalMonths: yearMonths.length,
      pointsPerMonth: points.length
    });

    // Initialize progress tracker
    this.progressTracker = new ProgressTracker({
      dataType: this.dataType,
      resolution,
      totalMonths: yearMonths.length,
      totalPoints: points.length
    });

    // Find resume point
    const startIndex = this.findResumePoint(yearMonths);
    if (startIndex > 0) {
      console.log(`Resuming from ${yearMonths[startIndex].year}-${yearMonths[startIndex].month}`);
      this.progressTracker.completedMonths = startIndex;
    }

    this.progressTracker.start();

    try {
      // Process each year-month
      for (let i = startIndex; i < yearMonths.length; i++) {
        const { year, month } = yearMonths[i];

        // Check for graceful shutdown signal
        if (this.shouldStop) {
          console.log('\nReceived stop signal. Pausing job...');
          await this.job.pause();
          break;
        }

        await this.processYearMonth(points, year, month, resolution);
      }

      // Mark complete if we finished everything
      if (!this.shouldStop) {
        await this.job.markCompleted();
        this.progressTracker.complete();
      }
    } catch (error) {
      console.error('\nIngestion failed:', error.message);
      await this.job.markFailed(error);
      throw error;
    }
  }

  /**
   * Initialize or resume an ingestion job
   */
  async initializeJob(options) {
    const { resolution, yearStart, yearEnd, resumeJobId, totalMonths, pointsPerMonth } = options;

    // Try to resume existing job
    if (resumeJobId) {
      const existingJob = await IngestionJob.findOne({ jobId: resumeJobId });
      if (existingJob) {
        console.log(`Resuming job: ${existingJob.jobId}`);
        await existingJob.markStarted();
        return existingJob;
      }
      console.warn(`Job ${resumeJobId} not found. Creating new job.`);
    }

    // Check for any running/paused job with same params
    const resumable = await IngestionJob.findResumable(this.dataType, resolution);
    if (resumable) {
      console.log(`Found resumable job: ${resumable.jobId}`);
      await resumable.markStarted();
      return resumable;
    }

    // Create new job
    const job = new IngestionJob({
      dataType: this.dataType,
      resolution,
      yearStart,
      yearEnd,
      stats: {
        totalMonths,
        totalPoints: totalMonths * pointsPerMonth
      }
    });

    await job.save();
    await job.markStarted();

    console.log(`Created new job: ${job.jobId}`);
    return job;
  }

  /**
   * Find the index to resume from based on job checkpoint
   */
  findResumePoint(yearMonths) {
    if (!this.job.lastCompletedYear || !this.job.lastCompletedMonth) {
      return 0;
    }

    const checkpointIndex = yearMonths.findIndex(
      (ym) =>
        ym.year === this.job.lastCompletedYear &&
        ym.month === this.job.lastCompletedMonth
    );

    // Start from the month AFTER the last completed one
    return checkpointIndex >= 0 ? checkpointIndex + 1 : 0;
  }

  /**
   * Process a single year-month across all grid points
   */
  async processYearMonth(points, year, month, resolution) {
    let processedCount = 0;
    let apiCalls = 0;

    // Process in batches
    for (let i = 0; i < points.length; i += this.batchSize) {
      const batch = points.slice(i, i + this.batchSize);

      try {
        // Rate limit
        await this.rateLimiter.throttle();
        apiCalls++;

        // Fetch data from source (implemented by subclass)
        const rawData = await this.fetchData(batch, year, month);

        // Transform data (implemented by subclass)
        const documents = this.transformData(rawData, resolution, year, month);

        // Save to database (skip duplicates)
        if (documents.length > 0) {
          await this.model.insertMany(documents, { ordered: false }).catch((err) => {
            // Ignore duplicate key errors
            if (err.code !== 11000) {
              throw err;
            }
          });
        }

        processedCount += documents.length;
      } catch (error) {
        this.progressTracker.error(
          `Batch error at ${year}-${month} (points ${i}-${i + batch.length})`,
          error
        );
        this.rateLimiter.recordFailure();
      }
    }

    // Update job checkpoint
    await this.job.checkpoint(year, month, processedCount, apiCalls);

    // Update progress tracker
    this.progressTracker.recordMonthComplete(year, month, processedCount, apiCalls);
  }

  /**
   * Fetch data from source - MUST be implemented by subclass
   * @param {Array} points - Array of {lat, lng} objects
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @returns {Promise<Array>} Raw data from source
   */
  async fetchData(points, year, month) {
    throw new Error('fetchData() must be implemented by subclass');
  }

  /**
   * Transform raw data to model format - MUST be implemented by subclass
   * @param {Array} rawData - Raw data from source
   * @param {number} resolution - Grid resolution
   * @param {number} year - Year
   * @param {number} month - Month
   * @returns {Array} Documents ready for database insertion
   */
  transformData(rawData, resolution, year, month) {
    throw new Error('transformData() must be implemented by subclass');
  }

  /**
   * Setup graceful shutdown handling
   */
  setupShutdownHandler() {
    this.shouldStop = false;

    const shutdown = async () => {
      console.log('\nGraceful shutdown initiated...');
      this.shouldStop = true;
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }
}

module.exports = BaseIngester;
