/**
 * Search Index Utility
 * Builds and queries a unified search index across all entity types
 */
import type { City } from '../citiesData';
import type { Earthquake } from '../types/earthquake';
import type { Satellite, SatellitePosition } from '../types/satellite';

export type SearchResultType = 'city' | 'country' | 'earthquake' | 'satellite';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  name: string;
  subtitle: string;
  lat: number;
  lng: number;
  icon: string;
  color: string;
  data: any; // Original entity data
  score: number; // Search relevance score
}

interface SearchableEntity {
  id: string;
  type: SearchResultType;
  searchableText: string[]; // Array of searchable fields
  result: SearchResult;
}

export interface SearchIndex {
  entities: SearchableEntity[];
}

/**
 * Build a unified search index from all data sources
 */
export function buildSearchIndex(data: {
  cities: City[];
  earthquakes: Earthquake[];
  satellites: Satellite[] | SatellitePosition[];
}): SearchIndex {
  const entities: SearchableEntity[] = [];

  // Index cities
  data.cities.forEach(city => {
    entities.push({
      id: `city-${city.name}-${city.country}`,
      type: 'city',
      searchableText: [
        city.name.toLowerCase(),
        city.country.toLowerCase(),
        city.nickname?.toLowerCase() || '',
        ...(city.airportCodes?.map(c => c.toLowerCase()) || []),
        city.famousFor?.toLowerCase() || ''
      ].filter(Boolean),
      result: {
        id: `city-${city.name}-${city.country}`,
        type: 'city',
        name: city.name,
        subtitle: city.country,
        lat: city.lat,
        lng: city.lng,
        icon: 'city',
        color: city.color,
        data: city,
        score: 0
      }
    });
  });

  // Extract unique countries from cities
  const countries = new Map<string, { name: string; lat: number; lng: number }>();
  data.cities.forEach(city => {
    if (!countries.has(city.country)) {
      countries.set(city.country, {
        name: city.country,
        lat: city.lat,
        lng: city.lng
      });
    }
  });

  countries.forEach((country) => {
    entities.push({
      id: `country-${country.name}`,
      type: 'country',
      searchableText: [country.name.toLowerCase()],
      result: {
        id: `country-${country.name}`,
        type: 'country',
        name: country.name,
        subtitle: 'Country',
        lat: country.lat,
        lng: country.lng,
        icon: 'flag',
        color: '#4FC3F7',
        data: country,
        score: 0
      }
    });
  });

  // Index earthquakes
  data.earthquakes.forEach(eq => {
    entities.push({
      id: `earthquake-${eq.id}`,
      type: 'earthquake',
      searchableText: [
        eq.place.toLowerCase(),
        `magnitude ${eq.magnitude}`,
        eq.magnitude >= 5 ? 'strong' : eq.magnitude >= 4 ? 'moderate' : 'light'
      ],
      result: {
        id: `earthquake-${eq.id}`,
        type: 'earthquake',
        name: eq.place,
        subtitle: `M${eq.magnitude.toFixed(1)} - ${eq.timeAgo}`,
        lat: eq.lat,
        lng: eq.lng,
        icon: 'earthquake',
        color: eq.color,
        data: eq,
        score: 0
      }
    });
  });

  // Index satellites
  data.satellites.forEach(sat => {
    const satPos = sat as SatellitePosition;

    // Skip satellites without position data
    if (satPos.lat === undefined || satPos.lng === undefined) return;

    entities.push({
      id: `satellite-${sat.id}`,
      type: 'satellite',
      searchableText: [
        sat.name.toLowerCase(),
        sat.category.toLowerCase(),
        sat.category === 'iss' ? 'international space station' : ''
      ].filter(Boolean),
      result: {
        id: `satellite-${sat.id}`,
        type: 'satellite',
        name: sat.name,
        subtitle: sat.category.toUpperCase(),
        lat: satPos.lat,
        lng: satPos.lng,
        icon: 'satellite',
        color: satPos.color || '#9C27B0',
        data: sat,
        score: 0
      }
    });
  });

  return { entities };
}

/**
 * Search the index for matching entities
 */
export function searchIndex(
  index: SearchIndex,
  query: string,
  options: {
    limit?: number;
    types?: SearchResultType[];
  } = {}
): SearchResult[] {
  const { limit = 10, types } = options;
  const queryLower = query.toLowerCase().trim();

  if (!queryLower) return [];

  const results: SearchResult[] = [];

  for (const entity of index.entities) {
    // Filter by type if specified
    if (types && !types.includes(entity.type)) continue;

    // Calculate relevance score
    let score = 0;

    for (const text of entity.searchableText) {
      if (!text) continue;

      // Exact match
      if (text === queryLower) {
        score += 100;
      }
      // Starts with query
      else if (text.startsWith(queryLower)) {
        score += 50;
      }
      // Contains query
      else if (text.includes(queryLower)) {
        score += 25;
      }
      // Word starts with query
      else if (text.split(' ').some(word => word.startsWith(queryLower))) {
        score += 15;
      }
    }

    if (score > 0) {
      results.push({
        ...entity.result,
        score
      });
    }
  }

  // Sort by score (descending) and type priority
  const typePriority: Record<SearchResultType, number> = {
    city: 4,
    country: 3,
    satellite: 2,
    earthquake: 1
  };

  results.sort((a, b) => {
    // First by score
    if (b.score !== a.score) return b.score - a.score;
    // Then by type priority
    return typePriority[b.type] - typePriority[a.type];
  });

  return results.slice(0, limit);
}

/**
 * Get icon emoji for result type
 */
export function getResultIcon(type: SearchResultType): string {
  switch (type) {
    case 'city': return '🏙️';
    case 'country': return '🌍';
    case 'earthquake': return '🌋';
    case 'satellite': return '🛰️';
    default: return '📍';
  }
}
