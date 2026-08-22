import { memo } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import type { City } from '../../citiesData';
import type { ViewType } from '../../types/views';
import type { useGlobeLayers } from '../../hooks/useGlobeLayers';

interface GlobeCanvasProps {
  globeRef: React.RefObject<any>;
  isDayMode: boolean;
  currentView: ViewType;
  layers: ReturnType<typeof useGlobeLayers>;
  cities: City[];
  onPointClick: (point: any) => void;
  onPointHover: (point: any) => void;
  onCustomLayerClick: (point: any) => void;
  onCustomLayerHover: (point: any) => void;
  onZoom: (pov: { lat: number; lng: number; altitude: number }) => void;
  onGlobeClick: (coords: { lat: number; lng: number }) => Promise<void>;
  createSatelliteObject: (sat: any) => THREE.Group;
  createAirplaneObject: (flight: any) => THREE.Group;
  customThreeObjectUpdate: (obj: THREE.Object3D, d: any) => void;
}

/**
 * Isolated 3D canvas. Memoized to prevent re-render unless layers or theme change.
 * Keeps heavy react-globe.gl props out of the main Globe.tsx orchestrator.
 */
const GlobeCanvas = memo(({
  globeRef,
  isDayMode,
  currentView,
  layers,
  onPointClick,
  onPointHover,
  onCustomLayerClick,
  onCustomLayerHover,
  onZoom,
  onGlobeClick,
  createSatelliteObject,
  createAirplaneObject,
  customThreeObjectUpdate,
}: GlobeCanvasProps) => {
  return (
    <Globe
      ref={globeRef}
      globeImageUrl={isDayMode
        ? "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        : "https://unpkg.com/three-globe/example/img/earth-night.jpg"
      }
      backgroundImageUrl="https://unpkg.com/three-globe/example/img/night-sky.png"
      pointsData={layers.pointsData as any}
      pointLat="lat"
      pointLng="lng"
      pointAltitude={layers.pointAltitude as any}
      pointColor={layers.pointColor as any}
      pointRadius={layers.pointRadius as any}
      labelsData={layers.labelsData as any}
      labelLat="lat"
      labelLng="lng"
      labelAltitude={0.02}
      labelText={() => ''}
      labelSize={0}
      labelDotRadius={0.5}
      labelColor={(d: any) => (d as City).color || '#00ffcc'}
      labelResolution={2}
      pointLabel={layers.pointLabel as any}
      onPointClick={onPointClick}
      onPointHover={onPointHover}
      atmosphereColor={isDayMode ? "#4d9fff" : "#3a228a"}
      atmosphereAltitude={0.15}
      pointsTransitionDuration={500}
      heatmapsData={layers.heatmapsData as any}
      heatmapPointLat="lat"
      heatmapPointLng="lng"
      heatmapPointWeight="weight"
      heatmapBandwidth={7}
      heatmapColorSaturation={0.8}
      heatmapBaseAltitude={0.005}
      heatmapTopAltitude={0.02}
      heatmapsTransitionDuration={1200}
      pathsData={layers.pathsData as any}
      pathPoints="coords"
      pathPointLat={(p: number[]) => p[1]}
      pathPointLng={(p: number[]) => p[0]}
      pathPointAlt={(p: number[]) => (p as any)[2] || 0.01}
      pathColor={(d: any) => d.color}
      pathStroke={currentView === 'flights' ? 3 : 2}
      pathDashLength={currentView === 'flights' ? 0 : 0.5}
      pathDashGap={currentView === 'flights' ? 0 : 0.1}
      pathDashAnimateTime={currentView === 'flights' ? 0 : 2000}
      pathTransitionDuration={0}
      ringsData={layers.ringsData as any}
      ringLat="lat"
      ringLng="lng"
      ringAltitude={currentView === 'explorer' ? 0.02 : 0.005}
      ringColor={layers.ringColor as any}
      ringMaxRadius={layers.ringMaxRadius as any}
      ringPropagationSpeed={layers.ringPropagationSpeed as any}
      ringRepeatPeriod={layers.ringRepeatPeriod as any}
      customLayerData={layers.customLayerData as any}
      customThreeObject={
        currentView === 'satellites' ? (d: object) => createSatelliteObject(d as any)
        : currentView === 'flights' ? (d: object) => createAirplaneObject(d as any)
        : undefined
      }
      customThreeObjectUpdate={customThreeObjectUpdate as any}
      customLayerLabel={layers.customLayerLabel as any}
      onCustomLayerClick={onCustomLayerClick}
      onCustomLayerHover={onCustomLayerHover}
      onZoom={onZoom as any}
      onGlobeClick={onGlobeClick as any}
    />
  );
});

GlobeCanvas.displayName = 'GlobeCanvas';
export default GlobeCanvas;
