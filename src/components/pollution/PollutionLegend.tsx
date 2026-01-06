import React from 'react';
import { AQI_CATEGORIES, type AQICategory } from '../../types/pollution';

const PollutionLegend: React.FC = () => {
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
    minWidth: '220px'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const categories = Object.entries(AQI_CATEGORIES) as [AQICategory, typeof AQI_CATEGORIES[AQICategory]][];

  return (
    <div style={containerStyle}>
      <div style={titleStyle}>
        <span style={{ fontSize: '16px' }}>🏭</span>
        <span>Air Quality Index (AQI)</span>
      </div>

      {/* AQI Scale */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {categories.map(([key, config]) => (
          <div
            key={key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 8px',
              borderRadius: '4px',
              background: 'rgba(255, 255, 255, 0.03)'
            }}
          >
            <div
              style={{
                width: '24px',
                height: '14px',
                borderRadius: '3px',
                background: config.color,
                flexShrink: 0
              }}
            />
            <div style={{ flex: 1, fontSize: '11px' }}>
              <div style={{ fontWeight: '500', color: 'rgba(255,255,255,0.9)' }}>
                {config.name}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>
                {config.range[0]}-{config.range[1]}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Data source */}
      <div style={{
        marginTop: '14px',
        paddingTop: '12px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        fontSize: '10px',
        color: 'rgba(255,255,255,0.4)'
      }}>
        Data: Open-Meteo Air Quality API
      </div>
    </div>
  );
};

export default PollutionLegend;
