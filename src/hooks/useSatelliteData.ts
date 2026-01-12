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

// Orbit path point
interface OrbitPoint {
  lat: number;
  lng: number;
  alt: number;
}

interface UseSatelliteDataReturn {
  satellites: Satellite[];
  positions: SatellitePosition[];
  metadata: SatelliteMetadata | null;
  loading: boolean;
  error: string | null;
  selectedCategories: SatelliteCategory[];
  setSelectedCategories: React.Dispatch<React.SetStateAction<SatelliteCategory[]>>;
  selectedSatellite: Satellite | null;
  setSelectedSatellite: (sat: Satellite | null) => void;
  isAnimating: boolean;
  toggleAnimation: () => void;
  timeMultiplier: number;
  setTimeMultiplier: (multiplier: number) => void;
  currentTime: Date;
  // Orbit visualization
  selectedSatelliteOrbit: OrbitPoint[] | null;
  showOrbit: boolean;
  setShowOrbit: (show: boolean) => void;
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

  // Orbit visualization state
  const [selectedSatelliteOrbit, setSelectedSatelliteOrbit] = useState<OrbitPoint[] | null>(null);
  const [showOrbit, setShowOrbit] = useState(true);

  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(Date.now());
  const filteredSatellitesRef = useRef<Satellite[]>([]);

  /**
   * Calculate orbit path for a satellite
   * @param sat - Satellite with TLE data
   * @param startTime - Start time for orbit calculation
   * @param durationMinutes - Duration to calculate (default 90 min for LEO)
   * @param numPoints - Number of points in the path
   */
  const calculateOrbitPath = useCallback((
    sat: Satellite,
    startTime: Date,
    durationMinutes: number = 90,
    numPoints: number = 180
  ): OrbitPoint[] => {
    const points: OrbitPoint[] = [];
    const stepMs = (durationMinutes * 60 * 1000) / numPoints;

    try {
      const satrec = satellite.twoline2satrec(sat.tle.line1, sat.tle.line2);

      for (let i = 0; i <= numPoints; i++) {
        const time = new Date(startTime.getTime() + i * stepMs);
        const positionAndVelocity = satellite.propagate(satrec, time);

        if (!positionAndVelocity.position || typeof positionAndVelocity.position === 'boolean') {
          continue;
        }

        const gmst = satellite.gstime(time);
        const positionGd = satellite.eciToGeodetic(positionAndVelocity.position, gmst);

        const lat = satellite.degreesLat(positionGd.latitude);
        const lng = satellite.degreesLong(positionGd.longitude);
        const altKm = positionGd.height;

        points.push({
          lat,
          lng,
          alt: altKm / EARTH_RADIUS_KM
        });
      }
    } catch (error) {
      console.error('Error calculating orbit path:', error);
    }

    return points;
  }, []);

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
    const filtered = satellites.filter(sat => selectedCategories.includes(sat.category));
    // Update ref for use in effects that shouldn't re-run on filter changes
    filteredSatellitesRef.current = filtered;
    return filtered;
  }, [satellites, selectedCategories]);

  // Calculate positions for satellites (uses ref to avoid dependency issues)
  const calculatePositionsForSatellites = useCallback((sats: Satellite[], time: Date) => {
    const newPositions: SatellitePosition[] = [];
    for (const sat of sats) {
      const pos = calculatePosition(sat, time);
      if (pos) {
        newPositions.push(pos);
      }
    }
    return newPositions;
  }, []);

  // Animation loop - combines time and position updates to avoid cascading renders
  useEffect(() => {
    if (!isAnimating || filteredSatellites.length === 0) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    let currentSimTime = new Date();

    const animate = () => {
      const now = Date.now();
      const deltaMs = now - lastTimeRef.current;
      lastTimeRef.current = now;

      // Update simulation time
      currentSimTime = new Date(currentSimTime.getTime() + deltaMs * timeMultiplier);

      // Calculate positions at new time
      const sats = filteredSatellitesRef.current;
      if (sats.length > 0) {
        const newPositions = calculatePositionsForSatellites(sats, currentSimTime);
        // Batch state updates together
        setCurrentTime(currentSimTime);
        setPositions(newPositions);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating, filteredSatellites.length, timeMultiplier, calculatePositionsForSatellites]);

  // Update positions when animation is off but time/satellites change
  useEffect(() => {
    if (isAnimating) return; // Animation handles updates when running
    const sats = filteredSatellitesRef.current;
    if (sats.length > 0) {
      const newPositions = calculatePositionsForSatellites(sats, currentTime);
      setPositions(newPositions);
    }
  }, [currentTime, isAnimating, calculatePositionsForSatellites]);

  // Calculate orbit path when selected satellite changes
  useEffect(() => {
    if (selectedSatellite && showOrbit) {
      const orbitPath = calculateOrbitPath(selectedSatellite, currentTime);
      setSelectedSatelliteOrbit(orbitPath);
    } else {
      setSelectedSatelliteOrbit(null);
    }
  }, [selectedSatellite?.id, showOrbit, calculateOrbitPath]); // Only recalculate on satellite change, not on time change

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
    currentTime,
    // Orbit visualization
    selectedSatelliteOrbit,
    showOrbit,
    setShowOrbit
  };
};
