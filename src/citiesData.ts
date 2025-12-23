export interface City {
  name: string;
  lat: number;
  lng: number;
  population: string;
  trivia: string;
  color: string;
}

export const cities: City[] = [
  {
    name: "Tokyo",
    lat: 35.6762,
    lng: 139.6503,
    population: "37.4 million",
    trivia: "Tokyo is the world's most populous metropolitan area and has more Michelin-starred restaurants than any other city.",
    color: "#ff6b6b"
  },
  {
    name: "New York",
    lat: 40.7128,
    lng: -74.0060,
    population: "18.8 million",
    trivia: "The Statue of Liberty was a gift from France in 1886. New York City has over 800 languages spoken, making it the most linguistically diverse city in the world.",
    color: "#4ecdc4"
  },
  {
    name: "London",
    lat: 51.5074,
    lng: -0.1278,
    population: "9.6 million",
    trivia: "London has been a major settlement for over 2,000 years. The London Underground is the world's oldest underground railway, opening in 1863.",
    color: "#95e1d3"
  },
  {
    name: "Paris",
    lat: 48.8566,
    lng: 2.3522,
    population: "11.0 million",
    trivia: "Paris is known as the 'City of Light' due to its leading role during the Age of Enlightenment and its early adoption of street lighting.",
    color: "#feca57"
  },
  {
    name: "Dubai",
    lat: 25.2048,
    lng: 55.2708,
    population: "3.6 million",
    trivia: "The Burj Khalifa in Dubai is the tallest building in the world at 828 meters. Dubai has no street addresses; locations are described by landmarks.",
    color: "#ff9ff3"
  },
  {
    name: "Singapore",
    lat: 1.3521,
    lng: 103.8198,
    population: "5.7 million",
    trivia: "Singapore is a city-state and one of only three surviving city-states in the world. It has one of the highest standards of living globally.",
    color: "#54a0ff"
  },
  {
    name: "Sydney",
    lat: -33.8688,
    lng: 151.2093,
    population: "5.3 million",
    trivia: "The Sydney Opera House took 14 years to build and was completed in 1973. Sydney Harbour is one of the world's largest natural harbours.",
    color: "#48dbfb"
  },
  {
    name: "Rio de Janeiro",
    lat: -22.9068,
    lng: -43.1729,
    population: "13.5 million",
    trivia: "The Christ the Redeemer statue is one of the New Seven Wonders of the World. Rio hosted the Summer Olympics in 2016.",
    color: "#00d2d3"
  },
  {
    name: "Mumbai",
    lat: 19.0760,
    lng: 72.8777,
    population: "20.7 million",
    trivia: "Mumbai is the financial capital of India and home to Bollywood, the world's largest film industry by number of films produced.",
    color: "#ff6348"
  },
  {
    name: "Cairo",
    lat: 30.0444,
    lng: 31.2357,
    population: "21.3 million",
    trivia: "Cairo is home to the Great Pyramid of Giza, the only surviving Wonder of the Ancient World. The city has been continuously inhabited for over 1,000 years.",
    color: "#ffa502"
  }
];
