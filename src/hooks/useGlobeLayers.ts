import { useMemo } from 'react';
import { SATELLITE_CATEGORIES, EARTH_RADIUS_KM } from '../types/satellite';
import { getCountryFlag } from '../utils/countryFlag';
import type { City } from '../citiesData';
import type { ViewType } from '../types/views';
import type { PopulationDataPoint } from '../types/population';
import type { Earthquake } from '../types/earthquake';
import type { SatellitePosition } from '../types/satellite';
import type { Flight } from '../types/flights';

interface UseGlobeLayersOptions {
  currentView: ViewType;
  cities: City[];
  populationData: PopulationDataPoint[];
  earthquakes: Earthquake[];
  weatherHeatmap: { lat: number; lng: number; weight: number }[];
  pollutionHeatmap: { lat: number; lng: number; weight: number }[];
  auroraHeatmap: { lat: number; lng: number; weight: number }[];
  satellitePositions: SatellitePosition[];
  filteredFlights: Flight[];
  selectedFlightTrack?: Flight | null;
  selectedFlightTrackPath?: { lat: number; lng: number; altitude: number }[] | null;
  satelliteOrbit?: { lng: number; lat: number; alt: number }[] | null;
  showFlightTrail: boolean;
  showSatelliteOrbit: boolean;
  selectedFlightColor?: string;
  satelliteOrbitColor?: string;
  smoothedFlightPath: [number, number, number][] | null;
}

/**
 * Centralizes all <Globe> layer data selection based on currentView.
 * Keeps Globe.tsx lean and makes layer logic testable in isolation.
 */
export function useGlobeLayers(opts: UseGlobeLayersOptions) {
  const {
    currentView,
    cities,
    populationData,
    earthquakes,
    weatherHeatmap,
    pollutionHeatmap,
    auroraHeatmap,
    satellitePositions,
    filteredFlights,
    showFlightTrail,
    showSatelliteOrbit,
    satelliteOrbit,
    smoothedFlightPath,
    selectedFlightColor,
    satelliteOrbitColor,
  } = opts;

  // Points (bubbles / markers) — population, earthquakes, explorer/weather cities
  const pointsData = useMemo(() => {
    if (currentView === 'population') return populationData;
    if (currentView === 'earthquakes') return earthquakes;
    if (currentView === 'explorer' || currentView === 'weather') return cities;
    return [];
  }, [currentView, cities, populationData, earthquakes]);

  // Labels layer only for explorer (glowing city dots)
  const labelsData = useMemo(() => (currentView === 'explorer' ? cities : []), [currentView, cities]);

  // Rings — explorer city rings + earthquake seismic waves
  // Cap earthquake rings to avoid GPU buffer overflow (413+ quakes → GL_INVALID_OPERATION)
  const ringsData = useMemo(() => {
    if (currentView === 'explorer') return cities;
    if (currentView === 'earthquakes') {
      // Limit to most recent 100 to keep instanced buffer manageable
      return earthquakes.length > 150 ? earthquakes.slice(0, 100) : earthquakes;
    }
    return [];
  }, [currentView, cities, earthquakes]);

  // Heatmaps — weather / pollution / aurora
  const heatmapsData = useMemo(() => {
    if (currentView === 'weather') return [weatherHeatmap];
    if (currentView === 'pollution') return [pollutionHeatmap];
    if (currentView === 'aurora') return [auroraHeatmap];
    return [];
  }, [currentView, weatherHeatmap, pollutionHeatmap, auroraHeatmap]);

  // Paths — flight trail or satellite orbit
  const pathsData = useMemo(() => {
    if (currentView === 'flights' && showFlightTrail && smoothedFlightPath?.length) {
      return [{ coords: smoothedFlightPath, color: selectedFlightColor || '#FF9800' }];
    }
    if (currentView === 'satellites' && showSatelliteOrbit && satelliteOrbit?.length) {
      return [{ coords: satelliteOrbit.map(p => [p.lng, p.lat, p.alt] as [number, number, number]), color: satelliteOrbitColor || '#9C27B0' }];
    }
    return [];
  }, [currentView, showFlightTrail, smoothedFlightPath, selectedFlightColor, showSatelliteOrbit, satelliteOrbit, satelliteOrbitColor]);

  // Custom 3D layer — satellites or flights
  const customLayerData = useMemo(() => {
    if (currentView === 'satellites') return satellitePositions;
    if (currentView === 'flights') return filteredFlights;
    return [];
  }, [currentView, satellitePositions, filteredFlights]);

  // Accessor fns (memoized to avoid re-creation)
  const pointAltitude = useMemo(() => () => {
    if (currentView === 'population') return 0.01;
    if (currentView === 'earthquakes') return 0.01;
    return currentView === 'weather' ? 0.05 : 0.02;
  }, [currentView]);

  const pointColor = useMemo(() => (d: any) => {
    if (currentView === 'population') return '#4FC3F7';
    if (currentView === 'earthquakes') return d.color;
    return d.color || '#ffffff';
  }, [currentView]);

  const pointRadius = useMemo(() => (d: any) => {
    if (currentView === 'population') return 0.4 + (d.weight * 2.5);
    if (currentView === 'earthquakes') return 0.15 + (d.weight * 0.8);
    return 0.8;
  }, [currentView]);

  const pointLabel = useMemo(() => (d: any) => {
    if (currentView === 'population') {
      return `
        <div style="background: rgba(0,0,0,0.9); padding: 12px; border-radius: 8px; color: white; max-width: 250px;">
          <div style="font-size: 24px; margin-bottom: 8px;">${getCountryFlag(d.countryCode)}</div>
          <b style="font-size: 16px; color: #4FC3F7;">${d.name}</b><br/>
          <div style="margin-top: 8px; font-size: 14px;">
            <b>Population:</b> ${d.populationFormatted}<br/>
            <span style="opacity: 0.7; font-size: 12px;">${d.population?.toLocaleString() || 0} people</span>
          </div>
        </div>
      `;
    }
    if (currentView === 'earthquakes') {
      return `
        <div style="background: rgba(0,0,0,0.95); padding: 14px; border-radius: 10px; color: white; max-width: 280px; border: 1px solid ${d.color}44;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: ${d.color}33; border: 2px solid ${d.color}; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 18px; font-weight: bold; color: ${d.color};">${d.magnitude.toFixed(1)}</span>
            </div>
            <div>
              <div style="font-size: 11px; color: rgba(255,255,255,0.5); text-transform: uppercase;">Magnitude</div>
              <div style="font-size: 14px; font-weight: 600;">${d.magnitude >= 6 ? 'Strong' : d.magnitude >= 5 ? 'Moderate' : 'Light'}</div>
            </div>
          </div>
          <div style="font-size: 13px; margin-bottom: 8px;">${d.place}</div>
          <div style="display: flex; gap: 16px; font-size: 12px; color: rgba(255,255,255,0.7);">
            <span>Depth: ${d.depth.toFixed(1)}km</span>
            <span>${d.timeAgo}</span>
          </div>
          ${d.isRecent ? '<div style="margin-top: 8px; padding: 4px 8px; background: rgba(255,68,68,0.3); border-radius: 4px; font-size: 11px; color: #ff6666; display: inline-block;">Recent Event</div>' : ''}
        </div>
      `;
    }
    return `
      <div style="background: rgba(0,0,0,0.9); padding: 12px; border-radius: 8px; color: white; max-width: 250px;">
        <b style="font-size: 16px; color: ${d.color};">${d.name}</b><br/>
        <span style="font-size: 13px; opacity: 0.8;">${d.country}</span><br/>
        <div style="margin-top: 8px; font-size: 12px;">
          <b>Population:</b> ${d.population}<br/>
          <b>Area:</b> ${d.area}
        </div>
      </div>
    `;
  }, [currentView]);

  const ringColor = useMemo(() => (d: any) => {
    if (currentView === 'explorer') return d.color || '#00ffcc';
    const baseColor = d.color || '#ff4444';
    return [`${baseColor}cc`, `${baseColor}00`];
  }, [currentView]);

  const ringMaxRadius = useMemo(() => (d: any) => {
    if (currentView === 'explorer') return 0.5;
    return 3 + (d.magnitude - 2.5) * 2;
  }, [currentView]);

  const ringPropagationSpeed = useMemo(() => {
    if (currentView === 'explorer') return 0 as unknown as (d: any) => number;
    return (d: any) => 2 + (d.magnitude - 2.5) * 0.8;
  }, [currentView]);

  const ringRepeatPeriod = useMemo(() => {
    if (currentView === 'explorer') return 0 as unknown as (d: any) => number;
    return (d: any) => d.isRecent ? 600 : 1200;
  }, [currentView]);

  const customLayerLabel = useMemo(() => (d: any) => {
    if (currentView === 'satellites') {
      const sat = d as SatellitePosition;
      return `
        <div style="background: rgba(0,0,0,0.95); padding: 14px; border-radius: 10px; color: white; max-width: 280px; border: 1px solid ${sat.color}44;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: ${sat.color}33; border: 2px solid ${sat.color}; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 18px;">${SATELLITE_CATEGORIES[sat.category]?.icon || '🛰️'}</span>
            </div>
            <div>
              <div style="font-size: 11px; color: rgba(255,255,255,0.5); text-transform: uppercase;">${SATELLITE_CATEGORIES[sat.category]?.name || 'Satellite'}</div>
              <div style="font-size: 14px; font-weight: 600;">${sat.name}</div>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; color: rgba(255,255,255,0.8);">
            <div>Alt: ${(sat.alt * EARTH_RADIUS_KM).toFixed(0)} km</div>
            <div>Vel: ${sat.velocity.toFixed(1)} km/s</div>
            <div>Lat: ${sat.lat.toFixed(2)}°</div>
            <div>Lng: ${sat.lng.toFixed(2)}°</div>
          </div>
        </div>
      `;
    }
    if (currentView === 'flights') {
      const flight = d as any;
      // color resolved via FLIGHT_CATEGORIES; import avoided to keep hook lean — use flight.color fallback
      const color = flight.color || '#FF9800';
      return `
        <div style="background: rgba(0,0,0,0.95); padding: 14px; border-radius: 10px; color: white; max-width: 280px; border: 1px solid ${color}44;">
          <div style="font-size: 16px; font-weight: 700; color: ${color};">${flight.callsign || 'Unknown'}</div>
          <div style="font-size: 12px; color: rgba(255,255,255,0.8);">
            Alt: ${flight.altitudeFt?.toLocaleString() || 0} ft • ${flight.originCountry || ''}
          </div>
        </div>
      `;
    }
    return '';
  }, [currentView]);

  return {
    pointsData,
    labelsData,
    ringsData,
    heatmapsData,
    pathsData,
    customLayerData,
    pointAltitude,
    pointColor,
    pointRadius,
    pointLabel,
    ringColor,
    ringMaxRadius,
    ringPropagationSpeed,
    ringRepeatPeriod,
    customLayerLabel,
  };
}
