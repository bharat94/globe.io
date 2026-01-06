import React from 'react';
import type { PollutionLocationData } from '../../types/pollution';
import { AQI_CATEGORIES } from '../../types/pollution';

interface PollutionPanelProps {
  location: PollutionLocationData;
  onClose: () => void;
}

const PollutionPanel: React.FC<PollutionPanelProps> = ({ location, onClose }) => {
  const categoryConfig = AQI_CATEGORIES[location.category];

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'rgba(0, 0, 0, 0.92)',
    backdropFilter: 'blur(12px)',
    padding: '24px',
    borderRadius: '16px',
    color: 'white',
    width: '320px',
    maxHeight: '85vh',
    overflowY: 'auto',
    zIndex: 1000,
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    border: `1px solid ${categoryConfig.color}33`
  };

  const closeButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'transparent',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px'
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '10px',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '4px'
  };

  const statBoxStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    padding: '12px',
    borderRadius: '8px',
    textAlign: 'center' as const
  };

  // Format pollutant value with unit
  const formatPollutant = (value: number | null, unit: string = 'μg/m³') => {
    if (value === null || value === undefined) return '—';
    return `${value.toFixed(1)} ${unit}`;
  };

  return (
    <div style={panelStyle}>
      <button
        style={closeButtonStyle}
        onClick={onClose}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'white';
          e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
          e.currentTarget.style.background = 'transparent';
        }}
      >
        ✕
      </button>

      {/* AQI Circle */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div
          style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${categoryConfig.color}44 0%, transparent 70%)`,
            border: `4px solid ${categoryConfig.color}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px'
          }}
        >
          <span style={{ fontSize: '32px', fontWeight: '700', color: categoryConfig.color }}>
            {location.aqi}
          </span>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>AQI</span>
        </div>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: categoryConfig.color,
          marginBottom: '4px'
        }}>
          {categoryConfig.name}
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', maxWidth: '250px', margin: '0 auto' }}>
          {categoryConfig.description}
        </div>
      </div>

      {/* Location */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
          {location.lat.toFixed(2)}°, {location.lng.toFixed(2)}°
        </div>
      </div>

      {/* Dominant Pollutant */}
      <div style={{
        background: `${categoryConfig.color}22`,
        border: `1px solid ${categoryConfig.color}44`,
        padding: '12px',
        borderRadius: '8px',
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        <div style={labelStyle}>Dominant Pollutant</div>
        <div style={{ fontSize: '16px', fontWeight: '600' }}>{location.dominantPollutant}</div>
      </div>

      {/* Pollutant Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px',
        marginBottom: '16px'
      }}>
        <div style={statBoxStyle}>
          <div style={labelStyle}>PM2.5</div>
          <div style={{ fontSize: '16px', fontWeight: '500' }}>
            {formatPollutant(location.pollutants.pm2_5)}
          </div>
        </div>
        <div style={statBoxStyle}>
          <div style={labelStyle}>PM10</div>
          <div style={{ fontSize: '16px', fontWeight: '500' }}>
            {formatPollutant(location.pollutants.pm10)}
          </div>
        </div>
        <div style={statBoxStyle}>
          <div style={labelStyle}>Ozone (O₃)</div>
          <div style={{ fontSize: '16px', fontWeight: '500' }}>
            {formatPollutant(location.pollutants.ozone)}
          </div>
        </div>
        <div style={statBoxStyle}>
          <div style={labelStyle}>NO₂</div>
          <div style={{ fontSize: '16px', fontWeight: '500' }}>
            {formatPollutant(location.pollutants.nitrogen_dioxide)}
          </div>
        </div>
        <div style={statBoxStyle}>
          <div style={labelStyle}>SO₂</div>
          <div style={{ fontSize: '16px', fontWeight: '500' }}>
            {formatPollutant(location.pollutants.sulphur_dioxide)}
          </div>
        </div>
        <div style={statBoxStyle}>
          <div style={labelStyle}>CO</div>
          <div style={{ fontSize: '16px', fontWeight: '500' }}>
            {formatPollutant(location.pollutants.carbon_monoxide)}
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px'
      }}>
        <div style={statBoxStyle}>
          <div style={labelStyle}>UV Index</div>
          <div style={{ fontSize: '16px', fontWeight: '500' }}>
            {location.pollutants.uv_index !== null ? location.pollutants.uv_index.toFixed(1) : '—'}
          </div>
        </div>
        <div style={statBoxStyle}>
          <div style={labelStyle}>Dust</div>
          <div style={{ fontSize: '16px', fontWeight: '500' }}>
            {formatPollutant(location.pollutants.dust)}
          </div>
        </div>
      </div>

      {/* Timestamp */}
      <div style={{
        marginTop: '16px',
        paddingTop: '12px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        fontSize: '11px',
        color: 'rgba(255,255,255,0.4)',
        textAlign: 'center'
      }}>
        Updated: {new Date(location.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
};

export default PollutionPanel;
