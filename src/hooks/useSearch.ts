/**
 * Search Hook
 * Manages search state, indexing, and result filtering
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import type { City } from '../citiesData';
import type { Earthquake } from '../types/earthquake';
import type { SatellitePosition } from '../types/satellite';
import {
  buildSearchIndex,
  searchIndex,
  type SearchIndex,
  type SearchResult,
} from '../utils/searchIndex';

interface UseSearchOptions {
  debounceMs?: number;
  maxResults?: number;
}

interface UseSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: SearchResult[];
  isSearching: boolean;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  clearSearch: () => void;
  updateData: (data: SearchableData) => void;
}

interface SearchableData {
  cities: City[];
  earthquakes: Earthquake[];
  satellites: SatellitePosition[];
}

export const useSearch = (options: UseSearchOptions = {}): UseSearchReturn => {
  const { debounceMs = 150, maxResults = 10 } = options;

  const [query, setQueryState] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const indexRef = useRef<SearchIndex | null>(null);
  const debounceTimeoutRef = useRef<number | null>(null);

  // Update the search index when data changes
  const updateData = useCallback((data: SearchableData) => {
    indexRef.current = buildSearchIndex({
      cities: data.cities,
      earthquakes: data.earthquakes,
      satellites: data.satellites
    });
  }, []);

  // Debounced search
  const performSearch = useCallback((searchQuery: string) => {
    if (!indexRef.current || !searchQuery.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const searchResults = searchIndex(indexRef.current, searchQuery, {
      limit: maxResults
    });

    setResults(searchResults);
    setIsSearching(false);
  }, [maxResults]);

  // Set query with debouncing
  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery);
    setSelectedIndex(0);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (!newQuery.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceTimeoutRef.current = window.setTimeout(() => {
      performSearch(newQuery);
    }, debounceMs);
  }, [debounceMs, performSearch]);

  // Clear search
  const clearSearch = useCallback(() => {
    setQueryState('');
    setResults([]);
    setSelectedIndex(0);
    setIsSearching(false);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    query,
    setQuery,
    results,
    isSearching,
    selectedIndex,
    setSelectedIndex,
    clearSearch,
    updateData
  };
};

export default useSearch;
