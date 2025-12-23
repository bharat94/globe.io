const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  country: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      index: '2dsphere' // Geospatial index for location queries
    }
  },
  population: {
    type: String,
    required: true
  },
  area: {
    type: String,
    required: true
  },
  founded: {
    type: String,
    required: true
  },
  timezone: {
    type: String,
    required: true
  },
  famousFor: {
    type: String,
    required: true
  },
  trivia: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Create indexes for common queries
citySchema.index({ name: 1 });
citySchema.index({ country: 1 });
citySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('City', citySchema);
