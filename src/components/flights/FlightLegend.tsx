import React from 'react';
import { ALTITUDE_COLORS } from '../../types/flights';

const FlightLegend: React.FC = () => {
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '100px',
    right: '20px',
    background: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(10px)',
    padding: '16px 20px',
    borderRadius: '12px',
    color: 'white',
    zIndex: 1000,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    minWidth: '180px'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const scaleLabels = ALTITUDE_COLORS.map((item, index) => ({
    color: item.color,
    label: item.label
  }));

  return (
    <div style={containerStyle}>
      <div style={titleStyle}>
        <span style={{ fontSize: '16px' }}>✈️</span>
        <span>Altitude</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {scaleLabels.map((item, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '4px 6px',
              borderRadius: '4px',
              background: 'rgba(255, 255, 255, 0.03)'
            }}
          >
            <div
              style={{
                width: '20px',
                height: '12px',
                borderRadius: '2px',
                background: item.color,
                flexShrink: 0
              }}
            />
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: '14px',
        paddingTop: '12px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        fontSize: '10px',
        color: 'rgba(255,255,255,0.4)'
      }}>
        Data: OpenSky Network
      </div>
    </div>
  );
};

export default FlightLegend;
