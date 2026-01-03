/**
 * Tests for useWeatherData hook (backwards compatibility wrapper)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWeatherData, getZoomLevel, getResolutionForZoom } from '../useWeatherData';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useWeatherData', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockFetch.mockReset();
    // Default mock for metadata and grid data
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/years')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ minYear: 2000, maxYear: 2024 })
        });
      }
      if (url.includes('/grid/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { lat: 0, lng: 0, weight: 0.5, temperature: { avg: 25, min: 20, max: 30 } },
            { lat: 10, lng: 10, weight: 0.6, temperature: { avg: 28, min: 22, max: 34 } }
          ])
        });
      }
      if (url.includes('/location/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { lat: 40.7, lng: -74, month: 1, temperature: { avg: 5, min: -2, max: 10 } },
            { lat: 40.7, lng: -74, month: 2, temperature: { avg: 7, min: 0, max: 12 } }
          ])
        });
      }
      return Promise.resolve({ ok: false, status: 404 });
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('backwards compatibility', () => {
    it('should return heatmapData array', async () => {
      const { result } = renderHook(() => useWeatherData());

      await waitFor(() => {
        expect(result.current.heatmapData.length).toBeGreaterThan(0);
      });

      // Verify HeatmapPoint format (lat, lng, weight only)
      result.current.heatmapData.forEach(point => {
        expect(point).toHaveProperty('lat');
        expect(point).toHaveProperty('lng');
        expect(point).toHaveProperty('weight');
        expect(typeof point.lat).toBe('number');
        expect(typeof point.lng).toBe('number');
        expect(typeof point.weight).toBe('number');
      });
    });

    it('should return yearRange object', async () => {
      const { result } = renderHook(() => useWeatherData());

      await waitFor(() => {
        expect(result.current.yearRange).toBeDefined();
      });

      expect(result.current.yearRange).toHaveProperty('minYear');
      expect(result.current.yearRange).toHaveProperty('maxYear');
      expect(result.current.yearRange.minYear).toBe(2000);
      expect(result.current.yearRange.maxYear).toBe(2024);
    });

    it('should provide all expected interface properties', async () => {
      const { result } = renderHook(() => useWeatherData());

      // Check all properties exist
      expect(result.current).toHaveProperty('heatmapData');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('yearRange');
      expect(result.current).toHaveProperty('selectedYear');
      expect(result.current).toHaveProperty('selectedMonth');
      expect(result.current).toHaveProperty('isPlaying');
      expect(result.current).toHaveProperty('playbackSpeed');
      expect(result.current).toHaveProperty('currentZoom');
      expect(result.current).toHaveProperty('currentResolution');
      expect(result.current).toHaveProperty('setSelectedYear');
      expect(result.current).toHaveProperty('setSelectedMonth');
      expect(result.current).toHaveProperty('togglePlayback');
      expect(result.current).toHaveProperty('setPlaybackSpeed');
      expect(result.current).toHaveProperty('setViewport');
      expect(result.current).toHaveProperty('getLocationData');

      // Check function types
      expect(typeof result.current.setSelectedYear).toBe('function');
      expect(typeof result.current.setSelectedMonth).toBe('function');
      expect(typeof result.current.togglePlayback).toBe('function');
      expect(typeof result.current.setPlaybackSpeed).toBe('function');
      expect(typeof result.current.setViewport).toBe('function');
      expect(typeof result.current.getLocationData).toBe('function');
    });
  });

  describe('getLocationData', () => {
    it('should fetch location data for coordinates', async () => {
      const { result } = renderHook(() => useWeatherData());

      await waitFor(() => {
        expect(result.current.heatmapData.length).toBeGreaterThan(0);
      });

      const locationData = await result.current.getLocationData(40.7, -74);

      expect(locationData).not.toBeNull();
      expect(locationData?.lat).toBe(40.7);
      expect(locationData?.month).toBe(1); // Should match selectedMonth
    });

    it('should return null on API error', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/location/')) {
          return Promise.resolve({ ok: false, status: 404 });
        }
        // Keep other mocks working
        if (url.includes('/years')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ minYear: 2000, maxYear: 2024 })
          });
        }
        if (url.includes('/grid/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([])
          });
        }
        return Promise.resolve({ ok: false, status: 404 });
      });

      const { result } = renderHook(() => useWeatherData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const locationData = await result.current.getLocationData(0, 0);
      expect(locationData).toBeNull();
    });
  });

  describe('re-exported utilities', () => {
    it('should re-export getZoomLevel', () => {
      expect(typeof getZoomLevel).toBe('function');
      expect(getZoomLevel(4)).toBe('global');
      expect(getZoomLevel(2.5)).toBe('continental');
    });

    it('should re-export getResolutionForZoom', () => {
      expect(typeof getResolutionForZoom).toBe('function');
      expect(getResolutionForZoom('global')).toBe(10);
      expect(getResolutionForZoom('detail')).toBe(0.5);
    });
  });
});
