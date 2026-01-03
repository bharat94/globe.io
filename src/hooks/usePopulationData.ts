/**
 * Population data hook
 * Fetches and manages country population data for globe visualization
 * Includes caching and preloading for smooth playback transitions
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import type { PopulationDataPoint, PopulationYearRange, CountryDetailedData } from '../types/population';

const API_BASE = 'http://localhost:3001/api/population';

// In-memory cache for population data by year
const dataCache = new Map<number, PopulationDataPoint[]>();

interface UsePopulationDataReturn {
  populationData: PopulationDataPoint[];
  loading: boolean;
  error: string | null;
  yearRange: PopulationYearRange;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  isPlaying: boolean;
  togglePlayback: () => void;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
  getCountryData: (countryCode: string) => Promise<any>;
  getCountryDetails: (countryCode: string, year: number) => Promise<CountryDetailedData | null>;
}

// Fetch helper (shared for main fetch and preload)
async function fetchYearData(year: number): Promise<PopulationDataPoint[]> {
  // Check cache first
  if (dataCache.has(year)) {
    return dataCache.get(year)!;
  }

  const response = await fetch(`${API_BASE}/data/${year}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch population data: ${response.statusText}`);
  }

  const data = await response.json();
  dataCache.set(year, data);
  return data;
}

export const usePopulationData = (): UsePopulationDataReturn => {
  const [populationData, setPopulationData] = useState<PopulationDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [yearRange, setYearRange] = useState<PopulationYearRange>({ minYear: 1960, maxYear: 2023 });
  const [selectedYear, setSelectedYear] = useState(2020);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const preloadingRef = useRef<Set<number>>(new Set());

  // Fetch year range on mount
  useEffect(() => {
    const fetchYearRange = async () => {
      try {
        const response = await fetch(`${API_BASE}/years`);
        if (response.ok) {
          const data = await response.json();
          setYearRange(data);
        }
      } catch (err) {
        console.error('Failed to fetch population year range:', err);
      }
    };
    fetchYearRange();
  }, []);

  // Preload next years during playback
  const preloadYears = useCallback((currentYear: number, maxYear: number) => {
    const yearsToPreload = [currentYear + 1, currentYear + 2, currentYear + 3];
    yearsToPreload.forEach(year => {
      if (year <= maxYear && !dataCache.has(year) && !preloadingRef.current.has(year)) {
        preloadingRef.current.add(year);
        fetchYearData(year)
          .catch(() => {}) // Silently ignore preload errors
          .finally(() => preloadingRef.current.delete(year));
      }
    });
  }, []);

  // Fetch population data when year changes
  useEffect(() => {
    const fetchPopulationData = async () => {
      // Check cache first - instant if cached
      if (dataCache.has(selectedYear)) {
        setPopulationData(dataCache.get(selectedYear)!);
        setLoading(false);
        return;
      }

      // Only show loading if we don't have any data yet
      if (populationData.length === 0) {
        setLoading(true);
      }
      setError(null);

      try {
        const data = await fetchYearData(selectedYear);
        setPopulationData(data);
      } catch (err) {
        console.error('Population data fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch population data');
        // Don't clear existing data on error - keep showing last good state
      } finally {
        setLoading(false);
      }
    };

    fetchPopulationData();

    // Preload upcoming years if playing
    if (isPlaying) {
      preloadYears(selectedYear, yearRange.maxYear);
    }
  }, [selectedYear, isPlaying, yearRange.maxYear, preloadYears]);

  // Playback logic
  useEffect(() => {
    if (isPlaying) {
      playbackIntervalRef.current = setInterval(() => {
        setSelectedYear(prev => {
          if (prev >= yearRange.maxYear) {
            return yearRange.minYear;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    } else {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
        playbackIntervalRef.current = null;
      }
    }

    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, yearRange.minYear, yearRange.maxYear]);

  const togglePlayback = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const getCountryData = useCallback(async (countryCode: string) => {
    try {
      const response = await fetch(`${API_BASE}/country/${countryCode}`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (err) {
      console.error('Failed to fetch country data:', err);
      return null;
    }
  }, []);

  const getCountryDetails = useCallback(async (countryCode: string, year: number): Promise<CountryDetailedData | null> => {
    try {
      const response = await fetch(`${API_BASE}/country/${countryCode}/details?year=${year}`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (err) {
      console.error('Failed to fetch country details:', err);
      return null;
    }
  }, []);

  return {
    populationData,
    loading,
    error,
    yearRange,
    selectedYear,
    setSelectedYear,
    isPlaying,
    togglePlayback,
    playbackSpeed,
    setPlaybackSpeed,
    getCountryData,
    getCountryDetails
  };
};
