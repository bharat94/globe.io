#!/usr/bin/env node

/**
 * Geo Data Ingestion CLI
 *
 * Usage:
 *   node server/ingestion/index.js ingest --type temperature --resolution 10 --year-start 2000 --year-end 2024
 *   node server/ingestion/index.js jobs list
 *   node server/ingestion/index.js jobs status <job-id>
 *   node server/ingestion/index.js stats --type temperature
 */

require('dotenv').config();
const { program } = require('commander');
const mongoose = require('mongoose');
const config = require('./config');

// Import ingesters
const TemperatureIngester = require('./ingesters/TemperatureIngester');

// Import models for job management
const IngestionJob = require('../models/IngestionJob');
const TemperatureData = require('../models/TemperatureData');

/**
 * Get the appropriate ingester for a data type
 */
function getIngester(dataType) {
  switch (dataType) {
    case 'temperature':
      return new TemperatureIngester();
    // Future: case 'precipitation': return new PrecipitationIngester();
    default:
      throw new Error(`Unknown data type: ${dataType}. Supported: ${config.DATA_TYPES.join(', ')}`);
  }
}

/**
 * Connect to MongoDB
 */
async function connectDB() {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
}

/**
 * Disconnect from MongoDB
 */
async function disconnectDB() {
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

// ============================================
// INGEST COMMAND
// ============================================
program
  .command('ingest')
  .description('Run data ingestion from external APIs')
  .requiredOption('-t, --type <type>', `Data type (${config.DATA_TYPES.join(', ')})`)
  .requiredOption('-r, --resolution <number>', 'Grid resolution in degrees', parseFloat)
  .option('-ys, --year-start <year>', 'Start year (default: 2000)')
  .option('-ye, --year-end <year>', 'End year (default: 2024)')
  .option('--dry-run', 'Show what would be ingested without making API calls')
  .option('--resume <jobId>', 'Resume a specific job by ID')
  .action(async (options) => {
    // Parse year options with defaults
    const yearStart = options.yearStart ? parseInt(options.yearStart) : config.DEFAULT_YEAR_START;
    const yearEnd = options.yearEnd ? parseInt(options.yearEnd) : config.DEFAULT_YEAR_END;
    // Validate resolution
    if (!config.RESOLUTIONS.includes(options.resolution)) {
      console.error(`Invalid resolution: ${options.resolution}`);
      console.error(`Valid resolutions: ${config.RESOLUTIONS.join(', ')}`);
      process.exit(1);
    }

    // Validate data type
    if (!config.DATA_TYPES.includes(options.type)) {
      console.error(`Invalid data type: ${options.type}`);
      console.error(`Valid types: ${config.DATA_TYPES.join(', ')}`);
      process.exit(1);
    }

    await connectDB();

    try {
      const ingester = getIngester(options.type);

      // Setup graceful shutdown
      ingester.setupShutdownHandler();

      await ingester.ingest({
        resolution: options.resolution,
        yearStart,
        yearEnd,
        dryRun: options.dryRun,
        resumeJobId: options.resume
      });
    } catch (error) {
      console.error('Ingestion failed:', error.message);
      process.exit(1);
    } finally {
      await disconnectDB();
    }
  });

// ============================================
// JOBS COMMAND
// ============================================
const jobsCmd = program
  .command('jobs')
  .description('Manage ingestion jobs');

jobsCmd
  .command('list')
  .description('List all ingestion jobs')
  .option('-s, --status <status>', 'Filter by status (pending, running, paused, completed, failed)')
  .option('-t, --type <type>', 'Filter by data type')
  .option('-l, --limit <number>', 'Limit results', parseInt, 20)
  .action(async (options) => {
    await connectDB();

    try {
      const query = {};
      if (options.status) query.status = options.status;
      if (options.type) query.dataType = options.type;

      const jobs = await IngestionJob.find(query)
        .sort({ createdAt: -1 })
        .limit(options.limit)
        .lean();

      if (jobs.length === 0) {
        console.log('No jobs found.');
        return;
      }

      console.log('\nIngestion Jobs:');
      console.log('='.repeat(100));
      console.log(
        'Job ID'.padEnd(38) +
        'Type'.padEnd(14) +
        'Res'.padEnd(6) +
        'Status'.padEnd(12) +
        'Progress'.padEnd(12) +
        'Created'
      );
      console.log('-'.repeat(100));

      for (const job of jobs) {
        const progress = job.stats.totalMonths > 0
          ? `${Math.round((job.stats.completedMonths / job.stats.totalMonths) * 100)}%`
          : '0%';

        console.log(
          job.jobId.padEnd(38) +
          job.dataType.padEnd(14) +
          `${job.resolution}°`.padEnd(6) +
          job.status.padEnd(12) +
          progress.padEnd(12) +
          new Date(job.createdAt).toISOString().substring(0, 10)
        );
      }
      console.log('='.repeat(100));
    } finally {
      await disconnectDB();
    }
  });

jobsCmd
  .command('status <jobId>')
  .description('Get detailed status of a job')
  .action(async (jobId) => {
    await connectDB();

    try {
      const job = await IngestionJob.findOne({ jobId }).lean();

      if (!job) {
        console.error(`Job not found: ${jobId}`);
        process.exit(1);
      }

      console.log('\nJob Details:');
      console.log('='.repeat(60));
      console.log(`Job ID:       ${job.jobId}`);
      console.log(`Data Type:    ${job.dataType}`);
      console.log(`Resolution:   ${job.resolution}°`);
      console.log(`Year Range:   ${job.yearStart}-${job.yearEnd}`);
      console.log(`Status:       ${job.status}`);
      console.log('');
      console.log('Progress:');
      console.log(`  Months:     ${job.stats.completedMonths}/${job.stats.totalMonths}`);
      console.log(`  Points:     ${job.stats.processedPoints.toLocaleString()}`);
      console.log(`  API Calls:  ${job.stats.apiCallsMade.toLocaleString()}`);
      console.log(`  Errors:     ${job.stats.failedPoints}`);
      console.log('');
      console.log('Checkpoint:');
      console.log(`  Last:       ${job.lastCompletedYear}-${String(job.lastCompletedMonth || 0).padStart(2, '0')}`);
      console.log('');
      console.log('Timing:');
      console.log(`  Created:    ${job.createdAt}`);
      console.log(`  Started:    ${job.startedAt || 'N/A'}`);
      console.log(`  Completed:  ${job.completedAt || 'N/A'}`);
      console.log(`  Last Activity: ${job.lastActivityAt}`);

      if (job.lastError) {
        console.log('');
        console.log('Last Error:');
        console.log(`  Message:    ${job.lastError.message}`);
        console.log(`  Occurred:   ${job.lastError.occurredAt}`);
      }
      console.log('='.repeat(60));
    } finally {
      await disconnectDB();
    }
  });

// ============================================
// STATS COMMAND
// ============================================
program
  .command('stats')
  .description('Show data statistics')
  .option('-t, --type <type>', 'Data type', 'temperature')
  .action(async (options) => {
    await connectDB();

    try {
      if (options.type === 'temperature') {
        // Count by resolution
        const byResolution = await TemperatureData.aggregate([
          { $group: { _id: '$resolution', count: { $sum: 1 } } },
          { $sort: { _id: 1 } }
        ]);

        // Get year range
        const yearRange = await TemperatureData.aggregate([
          {
            $group: {
              _id: null,
              minYear: { $min: '$year' },
              maxYear: { $max: '$year' }
            }
          }
        ]);

        // Total count
        const totalCount = await TemperatureData.countDocuments();

        console.log('\nTemperature Data Statistics:');
        console.log('='.repeat(50));
        console.log(`Total records: ${totalCount.toLocaleString()}`);

        if (yearRange.length > 0) {
          console.log(`Year range: ${yearRange[0].minYear}-${yearRange[0].maxYear}`);
        }

        console.log('\nBy Resolution:');
        for (const res of byResolution) {
          console.log(`  ${res._id}°: ${res.count.toLocaleString()} records`);
        }
        console.log('='.repeat(50));
      }
    } finally {
      await disconnectDB();
    }
  });

// ============================================
// MAIN
// ============================================
program
  .name('globe-ingest')
  .description('Globe.io Data Ingestion CLI')
  .version('1.0.0');

program.parse();
