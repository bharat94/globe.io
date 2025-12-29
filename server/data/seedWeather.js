const mongoose = require('mongoose');
const WeatherData = require('../models/WeatherData');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/globe-io';

// City data with base temperatures and climate info
const citiesData = [
  { name: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503, baseTemp: 16, amplitude: 13, climateZone: "Humid Subtropical" },
  { name: "New York", country: "United States", lat: 40.7128, lng: -74.0060, baseTemp: 13, amplitude: 14, climateZone: "Humid Subtropical" },
  { name: "London", country: "United Kingdom", lat: 51.5074, lng: -0.1278, baseTemp: 11, amplitude: 7, climateZone: "Temperate Maritime" },
  { name: "Paris", country: "France", lat: 48.8566, lng: 2.3522, baseTemp: 12, amplitude: 9, climateZone: "Temperate Oceanic" },
  { name: "Dubai", country: "United Arab Emirates", lat: 25.2048, lng: 55.2708, baseTemp: 28, amplitude: 10, climateZone: "Hot Desert" },
  { name: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198, baseTemp: 27, amplitude: 1, climateZone: "Tropical Rainforest" },
  { name: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093, baseTemp: 18, amplitude: 7, climateZone: "Humid Subtropical" },
  { name: "Rio de Janeiro", country: "Brazil", lat: -22.9068, lng: -43.1729, baseTemp: 24, amplitude: 5, climateZone: "Tropical Savanna" },
  { name: "Mumbai", country: "India", lat: 19.0760, lng: 72.8777, baseTemp: 27, amplitude: 4, climateZone: "Tropical Wet and Dry" },
  { name: "Cairo", country: "Egypt", lat: 30.0444, lng: 31.2357, baseTemp: 22, amplitude: 10, climateZone: "Hot Desert" },
  { name: "Beijing", country: "China", lat: 39.9042, lng: 116.4074, baseTemp: 13, amplitude: 17, climateZone: "Humid Continental" },
  { name: "Shanghai", country: "China", lat: 31.2304, lng: 121.4737, baseTemp: 17, amplitude: 13, climateZone: "Humid Subtropical" },
  { name: "Moscow", country: "Russia", lat: 55.7558, lng: 37.6173, baseTemp: 6, amplitude: 15, climateZone: "Humid Continental" },
  { name: "Istanbul", country: "Turkey", lat: 41.0082, lng: 28.9784, baseTemp: 15, amplitude: 10, climateZone: "Mediterranean" },
  { name: "Mexico City", country: "Mexico", lat: 19.4326, lng: -99.1332, baseTemp: 17, amplitude: 4, climateZone: "Subtropical Highland" },
  { name: "São Paulo", country: "Brazil", lat: -23.5505, lng: -46.6333, baseTemp: 20, amplitude: 5, climateZone: "Humid Subtropical" },
  { name: "Los Angeles", country: "United States", lat: 34.0522, lng: -118.2437, baseTemp: 18, amplitude: 6, climateZone: "Mediterranean" },
  { name: "Bangkok", country: "Thailand", lat: 13.7563, lng: 100.5018, baseTemp: 29, amplitude: 3, climateZone: "Tropical Savanna" },
  { name: "Seoul", country: "South Korea", lat: 37.5665, lng: 126.9780, baseTemp: 13, amplitude: 15, climateZone: "Humid Continental" },
  { name: "Jakarta", country: "Indonesia", lat: -6.2088, lng: 106.8456, baseTemp: 27, amplitude: 1, climateZone: "Tropical Monsoon" },
  { name: "Delhi", country: "India", lat: 28.7041, lng: 77.1025, baseTemp: 25, amplitude: 12, climateZone: "Humid Subtropical" },
  { name: "Lagos", country: "Nigeria", lat: 6.5244, lng: 3.3792, baseTemp: 27, amplitude: 2, climateZone: "Tropical Savanna" },
  { name: "Buenos Aires", country: "Argentina", lat: -34.6037, lng: -58.3816, baseTemp: 17, amplitude: 8, climateZone: "Humid Subtropical" },
  { name: "Toronto", country: "Canada", lat: 43.6532, lng: -79.3832, baseTemp: 9, amplitude: 15, climateZone: "Humid Continental" },
  { name: "Berlin", country: "Germany", lat: 52.5200, lng: 13.4050, baseTemp: 10, amplitude: 10, climateZone: "Temperate Oceanic" },
  { name: "Rome", country: "Italy", lat: 41.9028, lng: 12.4964, baseTemp: 16, amplitude: 9, climateZone: "Mediterranean" },
  { name: "Madrid", country: "Spain", lat: 40.4168, lng: -3.7038, baseTemp: 15, amplitude: 11, climateZone: "Hot-Summer Mediterranean" },
  { name: "Melbourne", country: "Australia", lat: -37.8136, lng: 144.9631, baseTemp: 15, amplitude: 7, climateZone: "Temperate Oceanic" },
  { name: "Amsterdam", country: "Netherlands", lat: 52.3676, lng: 4.9041, baseTemp: 10, amplitude: 7, climateZone: "Temperate Oceanic" },
  { name: "Barcelona", country: "Spain", lat: 41.3874, lng: 2.1686, baseTemp: 16, amplitude: 8, climateZone: "Hot-Summer Mediterranean" },
  { name: "Johannesburg", country: "South Africa", lat: -26.2041, lng: 28.0473, baseTemp: 16, amplitude: 7, climateZone: "Subtropical Highland" },
  { name: "Nairobi", country: "Kenya", lat: -1.2864, lng: 36.8172, baseTemp: 19, amplitude: 2, climateZone: "Subtropical Highland" },
  { name: "Casablanca", country: "Morocco", lat: 33.5731, lng: -7.5898, baseTemp: 18, amplitude: 7, climateZone: "Hot-Summer Mediterranean" },
  { name: "Addis Ababa", country: "Ethiopia", lat: 9.0320, lng: 38.7469, baseTemp: 17, amplitude: 3, climateZone: "Subtropical Highland" },
  { name: "Accra", country: "Ghana", lat: 5.6037, lng: -0.1870, baseTemp: 27, amplitude: 2, climateZone: "Tropical Savanna" },
  { name: "Dar es Salaam", country: "Tanzania", lat: -6.7924, lng: 39.2083, baseTemp: 26, amplitude: 3, climateZone: "Tropical Savanna" },
  { name: "Kinshasa", country: "Democratic Republic of Congo", lat: -4.4419, lng: 15.2663, baseTemp: 25, amplitude: 2, climateZone: "Tropical Wet and Dry" },
  { name: "Luanda", country: "Angola", lat: -8.8368, lng: 13.2343, baseTemp: 25, amplitude: 4, climateZone: "Semi-Arid" },
  { name: "Tehran", country: "Iran", lat: 35.6892, lng: 51.3890, baseTemp: 17, amplitude: 15, climateZone: "Cold Semi-Arid" },
  { name: "Riyadh", country: "Saudi Arabia", lat: 24.7136, lng: 46.6753, baseTemp: 26, amplitude: 12, climateZone: "Hot Desert" },
  { name: "Baghdad", country: "Iraq", lat: 33.3152, lng: 44.3661, baseTemp: 23, amplitude: 15, climateZone: "Hot Desert" },
  { name: "Tel Aviv", country: "Israel", lat: 32.0853, lng: 34.7818, baseTemp: 20, amplitude: 8, climateZone: "Hot-Summer Mediterranean" },
  { name: "Kuala Lumpur", country: "Malaysia", lat: 3.1390, lng: 101.6869, baseTemp: 28, amplitude: 1, climateZone: "Tropical Rainforest" },
  { name: "Manila", country: "Philippines", lat: 14.5995, lng: 120.9842, baseTemp: 28, amplitude: 2, climateZone: "Tropical Monsoon" },
  { name: "Hanoi", country: "Vietnam", lat: 21.0285, lng: 105.8542, baseTemp: 24, amplitude: 9, climateZone: "Humid Subtropical" },
  { name: "Karachi", country: "Pakistan", lat: 24.8607, lng: 67.0011, baseTemp: 26, amplitude: 8, climateZone: "Hot Desert" },
  { name: "Bogotá", country: "Colombia", lat: 4.7110, lng: -74.0721, baseTemp: 14, amplitude: 1, climateZone: "Subtropical Highland" },
  { name: "Lima", country: "Peru", lat: -12.0464, lng: -77.0428, baseTemp: 19, amplitude: 4, climateZone: "Subtropical Desert" },
  { name: "Auckland", country: "New Zealand", lat: -36.8485, lng: 174.7633, baseTemp: 15, amplitude: 6, climateZone: "Temperate Oceanic" },
  { name: "Havana", country: "Cuba", lat: 23.1136, lng: -82.3666, baseTemp: 25, amplitude: 4, climateZone: "Tropical Savanna" }
];

// Generate temperature for a specific month considering hemisphere and seasonal variation
function generateTemperature(city, year, month) {
  const isNorthernHemisphere = city.lat >= 0;

  // Month adjustment: January = 1, peaks in July (north) or January (south)
  // For northern hemisphere, peak month is 7 (July), trough is 1 (January)
  // For southern hemisphere, it's reversed
  const peakMonth = isNorthernHemisphere ? 7 : 1;

  // Calculate seasonal offset (0 to 1, where 1 is peak season)
  const monthOffset = ((month - peakMonth + 12) % 12) / 12;
  const seasonalFactor = Math.cos(monthOffset * 2 * Math.PI); // -1 to 1

  // Climate change trend: slight warming over 2000-2024 (about 0.02°C per year)
  const yearOffset = year - 2000;
  const warmingTrend = yearOffset * 0.02;

  // Random year-to-year variation (-1 to 1°C)
  const yearVariation = (Math.sin(year * 12.345) * 0.5) + (Math.cos(year * 7.89) * 0.5);

  // Random monthly variation (-2 to 2°C)
  const monthVariation = Math.sin(year * month * 1.234) * 2;

  // Calculate average temperature
  const avgTemp = city.baseTemp + (seasonalFactor * city.amplitude) + warmingTrend + yearVariation + monthVariation;

  // Calculate min/max with daily range based on climate
  const dailyRange = city.climateZone.includes('Desert') ? 15 :
                     city.climateZone.includes('Tropical') ? 6 :
                     city.climateZone.includes('Continental') ? 12 : 8;

  const minTemp = avgTemp - (dailyRange / 2) + (Math.random() * 2 - 1);
  const maxTemp = avgTemp + (dailyRange / 2) + (Math.random() * 2 - 1);

  return {
    avg: Math.round(avgTemp * 10) / 10,
    min: Math.round(minTemp * 10) / 10,
    max: Math.round(maxTemp * 10) / 10
  };
}

// Generate precipitation data
function generatePrecipitation(city, month) {
  const isNorthernHemisphere = city.lat >= 0;

  // Base precipitation by climate
  let basePrecip = 50;
  let seasonalPattern = 'uniform';

  if (city.climateZone.includes('Tropical')) {
    basePrecip = 150;
    seasonalPattern = 'monsoon';
  } else if (city.climateZone.includes('Desert')) {
    basePrecip = 10;
  } else if (city.climateZone.includes('Mediterranean')) {
    basePrecip = 40;
    seasonalPattern = 'winter-wet';
  } else if (city.climateZone.includes('Continental')) {
    basePrecip = 60;
    seasonalPattern = 'summer-wet';
  }

  // Apply seasonal pattern
  let seasonalMultiplier = 1;
  if (seasonalPattern === 'monsoon') {
    // Wet season in summer
    const wetMonths = isNorthernHemisphere ? [6, 7, 8, 9] : [12, 1, 2, 3];
    seasonalMultiplier = wetMonths.includes(month) ? 2.5 : 0.4;
  } else if (seasonalPattern === 'winter-wet') {
    // Wet in winter, dry in summer
    const wetMonths = isNorthernHemisphere ? [11, 12, 1, 2, 3] : [5, 6, 7, 8, 9];
    seasonalMultiplier = wetMonths.includes(month) ? 1.8 : 0.3;
  } else if (seasonalPattern === 'summer-wet') {
    const wetMonths = isNorthernHemisphere ? [5, 6, 7, 8] : [11, 12, 1, 2];
    seasonalMultiplier = wetMonths.includes(month) ? 1.5 : 0.7;
  }

  const total = Math.round(basePrecip * seasonalMultiplier * (0.7 + Math.random() * 0.6));
  const days = Math.min(28, Math.max(0, Math.round(total / 8 + Math.random() * 3)));

  return { total, days };
}

async function seedWeatherData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing weather data
    console.log('🗑️  Clearing existing weather data...');
    await WeatherData.deleteMany({});
    console.log('✅ Cleared existing weather data');

    // Generate weather data for 2000-2024
    console.log('🌡️  Generating weather data for 2000-2024...');
    const startYear = 2000;
    const endYear = 2024;

    const weatherRecords = [];

    for (const city of citiesData) {
      for (let year = startYear; year <= endYear; year++) {
        for (let month = 1; month <= 12; month++) {
          const temperature = generateTemperature(city, year, month);
          const precipitation = generatePrecipitation(city, month);

          weatherRecords.push({
            location: {
              type: 'Point',
              coordinates: [city.lng, city.lat]
            },
            cityName: city.name,
            country: city.country,
            year,
            month,
            temperature,
            precipitation,
            humidity: Math.round(40 + Math.random() * 40), // 40-80%
            climateZone: city.climateZone
          });
        }
      }
      process.stdout.write(`\r📍 Processed ${city.name}...`);
    }

    console.log(`\n📝 Inserting ${weatherRecords.length} weather records...`);

    // Insert in batches of 1000 for performance
    const batchSize = 1000;
    for (let i = 0; i < weatherRecords.length; i += batchSize) {
      const batch = weatherRecords.slice(i, i + batchSize);
      await WeatherData.insertMany(batch);
      process.stdout.write(`\r✅ Inserted ${Math.min(i + batchSize, weatherRecords.length)}/${weatherRecords.length} records`);
    }

    console.log('\n');

    // Verify data
    const count = await WeatherData.countDocuments();
    const years = await WeatherData.distinct('year');
    console.log(`📊 Total weather records: ${count}`);
    console.log(`📅 Years covered: ${years[0]} - ${years[years.length - 1]}`);

    console.log('\n🎉 Weather data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding weather data:', error);
    process.exit(1);
  }
}

seedWeatherData();
