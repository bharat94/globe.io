/**
 * URL State Hook
 * Syncs application state with URL parameters for deep linking
 */
import { useCallback, useRef } from 'react';
import type { ViewType } from '../types/views';

export interface UrlState {
  view?: ViewType;
  lat?: number;
  lng?: number;
  alt?: number;
  // Weather/Population params
  year?: number;
  month?: number;
  // Earthquake params
  mag?: number;
  days?: number;
  // Pollution params
  pollutant?: string;
}

const parseNumber = (value: string | null): number | undefined => {
  if (value === null) return undefined;
  const num = parseFloat(value);
  return isNaN(num) ? undefined : num;
};

const parseInt10 = (value: string | null): number | undefined => {
  if (value === null) return undefined;
  const num = parseInt(value, 10);
  return isNaN(num) ? undefined : num;
};

export const useUrlState = () => {
  const isInitialMount = useRef(true);

  // Read state from URL parameters
  const getStateFromUrl = useCallback((): UrlState => {
    const params = new URLSearchParams(window.location.search);

    return {
      view: (params.get('view') as ViewType) || undefined,
      lat: parseNumber(params.get('lat')),
      lng: parseNumber(params.get('lng')),
      alt: parseNumber(params.get('alt')),
      year: parseInt10(params.get('year')),
      month: parseInt10(params.get('month')),
      mag: parseNumber(params.get('mag')),
      days: parseInt10(params.get('days')),
      pollutant: params.get('pollutant') || undefined,
    };
  }, []);

  // Update URL parameters without page reload
  const updateUrl = useCallback((state: UrlState) => {
    const params = new URLSearchParams();

    // Only add defined, non-default values
    if (state.view && state.view !== 'explorer') {
      params.set('view', state.view);
    }

    // Camera position - round to 2 decimal places
    if (state.lat !== undefined) {
      params.set('lat', state.lat.toFixed(2));
    }
    if (state.lng !== undefined) {
      params.set('lng', state.lng.toFixed(2));
    }
    if (state.alt !== undefined) {
      params.set('alt', state.alt.toFixed(2));
    }

    // View-specific params
    if (state.year !== undefined) {
      params.set('year', String(state.year));
    }
    if (state.month !== undefined) {
      params.set('month', String(state.month));
    }
    if (state.mag !== undefined) {
      params.set('mag', String(state.mag));
    }
    if (state.days !== undefined) {
      params.set('days', String(state.days));
    }
    if (state.pollutant) {
      params.set('pollutant', state.pollutant);
    }

    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : window.location.pathname;

    // Use replaceState to avoid adding to browser history on every update
    window.history.replaceState({}, '', newUrl);
  }, []);

  // Check if URL has any state parameters
  const hasUrlState = useCallback((): boolean => {
    const params = new URLSearchParams(window.location.search);
    return params.toString().length > 0;
  }, []);

  return {
    getStateFromUrl,
    updateUrl,
    hasUrlState,
    isInitialMount
  };
};

export default useUrlState;
