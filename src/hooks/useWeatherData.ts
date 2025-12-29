import { useState, useEffect, useRef, useCallback } from 'react';
import type { HeatmapPoint, YearRange, WeatherDataPoint } from '../types/weather';

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
  setSelectedYear: (year: number) => void;
  setSelectedMonth: (month: number) => void;
  togglePlayback: () => void;
  setPlaybackSpeed: (speed: number) => void;
  getLocationData: (lat: number, lng: number) => Promise<WeatherDataPoint | null>;
}

export const useWeatherData = (): UseWeatherDataReturn => {
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [yearRange, setYearRange] = useState<YearRange>({ minYear: 2000, maxYear: 2024 });
  const [selectedYear, setSelectedYear] = useState(2024);
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(2000); // ms between frames

  // Cache for fetched data
  const cache = useRef<Map<string, HeatmapPoint[]>>(new Map());
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
        console.error('Failed to fetch year range:', err);
      }
    };
    fetchYearRange();
  }, []);

  // Fetch weather data when year/month changes
  useEffect(() => {
    const fetchHeatmapData = async () => {
      const cacheKey = `${selectedYear}-${selectedMonth}`;

      // Check cache first
      if (cache.current.has(cacheKey)) {
        setHeatmapData(cache.current.get(cacheKey)!);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/heatmap/${selectedYear}/${selectedMonth}`);
        if (!response.ok) {
          throw new Error('Failed to fetch weather data');
        }
        const data = await response.json();

        // Cache the result
        cache.current.set(cacheKey, data);
        setHeatmapData(data);
      } catch (err) {
        console.error('Error fetching weather data:', err);
        setError('Failed to load weather data');
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmapData();
  }, [selectedYear, selectedMonth]);

  // Playback animation logic
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        setSelectedMonth((prevMonth) => {
          if (prevMonth >= 12) {
            // Move to next year
            setSelectedYear((prevYear) => {
              if (prevYear >= yearRange.maxYear) {
                setIsPlaying(false);
                return prevYear;
              }
              return prevYear + 1;
            });
            return 1;
          }
          return prevMonth + 1;
        });
      }, playbackSpeed);
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    };
  }, [isPlaying, playbackSpeed, yearRange.maxYear]);

  const togglePlayback = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  // Get weather data for a specific location
  const getLocationData = useCallback(async (lat: number, lng: number): Promise<WeatherDataPoint | null> => {
    try {
      const response = await fetch(`${API_BASE}/location/${lat}/${lng}?year=${selectedYear}`);
      if (!response.ok) return null;

      const data = await response.json();
      // Return the data for the selected month
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
    setSelectedYear,
    setSelectedMonth,
    togglePlayback,
    setPlaybackSpeed,
    getLocationData
  };
};
