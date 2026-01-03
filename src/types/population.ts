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

export interface PopulationDemographics {
  femalePercent?: number;
  malePercent?: number;
  ages0to14?: number;
  ages15to64?: number;
  ages65plus?: number;
  lifeExpectancy?: number;
  urbanPercent?: number;
  ruralPercent?: number;
  growthRate?: number;
  density?: number;
  fertilityRate?: number;
}

export interface CountryDetailedData {
  countryCode: string;
  countryCode3: string;
  name: string;
  year: number;
  population: number;
  populationFormatted: string;
  demographics: PopulationDemographics;
  history: {
    year: number;
    population: number;
  }[];
}
