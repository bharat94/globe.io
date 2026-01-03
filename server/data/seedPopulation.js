/**
 * Population Data Seeder
 * Fetches country population data from World Bank API and stores in MongoDB
 */
const mongoose = require('mongoose');
require('dotenv').config();

const PopulationData = require('../models/PopulationData');
const countries = require('./countries');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/globe-io';
const WORLD_BANK_API = 'https://api.worldbank.org/v2/country';
const START_YEAR = 1960;
const END_YEAR = 2023;

/**
 * Fetch population data from World Bank API for a country
 */
async function fetchCountryPopulation(countryCode) {
  const url = `${WORLD_BANK_API}/${countryCode}/indicator/SP.POP.TOTL?format=json&date=${START_YEAR}:${END_YEAR}&per_page=100`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    // World Bank returns [metadata, data] array
    if (!data || !data[1]) {
      console.warn(`No data for ${countryCode}`);
      return [];
    }

    return data[1]
      .filter(d => d.value !== null)
      .map(d => ({
        year: parseInt(d.date),
        population: d.value
      }));
  } catch (error) {
    console.error(`Error fetching ${countryCode}:`, error.message);
    return [];
  }
}

/**
 * Main seeding function
 */
async function seedPopulationData() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  console.log('Clearing existing population data...');
  await PopulationData.deleteMany({});

  const totalCountries = countries.length;
  let processedCountries = 0;
  let totalRecords = 0;

  console.log(`Fetching population data for ${totalCountries} countries...`);
  console.log(`Year range: ${START_YEAR}-${END_YEAR}\n`);

  // Process countries in batches to respect API limits
  const BATCH_SIZE = 5;
  for (let i = 0; i < countries.length; i += BATCH_SIZE) {
    const batch = countries.slice(i, i + BATCH_SIZE);

    const batchPromises = batch.map(async (country) => {
      const populationData = await fetchCountryPopulation(country.code);

      if (populationData.length === 0) {
        console.log(`  [SKIP] ${country.name} - no data`);
        return 0;
      }

      // Create records for this country
      const records = populationData.map(d => ({
        countryCode: country.code,
        countryCode3: country.code3,
        countryName: country.name,
        lat: country.lat,
        lng: country.lng,
        year: d.year,
        population: d.population,
        source: 'world-bank'
      }));

      // Insert into database
      await PopulationData.insertMany(records);
      console.log(`  [OK] ${country.name}: ${records.length} years`);
      return records.length;
    });

    const results = await Promise.all(batchPromises);
    totalRecords += results.reduce((a, b) => a + b, 0);
    processedCountries += batch.length;

    console.log(`Progress: ${processedCountries}/${totalCountries} countries\n`);

    // Small delay between batches
    if (i + BATCH_SIZE < countries.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Get year range from actual data
  const stats = await PopulationData.aggregate([
    {
      $group: {
        _id: null,
        minYear: { $min: '$year' },
        maxYear: { $max: '$year' },
        totalRecords: { $sum: 1 },
        uniqueCountries: { $addToSet: '$countryCode' }
      }
    }
  ]);

  console.log('\n========================================');
  console.log('Population data seeding complete!');
  console.log('========================================');
  console.log(`Total records: ${totalRecords}`);
  console.log(`Countries: ${stats[0]?.uniqueCountries?.length || 0}`);
  console.log(`Year range: ${stats[0]?.minYear || 'N/A'} - ${stats[0]?.maxYear || 'N/A'}`);

  await mongoose.disconnect();
  console.log('\nDisconnected from MongoDB');
}

// Run if called directly
if (require.main === module) {
  seedPopulationData()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}

module.exports = { seedPopulationData };
