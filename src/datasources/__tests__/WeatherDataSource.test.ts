/**
 * Tests for WeatherDataSource
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { WeatherDataSource } from '../sources/weather/WeatherDataSource';
import type { DataQuery, HeatmapDataPoint } from '../types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('WeatherDataSource', () => {
  let dataSource: WeatherDataSource;

  beforeEach(() => {
    dataSource = new WeatherDataSource();
    mockFetch.mockReset();
  });

  afterEach(() => {
    dataSource.clearCache();
  });

  describe('sourceType', () => {
    it('should return "weather"', () => {
      expect(dataSource.sourceType).toBe('weather');
    });
  });

  describe('fetchData', () => {
    const mockData: HeatmapDataPoint[] = [
      { lat: 0, lng: 0, weight: 0.5, temperature: { avg: 25, min: 20, max: 30 } },
      { lat: 10, lng: 10, weight: 0.6, temperature: { avg: 28, min: 22, max: 34 } }
    ];

    it('should fetch data from API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      const query: DataQuery = { year: 2024, month: 1 };
      const result = await dataSource.fetchData(query);

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/weather/grid/2024/1'
      );
    });

    it('should include resolution in URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      const query: DataQuery = { year: 2024, month: 6, resolution: 5 };
      await dataSource.fetchData(query);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/weather/grid/2024/6?resolution=5'
      );
    });

    it('should include bounds in URL when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      const query: DataQuery = {
        year: 2024,
        month: 3,
        resolution: 2.5,
        bounds: { minLat: -10, maxLat: 10, minLng: -20, maxLng: 20 }
      };
      await dataSource.fetchData(query);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/weather/grid/2024/3?resolution=2.5&minLat=-10&maxLat=10&minLng=-20&maxLng=20'
      );
    });

    it('should cache results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

      const query: DataQuery = { year: 2024, month: 1 };

      // First call - fetches from API
      await dataSource.fetchData(query);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const cachedResult = await dataSource.fetchData(query);
      expect(mockFetch).toHaveBeenCalledTimes(1); // No additional call
      expect(cachedResult).toEqual(mockData);
    });

    it('should throw on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const query: DataQuery = { year: 2024, month: 1 };

      await expect(dataSource.fetchData(query)).rejects.toThrow(
        'Failed to fetch weather data: 500'
      );
    });
  });

  describe('getMetadata', () => {
    it('should fetch metadata from API', async () => {
      const mockMetadata = { minYear: 1940, maxYear: 2024 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMetadata)
      });

      const result = await dataSource.getMetadata();

      expect(result).toEqual(mockMetadata);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/weather/years'
      );
    });

    it('should throw on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      await expect(dataSource.getMetadata()).rejects.toThrow(
        'Failed to fetch metadata: 404'
      );
    });
  });

  describe('getLocationData', () => {
    it('should fetch location data from API', async () => {
      const mockLocationData = { lat: 40.7, lng: -74.0, temperature: { avg: 15 } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLocationData)
      });

      const result = await dataSource.getLocationData(40.7, -74.0, 2024);

      expect(result).toEqual(mockLocationData);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/weather/location/40.7/-74?year=2024'
      );
    });

    it('should return null on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const result = await dataSource.getLocationData(0, 0, 2024);

      expect(result).toBeNull();
    });
  });

  describe('cache operations', () => {
    it('should track cache size', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([])
      });

      expect(dataSource.getCacheSize()).toBe(0);

      await dataSource.fetchData({ year: 2024, month: 1 });
      expect(dataSource.getCacheSize()).toBe(1);

      await dataSource.fetchData({ year: 2024, month: 2 });
      expect(dataSource.getCacheSize()).toBe(2);
    });

    it('should clear cache', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([])
      });

      await dataSource.fetchData({ year: 2024, month: 1 });
      expect(dataSource.getCacheSize()).toBe(1);

      dataSource.clearCache();
      expect(dataSource.getCacheSize()).toBe(0);
    });
  });
});
