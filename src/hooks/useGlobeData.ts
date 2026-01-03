/**
 * Generic data hook for Globe.io
 * Provides unified interface for any data type (weather, pollution, etc.)
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  DataSourceType,
  DataQuery,
  DataSourceMetadata,
  HeatmapDataPoint,
  Viewport,
  ViewportBounds,
  ZoomLevel
} from '../datasources/types';
import { WeatherDataSource } from '../datasources/sources/weather/WeatherDataSource';

// Data source registry
const dataSources = {
  weather: () => new WeatherDataSource(),
  // Future: pollution: () => new PollutionDataSource(),
  // Future: flights: () => new FlightsDataSource(),
};

// Zoom level utilities
export const getZoomLevel = (altitude: number): ZoomLevel => {
  if (altitude > 3.0) return 'global';
  if (altitude > 2.0) return 'continental';
  if (altitude > 1.2) return 'regional';
  if (altitude > 0.6) return 'local';
  return 'detail';
};

export const getResolutionForZoom = (zoom: ZoomLevel): number => {
  switch (zoom) {
    case 'global': return 10;
    case 'continental': return 5;
    case 'regional': return 2.5;
    case 'local': return 1;
    case 'detail': return 0.5;
  }
};

interface UseGlobeDataOptions {
  sourceType: DataSourceType;
  initialYear?: number;
  initialMonth?: number;
}

interface UseGlobeDataReturn {
  data: HeatmapDataPoint[];
  loading: boolean;
  error: string | null;
  metadata: DataSourceMetadata | null;
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
}

export const useGlobeData = (options: UseGlobeDataOptions): UseGlobeDataReturn => {
  const { sourceType, initialYear = 2024, initialMonth = 1 } = options;

  // Create data source instance (memoized)
  const dataSourceRef = useRef(
    dataSources[sourceType] ? dataSources[sourceType]() : null
  );

  // State
  const [data, setData] = useState<HeatmapDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<DataSourceMetadata | null>(null);
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(2000);
  const [viewport, setViewportState] = useState<Viewport>({ lat: 0, lng: 0, altitude: 3 });
  const [currentZoom, setCurrentZoom] = useState<ZoomLevel>('global');
  const [currentResolution, setCurrentResolution] = useState(10);

  // Refs for timers
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch metadata on mount
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!dataSourceRef.current) return;
      try {
        const meta = await dataSourceRef.current.getMetadata();
        setMetadata(meta);
      } catch (err) {
        console.error('Failed to fetch metadata:', err);
      }
    };
    fetchMetadata();
  }, []);

  // Calculate viewport bounds
  const getViewportBounds = useCallback((vp: Viewport): ViewportBounds => {
    const latSpan = Math.min(180, vp.altitude * 40);
    const lngSpan = Math.min(360, vp.altitude * 60);
    return {
      minLat: Math.max(-90, vp.lat - latSpan / 2),
      maxLat: Math.min(90, vp.lat + latSpan / 2),
      minLng: vp.lng - lngSpan / 2,
      maxLng: vp.lng + lngSpan / 2
    };
  }, []);

  // Fetch data when parameters change
  useEffect(() => {
    const fetchData = async () => {
      if (!dataSourceRef.current) {
        setError(`Unknown data source: ${sourceType}`);
        return;
      }

      const zoom = getZoomLevel(viewport.altitude);
      const resolution = getResolutionForZoom(zoom);

      setCurrentZoom(zoom);
      setCurrentResolution(resolution);

      // For global/continental, fetch all data. For closer zooms, use viewport bounds
      const bounds = (zoom === 'global' || zoom === 'continental')
        ? undefined
        : getViewportBounds(viewport);

      const query: DataQuery = {
        year: selectedYear,
        month: selectedMonth,
        resolution,
        bounds
      };

      // Check cache first
      const cached = dataSourceRef.current.getFromCache(query);
      if (cached) {
        setData(cached);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await dataSourceRef.current.fetchData(query);

        // For zoomed views, merge with global data for smooth transitions
        if (bounds && (zoom === 'regional' || zoom === 'local' || zoom === 'detail')) {
          const globalQuery: DataQuery = {
            year: selectedYear,
            month: selectedMonth,
            resolution: 10
          };
          const globalData = dataSourceRef.current.getFromCache(globalQuery) || [];

          // Merge data, preferring higher resolution
          const dataMap = new Map<string, HeatmapDataPoint>();
          globalData.forEach(p => {
            dataMap.set(`${p.lat.toFixed(1)},${p.lng.toFixed(1)}`, p);
          });
          result.forEach(p => {
            dataMap.set(`${p.lat.toFixed(2)},${p.lng.toFixed(2)}`, p);
          });

          setData(Array.from(dataMap.values()));
        } else {
          setData(result);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedYear, selectedMonth, viewport, getViewportBounds, sourceType]);

  // Debounced viewport setter
  const setViewport = useCallback((newViewport: Viewport) => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    fetchTimeoutRef.current = setTimeout(() => {
      setViewportState(newViewport);
    }, 150);
  }, []);

  // Playback logic
  useEffect(() => {
    if (isPlaying && metadata) {
      playIntervalRef.current = setInterval(() => {
        setSelectedMonth(prevMonth => {
          if (prevMonth >= 12) {
            setSelectedYear(prevYear => {
              if (prevYear >= metadata.maxYear) {
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
  }, [isPlaying, playbackSpeed, metadata]);

  const togglePlayback = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  return {
    data,
    loading,
    error,
    metadata,
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
    setViewport
  };
};

// Re-export types for convenience
export type { Viewport, ZoomLevel } from '../datasources/types';
