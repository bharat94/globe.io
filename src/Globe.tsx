import { useRef, useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import * as THREE from 'three';
import type { City } from './citiesData';
import type { ViewType } from './types/views';
import type { WeatherDataPoint } from './types/weather';
import type { PopulationDataPoint } from './types/population';
import type { Earthquake } from './types/earthquake';
import type { SatellitePosition, SatelliteCategory } from './types/satellite';
import { SATELLITE_CATEGORIES } from './types/satellite';
import type { Flight, FlightCategory } from './types/flights';
import { FLIGHT_CATEGORIES } from './types/flights';
import { smoothFlightPath } from './utils/pathSmoothing';
import { VIEWS } from './types/views';
import ViewSelector from './components/ViewSelector';
import { SearchBar } from './components/search';
// Lazy-load view-specific UI to keep initial bundle lean (2.1 MB → split)
const TimeSlider = lazy(() => import('./components/weather/TimeSlider'));
const WeatherPanel = lazy(() => import('./components/weather/WeatherPanel'));
const WeatherLegend = lazy(() => import('./components/weather/WeatherLegend'));
const PopulationTimeSlider = lazy(() => import('./components/population/PopulationTimeSlider'));
const PopulationPanel = lazy(() => import('./components/population/PopulationPanel'));
const PopulationLegend = lazy(() => import('./components/population/PopulationLegend'));
const EarthquakePanel = lazy(() => import('./components/earthquake/EarthquakePanel'));
const EarthquakeLegend = lazy(() => import('./components/earthquake/EarthquakeLegend'));
const EarthquakeControls = lazy(() => import('./components/earthquake/EarthquakeControls'));
const SatellitePanel = lazy(() => import('./components/satellite/SatellitePanel'));
const SatelliteLegend = lazy(() => import('./components/satellite/SatelliteLegend'));
const SatelliteControls = lazy(() => import('./components/satellite/SatelliteControls'));
const PollutionPanel = lazy(() => import('./components/pollution/PollutionPanel'));
const PollutionLegend = lazy(() => import('./components/pollution/PollutionLegend'));
const PollutionControls = lazy(() => import('./components/pollution/PollutionControls'));
const FlightPanel = lazy(() => import('./components/flights/FlightPanel'));
const FlightControls = lazy(() => import('./components/flights/FlightControls'));
const FlightLegend = lazy(() => import('./components/flights/FlightLegend'));
const AuroraPanel = lazy(() => import('./components/aurora/AuroraPanel'));
const AuroraLegend = lazy(() => import('./components/aurora/AuroraLegend'));
const AuroraControls = lazy(() => import('./components/aurora/AuroraControls'));
import { useWeatherData } from './hooks/useWeatherData';
import { useSearch } from './hooks/useSearch';
import type { SearchResult } from './utils/searchIndex';
import { usePopulationData } from './hooks/usePopulationData';
import { useEarthquakeData } from './hooks/useEarthquakeData';
import { useSatelliteData } from './hooks/useSatelliteData';
import { usePollutionData } from './hooks/usePollutionData';
import { useAuroraData } from './hooks/useAuroraData';
import { useFlightData } from './hooks/useFlightData';
import { useUrlState } from './hooks/useUrlState';
import { API_ENDPOINTS } from './config';
import { useSharedGeometries } from './hooks/useSharedGeometries';
import { useGlobeLayers } from './hooks/useGlobeLayers';
import GlobeCanvas from './components/globe/GlobeCanvas';

const GlobeComponent = () => {
  const globeEl = useRef<any>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [hoverCity, setHoverCity] = useState<City | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLearnMore, setShowLearnMore] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('explorer');
  const [selectedWeatherLocation, setSelectedWeatherLocation] = useState<WeatherDataPoint | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<PopulationDataPoint | null>(null);

  // Weather data hook
  const weatherData = useWeatherData();

  // Population data hook
  const populationData = usePopulationData();

  // Earthquake data hook
  const earthquakeData = useEarthquakeData();

  // Satellite data hook
  const satelliteData = useSatelliteData();

  // Pollution data hook
  const pollutionData = usePollutionData();

  // Flight data hook
  const flightData = useFlightData();

  // Aurora data hook
  const auroraData = useAuroraData();

  // URL state hook
  const { getStateFromUrl, updateUrl, hasUrlState, isInitialMount } = useUrlState();

  // Search hook
  const search = useSearch();

  const setViewportRef = useRef(weatherData.setViewport);
  setViewportRef.current = weatherData.setViewport;

  // Determine default theme based on local time (6am-6pm = day, 6pm-6am = night)
  const getDefaultTheme = () => {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18; // true = day mode, false = night mode
  };

  const [isDayMode, setIsDayMode] = useState(getDefaultTheme());
  const [cameraPosition, setCameraPosition] = useState<{ lat: number; lng: number; altitude: number } | null>(null);
  const urlUpdateTimeoutRef = useRef<number | null>(null);

  // Initialize from URL on mount
  useEffect(() => {
    if (isInitialMount.current && hasUrlState()) {
      const urlState = getStateFromUrl();

      // Set view from URL
      if (urlState.view) {
        setCurrentView(urlState.view);
      }

      // Set view-specific params
      if (urlState.year !== undefined) {
        weatherData.setSelectedYear(urlState.year);
        populationData.setSelectedYear(urlState.year);
      }
      if (urlState.month !== undefined) {
        weatherData.setSelectedMonth(urlState.month);
      }
      if (urlState.mag !== undefined) {
        earthquakeData.setMinMagnitude(urlState.mag);
      }
      if (urlState.days !== undefined) {
        const raw = String(urlState.days).trim().toLowerCase();
        // Direct TimeRange string (hour/day/week/month) – new format
        if (['hour', 'day', 'week', 'month'].includes(raw)) {
          earthquakeData.setTimeRange(raw as any);
        } else {
          // Legacy numeric days fallback
          const daysNum = parseInt(raw, 10);
          if (!isNaN(daysNum)) {
            if (daysNum <= 1) earthquakeData.setTimeRange('hour');
            else if (daysNum <= 7) earthquakeData.setTimeRange('day');
            else if (daysNum <= 30) earthquakeData.setTimeRange('week');
            else earthquakeData.setTimeRange('month');
          }
        }
      }
      if (urlState.pollutant) {
        pollutionData.setSelectedPollutant(urlState.pollutant as any);
      }

      // Navigate to camera position after globe loads
      if (urlState.lat !== undefined && urlState.lng !== undefined) {
        const initCamera = () => {
          if (globeEl.current) {
            globeEl.current.pointOfView(
              { lat: urlState.lat, lng: urlState.lng, altitude: urlState.alt || 2.5 },
              0 // Instant navigation on initial load
            );
          }
        };
        // Small delay to ensure globe is ready
        setTimeout(initCamera, 100);
      }
    }
    isInitialMount.current = false;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getStateFromUrl, hasUrlState]);

  // Update URL when state changes (debounced)
   
  useEffect(() => {
    if (isInitialMount.current) return;

    // Clear existing timeout
    if (urlUpdateTimeoutRef.current) {
      clearTimeout(urlUpdateTimeoutRef.current);
    }

    // Debounce URL updates to avoid too many history entries
    urlUpdateTimeoutRef.current = window.setTimeout(() => {
      const state: any = {
        view: currentView
      };

      // Add camera position if available
      if (cameraPosition) {
        state.lat = cameraPosition.lat;
        state.lng = cameraPosition.lng;
        state.alt = cameraPosition.altitude;
      }

      // Add view-specific params
      if (currentView === 'weather') {
        state.year = weatherData.selectedYear;
        state.month = weatherData.selectedMonth;
      } else if (currentView === 'population') {
        state.year = populationData.selectedYear;
      } else if (currentView === 'earthquakes') {
        state.mag = earthquakeData.minMagnitude;
        state.days = earthquakeData.timeRange;
      } else if (currentView === 'pollution') {
        state.pollutant = pollutionData.selectedPollutant;
      }

      updateUrl(state);
    }, 500);

    return () => {
      if (urlUpdateTimeoutRef.current) {
        clearTimeout(urlUpdateTimeoutRef.current);
      }
    };
  }, [
    currentView,
    cameraPosition,
    weatherData.selectedYear,
    weatherData.selectedMonth,
    populationData.selectedYear,
    earthquakeData.minMagnitude,
    earthquakeData.timeRange,
    pollutionData.selectedPollutant,
    updateUrl
  ]);

  // Update search index when data changes
  // Use satellites with positions; rebuild when positions populate to make ISS searchable after TLE propagation
  const staticSatellitePositions = useMemo(() => {
    if (satelliteData.satellites.length === 0) return [];
    // Include positions when available; fallback to 0,0 filtered out until first propagation completes
    return satelliteData.satellites.map(sat => {
      const pos = satelliteData.positions.find(p => p.id === sat.id);
      return pos || { id: sat.id, name: sat.name, category: sat.category, lat: 0, lng: 0, alt: 0, velocity: 0, color: '' };
    }).filter(p => p.lat !== 0 || p.lng !== 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [satelliteData.satellites, satelliteData.positions.length]);

  // Memoize smoothed flight path to avoid recalculation on every render
  const smoothedFlightPath = useMemo(() => {
    if (!flightData.selectedFlightTrack?.path?.length) return null;

    const path = flightData.selectedFlightTrack.path;
    // Use smoothFlightPath for interpolated curve
    return smoothFlightPath(path, 8); // 8 segments per point for smooth curve
  }, [flightData.selectedFlightTrack]);

  useEffect(() => {
    search.updateData({
      cities,
      earthquakes: earthquakeData.earthquakes,
      satellites: staticSatellitePositions
    });
  }, [cities, earthquakeData.earthquakes, staticSatellitePositions, search]);

  // Handle search result selection
  const handleSearchSelect = useCallback((result: SearchResult) => {
    // Navigate camera to result location
    if (globeEl.current) {
      globeEl.current.pointOfView(
        { lat: result.lat, lng: result.lng, altitude: 1.5 },
        1000
      );
    }

    // Handle based on result type and current view
    switch (result.type) {
      case 'city':
      case 'country':
        // For city-based views, select the entity in that view
        if (currentView === 'explorer') {
          setSelectedCity(result.data);
        } else if (currentView === 'population') {
          // Find matching country in population data
          const countryName = result.type === 'city' ? result.data.country : result.data.name;
          const countryData = populationData.populationData.find(
            (p: PopulationDataPoint) => p.name === countryName
          );
          if (countryData) {
            setSelectedCountry(countryData);
          }
        }
        // For non-city views (weather, earthquakes, satellites, pollution, flights),
        // just navigate to the location - camera is already moved above
        break;
      case 'earthquake':
        setCurrentView('earthquakes');
        earthquakeData.setSelectedEarthquake(result.data);
        break;
      case 'satellite':
        setCurrentView('satellites');
        const satellite = satelliteData.satellites.find(s => s.id === result.data.id);
        if (satellite) {
          satelliteData.setSelectedSatellite(satellite);
        }
        break;
    }

    // Clear search
    search.clearSearch();
  }, [currentView, earthquakeData, satelliteData, populationData.populationData, search]);

  // Handle zoom/rotation changes for progressive loading and URL state
  const handleZoom = useCallback((pov: { lat: number; lng: number; altitude: number }) => {
    // Update camera position for URL state
    setCameraPosition(pov);

    // Weather-specific viewport handling
    if (currentView === 'weather') {
      console.log('onZoom fired - lat:', pov.lat.toFixed(2), 'lng:', pov.lng.toFixed(2), 'alt:', pov.altitude.toFixed(2));

      setViewportRef.current({
        lat: pov.lat,
        lng: pov.lng,
        altitude: pov.altitude
      });
    }
  }, [currentView]);

  // Set initial viewport when entering weather view
  useEffect(() => {
    if (currentView === 'weather' && globeEl.current) {
      const pov = globeEl.current.pointOfView();
      if (pov) {
        console.log('Initial POV:', pov);
        setViewportRef.current({
          lat: pov.lat || 0,
          lng: pov.lng || 0,
          altitude: pov.altitude || 2.5
        });
      }
    }
  }, [currentView]);

  // Fetch data based on current view
  useEffect(() => {
    const fetchViewData = async () => {
      setLoading(true);
      setError(null);
      setSelectedCity(null); // Clear selected city when switching views
      setSelectedWeatherLocation(null); // Clear weather selection
      setSelectedCountry(null); // Clear population selection
      earthquakeData.setSelectedEarthquake(null);
      satelliteData.setSelectedSatellite(null);
      flightData.setSelectedFlight(null);
      pollutionData.setSelectedLocation(null);

      try {
        // Always fetch cities for markers
        const response = await fetch(API_ENDPOINTS.cities);
        if (!response.ok) {
          throw new Error('Failed to fetch cities');
        }
        const data = await response.json();
        setCities(data);

        // View-specific handling
        if (currentView === 'weather') {
          // Weather data is handled by useWeatherData hook
          setLoading(false);
          return;
        }

        if (currentView === 'population') {
          // Population data is handled by usePopulationData hook
          setLoading(false);
          return;
        }

        if (currentView === 'earthquakes') {
          // Earthquake data is handled by useEarthquakeData hook
          setLoading(false);
          return;
        }

        if (currentView === 'satellites') {
          // Satellite data is handled by useSatelliteData hook
          setLoading(false);
          return;
        }

        if (currentView === 'pollution') {
          // Pollution data is handled by usePollutionData hook
          setLoading(false);
          return;
        }

        if (currentView === 'flights') {
          // Flight data is handled by useFlightData hook
          setLoading(false);
          return;
        }

        setLoading(false);
      } catch (err) {
        console.error(`Error fetching ${currentView} data:`, err);
        setError(`Failed to load ${currentView} data. Please make sure the server is running.`);
        setLoading(false);
      }
    };

    fetchViewData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView]);

  const handleCityClick = useCallback((city: City) => {
    setSelectedCity(city);
    setShowLearnMore(false); // Reset Learn More when selecting a new city

    if (globeEl.current) {
      globeEl.current.pointOfView(
        { lat: city.lat, lng: city.lng, altitude: 2 },
        1000
      );
    }
  }, []);

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
  };

  // Handle click on population bubble
  const handlePopulationClick = useCallback((point: PopulationDataPoint) => {
    setSelectedCountry(point);
    if (globeEl.current) {
      globeEl.current.pointOfView(
        { lat: point.lat, lng: point.lng, altitude: 2 },
        1000
      );
    }
  }, []);

  // Handle click on earthquake
  const handleEarthquakeClick = useCallback((earthquake: Earthquake) => {
    earthquakeData.setSelectedEarthquake(earthquake);
    if (globeEl.current) {
      globeEl.current.pointOfView(
        { lat: earthquake.lat, lng: earthquake.lng, altitude: 1.5 },
        1000
      );
    }
  }, [earthquakeData]);

  // Handle click on weather heatmap point
  const handleWeatherPointClick = useCallback(async (point: any) => {
    if (point && point.lat !== undefined && point.lng !== undefined) {
      // Get detailed data for this location
      const locationData = await weatherData.getLocationData(point.lat, point.lng);
      if (locationData) {
        setSelectedWeatherLocation(locationData);
      } else {
        // Use the heatmap point data directly
        setSelectedWeatherLocation({
          lat: point.lat,
          lng: point.lng,
          cityName: point.cityName,
          country: point.country,
          year: weatherData.selectedYear,
          month: weatherData.selectedMonth,
          temperature: point.temperature || { avg: 0, min: 0, max: 0 }
        });
      }

      // Animate camera to location
      if (globeEl.current) {
        globeEl.current.pointOfView(
          { lat: point.lat, lng: point.lng, altitude: 2 },
          1000
        );
      }
    }
  }, [weatherData]);

  // Shared geometries for satellite/airplane objects — extracted to hook to keep Globe.tsx lean
  const sharedGeometries = useSharedGeometries();

  // Centralized layer selection — keeps <Globe> prop logic out of JSX
  const globeLayers = useGlobeLayers({
    currentView,
    cities,
    populationData: populationData.populationData,
    earthquakes: earthquakeData.earthquakes,
    weatherHeatmap: weatherData.heatmapData,
    pollutionHeatmap: pollutionData.heatmapData,
    auroraHeatmap: auroraData.heatmapData,
    satellitePositions: satelliteData.positions,
    filteredFlights: flightData.filteredFlights,
    showFlightTrail: flightData.showTrail,
    showSatelliteOrbit: satelliteData.showOrbit,
    satelliteOrbit: satelliteData.selectedSatelliteOrbit as unknown as { lng: number; lat: number; alt: number }[] | null,
    smoothedFlightPath,
    selectedFlightColor: flightData.selectedFlight?.color,
    satelliteOrbitColor: satelliteData.selectedSatellite
      ? SATELLITE_CATEGORIES[satelliteData.selectedSatellite.category]?.color
      : undefined,
  });

  // Create 3D satellite object — uses shared geometries, per-instance materials
  const createSatelliteObject = useCallback((sat: SatellitePosition) => {
    const group = new THREE.Group();
    const categoryConfig = SATELLITE_CATEGORIES[sat.category];
    const color = categoryConfig?.color || '#ffffff';

    // Different sizes for different categories
    const isISS = sat.category === 'iss';

    // Main satellite body — share geometries, clone materials per instance
    if (isISS) {
      const bodyMaterial = new THREE.MeshBasicMaterial({ color: '#ffffff' });
      const body = new THREE.Mesh(sharedGeometries.issBody, bodyMaterial);
      group.add(body);

      const panelMaterial = new THREE.MeshBasicMaterial({ color: '#4169E1' });
      const leftPanel = new THREE.Mesh(sharedGeometries.issPanel, panelMaterial.clone());
      leftPanel.position.set(-1.2, 0, 0);
      group.add(leftPanel);
      const rightPanel = new THREE.Mesh(sharedGeometries.issPanel, panelMaterial.clone());
      rightPanel.position.set(1.2, 0, 0);
      group.add(rightPanel);
      // Tag meshes for disposal (materials only — geometries are shared)
      (group as unknown as { _materials: THREE.Material[] })._materials = [bodyMaterial, panelMaterial];
    } else {
      const satMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.9
      });
      const satMesh = new THREE.Mesh(sharedGeometries.satSphere, satMaterial);
      group.add(satMesh);
    }

    // Glow effect — shared geometry
    const glowGeometry = isISS ? sharedGeometries.satGlowISS : sharedGeometries.satGlowSmall;
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: isISS ? 0.3 : 0.15,
      side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);

    // Add point light for ISS
    if (isISS) {
      const light = new THREE.PointLight(color, 1, 50);
      group.add(light);
    }

    return group;
  }, [sharedGeometries]);

  // Create 3D airplane object for flights — uses shared geometries
  // Dimming/heading are handled in customThreeObjectUpdate to avoid recreating objects on selection change
  const createAirplaneObject = useCallback((flight: Flight) => {
    const group = new THREE.Group();
    const categoryConfig = FLIGHT_CATEGORIES[flight.category];
    const color = categoryConfig?.color || flight.color || '#ffffff';

    const coneMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 1
    });
    const cone = new THREE.Mesh(sharedGeometries.airplaneCone, coneMaterial);
    cone.rotation.z = -((flight.heading || 0) * Math.PI / 180);
    group.add(cone);

    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide
    });
    const glow = new THREE.Mesh(sharedGeometries.airplaneGlow, glowMaterial);
    group.add(glow);

    // Store color for update loop without capturing selectedFlight closure
    (group.userData as { baseColor: string }).baseColor = color;

    return group;
  }, [sharedGeometries]);

  // Handle flight click from custom layer
  const handleFlightClick = useCallback((flight: Flight) => {
    flightData.setSelectedFlight(flight);
  }, [flightData]);

  // Toggle flight category — clear trail if selected flight's category hidden
  const handleToggleFlightCategory = useCallback((category: FlightCategory) => {
    flightData.setSelectedCategories((prev: FlightCategory[]) => {
      const next = prev.includes(category) ? prev.filter((c: FlightCategory) => c !== category) : [...prev, category];
      if (flightData.selectedFlight && !next.includes(flightData.selectedFlight.category)) {
        flightData.setSelectedFlight(null);
        flightData.setShowTrail(false);
      }
      return next;
    });
  }, [flightData]);

  // Handle satellite click
  const handleSatelliteClick = useCallback((sat: SatellitePosition) => {
    const satellite = satelliteData.satellites.find(s => s.id === sat.id);
    if (satellite) {
      satelliteData.setSelectedSatellite(satellite);
    }
  }, [satelliteData]);

  // Toggle satellite category — clear selection/orbit if its category is hidden
  const handleToggleSatelliteCategory = useCallback((category: SatelliteCategory) => {
    satelliteData.setSelectedCategories((prev: SatelliteCategory[]) => {
      const next = prev.includes(category) ? prev.filter((c: SatelliteCategory) => c !== category) : [...prev, category];
      // If selected satellite's category is now hidden, deselect it and hide orbit
      if (satelliteData.selectedSatellite?.category === category && !next.includes(category)) {
        satelliteData.setSelectedSatellite(null);
        satelliteData.setShowOrbit(false);
      }
      return next;
    });
  }, [satelliteData]);

  // Globe interaction handlers — extracted for GlobeCanvas
  const handleGlobePointClick = useCallback((point: any) => {
    if (currentView === 'explorer') handleCityClick(point as City);
    else if (currentView === 'population') handlePopulationClick(point as PopulationDataPoint);
    else if (currentView === 'earthquakes') handleEarthquakeClick(point as Earthquake);
  }, [currentView, handleCityClick, handlePopulationClick, handleEarthquakeClick]);

  const handleGlobePointHover = useCallback((point: any) => {
    if (currentView === 'explorer' || currentView === 'population' || currentView === 'earthquakes') {
      if (currentView === 'explorer') setHoverCity(point as City | null);
      const canvas = document.querySelector('canvas');
      if (canvas) canvas.style.cursor = point ? 'pointer' : 'grab';
    }
  }, [currentView]);

  const handleGlobeCustomLayerClick = useCallback((d: any) => {
    if (currentView === 'satellites') handleSatelliteClick(d as SatellitePosition);
    else if (currentView === 'flights') handleFlightClick(d as Flight);
  }, [currentView, handleSatelliteClick, handleFlightClick]);

  const handleGlobeCustomLayerHover = useCallback((d: any) => {
    const canvas = document.querySelector('canvas');
    if (canvas) canvas.style.cursor = d ? 'pointer' : 'grab';
  }, []);

  const handleCustomThreeObjectUpdate = useCallback((obj: THREE.Object3D, d: any) => {
    if (currentView === 'satellites') {
      if (globeEl.current && d.lat !== undefined) {
        const coords = globeEl.current.getCoords(d.lat, d.lng, d.alt);
        if (coords) obj.position.set(coords.x, coords.y, coords.z);
      }
    } else if (currentView === 'flights') {
      const flight = d as Flight;
      if (globeEl.current && flight.lat !== undefined) {
        const altitudeScale = 0.005 + (flight.altitude / 150000);
        const coords = globeEl.current.getCoords(flight.lat, flight.lng, altitudeScale);
        if (coords) obj.position.set(coords.x, coords.y, coords.z);
      }
      const cone = obj.children.find(c => c instanceof THREE.Mesh && (c as THREE.Mesh).geometry instanceof THREE.ConeGeometry);
      if (cone) cone.rotation.z = -((flight.heading || 0) * Math.PI / 180);
      const isDimmed = flightData.selectedFlight && flightData.selectedFlight.icao24 !== flight.icao24;
      obj.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          const material = child.material as THREE.MeshBasicMaterial;
          if (child.geometry instanceof THREE.ConeGeometry) material.opacity = isDimmed ? 0.15 : 1;
          else material.opacity = isDimmed ? 0.05 : 0.2;
        }
      });
    }
  }, [currentView, flightData.selectedFlight]);

  const handleGlobeClickInternal = useCallback(async (coords: { lat: number; lng: number }) => {
    if (currentView === 'weather') {
      const nearest = weatherData.heatmapData.reduce((closest: any, point: any) => {
        const dist = Math.sqrt(Math.pow(point.lat - coords.lat, 2) + Math.pow(point.lng - coords.lng, 2));
        if (!closest || dist < closest.dist) return { point, dist };
        return closest;
      }, null);
      if (nearest && nearest.dist < 15) handleWeatherPointClick(nearest.point);
    } else if (currentView === 'pollution') {
      const locationData = await pollutionData.getLocationData(coords.lat, coords.lng);
      if (locationData) {
        pollutionData.setSelectedLocation(locationData);
        if (globeEl.current) globeEl.current.pointOfView({ lat: coords.lat, lng: coords.lng, altitude: 2 }, 1000);
      }
    }
  }, [currentView, weatherData, pollutionData, handleWeatherPointClick]);

  if (loading) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
        color: 'white',
        fontSize: '18px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🌍</div>
          <div>Loading cities...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
        color: 'white',
        fontSize: '18px'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '500px', padding: '20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
          <div style={{ marginBottom: '10px', color: '#ff6b6b' }}>{error}</div>
          <div style={{ fontSize: '14px', opacity: 0.7 }}>
            Make sure MongoDB is running and the server is started.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <style>{`
        canvas {
          cursor: grab;
        }
        canvas:active {
          cursor: grabbing;
        }
      `}</style>
      {/* View Selector */}
      <ViewSelector
        views={VIEWS}
        currentView={currentView}
        onViewChange={handleViewChange}
      />

      {/* Day/Night Mode Toggle */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.7)',
        padding: '10px 20px',
        borderRadius: '25px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        backdropFilter: 'blur(10px)',
      }}>
        <span style={{ fontSize: '20px' }} aria-hidden="true">☀️</span>
        <button
          onClick={() => setIsDayMode(!isDayMode)}
          aria-label={isDayMode ? 'Switch to night mode' : 'Switch to day mode'}
          aria-pressed={!isDayMode}
          title={isDayMode ? 'Day mode — click for night' : 'Night mode — click for day'}
          style={{
            background: isDayMode ? '#4CAF50' : '#2196F3',
            border: 'none',
            borderRadius: '15px',
            width: '50px',
            height: '26px',
            position: 'relative',
            cursor: 'pointer',
            transition: 'background 0.3s',
          }}
        >
          <div style={{
            position: 'absolute',
            top: '3px',
            left: isDayMode ? '3px' : '27px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: 'white',
            transition: 'left 0.3s',
          }} />
        </button>
        <span style={{ fontSize: '20px' }} aria-hidden="true">🌙</span>
      </div>

      {/* Search Bar */}
      <SearchBar
        query={search.query}
        onQueryChange={search.setQuery}
        results={search.results}
        selectedIndex={search.selectedIndex}
        onSelectedIndexChange={search.setSelectedIndex}
        onSelectResult={handleSearchSelect}
        onClear={search.clearSearch}
        isSearching={search.isSearching}
      />

      <GlobeCanvas
        globeRef={globeEl}
        isDayMode={isDayMode}
        currentView={currentView}
        layers={globeLayers}
        cities={cities}
        onPointClick={handleGlobePointClick}
        onPointHover={handleGlobePointHover}
        onCustomLayerClick={handleGlobeCustomLayerClick}
        onCustomLayerHover={handleGlobeCustomLayerHover}
        onZoom={handleZoom}
        onGlobeClick={handleGlobeClickInternal}
        createSatelliteObject={createSatelliteObject}
        createAirplaneObject={createAirplaneObject}
        customThreeObjectUpdate={handleCustomThreeObjectUpdate}
      />

      {currentView === 'explorer' && selectedCity && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(0, 0, 0, 0.85)',
          color: 'white',
          padding: '20px',
          borderRadius: '10px',
          maxWidth: '380px',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(10px)',
        }}>
          <button
            onClick={() => setSelectedCity(null)}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '5px'
            }}
          >
            ×
          </button>
          <h2 style={{
            margin: '0 0 5px 0',
            color: selectedCity.color,
            fontSize: '24px'
          }}>
            {selectedCity.name}
          </h2>
          <p style={{ margin: '0 0 15px 0', fontSize: '14px', opacity: 0.7 }}>
            {selectedCity.country}
          </p>

          <div style={{ fontSize: '13px', marginBottom: '15px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <span style={{ opacity: 0.7 }}>Population</span><br/>
                <b>{selectedCity.population}</b>
              </div>
              <div>
                <span style={{ opacity: 0.7 }}>Area</span><br/>
                <b>{selectedCity.area}</b>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <span style={{ opacity: 0.7 }}>Founded</span><br/>
                <b>{selectedCity.founded}</b>
              </div>
              <div>
                <span style={{ opacity: 0.7 }}>Timezone</span><br/>
                <b>{selectedCity.timezone}</b>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '12px', opacity: 0.7 }}>Famous For</p>
            <p style={{ margin: '0', fontSize: '13px', lineHeight: '1.4' }}>
              {selectedCity.famousFor}
            </p>
          </div>

          <div>
            <p style={{ margin: '0 0 5px 0', fontSize: '12px', opacity: 0.7 }}>Fun Fact</p>
            <p style={{ margin: '0', fontSize: '13px', lineHeight: '1.5' }}>
              {selectedCity.trivia}
            </p>
          </div>

          {/* Learn More Expandable Section */}
          <div style={{ marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '15px' }}>
            <button
              onClick={() => setShowLearnMore(!showLearnMore)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.7)',
                padding: '8px 0',
                cursor: 'pointer',
                fontSize: '13px',
                textDecoration: 'underline',
                transition: 'color 0.2s',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'rgba(255, 255, 255, 1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
              }}
            >
              {showLearnMore ? '− Hide Details' : '+ Learn More'}
            </button>

            {showLearnMore && (
              <div style={{ marginTop: '15px', fontSize: '13px', animation: 'fadeIn 0.3s' }}>
                {selectedCity.nickname && (
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ opacity: 0.7 }}>Nickname</span><br/>
                    <b>{selectedCity.nickname}</b>
                  </div>
                )}

                {selectedCity.elevation !== undefined && (
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ opacity: 0.7 }}>Elevation</span><br/>
                    <b>{selectedCity.elevation}m above sea level</b>
                  </div>
                )}

                {selectedCity.climateType && (
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ opacity: 0.7 }}>Climate</span><br/>
                    <b>{selectedCity.climateType}</b>
                  </div>
                )}

                {selectedCity.demonym && (
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ opacity: 0.7 }}>Residents Called</span><br/>
                    <b>{selectedCity.demonym}</b>
                  </div>
                )}

                {selectedCity.primaryLanguages && selectedCity.primaryLanguages.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ opacity: 0.7 }}>Languages</span><br/>
                    <b>{selectedCity.primaryLanguages.join(', ')}</b>
                  </div>
                )}

                {selectedCity.currency && (
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ opacity: 0.7 }}>Currency</span><br/>
                    <b>{selectedCity.currency}</b>
                  </div>
                )}

                {selectedCity.airportCodes && selectedCity.airportCodes.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ opacity: 0.7 }}>Airport Codes</span><br/>
                    <b>{selectedCity.airportCodes.join(', ')}</b>
                  </div>
                )}

                {selectedCity.mainIndustries && selectedCity.mainIndustries.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ opacity: 0.7 }}>Main Industries</span><br/>
                    <b>{selectedCity.mainIndustries.join(', ')}</b>
                  </div>
                )}

                {selectedCity.bestTimeToVisit && (
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ opacity: 0.7 }}>Best Time to Visit</span><br/>
                    <b>{selectedCity.bestTimeToVisit}</b>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <Suspense fallback={null}>
      {/* Weather View UI */}
      {currentView === 'weather' && (
        <>
          <TimeSlider
            minYear={weatherData.yearRange.minYear}
            maxYear={weatherData.yearRange.maxYear}
            currentYear={weatherData.selectedYear}
            currentMonth={weatherData.selectedMonth}
            isPlaying={weatherData.isPlaying}
            onYearChange={weatherData.setSelectedYear}
            onMonthChange={weatherData.setSelectedMonth}
            onPlayPause={weatherData.togglePlayback}
            onSpeedChange={weatherData.setPlaybackSpeed}
            playbackSpeed={weatherData.playbackSpeed}
          />
          <WeatherLegend />
          {selectedWeatherLocation && (
            <WeatherPanel
              location={selectedWeatherLocation}
              onClose={() => setSelectedWeatherLocation(null)}
            />
          )}
        </>
      )}

      {/* Population View UI */}
      {currentView === 'population' && (
        <>
          <PopulationTimeSlider
            minYear={populationData.yearRange.minYear}
            maxYear={populationData.yearRange.maxYear}
            currentYear={populationData.selectedYear}
            isPlaying={populationData.isPlaying}
            onYearChange={populationData.setSelectedYear}
            onPlayPause={populationData.togglePlayback}
            playbackSpeed={populationData.playbackSpeed}
            onSpeedChange={populationData.setPlaybackSpeed}
          />
          <PopulationLegend />
          {selectedCountry && (
            <PopulationPanel
              country={selectedCountry}
              currentYear={populationData.selectedYear}
              onClose={() => setSelectedCountry(null)}
              getCountryDetails={populationData.getCountryDetails}
            />
          )}
        </>
      )}

      {/* Earthquake View UI */}
      {currentView === 'earthquakes' && (
        <>
          <EarthquakeControls
            timeRange={earthquakeData.timeRange}
            onTimeRangeChange={earthquakeData.setTimeRange}
            minMagnitude={earthquakeData.minMagnitude}
            onMinMagnitudeChange={earthquakeData.setMinMagnitude}
            loading={earthquakeData.loading}
          />
          <EarthquakeLegend
            metadata={earthquakeData.metadata}
            lastUpdated={earthquakeData.lastUpdated}
            onRefresh={earthquakeData.refresh}
          />
          {earthquakeData.selectedEarthquake && (
            <EarthquakePanel
              earthquake={earthquakeData.selectedEarthquake}
              details={earthquakeData.earthquakeDetails}
              loading={earthquakeData.detailsLoading}
              onClose={() => earthquakeData.setSelectedEarthquake(null)}
            />
          )}
        </>
      )}

      {/* Satellites View UI */}
      {currentView === 'satellites' && (
        <>
          <SatelliteControls
            isAnimating={satelliteData.isAnimating}
            onToggleAnimation={satelliteData.toggleAnimation}
            timeMultiplier={satelliteData.timeMultiplier}
            onTimeMultiplierChange={satelliteData.setTimeMultiplier}
            satelliteCount={satelliteData.positions.length}
            loading={satelliteData.loading}
          />
          <SatelliteLegend
            metadata={satelliteData.metadata}
            selectedCategories={satelliteData.selectedCategories}
            onToggleCategory={handleToggleSatelliteCategory}
            currentTime={satelliteData.currentTime}
          />
          {satelliteData.selectedSatellite && (
            <SatellitePanel
              satellite={satelliteData.selectedSatellite}
              position={satelliteData.positions.find(p => p.id === satelliteData.selectedSatellite?.id) || null}
              onClose={() => satelliteData.setSelectedSatellite(null)}
              showOrbit={satelliteData.showOrbit}
              onToggleOrbit={satelliteData.setShowOrbit}
              orbitPointCount={satelliteData.selectedSatelliteOrbit?.length}
            />
          )}
        </>
      )}

      {/* Pollution View UI */}
      {currentView === 'pollution' && (
        <>
          <PollutionControls
            metadata={pollutionData.metadata}
            loading={pollutionData.loading}
            lastUpdated={pollutionData.lastUpdated}
            onRefresh={pollutionData.refresh}
            fetchProgress={pollutionData.fetchProgress}
            selectedPollutant={pollutionData.selectedPollutant}
            onPollutantChange={pollutionData.setSelectedPollutant}
          />
          <PollutionLegend selectedPollutant={pollutionData.selectedPollutant} />
          {pollutionData.selectedLocation && (
            <PollutionPanel
              location={pollutionData.selectedLocation}
              onClose={() => pollutionData.setSelectedLocation(null)}
            />
          )}
        </>
      )}

      {/* Flights View UI */}
      {currentView === 'flights' && (
        <>
          <FlightControls
            metadata={flightData.metadata}
            loading={flightData.loading}
            onRefresh={flightData.refresh}
            isAutoRefreshing={flightData.isAutoRefreshing}
            onToggleAutoRefresh={flightData.setAutoRefresh}
            searchQuery={flightData.searchQuery}
            onSearchChange={flightData.setSearchQuery}
            searchResults={flightData.searchResults}
            onSelectFlight={flightData.setSelectedFlight}
            filteredCount={flightData.filteredFlights.length}
          />
          <FlightLegend
            selectedCategories={flightData.selectedCategories}
            onToggleCategory={handleToggleFlightCategory}
            categoryCounts={flightData.categoryCounts}
          />
          {flightData.selectedFlight && (
            <FlightPanel
              flight={flightData.selectedFlight}
              onClose={() => flightData.setSelectedFlight(null)}
              showTrail={flightData.showTrail}
              onToggleTrail={flightData.setShowTrail}
              track={flightData.selectedFlightTrack}
              trackLoading={flightData.trackLoading}
            />
          )}
        </>
      )}

      {/* Aurora View UI */}
      {currentView === 'aurora' && (
        <>
          <AuroraControls
            metadata={auroraData.metadata}
            loading={auroraData.loading}
            lastUpdated={auroraData.lastUpdated}
            onRefresh={auroraData.refresh}
          />
          <AuroraLegend metadata={auroraData.metadata} />
          {auroraData.spaceWeather && auroraData.metadata && (
            <AuroraPanel
              spaceWeather={auroraData.spaceWeather}
              metadata={auroraData.metadata}
              onClose={() => {}} // Aurora panel stays open as info panel
            />
          )}
        </>
      )}
      </Suspense>

      {(weatherData.loading || populationData.loading) && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.85)',
          color: 'white',
          padding: '20px 40px',
          borderRadius: '12px',
          fontSize: '16px',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid rgba(255,255,255,0.3)',
            borderTop: '2px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <span>Loading data...</span>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        fontSize: '14px',
        maxWidth: '300px'
      }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
          {VIEWS.find(v => v.id === currentView)?.icon} {VIEWS.find(v => v.id === currentView)?.name} View
        </h3>
        <p style={{ margin: '5px 0', fontSize: '13px' }}>
          {currentView === 'explorer' && hoverCity
            ? `Hovering: ${hoverCity.name}`
            : currentView === 'weather'
            ? `${weatherData.loading ? 'Loading...' : `${weatherData.heatmapData.length} points @ ${weatherData.currentResolution}° grid`}`
            : currentView === 'population'
            ? `${populationData.loading ? 'Loading...' : `${populationData.populationData.length} countries`}`
            : currentView === 'earthquakes'
            ? `${earthquakeData.loading ? 'Loading...' : `${earthquakeData.earthquakes.length} earthquakes`}`
            : currentView === 'satellites'
            ? `${satelliteData.loading ? 'Loading TLE data...' : `${satelliteData.positions.length} satellites tracked`}`
            : currentView === 'pollution'
            ? `${pollutionData.loading ? 'Loading air quality...' : `${pollutionData.pollutionData.length} monitoring points`}`
            : currentView === 'flights'
            ? `${flightData.loading ? 'Loading flights...' : `${flightData.filteredFlights.length.toLocaleString()} of ${flightData.flights.length.toLocaleString()} aircraft`}`
            : VIEWS.find(v => v.id === currentView)?.description}
        </p>
        <p style={{ margin: '5px 0', fontSize: '12px', opacity: 0.7 }}>
          {currentView === 'weather'
            ? `Zoom: ${weatherData.currentZoom} • Scroll to load more detail`
            : currentView === 'population'
            ? 'Click a bubble to see country details'
            : currentView === 'earthquakes'
            ? 'Click a marker for details • Auto-refreshes every 5 min'
            : currentView === 'satellites'
            ? 'Real-time orbital positions • Click for details'
            : currentView === 'pollution'
            ? 'Click globe for location details • Updates hourly'
            : currentView === 'flights'
            ? 'Live aircraft positions • Auto-refreshes every 15s'
            : 'Drag to rotate • Scroll to zoom'}
        </p>
      </div>
    </div>
  );
};

export default GlobeComponent;
