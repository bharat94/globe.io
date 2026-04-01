/**
 * Flight Data Hook
 * Fetches and manages real-time flight tracking data
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Flight, FlightMetadata, FlightTrack, FlightCategory } from '../types/flights';
import { categorizeFlightByCallsign, getCategoryColor } from '../types/flights';
import { determineFlightRoute } from '../utils/airports';

const API_BASE = 'http://localhost:3001/api/flights';
const REFRESH_INTERVAL = 15000; // 15 seconds

interface UseFlightDataReturn {
  // Raw data
  flights: Flight[];
  metadata: FlightMetadata | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  isAutoRefreshing: boolean;
  setAutoRefresh: (enabled: boolean) => void;
  // Selection
  selectedFlight: Flight | null;
  setSelectedFlight: (flight: Flight | null) => void;
  // Track/trail related
  selectedFlightTrack: FlightTrack | null;
  trackLoading: boolean;
  showTrail: boolean;
  setShowTrail: (show: boolean) => void;
  // Category filtering
  selectedCategories: FlightCategory[];
  setSelectedCategories: React.Dispatch<React.SetStateAction<FlightCategory[]>>;
  categoryCounts: Record<FlightCategory, number>;
  filteredFlights: Flight[];
  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Flight[];
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

  // Category filtering state
  const [selectedCategories, setSelectedCategories] = useState<FlightCategory[]>([
    'commercial', 'cargo', 'private', 'military', 'other'
  ]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Categorize all flights when data changes
  const categorizedFlights = useMemo(() => {
    return flights.map(flight => ({
      ...flight,
      category: categorizeFlightByCallsign(flight.callsign),
      // Update color to use category color instead of altitude color
      color: getCategoryColor(categorizeFlightByCallsign(flight.callsign))
    }));
  }, [flights]);

  // Count flights per category
  const categoryCounts = useMemo(() => {
    const counts: Record<FlightCategory, number> = {
      commercial: 0,
      cargo: 0,
      private: 0,
      military: 0,
      other: 0
    };
    for (const flight of categorizedFlights) {
      counts[flight.category]++;
    }
    return counts;
  }, [categorizedFlights]);

  // Filter flights by selected categories
  const filteredFlights = useMemo(() => {
    return categorizedFlights.filter(f => selectedCategories.includes(f.category));
  }, [categorizedFlights, selectedCategories]);

  // Search results (filter by callsign)
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toUpperCase();
    return filteredFlights
      .filter(f => f.callsign?.toUpperCase().includes(q))
      .slice(0, 20); // Limit to 20 results
  }, [filteredFlights, searchQuery]);

  // Derive selectedFlight from categorized flights array - avoids infinite loop
  const selectedFlight = selectedFlightId
    ? categorizedFlights.find(f => f.icao24 === selectedFlightId) || null
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

      const track: FlightTrack = await response.json();

      if (!isMountedRef.current) return;

      // Compute origin/destination from track data
      if (track.path && track.path.length > 0) {
        const { origin, destination } = determineFlightRoute(track.path);
        track.route = {
          origin: origin ? { code: origin.code, city: origin.city, country: origin.country } : null,
          destination: destination ? { code: destination.code, city: destination.city, country: destination.country } : null
        };
      }

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
    // Raw data
    flights: categorizedFlights, // Return categorized flights as the main flights array
    metadata,
    loading,
    error,
    refresh,
    isAutoRefreshing,
    setAutoRefresh,
    // Selection
    selectedFlight,
    setSelectedFlight,
    // Track/trail related
    selectedFlightTrack,
    trackLoading,
    showTrail,
    setShowTrail,
    // Category filtering
    selectedCategories,
    setSelectedCategories,
    categoryCounts,
    filteredFlights,
    // Search
    searchQuery,
    setSearchQuery,
    searchResults
  };
};

export default useFlightData;
