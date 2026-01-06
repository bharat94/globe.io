/**
 * Pollution data hook
 * Fetches and manages air quality data from Open-Meteo API
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  PollutionDataPoint,
  PollutionLocationData,
  PollutionMetadata
} from '../types/pollution';

const API_BASE = 'http://localhost:3001/api/pollution';

interface FetchProgress {
  isLoading: boolean;
  progress: number;
  current: number;
  total: number;
}

interface UsePollutionDataReturn {
  pollutionData: PollutionDataPoint[];
  heatmapData: PollutionDataPoint[];
  metadata: PollutionMetadata | null;
  loading: boolean;
  error: string | null;
  selectedLocation: PollutionLocationData | null;
  setSelectedLocation: (location: PollutionLocationData | null) => void;
  getLocationData: (lat: number, lng: number) => Promise<PollutionLocationData | null>;
  refresh: () => void;
  lastUpdated: Date | null;
  fetchProgress: FetchProgress;
}

export const usePollutionData = (): UsePollutionDataReturn => {
  const [pollutionData, setPollutionData] = useState<PollutionDataPoint[]>([]);
  const [metadata, setMetadata] = useState<PollutionMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<PollutionLocationData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [fetchProgress, setFetchProgress] = useState<FetchProgress>({
    isLoading: false,
    progress: 0,
    current: 0,
    total: 0
  });
  const progressIntervalRef = useRef<number | null>(null);

  // Poll for progress updates
  const startProgressPolling = useCallback(() => {
    if (progressIntervalRef.current) return;

    progressIntervalRef.current = window.setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE}/progress`);
        if (response.ok) {
          const progress = await response.json();
          setFetchProgress(progress);

          // Stop polling when complete
          if (!progress.isLoading && progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
        }
      } catch {
        // Ignore progress polling errors
      }
    }, 500);
  }, []);

  const stopProgressPolling = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // Fetch global pollution grid
  const fetchPollutionGrid = useCallback(async () => {
    setLoading(true);
    setError(null);
    startProgressPolling();

    try {
      const response = await fetch(`${API_BASE}/grid?resolution=15`);
      if (!response.ok) {
        throw new Error(`Failed to fetch pollution data: ${response.statusText}`);
      }

      const result = await response.json();
      setPollutionData(result.data);
      setMetadata(result.metadata);
      setLastUpdated(new Date());
      setFetchProgress({ isLoading: false, progress: 100, current: 0, total: 0 });
    } catch (err) {
      console.error('Pollution fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch pollution data');
    } finally {
      setLoading(false);
      stopProgressPolling();
    }
  }, [startProgressPolling, stopProgressPolling]);

  // Initial fetch
  useEffect(() => {
    fetchPollutionGrid();
  }, [fetchPollutionGrid]);

  // Get detailed data for a specific location
  const getLocationData = useCallback(async (lat: number, lng: number): Promise<PollutionLocationData | null> => {
    try {
      const response = await fetch(`${API_BASE}/location?lat=${lat}&lng=${lng}`);
      if (!response.ok) {
        return null;
      }
      return await response.json();
    } catch (err) {
      console.error('Location data fetch error:', err);
      return null;
    }
  }, []);

  // Refresh data
  const refresh = useCallback(() => {
    fetchPollutionGrid();
  }, [fetchPollutionGrid]);

  // Transform pollution data for heatmap visualization
  // Using same format as weather heatmap
  const heatmapData = pollutionData.map(point => ({
    ...point,
    // Weight is already normalized 0-1 in the backend
  }));

  return {
    pollutionData,
    heatmapData,
    metadata,
    loading,
    error,
    selectedLocation,
    setSelectedLocation,
    getLocationData,
    refresh,
    lastUpdated,
    fetchProgress
  };
};
