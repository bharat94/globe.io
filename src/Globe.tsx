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
          <div style="background: rgba(0,0,0,0.9); padding: 12px; border-radius: 8px; color: white; max-width: 250px;">
            <b style="font-size: 16px; color: ${d.color};">${d.name}</b><br/>
            <span style="font-size: 13px; opacity: 0.8;">${d.country}</span><br/>
            <div style="margin-top: 8px; font-size: 12px;">
              <b>Population:</b> ${d.population}<br/>
              <b>Area:</b> ${d.area}
            </div>
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
