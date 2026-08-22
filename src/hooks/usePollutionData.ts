/**
 * Pollution data hook
 * Fetches and manages air quality data from Open-Meteo API
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type {
  PollutionDataPoint,
  PollutionLocationData,
  PollutionMetadata,
  PollutantType
} from '../types/pollution';
import { normalizePollutant, getPollutantValue, POLLUTANT_CONFIG } from '../types/pollution';
import { API_ENDPOINTS } from '../config';

const API_BASE = API_ENDPOINTS.pollution;

interface FetchProgress {
  isLoading: boolean;
  progress: number;
  current: number;
  total: number;
}

interface HeatmapPoint {
  lat: number;
  lng: number;
  weight: number;
}

interface UsePollutionDataReturn {
  pollutionData: PollutionDataPoint[];
  heatmapData: HeatmapPoint[];
  metadata: PollutionMetadata | null;
  loading: boolean;
  error: string | null;
  selectedLocation: PollutionLocationData | null;
  setSelectedLocation: (location: PollutionLocationData | null) => void;
  getLocationData: (lat: number, lng: number) => Promise<PollutionLocationData | null>;
  refresh: () => void;
  lastUpdated: Date | null;
  fetchProgress: FetchProgress;
  selectedPollutant: PollutantType;
  setSelectedPollutant: (pollutant: PollutantType) => void;
  pollutantConfig: typeof POLLUTANT_CONFIG;
}

export const usePollutionData = (): UsePollutionDataReturn => {
  const [pollutionData, setPollutionData] = useState<PollutionDataPoint[]>([]);
  const [metadata, setMetadata] = useState<PollutionMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<PollutionLocationData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedPollutant, setSelectedPollutant] = useState<PollutantType>('pm2_5');
  const [fetchProgress, setFetchProgress] = useState<FetchProgress>({
    isLoading: false,
    progress: 0,
    current: 0,
    total: 0
  });
  const progressIntervalRef = useRef<number | null>(null);
  const fetchIdRef = useRef<number>(0);

  // Poll for progress updates
  const startProgressPolling = useCallback((fetchId: number) => {
    // Clear any existing polling
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = window.setInterval(async () => {
      // Stop if this fetch is no longer current
      if (fetchIdRef.current !== fetchId) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/progress`);
        if (response.ok) {
          const progress = await response.json();
          // Only update if this fetch is still current
          if (fetchIdRef.current === fetchId) {
            setFetchProgress(progress);
          }

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
    const currentFetchId = ++fetchIdRef.current;
    setLoading(true);
    setError(null);
    setFetchProgress({ isLoading: true, progress: 0, current: 0, total: 0 });
    startProgressPolling(currentFetchId);

    try {
      const response = await fetch(`${API_BASE}/grid?resolution=15`);

      // Check if this fetch is still current
      if (fetchIdRef.current !== currentFetchId) {
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch pollution data: ${response.statusText}`);
      }

      const result = await response.json();
      setPollutionData(result.data);
      setMetadata(result.metadata);
      setLastUpdated(new Date());
      setFetchProgress({ isLoading: false, progress: 100, current: 0, total: 0 });
    } catch (err) {
      if (fetchIdRef.current === currentFetchId) {
        console.error('Pollution fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch pollution data');
      }
    } finally {
      if (fetchIdRef.current === currentFetchId) {
        setLoading(false);
        stopProgressPolling();
      }
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

  // Transform pollution data for heatmap visualization based on selected pollutant
  // Using useMemo to prevent unnecessary re-renders
  const heatmapData = useMemo(() => {
    return pollutionData
      .map(point => {
        const value = getPollutantValue(point, selectedPollutant);
        const weight = normalizePollutant(value, selectedPollutant);
        return {
          lat: point.lat,
          lng: point.lng,
          weight
        };
      })
      .filter(point => point.weight > 0); // Filter out null/zero values
  }, [pollutionData, selectedPollutant]);

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
    fetchProgress,
    selectedPollutant,
    setSelectedPollutant,
    pollutantConfig: POLLUTANT_CONFIG
  };
};
