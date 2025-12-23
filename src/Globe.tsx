import { useRef, useState } from 'react';
import Globe from 'react-globe.gl';
import { cities, type City } from './citiesData';

const GlobeComponent = () => {
  const globeEl = useRef<any>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [hoverCity, setHoverCity] = useState<City | null>(null);

  const handleCityClick = (city: City) => {
    setSelectedCity(city);

    if (globeEl.current) {
      globeEl.current.pointOfView(
        { lat: city.lat, lng: city.lng, altitude: 2 },
        1000
      );
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        pointsData={cities}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude={0.02}
        pointRadius={0.6}
        pointLabel={(d: any) => `
          <div style="background: rgba(0,0,0,0.8); padding: 10px; border-radius: 5px; color: white;">
            <b>${d.name}</b><br/>
            Population: ${d.population}
          </div>
        `}
        onPointClick={(point: any) => handleCityClick(point as City)}
        onPointHover={(point: any) => setHoverCity(point as City | null)}
        atmosphereColor="#3a228a"
        atmosphereAltitude={0.15}
      />

      {selectedCity && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(0, 0, 0, 0.85)',
          color: 'white',
          padding: '20px',
          borderRadius: '10px',
          maxWidth: '350px',
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
            margin: '0 0 10px 0',
            color: selectedCity.color,
            fontSize: '24px'
          }}>
            {selectedCity.name}
          </h2>
          <p style={{ margin: '5px 0', fontSize: '14px', opacity: 0.8 }}>
            <b>Population:</b> {selectedCity.population}
          </p>
          <p style={{ margin: '10px 0 0 0', lineHeight: '1.5', fontSize: '14px' }}>
            {selectedCity.trivia}
          </p>
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
          🌍 Interactive City Globe
        </h3>
        <p style={{ margin: '5px 0', fontSize: '13px' }}>
          {hoverCity
            ? `Hovering: ${hoverCity.name}`
            : 'Click on any city marker to learn more!'}
        </p>
        <p style={{ margin: '5px 0', fontSize: '12px', opacity: 0.7 }}>
          Drag to rotate • Scroll to zoom
        </p>
      </div>
    </div>
  );
};

export default GlobeComponent;
