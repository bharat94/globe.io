import { useRef, useState, useEffect, useCallback } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import type { City } from './citiesData';
import type { ViewType } from './types/views';
import { VIEWS } from './types/views';
import ViewSelector from './components/ViewSelector';

const GlobeComponent = () => {
  const globeEl = useRef<any>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [hoverCity, setHoverCity] = useState<City | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLearnMore, setShowLearnMore] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('explorer');

  // Determine default theme based on local time (6am-6pm = day, 6pm-6am = night)
  const getDefaultTheme = () => {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18; // true = day mode, false = night mode
  };

  const [isDayMode, setIsDayMode] = useState(getDefaultTheme());

  // Fetch data based on current view
  useEffect(() => {
    const fetchViewData = async () => {
      setLoading(true);
      setError(null);
      setSelectedCity(null); // Clear selected city when switching views

      try {
        // View-specific data fetching
        switch (currentView) {
          case 'explorer':
            const response = await fetch('http://localhost:3001/api/cities');
            if (!response.ok) {
              throw new Error('Failed to fetch cities');
            }
            const data = await response.json();
            setCities(data);
            break;

          case 'weather':
            // TODO: Implement weather data fetching
            setCities([]);
            break;

          case 'flights':
            // TODO: Implement flights data fetching
            setCities([]);
            break;

          case 'pollution':
            // TODO: Implement pollution data fetching
            setCities([]);
            break;
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
        // Only show points in explorer view
        pointsData={currentView === 'explorer' ? cities : []}
        pointLat="lat"
        pointLng="lng"
        pointAltitude={0.02}
        pointColor={(d: any) => d.color || '#ffffff'}
        pointRadius={0.8}
        pointLabel={(d: any) => `
          <div style="background: rgba(0,0,0,0.9); padding: 12px; border-radius: 8px; color: white; max-width: 250px;">
            <b style="font-size: 16px; color: ${d.color};">${d.name}</b><br/>
            <span style="font-size: 13px; opacity: 0.8;">${d.country}</span><br/>
            <div style="margin-top: 8px; font-size: 12px;">
              <b>Population:</b> ${d.population}<br/>
              <b>Area:</b> ${d.area}
            </div>
          </div>
        `}
        onPointClick={(point: any) => currentView === 'explorer' && handleCityClick(point as City)}
        onPointHover={(point: any) => {
          if (currentView === 'explorer') {
            setHoverCity(point as City | null);
            // Change cursor to pointer when hovering over a city
            const canvas = document.querySelector('canvas');
            if (canvas) {
              canvas.style.cursor = point ? 'pointer' : 'grab';
            }
          }
        }}
        atmosphereColor={isDayMode ? "#4d9fff" : "#3a228a"}
        atmosphereAltitude={0.15}
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
            : VIEWS.find(v => v.id === currentView)?.description}
        </p>
        <p style={{ margin: '5px 0', fontSize: '12px', opacity: 0.7 }}>
          Drag to rotate • Scroll to zoom
        </p>
      </div>
    </div>
  );
};

export default GlobeComponent;
