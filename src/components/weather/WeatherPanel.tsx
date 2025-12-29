import React from 'react';
import type { WeatherDataPoint } from '../../types/weather';
import { formatTemperature, getMonthName, getTemperatureColor } from '../../utils/weatherUtils';

interface WeatherPanelProps {
  location: WeatherDataPoint;
  onClose: () => void;
}

const WeatherPanel: React.FC<WeatherPanelProps> = ({ location, onClose }) => {
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'rgba(0, 0, 0, 0.85)',
    color: 'white',
    padding: '20px',
    borderRadius: '12px',
    maxWidth: '320px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    zIndex: 1000
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '15px'
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '20px',
    fontWeight: 'bold'
  };

  const subtitleStyle: React.CSSProperties = {
    margin: '4px 0 0 0',
    fontSize: '13px',
    opacity: 0.7
  };

  const closeButtonStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: 'white',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '0 5px',
    opacity: 0.7
  };

  const tempDisplayStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '15px',
    padding: '15px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '10px'
  };

  const mainTempStyle: React.CSSProperties = {
    fontSize: '42px',
    fontWeight: 'bold',
    color: getTemperatureColor(location.temperature.avg)
  };

  const tempRangeStyle: React.CSSProperties = {
    fontSize: '13px',
    opacity: 0.8
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '12px'
  };

  const statBoxStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '10px',
    borderRadius: '8px'
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: '11px',
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 'bold',
    marginTop: '4px'
  };

  const dateStyle: React.CSSProperties = {
    fontSize: '12px',
    opacity: 0.5,
    textAlign: 'center',
    marginTop: '10px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    paddingTop: '10px'
  };

  const climateTagStyle: React.CSSProperties = {
    display: 'inline-block',
    background: 'rgba(74, 144, 226, 0.3)',
    color: '#74b9ff',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    marginTop: '8px'
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <h3 style={titleStyle}>{location.cityName || 'Unknown Location'}</h3>
          <p style={subtitleStyle}>{location.country || `${location.lat.toFixed(2)}°, ${location.lng.toFixed(2)}°`}</p>
        </div>
        <button
          style={closeButtonStyle}
          onClick={onClose}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
        >
          ×
        </button>
      </div>

      <div style={tempDisplayStyle}>
        <span style={mainTempStyle}>
          {formatTemperature(location.temperature.avg)}
        </span>
        <div style={tempRangeStyle}>
          <div style={{ color: '#74add1' }}>
            ↓ {formatTemperature(location.temperature.min)}
          </div>
          <div style={{ color: '#f46d43' }}>
            ↑ {formatTemperature(location.temperature.max)}
          </div>
        </div>
      </div>

      <div style={gridStyle}>
        {location.precipitation && (
          <div style={statBoxStyle}>
            <div style={statLabelStyle}>Precipitation</div>
            <div style={statValueStyle}>{location.precipitation.total} mm</div>
          </div>
        )}
        {location.humidity !== undefined && (
          <div style={statBoxStyle}>
            <div style={statLabelStyle}>Humidity</div>
            <div style={statValueStyle}>{location.humidity}%</div>
          </div>
        )}
      </div>

      {location.climateZone && (
        <div style={{ textAlign: 'center' }}>
          <span style={climateTagStyle}>{location.climateZone}</span>
        </div>
      )}

      <div style={dateStyle}>
        Data for {getMonthName(location.month)} {location.year}
      </div>
    </div>
  );
};

export default WeatherPanel;
