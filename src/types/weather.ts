export interface WeatherDataPoint {
  lat: number;
  lng: number;
  cityName?: string;
  country?: string;
  year: number;
  month: number;
  temperature: {
    avg: number;
    min: number;
    max: number;
  };
  precipitation?: {
    total: number;
    days: number;
  };
  humidity?: number;
  climateZone?: string;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  weight: number;  // 0-1 normalized temperature value
}

export interface WeatherLocation {
  lat: number;
  lng: number;
  cityName?: string;
  country?: string;
  data: WeatherDataPoint;
}

export interface YearRange {
  minYear: number;
  maxYear: number;
}
