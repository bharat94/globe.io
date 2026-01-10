import React from 'react';
import type { Flight } from '../../types/flights';
import { formatCallsign, getAltitudeBand, metersToFeet, msToKnots } from '../../types/flights';

interface FlightPanelProps {
  flight: Flight;
  onClose: () => void;
}

const FlightPanel: React.FC<FlightPanelProps> = ({ flight, onClose }) => {
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'rgba(0, 0, 0, 0.9)',
    backdropFilter: 'blur(10px)',
    padding: '20px',
    borderRadius: '16px',
    color: 'white',
    zIndex: 1000,
    width: '320px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px'
  };

  const closeButtonStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '0',
    lineHeight: 1
  };

  const callsignStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 700,
    color: flight.color,
    marginBottom: '4px'
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.6)'
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '16px'
  };

  const statStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '12px',
    borderRadius: '8px'
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '4px'
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 600,
    color: 'white'
  };

  const infoRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    fontSize: '13px'
  };

  const labelStyle: React.CSSProperties = {
    color: 'rgba(255, 255, 255, 0.5)'
  };

  const valueStyle: React.CSSProperties = {
    color: 'white',
    fontWeight: 500
  };

  const verticalIndicator = flight.verticalRate > 50 ? '↑' : flight.verticalRate < -50 ? '↓' : '→';
  const verticalColor = flight.verticalRate > 50 ? '#4CAF50' : flight.verticalRate < -50 ? '#FF5722' : '#FFEB3B';

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <div style={callsignStyle}>
            {formatCallsign(flight.callsign)}
          </div>
          <div style={subtitleStyle}>
            {flight.originCountry} • {flight.icao24.toUpperCase()}
          </div>
        </div>
        <button style={closeButtonStyle} onClick={onClose}>×</button>
      </div>

      <div style={gridStyle}>
        <div style={statStyle}>
          <div style={statLabelStyle}>Altitude</div>
          <div style={statValueStyle}>
            {metersToFeet(flight.altitude).toLocaleString()} ft
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
            {getAltitudeBand(flight.altitude)}
          </div>
        </div>
        <div style={statStyle}>
          <div style={statLabelStyle}>Ground Speed</div>
          <div style={statValueStyle}>
            {msToKnots(flight.velocity)} kts
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
            {Math.round(flight.velocity * 3.6)} km/h
          </div>
        </div>
      </div>

      <div style={infoRowStyle}>
        <span style={labelStyle}>Heading</span>
        <span style={valueStyle}>{Math.round(flight.heading)}°</span>
      </div>

      <div style={infoRowStyle}>
        <span style={labelStyle}>Vertical Rate</span>
        <span style={{ ...valueStyle, color: verticalColor }}>
          {verticalIndicator} {Math.abs(Math.round(flight.verticalRate * 196.85))} fpm
        </span>
      </div>

      <div style={infoRowStyle}>
        <span style={labelStyle}>Status</span>
        <span style={valueStyle}>
          {flight.onGround ? (
            <span style={{ color: '#4CAF50' }}>On Ground</span>
          ) : (
            <span style={{ color: '#4FC3F7' }}>In Flight</span>
          )}
        </span>
      </div>

      <div style={{ ...infoRowStyle, borderBottom: 'none' }}>
        <span style={labelStyle}>Position</span>
        <span style={valueStyle}>
          {flight.lat.toFixed(4)}°, {flight.lng.toFixed(4)}°
        </span>
      </div>
    </div>
  );
};

export default FlightPanel;
