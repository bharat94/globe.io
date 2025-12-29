const mongoose = require('mongoose');

const weatherDataSchema = new mongoose.Schema({
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      index: '2dsphere'
    }
  },
  cityName: {
    type: String,
    index: true
  },
  country: {
    type: String
  },
  year: {
    type: Number,
    required: true,
    index: true
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
  precipitation: {
    total: { type: Number },  // mm
    days: { type: Number }    // number of rainy days
  },
  humidity: {
    type: Number  // percentage
  },
  climateZone: {
    type: String  // Koppen classification
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
weatherDataSchema.index({ year: 1, month: 1 });
weatherDataSchema.index({ 'location.coordinates': '2dsphere', year: 1 });
weatherDataSchema.index({ cityName: 1, year: 1, month: 1 });

module.exports = mongoose.model('WeatherData', weatherDataSchema);
