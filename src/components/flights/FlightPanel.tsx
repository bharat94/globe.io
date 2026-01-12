import React from 'react';
import type { Flight, FlightTrack } from '../../types/flights';
import { formatCallsign, getAltitudeBand, metersToFeet, msToKnots } from '../../types/flights';

interface FlightPanelProps {
  flight: Flight;
  onClose: () => void;
  showTrail?: boolean;
  onToggleTrail?: (show: boolean) => void;
  track?: FlightTrack | null;
  trackLoading?: boolean;
}

const FlightPanel: React.FC<FlightPanelProps> = ({
  flight,
  onClose,
  showTrail = true,
  onToggleTrail,
  track,
  trackLoading = false
}) => {
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

      {/* Route Display */}
      {track?.route && (track.route.origin || track.route.destination) && (
        <div style={{
          background: `linear-gradient(135deg, ${flight.color}22, ${flight.color}11)`,
          border: `1px solid ${flight.color}44`,
          borderRadius: '10px',
          padding: '12px 14px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: flight.color }}>
              {track.route.origin?.code || '???'}
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>
              {track.route.origin?.city || 'Unknown'}
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'rgba(255,255,255,0.4)'
          }}>
            <div style={{ width: '24px', height: '1px', background: 'rgba(255,255,255,0.3)' }} />
            <span style={{ fontSize: '16px' }}>✈</span>
            <div style={{ width: '24px', height: '1px', background: 'rgba(255,255,255,0.3)' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: flight.color }}>
              {track.route.destination?.code || '???'}
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>
              {track.route.destination?.city || 'Unknown'}
            </div>
          </div>
        </div>
      )}

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

      <div style={infoRowStyle}>
        <span style={labelStyle}>Position</span>
        <span style={valueStyle}>
          {flight.lat.toFixed(4)}°, {flight.lng.toFixed(4)}°
        </span>
      </div>

      {/* Flight Trail Toggle */}
      {onToggleTrail && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: track?.path?.length ? '8px' : 0
          }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'white' }}>
                Flight Trail
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                {trackLoading ? 'Loading...' : track?.path?.length ? `${track.path.length} waypoints` : 'No trail data'}
              </div>
            </div>
            <button
              onClick={() => onToggleTrail(!showTrail)}
              style={{
                background: showTrail ? flight.color : 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '12px',
                width: '44px',
                height: '24px',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s'
              }}
            >
              <div style={{
                position: 'absolute',
                top: '2px',
                left: showTrail ? '22px' : '2px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'white',
                transition: 'left 0.2s'
              }} />
            </button>
          </div>
          {track?.path?.length && showTrail ? (
            <div style={{
              display: 'flex',
              gap: '8px',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.6)'
            }}>
              <span>From: {new Date((track.startTime || 0) * 1000).toLocaleTimeString()}</span>
              <span>•</span>
              <span>To: {new Date((track.endTime || 0) * 1000).toLocaleTimeString()}</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default FlightPanel;
