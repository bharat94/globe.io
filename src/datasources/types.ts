/**
 * Data source type definitions for Globe.io
 */

export type DataSourceType = 'weather' | 'earthquakes' | 'satellites' | 'pollution';

export interface ViewportBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface DataQuery {
  year: number;
  month: number;
  resolution?: number;
  bounds?: ViewportBounds;
}

export interface DataSourceMetadata {
  minYear: number;
  maxYear: number;
  supportedResolutions?: number[];
}

export interface HeatmapDataPoint {
  lat: number;
  lng: number;
  weight: number;
  temperature?: {
    avg: number;
    min: number;
    max: number;
  };
  source?: string;
  [key: string]: unknown;
}

export interface Viewport {
  lat: number;
  lng: number;
  altitude: number;
}

export type ZoomLevel = 'global' | 'continental' | 'regional' | 'local' | 'detail';

export interface DataSourceState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  metadata: DataSourceMetadata | null;
}
