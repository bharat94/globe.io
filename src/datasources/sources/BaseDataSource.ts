/**
 * Base class for frontend data sources
 * Provides caching and common fetch logic
 */
import type { DataQuery, DataSourceMetadata } from '../types';

export abstract class BaseDataSource<T> {
  protected apiBase: string;
  protected cache: Map<string, T[]> = new Map();

  constructor(apiBase: string) {
    this.apiBase = apiBase;
  }

  /**
   * Source type identifier
   */
  abstract get sourceType(): string;

  /**
   * Generate cache key from query parameters
   */
  protected getCacheKey(query: DataQuery): string {
    const boundsKey = query.bounds
      ? `${query.bounds.minLat},${query.bounds.maxLat},${query.bounds.minLng},${query.bounds.maxLng}`
      : 'global';
    return `${query.year}-${query.month}-${query.resolution || 10}-${boundsKey}`;
  }

  /**
   * Get data from cache if available
   */
  getFromCache(query: DataQuery): T[] | null {
    const key = this.getCacheKey(query);
    return this.cache.has(key) ? this.cache.get(key)! : null;
  }

  /**
   * Save data to cache
   */
  saveToCache(query: DataQuery, data: T[]): void {
    const key = this.getCacheKey(query);
    this.cache.set(key, data);
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Fetch data - must be implemented by subclass
   */
  abstract fetchData(query: DataQuery): Promise<T[]>;

  /**
   * Get metadata - must be implemented by subclass
   */
  abstract getMetadata(): Promise<DataSourceMetadata>;
}
