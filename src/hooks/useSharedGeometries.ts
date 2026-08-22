import { useMemo, useEffect } from 'react';
import * as THREE from 'three';

export interface SharedGeometries {
  satSphere: THREE.SphereGeometry;
  issBody: THREE.BoxGeometry;
  issPanel: THREE.BoxGeometry;
  satGlowSmall: THREE.SphereGeometry;
  satGlowISS: THREE.SphereGeometry;
  airplaneCone: THREE.ConeGeometry;
  airplaneGlow: THREE.SphereGeometry;
}

/**
 * Memoized shared geometries for satellite/airplane objects.
 * Reused across all instances to avoid per-frame allocations.
 * Only Materials are per-instance (to allow per-category colors).
 */
export function useSharedGeometries(): SharedGeometries {
  const geometries = useMemo<SharedGeometries>(() => ({
    satSphere: new THREE.SphereGeometry(0.4, 8, 8),
    issBody: new THREE.BoxGeometry(3.0, 0.75, 0.75),
    issPanel: new THREE.BoxGeometry(0.45, 4.5, 0.15),
    satGlowSmall: new THREE.SphereGeometry(1.0, 16, 16),
    satGlowISS: new THREE.SphereGeometry(6.0, 16, 16),
    airplaneCone: (() => {
      const g = new THREE.ConeGeometry(0.4, 1.2, 4);
      g.rotateX(Math.PI / 2);
      return g;
    })(),
    airplaneGlow: new THREE.SphereGeometry(0.8, 16, 16),
  }), []);

  useEffect(() => {
    return () => {
      Object.values(geometries).forEach(g => g.dispose());
    };
  }, [geometries]);

  return geometries;
}
