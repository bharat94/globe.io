/**
 * Flight Data Hook
 * Fetches and manages real-time flight tracking data
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import type { Flight, FlightMetadata } from '../types/flights';

const API_BASE = 'http://localhost:3001/api/flights';
const REFRESH_INTERVAL = 15000; // 15 seconds

interface UseFlightDataReturn {
  flights: Flight[];
  metadata: FlightMetadata | null;
  loading: boolean;
  error: string | null;
  selectedFlight: Flight | null;
  setSelectedFlight: (flight: Flight | null) => void;
  refresh: () => void;
  isAutoRefreshing: boolean;
  setAutoRefresh: (enabled: boolean) => void;
}

export const useFlightData = (): UseFlightDataReturn => {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [metadata, setMetadata] = useState<FlightMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(true);

  const intervalRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  // Fetch flights data
  const fetchFlights = useCallback(async () => {
    try {
      setError(null);

      const response = await fetch(API_BASE);

      if (!isMountedRef.current) return;

      if (!response.ok) {
        throw new Error(`Failed to fetch flights: ${response.statusText}`);
      }

      const data = await response.json();

      if (!isMountedRef.current) return;

      setFlights(data.flights || []);
      setMetadata(data.metadata || null);
      setLoading(false);
    } catch (err) {
      if (!isMountedRef.current) return;

      console.error('Flight fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch flights');
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    isMountedRef.current = true;
    fetchFlights();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchFlights]);

  // Auto-refresh setup
  useEffect(() => {
    if (isAutoRefreshing) {
      intervalRef.current = window.setInterval(() => {
        fetchFlights();
      }, REFRESH_INTERVAL);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAutoRefreshing, fetchFlights]);

  // Manual refresh
  const refresh = useCallback(() => {
    setLoading(true);
    fetchFlights();
  }, [fetchFlights]);

  // Toggle auto-refresh
  const setAutoRefresh = useCallback((enabled: boolean) => {
    setIsAutoRefreshing(enabled);
  }, []);

  // Update selected flight when flights refresh
  useEffect(() => {
    if (selectedFlight) {
      const updated = flights.find(f => f.icao24 === selectedFlight.icao24);
      if (updated) {
        setSelectedFlight(updated);
      }
    }
  }, [flights, selectedFlight?.icao24]);

  return {
    flights,
    metadata,
    loading,
    error,
    selectedFlight,
    setSelectedFlight,
    refresh,
    isAutoRefreshing,
    setAutoRefresh
  };
};

export default useFlightData;
