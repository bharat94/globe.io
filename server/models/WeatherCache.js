const mongoose = require('mongoose');

/**
 * WeatherCache schema for storing fetched Open-Meteo grid data
 * Optimized for fast lat/lng/year/month lookups
 */
const weatherCacheSchema = new mongoose.Schema({
  lat: {
    type: Number,
    required: true
  },
  lng: {
    type: Number,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  temperature: {
    avg: { type: Number, required: true },
    min: { type: Number, required: true },
    max: { type: Number, required: true }
  },
  source: {
    type: String,
    default: 'open-meteo'
  },
  fetchedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient grid queries
weatherCacheSchema.index({ year: 1, month: 1 });
// Unique compound index to prevent duplicates
weatherCacheSchema.index({ lat: 1, lng: 1, year: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('WeatherCache', weatherCacheSchema);
