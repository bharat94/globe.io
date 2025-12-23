const mongoose = require('mongoose');
const City = require('../models/City');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/globe-io';

const citiesData = [
  {
    name: "Tokyo",
    country: "Japan",
    lat: 35.6762,
    lng: 139.6503,
    population: "37.4 million",
    area: "2,194 km²",
    founded: "1457",
    timezone: "UTC+9",
    famousFor: "Shibuya Crossing, Tokyo Skytree, Imperial Palace",
    trivia: "Tokyo is the world's most populous metropolitan area and has more Michelin-starred restaurants than any other city.",
    color: "#ff6b6b"
  },
  {
    name: "New York",
    country: "United States",
    lat: 40.7128,
    lng: -74.0060,
    population: "18.8 million",
    area: "783.8 km²",
    founded: "1624",
    timezone: "UTC-5",
    famousFor: "Statue of Liberty, Times Square, Central Park",
    trivia: "The Statue of Liberty was a gift from France in 1886. New York City has over 800 languages spoken, making it the most linguistically diverse city in the world.",
    color: "#4ecdc4"
  },
  {
    name: "London",
    country: "United Kingdom",
    lat: 51.5074,
    lng: -0.1278,
    population: "9.6 million",
    area: "1,572 km²",
    founded: "47 AD",
    timezone: "UTC+0",
    famousFor: "Big Ben, Tower Bridge, Buckingham Palace",
    trivia: "London has been a major settlement for over 2,000 years. The London Underground is the world's oldest underground railway, opening in 1863.",
    color: "#95e1d3"
  },
  {
    name: "Paris",
    country: "France",
    lat: 48.8566,
    lng: 2.3522,
    population: "11.0 million",
    area: "105.4 km²",
    founded: "3rd century BC",
    timezone: "UTC+1",
    famousFor: "Eiffel Tower, Louvre Museum, Arc de Triomphe",
    trivia: "Paris is known as the 'City of Light' due to its leading role during the Age of Enlightenment and its early adoption of street lighting.",
    color: "#feca57"
  },
  {
    name: "Dubai",
    country: "United Arab Emirates",
    lat: 25.2048,
    lng: 55.2708,
    population: "3.6 million",
    area: "4,114 km²",
    founded: "1833",
    timezone: "UTC+4",
    famousFor: "Burj Khalifa, Palm Jumeirah, Dubai Mall",
    trivia: "The Burj Khalifa in Dubai is the tallest building in the world at 828 meters. Dubai has no street addresses; locations are described by landmarks.",
    color: "#ff9ff3"
  },
  {
    name: "Singapore",
    country: "Singapore",
    lat: 1.3521,
    lng: 103.8198,
    population: "5.7 million",
    area: "733.1 km²",
    founded: "1819",
    timezone: "UTC+8",
    famousFor: "Marina Bay Sands, Gardens by the Bay, Merlion",
    trivia: "Singapore is a city-state and one of only three surviving city-states in the world. It has one of the highest standards of living globally.",
    color: "#54a0ff"
  },
  {
    name: "Sydney",
    country: "Australia",
    lat: -33.8688,
    lng: 151.2093,
    population: "5.3 million",
    area: "12,368 km²",
    founded: "1788",
    timezone: "UTC+10",
    famousFor: "Sydney Opera House, Harbour Bridge, Bondi Beach",
    trivia: "The Sydney Opera House took 14 years to build and was completed in 1973. Sydney Harbour is one of the world's largest natural harbours.",
    color: "#48dbfb"
  },
  {
    name: "Rio de Janeiro",
    country: "Brazil",
    lat: -22.9068,
    lng: -43.1729,
    population: "13.5 million",
    area: "1,221 km²",
    founded: "1565",
    timezone: "UTC-3",
    famousFor: "Christ the Redeemer, Copacabana Beach, Sugarloaf Mountain",
    trivia: "The Christ the Redeemer statue is one of the New Seven Wonders of the World. Rio hosted the Summer Olympics in 2016.",
    color: "#00d2d3"
  },
  {
    name: "Mumbai",
    country: "India",
    lat: 19.0760,
    lng: 72.8777,
    population: "20.7 million",
    area: "603.4 km²",
    founded: "1507",
    timezone: "UTC+5:30",
    famousFor: "Gateway of India, Marine Drive, Bollywood",
    trivia: "Mumbai is the financial capital of India and home to Bollywood, the world's largest film industry by number of films produced.",
    color: "#ff6348"
  },
  {
    name: "Cairo",
    country: "Egypt",
    lat: 30.0444,
    lng: 31.2357,
    population: "21.3 million",
    area: "3,085 km²",
    founded: "969 AD",
    timezone: "UTC+2",
    famousFor: "Pyramids of Giza, Sphinx, Egyptian Museum",
    trivia: "Cairo is home to the Great Pyramid of Giza, the only surviving Wonder of the Ancient World. The city has been continuously inhabited for over 1,000 years.",
    color: "#ffa502"
  },
  {
    name: "Beijing",
    country: "China",
    lat: 39.9042,
    lng: 116.4074,
    population: "21.5 million",
    area: "16,410 km²",
    founded: "1045 BC",
    timezone: "UTC+8",
    famousFor: "Great Wall, Forbidden City, Temple of Heaven",
    trivia: "Beijing has been the capital of China for over 800 years and hosted the 2008 Summer Olympics and 2022 Winter Olympics.",
    color: "#ff7979"
  },
  {
    name: "Shanghai",
    country: "China",
    lat: 31.2304,
    lng: 121.4737,
    population: "27.8 million",
    area: "6,341 km²",
    founded: "1291",
    timezone: "UTC+8",
    famousFor: "The Bund, Oriental Pearl Tower, Yu Garden",
    trivia: "Shanghai has the world's busiest container port and the second-tallest building in the world, the Shanghai Tower at 632 meters.",
    color: "#6c5ce7"
  },
  {
    name: "Moscow",
    country: "Russia",
    lat: 55.7558,
    lng: 37.6173,
    population: "12.6 million",
    area: "2,511 km²",
    founded: "1147",
    timezone: "UTC+3",
    famousFor: "Red Square, Kremlin, St. Basil's Cathedral",
    trivia: "Moscow's Metro system is one of the deepest in the world and is renowned for its ornate stations, often called 'underground palaces'.",
    color: "#a29bfe"
  },
  {
    name: "Istanbul",
    country: "Turkey",
    lat: 41.0082,
    lng: 28.9784,
    population: "15.8 million",
    area: "5,461 km²",
    founded: "660 BC",
    timezone: "UTC+3",
    famousFor: "Hagia Sophia, Blue Mosque, Grand Bazaar",
    trivia: "Istanbul is the only city in the world located on two continents (Europe and Asia), separated by the Bosphorus Strait.",
    color: "#fd79a8"
  },
  {
    name: "Mexico City",
    country: "Mexico",
    lat: 19.4326,
    lng: -99.1332,
    population: "22.1 million",
    area: "1,485 km²",
    founded: "1325",
    timezone: "UTC-6",
    famousFor: "Zócalo, Frida Kahlo Museum, Teotihuacan",
    trivia: "Mexico City is built on the ruins of the Aztec city of Tenochtitlan and is sinking at a rate of up to 50 cm per year due to groundwater extraction.",
    color: "#fdcb6e"
  },
  {
    name: "São Paulo",
    country: "Brazil",
    lat: -23.5505,
    lng: -46.6333,
    population: "22.4 million",
    area: "1,521 km²",
    founded: "1554",
    timezone: "UTC-3",
    famousFor: "Paulista Avenue, São Paulo Museum of Art, Ibirapuera Park",
    trivia: "São Paulo is the largest city in the Southern Hemisphere and has the world's largest Japanese population outside Japan.",
    color: "#e17055"
  },
  {
    name: "Los Angeles",
    country: "United States",
    lat: 34.0522,
    lng: -118.2437,
    population: "13.2 million",
    area: "1,302 km²",
    founded: "1781",
    timezone: "UTC-8",
    famousFor: "Hollywood Sign, Griffith Observatory, Santa Monica Pier",
    trivia: "Los Angeles is the entertainment capital of the world and has the nickname 'City of Angels'. It's also one of the most ethnically diverse cities in the US.",
    color: "#74b9ff"
  },
  {
    name: "Bangkok",
    country: "Thailand",
    lat: 13.7563,
    lng: 100.5018,
    population: "10.9 million",
    area: "1,569 km²",
    founded: "1782",
    timezone: "UTC+7",
    famousFor: "Grand Palace, Wat Pho, Floating Markets",
    trivia: "Bangkok holds the Guinness World Record for the longest city name. Its ceremonial name has 168 letters in Thai.",
    color: "#55efc4"
  },
  {
    name: "Seoul",
    country: "South Korea",
    lat: 37.5665,
    lng: 126.9780,
    population: "25.6 million",
    area: "605.2 km²",
    founded: "18 BC",
    timezone: "UTC+9",
    famousFor: "Gyeongbokgung Palace, N Seoul Tower, Gangnam",
    trivia: "Seoul is one of the most technologically advanced cities in the world, with the fastest average internet speed globally.",
    color: "#81ecec"
  },
  {
    name: "Jakarta",
    country: "Indonesia",
    lat: -6.2088,
    lng: 106.8456,
    population: "34.5 million",
    area: "664.0 km²",
    founded: "1527",
    timezone: "UTC+7",
    famousFor: "National Monument, Thousand Islands, Old Town",
    trivia: "Jakarta is the largest city in Southeast Asia and is sinking faster than any other major city in the world, at up to 25 cm per year.",
    color: "#fab1a0"
  },
  {
    name: "Delhi",
    country: "India",
    lat: 28.7041,
    lng: 77.1025,
    population: "32.9 million",
    area: "1,484 km²",
    founded: "6th century BC",
    timezone: "UTC+5:30",
    famousFor: "Red Fort, India Gate, Qutub Minar",
    trivia: "Delhi has been continuously inhabited since the 6th century BC and has served as the capital of various kingdoms and empires throughout history.",
    color: "#ff6b81"
  },
  {
    name: "Lagos",
    country: "Nigeria",
    lat: 6.5244,
    lng: 3.3792,
    population: "15.4 million",
    area: "1,171 km²",
    founded: "15th century",
    timezone: "UTC+1",
    famousFor: "Lekki Conservation Centre, National Museum, Victoria Island",
    trivia: "Lagos is Africa's largest city by population and is projected to become one of the world's largest cities by 2050.",
    color: "#f8a5c2"
  },
  {
    name: "Buenos Aires",
    country: "Argentina",
    lat: -34.6037,
    lng: -58.3816,
    population: "15.4 million",
    area: "203.0 km²",
    founded: "1536",
    timezone: "UTC-3",
    famousFor: "Casa Rosada, La Boca, Tango Dancing",
    trivia: "Buenos Aires is known as the 'Paris of South America' for its European architecture and is the birthplace of tango dancing.",
    color: "#a29bfe"
  },
  {
    name: "Toronto",
    country: "Canada",
    lat: 43.6532,
    lng: -79.3832,
    population: "6.4 million",
    area: "630.2 km²",
    founded: "1793",
    timezone: "UTC-5",
    famousFor: "CN Tower, Royal Ontario Museum, Toronto Islands",
    trivia: "Toronto is one of the most multicultural cities in the world, with over 200 ethnic groups and more than 160 languages spoken.",
    color: "#dfe6e9"
  },
  {
    name: "Berlin",
    country: "Germany",
    lat: 52.5200,
    lng: 13.4050,
    population: "6.1 million",
    area: "891.8 km²",
    founded: "13th century",
    timezone: "UTC+1",
    famousFor: "Brandenburg Gate, Berlin Wall, Museum Island",
    trivia: "Berlin has more bridges than Venice and is home to the world's largest Turkish population outside Turkey.",
    color: "#636e72"
  },
  {
    name: "Rome",
    country: "Italy",
    lat: 41.9028,
    lng: 12.4964,
    population: "4.3 million",
    area: "1,285 km²",
    founded: "753 BC",
    timezone: "UTC+1",
    famousFor: "Colosseum, Vatican City, Trevi Fountain",
    trivia: "Rome is called the 'Eternal City' and has been continuously inhabited for over 2,800 years. It contains a country within it - Vatican City.",
    color: "#b2bec3"
  },
  {
    name: "Madrid",
    country: "Spain",
    lat: 40.4168,
    lng: -3.7038,
    population: "6.7 million",
    area: "604.3 km²",
    founded: "9th century",
    timezone: "UTC+1",
    famousFor: "Prado Museum, Royal Palace, Plaza Mayor",
    trivia: "Madrid is the highest capital city in Europe at 667 meters above sea level and has more bars per capita than any other European city.",
    color: "#ffeaa7"
  },
  {
    name: "Melbourne",
    country: "Australia",
    lat: -37.8136,
    lng: 144.9631,
    population: "5.2 million",
    area: "9,993 km²",
    founded: "1835",
    timezone: "UTC+10",
    famousFor: "Federation Square, Great Ocean Road, Australian Open",
    trivia: "Melbourne is known as Australia's cultural capital and has been ranked the world's most liveable city multiple times.",
    color: "#00b894"
  },
  {
    name: "Amsterdam",
    country: "Netherlands",
    lat: 52.3676,
    lng: 4.9041,
    population: "2.4 million",
    area: "219.3 km²",
    founded: "1275",
    timezone: "UTC+1",
    famousFor: "Canal Ring, Anne Frank House, Van Gogh Museum",
    trivia: "Amsterdam has more than 165 canals and 1,281 bridges. It also has more bicycles than people, with over 880,000 bikes in the city.",
    color: "#0984e3"
  },
  {
    name: "Barcelona",
    country: "Spain",
    lat: 41.3874,
    lng: 2.1686,
    population: "5.6 million",
    area: "101.9 km²",
    founded: "15 BC",
    timezone: "UTC+1",
    famousFor: "Sagrada Familia, Park Güell, La Rambla",
    trivia: "Barcelona is home to 9 UNESCO World Heritage Sites and the famous Sagrada Familia has been under construction for over 140 years.",
    color: "#00cec9"
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing cities...');
    await City.deleteMany({});
    console.log('✅ Cleared existing cities');

    // Transform and insert data
    console.log('📝 Inserting cities...');
    const transformedCities = citiesData.map(city => ({
      name: city.name,
      country: city.country,
      location: {
        type: 'Point',
        coordinates: [city.lng, city.lat] // MongoDB uses [longitude, latitude]
      },
      population: city.population,
      area: city.area,
      founded: city.founded,
      timezone: city.timezone,
      famousFor: city.famousFor,
      trivia: city.trivia,
      color: city.color
    }));

    await City.insertMany(transformedCities);
    console.log(`✅ Inserted ${transformedCities.length} cities`);

    // Verify data
    const count = await City.countDocuments();
    console.log(`📊 Total cities in database: ${count}`);

    console.log('\n🎉 Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
