/**
 * PopulationData Model
 * Stores country-level population data over time
 * Data sourced from World Bank API
 */
const mongoose = require('mongoose');

const populationDataSchema = new mongoose.Schema({
  // Country identification
  countryCode: {
    type: String,
    required: true,
    index: true
  },
  countryCode3: {
    type: String,
    required: true
  },
  countryName: {
    type: String,
    required: true
  },

  // Geographic center (for visualization)
  lat: {
    type: Number,
    required: true
  },
  lng: {
    type: Number,
    required: true
  },

  // Time dimension
  year: {
    type: Number,
    required: true,
    index: true
  },

  // Population data
  population: {
    type: Number,
    required: true
  },

  // Metadata
  source: {
    type: String,
    default: 'world-bank'
  },
  ingestedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
populationDataSchema.index({ countryCode: 1, year: 1 }, { unique: true });
populationDataSchema.index({ year: 1 });

module.exports = mongoose.model('PopulationData', populationDataSchema);
