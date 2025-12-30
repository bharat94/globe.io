const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * IngestionJob schema for tracking data ingestion progress
 * Enables job resumability, monitoring, and management
 */
const ingestionJobSchema = new mongoose.Schema({
  // Job identification
  jobId: {
    type: String,
    required: true,
    unique: true,
    default: () => crypto.randomUUID()
  },

  // What type of data is being ingested
  dataType: {
    type: String,
    required: true,
    enum: ['temperature', 'precipitation', 'humidity', 'airQuality']
  },

  // Job parameters
  resolution: {
    type: Number,
    required: true
  },
  yearStart: {
    type: Number,
    required: true
  },
  yearEnd: {
    type: Number,
    required: true
  },

  // Job status
  status: {
    type: String,
    enum: ['pending', 'running', 'paused', 'completed', 'failed'],
    default: 'pending'
  },

  // Checkpoint for resumability (year-month granularity)
  lastCompletedYear: {
    type: Number,
    default: null
  },
  lastCompletedMonth: {
    type: Number,
    default: null
  },

  // Statistics
  stats: {
    totalMonths: { type: Number, default: 0 },
    completedMonths: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    processedPoints: { type: Number, default: 0 },
    failedPoints: { type: Number, default: 0 },
    apiCallsMade: { type: Number, default: 0 }
  },

  // Error tracking
  lastError: {
    message: String,
    stack: String,
    occurredAt: Date
  },

  // Timing
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for listing and filtering jobs
ingestionJobSchema.index({ status: 1, dataType: 1 });
ingestionJobSchema.index({ createdAt: -1 });

// Instance methods
ingestionJobSchema.methods.markStarted = function() {
  this.status = 'running';
  this.startedAt = new Date();
  this.lastActivityAt = new Date();
  return this.save();
};

ingestionJobSchema.methods.checkpoint = function(year, month, pointsProcessed, apiCalls) {
  this.lastCompletedYear = year;
  this.lastCompletedMonth = month;
  this.stats.completedMonths += 1;
  this.stats.processedPoints += pointsProcessed;
  this.stats.apiCallsMade += apiCalls;
  this.lastActivityAt = new Date();
  return this.save();
};

ingestionJobSchema.methods.markCompleted = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  this.lastActivityAt = new Date();
  return this.save();
};

ingestionJobSchema.methods.markFailed = function(error) {
  this.status = 'failed';
  this.lastError = {
    message: error.message,
    stack: error.stack,
    occurredAt: new Date()
  };
  this.lastActivityAt = new Date();
  return this.save();
};

ingestionJobSchema.methods.pause = function() {
  this.status = 'paused';
  this.lastActivityAt = new Date();
  return this.save();
};

// Static methods
ingestionJobSchema.statics.findResumable = function(dataType, resolution) {
  return this.findOne({
    dataType,
    resolution,
    status: { $in: ['running', 'paused'] }
  }).sort({ createdAt: -1 });
};

ingestionJobSchema.statics.getProgress = function(jobId) {
  return this.findOne({ jobId }).lean();
};

module.exports = mongoose.model('IngestionJob', ingestionJobSchema);
