/**
 * Earthquake data types
 */

export type TimeRange = 'hour' | 'day' | 'week' | 'month';
export type DepthCategory = 'shallow' | 'intermediate' | 'deep';

export interface Earthquake {
  id: string;
  lat: number;
  lng: number;
  depth: number;
  magnitude: number;
  place: string;
  time: number;
  timeAgo: string;
  url: string;
  felt: number | null;
  tsunami: boolean;
  significance: number;
  type: string;
  weight: number;
  depthCategory: DepthCategory;
  color: string;
  isRecent: boolean;
}

export interface EarthquakeMetadata {
  count: number;
  timeRange: TimeRange;
  minMagnitude: number;
  generated: string;
  title: string;
}

export interface EarthquakeResponse {
  earthquakes: Earthquake[];
  metadata: EarthquakeMetadata;
}

export interface EarthquakeDetail extends Earthquake {
  magnitudeType: string;
  cdi: number | null; // Community intensity
  mmi: number | null; // Modified Mercalli Intensity
  status: string;
  sources: string;
}
