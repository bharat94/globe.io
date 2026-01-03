/**
 * Weather-specific data hook
 * Wraps useGlobeData for backwards compatibility while adding weather-specific features
 */
import { useCallback } from 'react';
import { useGlobeData, getZoomLevel, getResolutionForZoom } from './useGlobeData';
import type { HeatmapPoint, YearRange, WeatherDataPoint } from '../types/weather';
import type { Viewport, ZoomLevel } from '../datasources/types';

// Re-export types and utilities for backwards compatibility
export { getZoomLevel, getResolutionForZoom };
export type { Viewport, ZoomLevel };

const API_BASE = 'http://localhost:3001/api/weather';

interface UseWeatherDataReturn {
  heatmapData: HeatmapPoint[];
  loading: boolean;
  error: string | null;
  yearRange: YearRange;
  selectedYear: number;
  selectedMonth: number;
  isPlaying: boolean;
  playbackSpeed: number;
  currentZoom: ZoomLevel;
  currentResolution: number;
  setSelectedYear: (year: number) => void;
  setSelectedMonth: (month: number) => void;
  togglePlayback: () => void;
  setPlaybackSpeed: (speed: number) => void;
  setViewport: (viewport: Viewport) => void;
  getLocationData: (lat: number, lng: number) => Promise<WeatherDataPoint | null>;
}

export const useWeatherData = (): UseWeatherDataReturn => {
  // Use the generic useGlobeData hook with weather source
  const {
    data,
    loading,
    error,
    metadata,
    selectedYear,
    selectedMonth,
    isPlaying,
    playbackSpeed,
    currentZoom,
    currentResolution,
    setSelectedYear,
    setSelectedMonth,
    togglePlayback,
    setPlaybackSpeed,
    setViewport
  } = useGlobeData({ sourceType: 'weather' });

  // Convert metadata to yearRange format for backwards compatibility
  const yearRange: YearRange = {
    minYear: metadata?.minYear ?? 2000,
    maxYear: metadata?.maxYear ?? 2024
  };

  // Map data to HeatmapPoint format (ensuring backwards compatibility)
  const heatmapData: HeatmapPoint[] = data.map(point => ({
    lat: point.lat,
    lng: point.lng,
    weight: point.weight
  }));

  // Weather-specific: fetch detailed location data
  const getLocationData = useCallback(async (lat: number, lng: number): Promise<WeatherDataPoint | null> => {
    try {
      const response = await fetch(`${API_BASE}/location/${lat}/${lng}?year=${selectedYear}`);
      if (!response.ok) return null;

      const data = await response.json();
      const monthData = data.find((d: WeatherDataPoint) => d.month === selectedMonth);
      return monthData || (data.length > 0 ? data[0] : null);
    } catch (err) {
      console.error('Error fetching location data:', err);
      return null;
    }
  }, [selectedYear, selectedMonth]);

  return {
    heatmapData,
    loading,
    error,
    yearRange,
    selectedYear,
    selectedMonth,
    isPlaying,
    playbackSpeed,
    currentZoom,
    currentResolution,
    setSelectedYear,
    setSelectedMonth,
    togglePlayback,
    setPlaybackSpeed,
    setViewport,
    getLocationData
  };
};
