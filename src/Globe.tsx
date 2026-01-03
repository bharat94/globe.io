import { useRef, useState, useEffect, useCallback } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import type { City } from './citiesData';
import type { ViewType } from './types/views';
import type { WeatherDataPoint } from './types/weather';
import type { PopulationDataPoint } from './types/population';
import { VIEWS } from './types/views';
import ViewSelector from './components/ViewSelector';
import TimeSlider from './components/weather/TimeSlider';
import WeatherPanel from './components/weather/WeatherPanel';
import WeatherLegend from './components/weather/WeatherLegend';
import PopulationTimeSlider from './components/population/PopulationTimeSlider';
import PopulationPanel from './components/population/PopulationPanel';
import PopulationLegend from './components/population/PopulationLegend';
import { useWeatherData } from './hooks/useWeatherData';
import { usePopulationData } from './hooks/usePopulationData';
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
        // Show city markers in explorer/weather views, population bubbles in population view
        pointsData={
          currentView === 'population'
            ? populationData.populationData
            : (currentView === 'explorer' || currentView === 'weather' ? cities : [])
        }
        pointLat="lat"
        pointLng="lng"
        pointAltitude={currentView === 'population' ? 0.01 : (currentView === 'weather' ? 0.05 : 0.02)}
        pointColor={(d: any) => currentView === 'population' ? '#4FC3F7' : (d.color || '#ffffff')}
        pointRadius={(d: any) => currentView === 'population' ? 0.4 + (d.weight * 2.5) : 0.8}
        pointLabel={(d: any) => currentView === 'population' ? `
          <div style="background: rgba(0,0,0,0.9); padding: 12px; border-radius: 8px; color: white; max-width: 250px;">
            <div style="font-size: 24px; margin-bottom: 8px;">${getCountryFlag(d.countryCode)}</div>
            <b style="font-size: 16px; color: #4FC3F7;">${d.name}</b><br/>
            <div style="margin-top: 8px; font-size: 14px;">
              <b>Population:</b> ${d.populationFormatted}<br/>
              <span style="opacity: 0.7; font-size: 12px;">${d.population?.toLocaleString() || 0} people</span>
            </div>
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
        `}
        onPointClick={(point: any) => {
          if (currentView === 'explorer') {
            handleCityClick(point as City);
          } else if (currentView === 'population') {
            handlePopulationClick(point as PopulationDataPoint);
          }
        }}
        onPointHover={(point: any) => {
          if (currentView === 'explorer' || currentView === 'population') {
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
        // Smooth transitions for points (population bubbles)
        pointsTransitionDuration={800}
        // Weather heatmap layer (only in weather view)
        heatmapsData={currentView === 'weather' ? [weatherData.heatmapData] : []}
        heatmapPointLat="lat"
        heatmapPointLng="lng"
        heatmapPointWeight="weight"
        heatmapBandwidth={7}
        heatmapColorSaturation={0.8}
        heatmapBaseAltitude={0.005}
        heatmapTopAltitude={0.02}
        heatmapsTransitionDuration={1200}
        onZoom={handleZoom}
        onGlobeClick={(coords: { lat: number; lng: number }) => {
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
            : VIEWS.find(v => v.id === currentView)?.description}
        </p>
        <p style={{ margin: '5px 0', fontSize: '12px', opacity: 0.7 }}>
          {currentView === 'weather'
            ? `Zoom: ${weatherData.currentZoom} • Scroll to load more detail`
            : currentView === 'population'
            ? 'Click a bubble to see country details'
            : 'Drag to rotate • Scroll to zoom'}
        </p>
      </div>
    </div>
  );
};

export default GlobeComponent;
