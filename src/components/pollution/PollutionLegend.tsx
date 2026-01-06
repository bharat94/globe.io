import React from 'react';
import { AQI_CATEGORIES, POLLUTANT_CONFIG, type AQICategory, type PollutantType } from '../../types/pollution';

interface PollutionLegendProps {
  selectedPollutant: PollutantType;
}

const PollutionLegend: React.FC<PollutionLegendProps> = ({ selectedPollutant }) => {
  const config = POLLUTANT_CONFIG[selectedPollutant];
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

  // Build scale labels from thresholds
  const scaleLabels = config.thresholds.map((threshold, index) => {
    const prevThreshold = index === 0 ? 0 : config.thresholds[index - 1];
    return {
      color: config.colors[index],
      range: `${prevThreshold}-${threshold}`,
      label: index === 0 ? 'Good' : index === 1 ? 'Moderate' : index === 2 ? 'Unhealthy (Sensitive)' : index === 3 ? 'Unhealthy' : 'Very Unhealthy'
    };
  });
  // Add hazardous
  scaleLabels.push({
    color: config.colors[config.colors.length - 1],
    range: `>${config.thresholds[config.thresholds.length - 1]}`,
    label: 'Hazardous'
  });

  return (
    <div style={containerStyle}>
      <div style={titleStyle}>
        <span style={{ fontSize: '16px' }}>🏭</span>
        <span>{config.name}</span>
      </div>

      {/* Description */}
      <div style={{
        fontSize: '11px',
        color: 'rgba(255,255,255,0.6)',
        marginBottom: '12px',
        lineHeight: '1.4'
      }}>
        {config.description}
        {config.unit && <span style={{ color: 'rgba(255,255,255,0.4)' }}> ({config.unit})</span>}
      </div>

      {/* Color Scale */}
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
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>
              {item.range}
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginLeft: 'auto' }}>
              {item.label}
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
