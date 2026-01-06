import React from 'react';
import type { Satellite, SatellitePosition } from '../../types/satellite';
import { SATELLITE_CATEGORIES, EARTH_RADIUS_KM } from '../../types/satellite';

interface SatellitePanelProps {
  satellite: Satellite;
  position: SatellitePosition | null;
  onClose: () => void;
}

const SatellitePanel: React.FC<SatellitePanelProps> = ({
  satellite,
  position,
  onClose
}) => {
  const categoryConfig = SATELLITE_CATEGORIES[satellite.category];

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
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '6px'
  };

  const statBoxStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    padding: '14px',
    borderRadius: '10px',
    textAlign: 'center' as const
  };

  const altitudeKm = position ? position.alt * EARTH_RADIUS_KM : 0;

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
        &#10005;
      </button>

      {/* Satellite Icon */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${categoryConfig.color}44 0%, transparent 70%)`,
            border: `3px solid ${categoryConfig.color}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            animation: 'pulse 2s infinite'
          }}
        >
          <span style={{ fontSize: '36px' }}>{categoryConfig.icon}</span>
        </div>
        <div style={{
          fontSize: '12px',
          fontWeight: '600',
          color: categoryConfig.color,
          textTransform: 'uppercase',
          letterSpacing: '2px'
        }}>
          {categoryConfig.name}
        </div>
      </div>

      {/* Name */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '18px', fontWeight: '500', lineHeight: 1.4 }}>
          {satellite.name}
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
          NORAD ID: {satellite.id}
        </div>
      </div>

      {/* Real-time Stats */}
      {position && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={statBoxStyle}>
            <div style={labelStyle}>Altitude</div>
            <div style={{ fontSize: '20px', fontWeight: '600', color: categoryConfig.color }}>
              {altitudeKm.toFixed(0)}
              <span style={{ fontSize: '12px', fontWeight: 'normal', marginLeft: '4px' }}>km</span>
            </div>
          </div>

          <div style={statBoxStyle}>
            <div style={labelStyle}>Velocity</div>
            <div style={{ fontSize: '20px', fontWeight: '600', color: '#4FC3F7' }}>
              {position.velocity.toFixed(1)}
              <span style={{ fontSize: '12px', fontWeight: 'normal', marginLeft: '4px' }}>km/s</span>
            </div>
          </div>

          <div style={statBoxStyle}>
            <div style={labelStyle}>Latitude</div>
            <div style={{ fontSize: '16px', fontWeight: '500' }}>
              {position.lat.toFixed(2)}°
            </div>
          </div>

          <div style={statBoxStyle}>
            <div style={labelStyle}>Longitude</div>
            <div style={{ fontSize: '16px', fontWeight: '500' }}>
              {position.lng.toFixed(2)}°
            </div>
          </div>
        </div>
      )}

      {/* Category Description */}
      <div style={{
        marginTop: '20px',
        paddingTop: '20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        fontSize: '13px',
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center'
      }}>
        {categoryConfig.description}
      </div>

      {/* ISS Special Info */}
      {satellite.category === 'iss' && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: 'rgba(255, 215, 0, 0.15)',
          border: '1px solid rgba(255, 215, 0, 0.3)',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#FFD700'
        }}>
          The ISS orbits Earth approximately every 90 minutes at about 28,000 km/h
        </div>
      )}

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 ${categoryConfig.color}44; }
          50% { box-shadow: 0 0 20px 10px ${categoryConfig.color}22; }
        }
      `}</style>
    </div>
  );
};

export default SatellitePanel;
