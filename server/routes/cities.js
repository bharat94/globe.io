const express = require('express');
const router = express.Router();
const City = require('../models/City');

// GET all cities
router.get('/', async (req, res) => {
  try {
    const cities = await City.find({}).select('-__v -createdAt -updatedAt');

    // Transform data to match frontend format (lat, lng instead of location.coordinates)
    const transformedCities = cities.map(city => ({
      name: city.name,
      country: city.country,
      lat: city.location.coordinates[1], // latitude
      lng: city.location.coordinates[0], // longitude
      population: city.population,
      area: city.area,
      founded: city.founded,
      timezone: city.timezone,
      famousFor: city.famousFor,
      trivia: city.trivia,
      color: city.color
    }));

    res.json(transformedCities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single city by name
router.get('/:name', async (req, res) => {
  try {
    const city = await City.findOne({ name: req.params.name });
    if (!city) {
      return res.status(404).json({ message: 'City not found' });
    }
    res.json(city);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET cities near a location (geospatial query)
router.get('/near/:lng/:lat', async (req, res) => {
  try {
    const { lng, lat } = req.params;
    const maxDistance = req.query.maxDistance || 5000000; // Default 5000km in meters

    const cities = await City.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    }).limit(10);

    res.json(cities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
