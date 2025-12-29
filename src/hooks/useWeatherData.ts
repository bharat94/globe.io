import { useState, useEffect, useRef, useCallback } from 'react';
import type { HeatmapPoint, YearRange, WeatherDataPoint } from '../types/weather';

const API_BASE = 'http://localhost:3001/api/weather';

// Zoom level to grid resolution mapping (more granular)
export type ZoomLevel = 'global' | 'continental' | 'regional' | 'local' | 'detail';

export const getZoomLevel = (altitude: number): ZoomLevel => {
  if (altitude > 3.0) return 'global';
  if (altitude > 2.0) return 'continental';
  if (altitude > 1.2) return 'regional';
  if (altitude > 0.6) return 'local';
  return 'detail';
};

export const getResolutionForZoom = (zoom: ZoomLevel): number => {
  switch (zoom) {
    case 'global': return 10;       // ~300 points
    case 'continental': return 5;   // ~950 points
    case 'regional': return 2.5;    // ~3,800 points
    case 'local': return 1;         // ~15,000 points (viewport only)
    case 'detail': return 0.5;      // ~60,000 points (viewport only)
  }
};

export interface Viewport {
  lat: number;
  lng: number;
  altitude: number;
}

interface UseWeatherDataReturn {
  heatmapData: HeatmapPoint[];
  loading: boolean;
  error: string | null;
  yearRange: YearRange;
  selectedYear: number;
  selectedMonth: number;
  isPlaying: boolean;
  playbackSpeed: number;
  currentZoom: ZoomLevel;
  currentResolution: number;
  setSelectedYear: (year: number) => void;
  setSelectedMonth: (month: number) => void;
  togglePlayback: () => void;
  setPlaybackSpeed: (speed: number) => void;
  setViewport: (viewport: Viewport) => void;
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
  const [playbackSpeed, setPlaybackSpeed] = useState(2000);
  const [viewport, setViewportState] = useState<Viewport>({ lat: 0, lng: 0, altitude: 3 });
  const [currentZoom, setCurrentZoom] = useState<ZoomLevel>('far');
  const [currentResolution, setCurrentResolution] = useState(10);

  // Cache for fetched data (keyed by year-month-resolution-viewport)
  const cache = useRef<Map<string, HeatmapPoint[]>>(new Map());
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Calculate viewport bounds for fetching
  const getViewportBounds = useCallback((vp: Viewport) => {
    // Approximate visible area based on altitude
    const latSpan = Math.min(180, vp.altitude * 40);
    const lngSpan = Math.min(360, vp.altitude * 60);
    return {
      minLat: Math.max(-90, vp.lat - latSpan / 2),
      maxLat: Math.min(90, vp.lat + latSpan / 2),
      minLng: vp.lng - lngSpan / 2,
      maxLng: vp.lng + lngSpan / 2
    };
  }, []);

  // Fetch weather data when year/month/resolution/viewport changes
  useEffect(() => {
    const fetchHeatmapData = async () => {
      const zoom = getZoomLevel(viewport.altitude);
      const resolution = getResolutionForZoom(zoom);

      setCurrentZoom(zoom);
      setCurrentResolution(resolution);

      // For global/continental zoom, fetch global. For closer, fetch viewport
      const bounds = (zoom === 'global' || zoom === 'continental') ? null : getViewportBounds(viewport);

      const cacheKey = bounds
        ? `${selectedYear}-${selectedMonth}-${resolution}-${Math.round(bounds.minLat)}-${Math.round(bounds.maxLat)}-${Math.round(bounds.minLng)}-${Math.round(bounds.maxLng)}`
        : `${selectedYear}-${selectedMonth}-${resolution}-global`;

      // Check cache first
      if (cache.current.has(cacheKey)) {
        setHeatmapData(cache.current.get(cacheKey)!);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let url = `${API_BASE}/grid/${selectedYear}/${selectedMonth}?resolution=${resolution}`;

        if (bounds) {
          url += `&minLat=${bounds.minLat}&maxLat=${bounds.maxLat}&minLng=${bounds.minLng}&maxLng=${bounds.maxLng}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch weather data');
        }
        const data = await response.json();

        // Cache the result
        cache.current.set(cacheKey, data);

        // Merge with existing data for smooth transitions
        if (bounds && (zoom === 'regional' || zoom === 'local' || zoom === 'detail')) {
          // Keep global data and add/replace with detailed data
          const globalKey = `${selectedYear}-${selectedMonth}-10-global`;
          const globalData = cache.current.get(globalKey) || [];

          // Create a map for efficient lookup, prefer higher resolution data
          const dataMap = new Map<string, HeatmapPoint>();

          // Add global data first
          globalData.forEach((p: HeatmapPoint) => {
            dataMap.set(`${p.lat.toFixed(1)},${p.lng.toFixed(1)}`, p);
          });

          // Add/replace with new detailed points
          data.forEach((newPoint: HeatmapPoint) => {
            dataMap.set(`${newPoint.lat.toFixed(2)},${newPoint.lng.toFixed(2)}`, newPoint);
          });

          setHeatmapData(Array.from(dataMap.values()));
        } else {
          setHeatmapData(data);
        }
      } catch (err) {
        console.error('Error fetching weather data:', err);
        setError('Failed to load weather data');
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmapData();
  }, [selectedYear, selectedMonth, viewport, getViewportBounds]);

  // Debounced viewport setter
  const setViewport = useCallback((newViewport: Viewport) => {
    // Clear pending fetch
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Debounce viewport changes to avoid too many API calls (150ms for responsiveness)
    fetchTimeoutRef.current = setTimeout(() => {
      setViewportState(newViewport);
    }, 150);
  }, []);

  // Playback animation logic
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        setSelectedMonth((prevMonth) => {
          if (prevMonth >= 12) {
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

  const getLocationData = useCallback(async (lat: number, lng: number): Promise<WeatherDataPoint | null> => {
    try {
      const response = await fetch(`${API_BASE}/location/${lat}/${lng}?year=${selectedYear}`);
      if (!response.ok) return null;

      const data = await response.json();
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
    currentZoom,
    currentResolution,
    setSelectedYear,
    setSelectedMonth,
    togglePlayback,
    setPlaybackSpeed,
    setViewport,
    getLocationData
  };
};
