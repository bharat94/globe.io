/**
 * Weather data source for frontend
 * Fetches temperature/weather data from the backend API
 */
import { BaseDataSource } from '../BaseDataSource';
import type { DataQuery, DataSourceMetadata, HeatmapDataPoint } from '../../types';

const API_BASE = 'http://localhost:3001/api/weather';

export class WeatherDataSource extends BaseDataSource<HeatmapDataPoint> {
  constructor() {
    super(API_BASE);
  }

  get sourceType(): string {
    return 'weather';
  }

  /**
   * Fetch weather grid data from backend
   */
  async fetchData(query: DataQuery): Promise<HeatmapDataPoint[]> {
    // Check cache first
    const cached = this.getFromCache(query);
    if (cached) {
      return cached;
    }

    // Build URL with query parameters
    let url = `${this.apiBase}/grid/${query.year}/${query.month}`;
    const params = new URLSearchParams();

    if (query.resolution) {
      params.set('resolution', String(query.resolution));
    }

    if (query.bounds) {
      params.set('minLat', String(query.bounds.minLat));
      params.set('maxLat', String(query.bounds.maxLat));
      params.set('minLng', String(query.bounds.minLng));
      params.set('maxLng', String(query.bounds.maxLng));
    }

    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    // Fetch from API
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch weather data: ${response.status}`);
    }

    const data: HeatmapDataPoint[] = await response.json();

    // Cache the result
    this.saveToCache(query, data);

    return data;
  }

  /**
   * Get metadata about available data (year range)
   */
  async getMetadata(): Promise<DataSourceMetadata> {
    const response = await fetch(`${this.apiBase}/years`);
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Fetch detailed location data for a specific point
   */
  async getLocationData(lat: number, lng: number, year: number): Promise<unknown> {
    const response = await fetch(`${this.apiBase}/location/${lat}/${lng}?year=${year}`);
    if (!response.ok) {
      return null;
    }
    return response.json();
  }
}
