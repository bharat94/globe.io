/**
 * Population data hook
 * Fetches and manages country population data for globe visualization
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import type { PopulationDataPoint, PopulationYearRange } from '../types/population';

const API_BASE = 'http://localhost:3001/api/population';

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

  // Fetch population data when year changes
  useEffect(() => {
    const fetchPopulationData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/data/${selectedYear}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch population data: ${response.statusText}`);
        }

        const data = await response.json();
        setPopulationData(data);
      } catch (err) {
        console.error('Population data fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch population data');
        setPopulationData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPopulationData();
  }, [selectedYear]);

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
    getCountryData
  };
};
