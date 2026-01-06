/**
 * Satellite data hook
 * Fetches TLE data and calculates real-time satellite positions
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import * as satellite from 'satellite.js';
import type {
  Satellite,
  SatellitePosition,
  SatelliteCategory,
  SatelliteMetadata,
  SATELLITE_CATEGORIES
} from '../types/satellite';
import { EARTH_RADIUS_KM } from '../types/satellite';

const API_BASE = 'http://localhost:3001/api/satellites';

// Time step for animation (seconds per frame at 60fps)
const TIME_STEP = 1000; // 1 second per frame = ~60x real-time

interface UseSatelliteDataReturn {
  satellites: Satellite[];
  positions: SatellitePosition[];
  metadata: SatelliteMetadata | null;
  loading: boolean;
  error: string | null;
  selectedCategories: SatelliteCategory[];
  setSelectedCategories: (categories: SatelliteCategory[]) => void;
  selectedSatellite: Satellite | null;
  setSelectedSatellite: (sat: Satellite | null) => void;
  isAnimating: boolean;
  toggleAnimation: () => void;
  timeMultiplier: number;
  setTimeMultiplier: (multiplier: number) => void;
  currentTime: Date;
}

// Get color for satellite category
function getCategoryColor(category: SatelliteCategory): string {
  const colors: Record<SatelliteCategory, string> = {
    iss: '#FFD700',
    starlink: '#00BFFF',
    gps: '#32CD32',
    weather: '#FF6B6B',
    science: '#9B59B6',
    other: '#95A5A6'
  };
  return colors[category] || colors.other;
}

/**
 * Calculate satellite position from TLE at given time
 */
function calculatePosition(
  sat: Satellite,
  time: Date
): SatellitePosition | null {
  try {
    // Parse TLE
    const satrec = satellite.twoline2satrec(sat.tle.line1, sat.tle.line2);

    // Propagate satellite position
    const positionAndVelocity = satellite.propagate(satrec, time);

    if (!positionAndVelocity.position || typeof positionAndVelocity.position === 'boolean') {
      return null;
    }

    // Get GMST for coordinate conversion
    const gmst = satellite.gstime(time);

    // Convert to geodetic coordinates
    const positionGd = satellite.eciToGeodetic(positionAndVelocity.position, gmst);

    // Convert radians to degrees
    const lat = satellite.degreesLat(positionGd.latitude);
    const lng = satellite.degreesLong(positionGd.longitude);
    const altKm = positionGd.height;

    // Calculate velocity magnitude
    let velocity = 0;
    if (positionAndVelocity.velocity && typeof positionAndVelocity.velocity !== 'boolean') {
      const v = positionAndVelocity.velocity;
      velocity = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    }

    return {
      id: sat.id,
      name: sat.name,
      category: sat.category,
      lat,
      lng,
      alt: altKm / EARTH_RADIUS_KM, // Convert to globe radius units
      velocity,
      color: getCategoryColor(sat.category)
    };
  } catch (error) {
    // TLE might be stale or invalid
    return null;
  }
}

export const useSatelliteData = (): UseSatelliteDataReturn => {
  const [satellites, setSatellites] = useState<Satellite[]>([]);
  const [positions, setPositions] = useState<SatellitePosition[]>([]);
  const [metadata, setMetadata] = useState<SatelliteMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<SatelliteCategory[]>([
    'iss', 'starlink', 'gps', 'weather', 'science'
  ]);
  const [selectedSatellite, setSelectedSatellite] = useState<Satellite | null>(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const [timeMultiplier, setTimeMultiplier] = useState(60); // 60x real-time
  const [currentTime, setCurrentTime] = useState(new Date());

  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(Date.now());

  // Toggle animation
  const toggleAnimation = useCallback(() => {
    setIsAnimating(prev => !prev);
  }, []);

  // Fetch satellite data
  const fetchSatellites = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_BASE);
      if (!response.ok) {
        throw new Error(`Failed to fetch satellites: ${response.statusText}`);
      }

      const data = await response.json();
      setSatellites(data.satellites);
      setMetadata(data.metadata);
    } catch (err) {
      console.error('Satellite fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch satellites');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchSatellites();
  }, [fetchSatellites]);

  // Filter satellites by selected categories
  const filteredSatellites = useMemo(() => {
    return satellites.filter(sat => selectedCategories.includes(sat.category));
  }, [satellites, selectedCategories]);

  // Calculate positions for all filtered satellites
  const calculateAllPositions = useCallback((time: Date) => {
    const newPositions: SatellitePosition[] = [];

    for (const sat of filteredSatellites) {
      const pos = calculatePosition(sat, time);
      if (pos) {
        newPositions.push(pos);
      }
    }

    return newPositions;
  }, [filteredSatellites]);

  // Animation loop
  useEffect(() => {
    if (!isAnimating || filteredSatellites.length === 0) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const animate = () => {
      const now = Date.now();
      const deltaMs = now - lastTimeRef.current;
      lastTimeRef.current = now;

      // Update simulation time
      setCurrentTime(prev => {
        const newTime = new Date(prev.getTime() + deltaMs * timeMultiplier);
        return newTime;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating, filteredSatellites.length, timeMultiplier]);

  // Update positions when time changes
  useEffect(() => {
    if (filteredSatellites.length > 0) {
      const newPositions = calculateAllPositions(currentTime);
      setPositions(newPositions);
    }
  }, [currentTime, filteredSatellites, calculateAllPositions]);

  return {
    satellites,
    positions,
    metadata,
    loading,
    error,
    selectedCategories,
    setSelectedCategories,
    selectedSatellite,
    setSelectedSatellite,
    isAnimating,
    toggleAnimation,
    timeMultiplier,
    setTimeMultiplier,
    currentTime
  };
};
