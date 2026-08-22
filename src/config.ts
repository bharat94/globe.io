/**
 * Centralized API configuration
 * Uses VITE_API_URL env var with fallback to localhost:3001 for dev
 */
export const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || 'http://localhost:3001';

export const API_ENDPOINTS = {
  cities: `${API_BASE_URL}/api/cities`,
  weather: `${API_BASE_URL}/api/weather`,
  population: `${API_BASE_URL}/api/population`,
  earthquakes: `${API_BASE_URL}/api/earthquakes`,
  satellites: `${API_BASE_URL}/api/satellites`,
  pollution: `${API_BASE_URL}/api/pollution`,
  flights: `${API_BASE_URL}/api/flights`,
  aurora: `${API_BASE_URL}/api/aurora`,
} as const;
