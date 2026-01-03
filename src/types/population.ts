/**
 * Population data types
 */

export interface PopulationDataPoint {
  countryCode: string;
  countryCode3: string;
  name: string;
  lat: number;
  lng: number;
  population: number;
  weight: number; // Normalized 0-1 for bubble sizing
  populationFormatted: string;
}

export interface CountryPopulationHistory {
  countryCode: string;
  countryCode3: string;
  name: string;
  lat: number;
  lng: number;
  history: {
    year: number;
    population: number;
    populationFormatted: string;
  }[];
}

export interface PopulationYearRange {
  minYear: number;
  maxYear: number;
}
