/**
 * Earthquake data hook
 * Fetches real-time seismic data from USGS via our API
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import type { Earthquake, EarthquakeMetadata, TimeRange, EarthquakeDetail } from '../types/earthquake';

const API_BASE = 'http://localhost:3001/api/earthquakes';

// Auto-refresh interval (5 minutes)
const REFRESH_INTERVAL = 5 * 60 * 1000;

interface UseEarthquakeDataReturn {
  earthquakes: Earthquake[];
  metadata: EarthquakeMetadata | null;
  loading: boolean;
  error: string | null;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  minMagnitude: number;
  setMinMagnitude: (mag: number) => void;
  selectedEarthquake: Earthquake | null;
  setSelectedEarthquake: (eq: Earthquake | null) => void;
  earthquakeDetails: EarthquakeDetail | null;
  detailsLoading: boolean;
  refresh: () => void;
  lastUpdated: Date | null;
}

export const useEarthquakeData = (): UseEarthquakeDataReturn => {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [metadata, setMetadata] = useState<EarthquakeMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('day');
  const [minMagnitude, setMinMagnitude] = useState(2.5);
  const [selectedEarthquake, setSelectedEarthquake] = useState<Earthquake | null>(null);
  const [earthquakeDetails, setEarthquakeDetails] = useState<EarthquakeDetail | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch earthquakes
  const fetchEarthquakes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const url = `${API_BASE}?range=${timeRange}&minmagnitude=${minMagnitude}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch earthquakes: ${response.statusText}`);
      }

      const data = await response.json();
      setEarthquakes(data.earthquakes);
      setMetadata(data.metadata);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Earthquake fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch earthquakes');
    } finally {
      setLoading(false);
    }
  }, [timeRange, minMagnitude]);

  // Initial fetch and refetch on parameter change
  useEffect(() => {
    fetchEarthquakes();
  }, [fetchEarthquakes]);

  // Auto-refresh
  useEffect(() => {
    refreshIntervalRef.current = setInterval(fetchEarthquakes, REFRESH_INTERVAL);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchEarthquakes]);

  // Fetch details when earthquake is selected
  useEffect(() => {
    if (!selectedEarthquake) {
      setEarthquakeDetails(null);
      return;
    }

    const fetchDetails = async () => {
      setDetailsLoading(true);
      try {
        const response = await fetch(`${API_BASE}/${selectedEarthquake.id}`);
        if (response.ok) {
          const data = await response.json();
          setEarthquakeDetails(data);
        }
      } catch (err) {
        console.error('Failed to fetch earthquake details:', err);
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchDetails();
  }, [selectedEarthquake]);

  const refresh = useCallback(() => {
    fetchEarthquakes();
  }, [fetchEarthquakes]);

  return {
    earthquakes,
    metadata,
    loading,
    error,
    timeRange,
    setTimeRange,
    minMagnitude,
    setMinMagnitude,
    selectedEarthquake,
    setSelectedEarthquake,
    earthquakeDetails,
    detailsLoading,
    refresh,
    lastUpdated,
  };
};
