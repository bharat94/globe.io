/**
 * Aurora Data Hook
 * Fetches and manages aurora forecast and space weather data
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { AuroraPoint, SpaceWeather, AuroraMetadata } from '../types/aurora';

const API_BASE = 'http://localhost:3001/api/aurora';
const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes

interface UseAuroraDataReturn {
  auroraPoints: AuroraPoint[];
  spaceWeather: SpaceWeather | null;
  metadata: AuroraMetadata | null;
  loading: boolean;
  error: string | null;
  heatmapData: Array<{ lat: number; lng: number; weight: number }>;
  lastUpdated: Date | null;
  refresh: () => void;
}

export const useAuroraData = (): UseAuroraDataReturn => {
  const [auroraPoints, setAuroraPoints] = useState<AuroraPoint[]>([]);
  const [spaceWeather, setSpaceWeather] = useState<SpaceWeather | null>(null);
  const [metadata, setMetadata] = useState<AuroraMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const intervalRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  // Fetch aurora forecast
  const fetchForecast = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/forecast`);
      if (!isMountedRef.current) return null;

      if (!response.ok) {
        throw new Error(`Failed to fetch aurora forecast: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      console.error('Aurora forecast error:', err);
      return null;
    }
  }, []);

  // Fetch space weather
  const fetchWeather = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/weather`);
      if (!isMountedRef.current) return null;

      if (!response.ok) {
        throw new Error(`Failed to fetch space weather: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      console.error('Space weather error:', err);
      return null;
    }
  }, []);

  // Fetch all aurora data
  const fetchAuroraData = useCallback(async () => {
    try {
      setError(null);

      // Fetch both in parallel
      const [forecast, weather] = await Promise.all([
        fetchForecast(),
        fetchWeather()
      ]);

      if (!isMountedRef.current) return;

      if (forecast?.points) {
        setAuroraPoints(forecast.points);
      }

      if (weather) {
        setSpaceWeather(weather);
      }

      // Build metadata
      if (forecast || weather) {
        setMetadata({
          totalPoints: forecast?.points?.length || 0,
          maxProbability: forecast?.metadata?.maxProbability || 0,
          lastUpdated: new Date().toISOString(),
          kpIndex: weather?.kpIndex || 0,
          forecast: weather?.forecast || 'Unknown'
        });
        setLastUpdated(new Date());
      }

      setLoading(false);
    } catch (err) {
      if (!isMountedRef.current) return;

      console.error('Aurora data error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch aurora data');
      setLoading(false);
    }
  }, [fetchForecast, fetchWeather]);

  // Initial fetch
  useEffect(() => {
    isMountedRef.current = true;
    fetchAuroraData();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchAuroraData]);

  // Auto-refresh
  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      fetchAuroraData();
    }, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchAuroraData]);

  // Manual refresh
  const refresh = useCallback(() => {
    setLoading(true);
    fetchAuroraData();
  }, [fetchAuroraData]);

  // Convert aurora points to heatmap format (memoized to prevent unnecessary re-renders)
  const heatmapData = useMemo(() =>
    auroraPoints.map(point => ({
      lat: point.lat,
      lng: point.lng,
      weight: point.probability / 100 // Normalize to 0-1
    })),
    [auroraPoints]
  );

  return {
    auroraPoints,
    spaceWeather,
    metadata,
    loading,
    error,
    heatmapData,
    lastUpdated,
    refresh
  };
};

export default useAuroraData;
