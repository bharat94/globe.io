const mongoose = require('mongoose');

/**
 * TemperatureData schema for storing pre-computed global temperature data
 * Supports multiple grid resolutions for progressive zoom loading
 */
const temperatureDataSchema = new mongoose.Schema({
  // Grid location
  lat: {
    type: Number,
    required: true
  },
  lng: {
    type: Number,
    required: true
  },

  // Resolution in degrees (10, 5, 2.5)
  resolution: {
    type: Number,
    required: true,
    enum: [10, 5, 2.5, 2, 1, 0.5]
  },

  // Time dimensions
  year: {
    type: Number,
    required: true,
    min: 1940,
    max: 2100
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },

  // Temperature data
  temperature: {
    avg: { type: Number, required: true },
    min: { type: Number, required: true },
    max: { type: Number, required: true }
  },

  // Metadata
  source: {
    type: String,
    default: 'open-meteo'
  },
  ingestedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Unique compound index - prevents duplicate ingestion
temperatureDataSchema.index(
  { lat: 1, lng: 1, resolution: 1, year: 1, month: 1 },
  { unique: true }
);

// Primary query pattern: get all points for a resolution/year/month
temperatureDataSchema.index({ resolution: 1, year: 1, month: 1 });

// Viewport queries (for partial fetches if needed)
temperatureDataSchema.index({ resolution: 1, year: 1, month: 1, lat: 1, lng: 1 });

module.exports = mongoose.model('TemperatureData', temperatureDataSchema);
