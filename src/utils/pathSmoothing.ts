/**
 * Path smoothing utilities for flight trails
 * Uses Catmull-Rom spline interpolation for smooth curves
 * Creates realistic flight profiles with smooth climb/cruise/descent
 */

export interface PathPoint {
  lat: number;
  lng: number;
  altitude: number;
  onGround?: boolean;
}

/**
 * Catmull-Rom spline interpolation between points
 * Creates smooth curves through control points
 */
function catmullRomInterpolate(
  p0: number, p1: number, p2: number, p3: number,
  t: number
): number {
  const t2 = t * t;
  const t3 = t2 * t;

  return 0.5 * (
    (2 * p1) +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  );
}

/**
 * Handle longitude wrapping for paths crossing the antimeridian
 */
function unwrapLongitude(points: PathPoint[]): PathPoint[] {
  if (points.length < 2) return points;

  const result: PathPoint[] = [{ ...points[0] }];
  let offset = 0;

  for (let i = 1; i < points.length; i++) {
    const prev = result[i - 1].lng;
    let curr = points[i].lng + offset;

    // Check for antimeridian crossing
    const diff = curr - prev;
    if (diff > 180) {
      offset -= 360;
      curr -= 360;
    } else if (diff < -180) {
      offset += 360;
      curr += 360;
    }

    result.push({
      ...points[i],
      lng: curr
    });
  }

  return result;
}

/**
 * Create a smooth altitude profile for realistic flight visualization
 * Ensures gradual climb from takeoff and gradual descent to landing
 */
function createSmoothAltitudeProfile(points: PathPoint[]): number[] {
  if (points.length < 2) return points.map(p => p.altitude);

  const altitudes = points.map(p => p.altitude);
  const n = altitudes.length;

  // Find max cruise altitude
  const maxAltitude = Math.max(...altitudes);

  // If flight is mostly on ground or very short, return as-is
  if (maxAltitude < 1000 || n < 5) {
    return altitudes;
  }

  // Find climb and descent phases
  let climbEndIndex = 0;
  let descentStartIndex = n - 1;

  // Find where climb ends (reaches ~90% of max altitude)
  const cruiseThreshold = maxAltitude * 0.85;
  for (let i = 0; i < n; i++) {
    if (altitudes[i] >= cruiseThreshold) {
      climbEndIndex = i;
      break;
    }
  }

  // Find where descent begins (last point at ~90% of max altitude)
  for (let i = n - 1; i >= 0; i--) {
    if (altitudes[i] >= cruiseThreshold) {
      descentStartIndex = i;
      break;
    }
  }

  // Ensure reasonable phase lengths
  if (climbEndIndex < 2) climbEndIndex = Math.min(Math.floor(n * 0.2), n - 1);
  if (descentStartIndex > n - 3) descentStartIndex = Math.max(Math.floor(n * 0.8), 0);

  const smoothAltitudes: number[] = [];

  for (let i = 0; i < n; i++) {
    if (i <= climbEndIndex) {
      // Climb phase: use smooth easing from ground to cruise
      // S-curve (ease-in-out) for realistic climb profile
      const t = climbEndIndex > 0 ? i / climbEndIndex : 1;
      const eased = t < 0.5
        ? 2 * t * t
        : 1 - Math.pow(-2 * t + 2, 2) / 2;

      const startAlt = altitudes[0] || 0;
      const endAlt = altitudes[climbEndIndex] || maxAltitude;
      smoothAltitudes.push(startAlt + (endAlt - startAlt) * eased);
    } else if (i >= descentStartIndex) {
      // Descent phase: smooth descent to landing
      const descentLength = n - 1 - descentStartIndex;
      const t = descentLength > 0 ? (i - descentStartIndex) / descentLength : 1;
      // Reverse S-curve for smooth descent
      const eased = t < 0.5
        ? 2 * t * t
        : 1 - Math.pow(-2 * t + 2, 2) / 2;

      const startAlt = altitudes[descentStartIndex] || maxAltitude;
      const endAlt = altitudes[n - 1] || 0;
      smoothAltitudes.push(startAlt + (endAlt - startAlt) * eased);
    } else {
      // Cruise phase: maintain relatively constant altitude with minor smoothing
      // Use a weighted average of nearby points to smooth turbulence
      const windowSize = 3;
      let sum = 0;
      let count = 0;
      for (let j = Math.max(0, i - windowSize); j <= Math.min(n - 1, i + windowSize); j++) {
        sum += altitudes[j];
        count++;
      }
      smoothAltitudes.push(sum / count);
    }
  }

  return smoothAltitudes;
}

/**
 * Smooth a flight path using Catmull-Rom spline interpolation
 * Creates realistic flight profile with smooth climb/cruise/descent
 * @param points Raw track points from API
 * @param segmentsPerPoint Number of interpolated points between each original point
 * @returns Smoothed path coordinates as [lng, lat, alt] arrays
 */
export function smoothFlightPath(
  points: PathPoint[],
  segmentsPerPoint: number = 5
): [number, number, number][] {
  if (!points || points.length < 2) {
    return points?.map(p => [p.lng, p.lat, p.altitude / 50000]) || [];
  }

  // First, create smooth altitude profile
  const smoothAltitudes = createSmoothAltitudeProfile(points);

  // Apply smoothed altitudes to points
  const pointsWithSmoothAlt = points.map((p, i) => ({
    ...p,
    altitude: smoothAltitudes[i]
  }));

  // Unwrap longitudes to handle antimeridian crossing
  const unwrapped = unwrapLongitude(pointsWithSmoothAlt);

  // If only 2 points, just return them (can't do spline with less than 4)
  if (unwrapped.length === 2) {
    return unwrapped.map(p => [p.lng, p.lat, p.altitude / 50000]);
  }

  const result: [number, number, number][] = [];

  // For each segment between points
  for (let i = 0; i < unwrapped.length - 1; i++) {
    // Get 4 control points for Catmull-Rom (clamp at boundaries)
    const p0 = unwrapped[Math.max(0, i - 1)];
    const p1 = unwrapped[i];
    const p2 = unwrapped[i + 1];
    const p3 = unwrapped[Math.min(unwrapped.length - 1, i + 2)];

    // Generate interpolated points
    for (let j = 0; j < segmentsPerPoint; j++) {
      const t = j / segmentsPerPoint;

      const lat = catmullRomInterpolate(p0.lat, p1.lat, p2.lat, p3.lat, t);
      const lng = catmullRomInterpolate(p0.lng, p1.lng, p2.lng, p3.lng, t);
      const alt = catmullRomInterpolate(p0.altitude, p1.altitude, p2.altitude, p3.altitude, t);

      // Ensure altitude is never negative
      const clampedAlt = Math.max(0, alt);
      result.push([lng, lat, clampedAlt / 50000]);
    }
  }

  // Add the final point
  const lastPoint = unwrapped[unwrapped.length - 1];
  result.push([lastPoint.lng, lastPoint.lat, Math.max(0, lastPoint.altitude) / 50000]);

  return result;
}

/**
 * Create a simplified path by keeping only significant points
 * Removes points that are too close together or on a straight line
 */
export function simplifyPath(
  points: PathPoint[],
  minDistance: number = 0.01  // Minimum distance in degrees
): PathPoint[] {
  if (points.length < 3) return points;

  const result: PathPoint[] = [points[0]];

  for (let i = 1; i < points.length - 1; i++) {
    const prev = result[result.length - 1];
    const curr = points[i];
    const next = points[i + 1];

    // Calculate distance from previous kept point
    const dist = Math.sqrt(
      Math.pow(curr.lat - prev.lat, 2) +
      Math.pow(curr.lng - prev.lng, 2)
    );

    // Keep point if it's far enough from the previous point
    if (dist >= minDistance) {
      // Also check if it represents a significant direction change
      const angle1 = Math.atan2(curr.lat - prev.lat, curr.lng - prev.lng);
      const angle2 = Math.atan2(next.lat - curr.lat, next.lng - curr.lng);
      const angleDiff = Math.abs(angle1 - angle2);

      // Keep if there's a direction change > 5 degrees or significant distance
      if (angleDiff > 0.087 || dist >= minDistance * 2) {
        result.push(curr);
      }
    }
  }

  // Always keep the last point
  result.push(points[points.length - 1]);

  return result;
}
