/**
 * Flight Data Hook
 * Fetches and manages real-time flight tracking data
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import type { Flight, FlightMetadata, FlightTrack } from '../types/flights';

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
  // Track/trail related
  selectedFlightTrack: FlightTrack | null;
  trackLoading: boolean;
  showTrail: boolean;
  setShowTrail: (show: boolean) => void;
}

export const useFlightData = (): UseFlightDataReturn => {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [metadata, setMetadata] = useState<FlightMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(true);

  // Track/trail state
  const [selectedFlightTrack, setSelectedFlightTrack] = useState<FlightTrack | null>(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [showTrail, setShowTrail] = useState(true);

  // Derive selectedFlight from flights array - avoids infinite loop
  const selectedFlight = selectedFlightId
    ? flights.find(f => f.icao24 === selectedFlightId) || null
    : null;

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

  // Wrapper to set selected flight by ID
  const setSelectedFlight = useCallback((flight: Flight | null) => {
    setSelectedFlightId(flight?.icao24 || null);
  }, []);

  // Fetch flight track when a flight is selected
  const fetchFlightTrack = useCallback(async (icao24: string) => {
    try {
      setTrackLoading(true);

      const response = await fetch(`${API_BASE}/${icao24}/track`);

      if (!isMountedRef.current) return;

      if (!response.ok) {
        throw new Error(`Failed to fetch track: ${response.statusText}`);
      }

      const track = await response.json();

      if (!isMountedRef.current) return;

      setSelectedFlightTrack(track);
      setTrackLoading(false);
    } catch (err) {
      if (!isMountedRef.current) return;

      console.error('Flight track fetch error:', err);
      setSelectedFlightTrack(null);
      setTrackLoading(false);
    }
  }, []);

  // Auto-fetch track when selected flight changes
  useEffect(() => {
    if (selectedFlightId && showTrail) {
      fetchFlightTrack(selectedFlightId);
    } else {
      setSelectedFlightTrack(null);
    }
  }, [selectedFlightId, showTrail, fetchFlightTrack]);

  // Periodically refresh track for selected flight
  useEffect(() => {
    if (!selectedFlightId || !showTrail) return;

    const trackRefreshInterval = window.setInterval(() => {
      fetchFlightTrack(selectedFlightId);
    }, 30000); // Refresh track every 30 seconds

    return () => clearInterval(trackRefreshInterval);
  }, [selectedFlightId, showTrail, fetchFlightTrack]);

  return {
    flights,
    metadata,
    loading,
    error,
    selectedFlight,
    setSelectedFlight,
    refresh,
    isAutoRefreshing,
    setAutoRefresh,
    // Track/trail related
    selectedFlightTrack,
    trackLoading,
    showTrail,
    setShowTrail
  };
};

export default useFlightData;
