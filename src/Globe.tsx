import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import type { City } from './citiesData';
import type { ViewType } from './types/views';
import type { WeatherDataPoint } from './types/weather';
import type { PopulationDataPoint } from './types/population';
import type { Earthquake } from './types/earthquake';
import type { SatellitePosition, SatelliteCategory } from './types/satellite';
import { SATELLITE_CATEGORIES, EARTH_RADIUS_KM } from './types/satellite';
import { VIEWS } from './types/views';
import ViewSelector from './components/ViewSelector';
import TimeSlider from './components/weather/TimeSlider';
import WeatherPanel from './components/weather/WeatherPanel';
import WeatherLegend from './components/weather/WeatherLegend';
import PopulationTimeSlider from './components/population/PopulationTimeSlider';
import PopulationPanel from './components/population/PopulationPanel';
import PopulationLegend from './components/population/PopulationLegend';
import { EarthquakePanel, EarthquakeLegend, EarthquakeControls } from './components/earthquake';
import { SatellitePanel, SatelliteLegend, SatelliteControls } from './components/satellite';
import { PollutionPanel, PollutionLegend, PollutionControls } from './components/pollution';
import { useWeatherData } from './hooks/useWeatherData';
import { usePopulationData } from './hooks/usePopulationData';
import { useEarthquakeData } from './hooks/useEarthquakeData';
import { useSatelliteData } from './hooks/useSatelliteData';
import { usePollutionData } from './hooks/usePollutionData';
import { getTemperatureColor } from './utils/weatherUtils';

// Convert country code to flag emoji
function getCountryFlag(countryCode: string): string {
  if (!countryCode) return '';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

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

  const setViewportRef = useRef(weatherData.setViewport);
  setViewportRef.current = weatherData.setViewport;

  // Determine default theme based on local time (6am-6pm = day, 6pm-6am = night)
  const getDefaultTheme = () => {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18; // true = day mode, false = night mode
  };

  const [isDayMode, setIsDayMode] = useState(getDefaultTheme());

  // Handle zoom/rotation changes for progressive loading
  const handleZoom = useCallback((pov: { lat: number; lng: number; altitude: number }) => {
    if (currentView !== 'weather') return;

    console.log('onZoom fired - lat:', pov.lat.toFixed(2), 'lng:', pov.lng.toFixed(2), 'alt:', pov.altitude.toFixed(2));

    setViewportRef.current({
      lat: pov.lat,
      lng: pov.lng,
      altitude: pov.altitude
    });
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

      try {
        // Always fetch cities for markers
        const response = await fetch('http://localhost:3001/api/cities');
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

        setLoading(false);
      } catch (err) {
        console.error(`Error fetching ${currentView} data:`, err);
        setError(`Failed to load ${currentView} data. Please make sure the server is running.`);
        setLoading(false);
      }
    };

    fetchViewData();
  }, [currentView]); // Re-fetch when view changes

  const handleCityClick = (city: City) => {
    setSelectedCity(city);
    setShowLearnMore(false); // Reset Learn More when selecting a new city

    if (globeEl.current) {
      globeEl.current.pointOfView(
        { lat: city.lat, lng: city.lng, altitude: 2 },
        1000
      );
    }
  };

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

  // Create glowing orb for each city marker
  const createGlowingOrb = useCallback((city: any) => {
    // Use the color directly from the city data
    const color = city.color || '#ffffff';

    // Main solid orb - using MeshBasicMaterial so color shows without needing lights
    const orbGeometry = new THREE.SphereGeometry(0.8, 32, 32);
    const orbMaterial = new THREE.MeshBasicMaterial({
      color: color  // Use the hex string directly
    });
    const orb = new THREE.Mesh(orbGeometry, orbMaterial);

    // Add point light inside the orb for glow effect on surroundings
    const light = new THREE.PointLight(color, 0.6, 5);
    orb.add(light);

    // Outer glow halo with city color for enhanced glow
    const glowGeometry = new THREE.SphereGeometry(1.0, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    orb.add(glow);

    return orb;
  }, []);

  // Create 3D satellite object
  const createSatelliteObject = useCallback((sat: SatellitePosition) => {
    const group = new THREE.Group();
    const categoryConfig = SATELLITE_CATEGORIES[sat.category];
    const color = categoryConfig?.color || '#ffffff';

    // Different sizes for different categories
    const isISS = sat.category === 'iss';
    const baseSize = isISS ? 1.5 : 0.4;

    // Main satellite body
    if (isISS) {
      // ISS - larger, distinctive shape
      const bodyGeometry = new THREE.BoxGeometry(baseSize * 2, baseSize * 0.5, baseSize * 0.5);
      const bodyMaterial = new THREE.MeshBasicMaterial({ color: '#ffffff' });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      group.add(body);

      // Solar panels
      const panelGeometry = new THREE.BoxGeometry(baseSize * 0.3, baseSize * 3, baseSize * 0.1);
      const panelMaterial = new THREE.MeshBasicMaterial({ color: '#4169E1' });
      const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
      leftPanel.position.set(-baseSize * 0.8, 0, 0);
      group.add(leftPanel);
      const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
      rightPanel.position.set(baseSize * 0.8, 0, 0);
      group.add(rightPanel);
    } else {
      // Regular satellite - small glowing sphere
      const satGeometry = new THREE.SphereGeometry(baseSize, 8, 8);
      const satMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.9
      });
      const satMesh = new THREE.Mesh(satGeometry, satMaterial);
      group.add(satMesh);
    }

    // Glow effect
    const glowSize = isISS ? baseSize * 4 : baseSize * 2.5;
    const glowGeometry = new THREE.SphereGeometry(glowSize, 16, 16);
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
  }, []);

  // Handle satellite click
  const handleSatelliteClick = useCallback((sat: SatellitePosition) => {
    const satellite = satelliteData.satellites.find(s => s.id === sat.id);
    if (satellite) {
      satelliteData.setSelectedSatellite(satellite);
    }
  }, [satelliteData]);

  // Toggle satellite category
  const handleToggleSatelliteCategory = useCallback((category: SatelliteCategory) => {
    satelliteData.setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  }, [satelliteData]);

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
        <span style={{ fontSize: '20px' }}>☀️</span>
        <button
          onClick={() => setIsDayMode(!isDayMode)}
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
        <span style={{ fontSize: '20px' }}>🌙</span>
      </div>

      <Globe
        ref={globeEl}
        globeImageUrl={isDayMode
          ? "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          : "//unpkg.com/three-globe/example/img/earth-night.jpg"
        }
        backgroundImageUrl={isDayMode
          ? "//unpkg.com/three-globe/example/img/night-sky.png"
          : "//unpkg.com/three-globe/example/img/night-sky.png"
        }
        // Show different point data based on view
        pointsData={
          currentView === 'population'
            ? populationData.populationData
            : currentView === 'earthquakes'
            ? earthquakeData.earthquakes
            : (currentView === 'explorer' || currentView === 'weather' ? cities : [])
        }
        pointLat="lat"
        pointLng="lng"
        pointAltitude={
          currentView === 'population' ? 0.01
          : currentView === 'earthquakes' ? 0.01
          : (currentView === 'weather' ? 0.05 : 0.02)
        }
        pointColor={(d: any) =>
          currentView === 'population' ? '#4FC3F7'
          : currentView === 'earthquakes' ? d.color
          : (d.color || '#ffffff')
        }
        pointRadius={(d: any) =>
          currentView === 'population' ? 0.4 + (d.weight * 2.5)
          : currentView === 'earthquakes' ? 0.15 + (d.weight * 0.8)
          : 0.8
        }
        pointLabel={(d: any) =>
          currentView === 'population' ? `
            <div style="background: rgba(0,0,0,0.9); padding: 12px; border-radius: 8px; color: white; max-width: 250px;">
              <div style="font-size: 24px; margin-bottom: 8px;">${getCountryFlag(d.countryCode)}</div>
              <b style="font-size: 16px; color: #4FC3F7;">${d.name}</b><br/>
              <div style="margin-top: 8px; font-size: 14px;">
                <b>Population:</b> ${d.populationFormatted}<br/>
                <span style="opacity: 0.7; font-size: 12px;">${d.population?.toLocaleString() || 0} people</span>
              </div>
            </div>
          ` : currentView === 'earthquakes' ? `
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
          ` : `
            <div style="background: rgba(0,0,0,0.9); padding: 12px; border-radius: 8px; color: white; max-width: 250px;">
              <b style="font-size: 16px; color: ${d.color};">${d.name}</b><br/>
              <span style="font-size: 13px; opacity: 0.8;">${d.country}</span><br/>
              <div style="margin-top: 8px; font-size: 12px;">
                <b>Population:</b> ${d.population}<br/>
                <b>Area:</b> ${d.area}
              </div>
            </div>
          `
        }
        onPointClick={(point: any) => {
          if (currentView === 'explorer') {
            handleCityClick(point as City);
          } else if (currentView === 'population') {
            handlePopulationClick(point as PopulationDataPoint);
          } else if (currentView === 'earthquakes') {
            handleEarthquakeClick(point as Earthquake);
          }
        }}
        onPointHover={(point: any) => {
          if (currentView === 'explorer' || currentView === 'population' || currentView === 'earthquakes') {
            if (currentView === 'explorer') {
              setHoverCity(point as City | null);
            }
            // Change cursor to pointer when hovering over a point
            const canvas = document.querySelector('canvas');
            if (canvas) {
              canvas.style.cursor = point ? 'pointer' : 'grab';
            }
          }
        }}
        atmosphereColor={isDayMode ? "#4d9fff" : "#3a228a"}
        atmosphereAltitude={0.15}
        // Transition duration for points (caching helps keep transitions smooth without pointsMerge)
        pointsTransitionDuration={500}
        // Weather heatmap layer (only in weather view)
        heatmapsData={
          currentView === 'weather' ? [weatherData.heatmapData]
          : currentView === 'pollution' ? [pollutionData.heatmapData]
          : []
        }
        heatmapPointLat="lat"
        heatmapPointLng="lng"
        heatmapPointWeight="weight"
        heatmapBandwidth={7}
        heatmapColorSaturation={0.8}
        heatmapBaseAltitude={0.005}
        heatmapTopAltitude={0.02}
        heatmapsTransitionDuration={1200}
        // Earthquake rings layer - seismic wave animation
        ringsData={currentView === 'earthquakes' ? earthquakeData.earthquakes : []}
        ringLat="lat"
        ringLng="lng"
        ringAltitude={0.005}
        ringColor={(d: any) => {
          // Create a gradient from the earthquake's color to transparent
          const baseColor = d.color || '#ff4444';
          return [`${baseColor}cc`, `${baseColor}00`];
        }}
        ringMaxRadius={(d: any) => {
          // Bigger magnitude = bigger ripple radius (in degrees)
          return 3 + (d.magnitude - 2.5) * 2;
        }}
        ringPropagationSpeed={(d: any) => {
          // Stronger earthquakes propagate faster
          return 2 + (d.magnitude - 2.5) * 0.8;
        }}
        ringRepeatPeriod={(d: any) => {
          // Recent earthquakes pulse faster, all pulse visibly
          return d.isRecent ? 600 : 1200;
        }}
        // Custom 3D layer for satellites
        customLayerData={currentView === 'satellites' ? satelliteData.positions : []}
        customThreeObject={currentView === 'satellites' ? createSatelliteObject : undefined}
        customThreeObjectUpdate={(obj: THREE.Object3D, sat: SatellitePosition) => {
          // Update position dynamically as satellites move
          if (globeEl.current && sat.lat !== undefined) {
            const coords = globeEl.current.getCoords(sat.lat, sat.lng, sat.alt);
            if (coords) {
              obj.position.set(coords.x, coords.y, coords.z);
            }
          }
        }}
        customLayerLabel={(sat: SatellitePosition) => `
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
        `}
        onCustomLayerClick={(sat: SatellitePosition) => {
          if (currentView === 'satellites') {
            handleSatelliteClick(sat);
          }
        }}
        onCustomLayerHover={(sat: SatellitePosition | null) => {
          const canvas = document.querySelector('canvas');
          if (canvas) {
            canvas.style.cursor = sat ? 'pointer' : 'grab';
          }
        }}
        onZoom={handleZoom}
        onGlobeClick={async (coords: { lat: number; lng: number }) => {
          if (currentView === 'weather') {
            // Find nearest heatmap point
            const nearest = weatherData.heatmapData.reduce((closest: any, point: any) => {
              const dist = Math.sqrt(
                Math.pow(point.lat - coords.lat, 2) + Math.pow(point.lng - coords.lng, 2)
              );
              if (!closest || dist < closest.dist) {
                return { point, dist };
              }
              return closest;
            }, null);
            if (nearest && nearest.dist < 15) {
              handleWeatherPointClick(nearest.point);
            }
          } else if (currentView === 'pollution') {
            // Fetch detailed pollution data for clicked location
            const locationData = await pollutionData.getLocationData(coords.lat, coords.lng);
            if (locationData) {
              pollutionData.setSelectedLocation(locationData);
              // Animate camera to location
              if (globeEl.current) {
                globeEl.current.pointOfView(
                  { lat: coords.lat, lng: coords.lng, altitude: 2 },
                  1000
                );
              }
            }
          }
        }}
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
            : 'Drag to rotate • Scroll to zoom'}
        </p>
      </div>
    </div>
  );
};

export default GlobeComponent;
