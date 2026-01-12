import React from 'react';
import type { FlightCategory } from '../../types/flights';
import { FLIGHT_CATEGORIES } from '../../types/flights';

interface FlightLegendProps {
  selectedCategories: FlightCategory[];
  onToggleCategory: (category: FlightCategory) => void;
  categoryCounts: Record<FlightCategory, number>;
}

const FlightLegend: React.FC<FlightLegendProps> = ({
  selectedCategories,
  onToggleCategory,
  categoryCounts
}) => {
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
    minWidth: '200px'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const categories = Object.entries(FLIGHT_CATEGORIES) as [FlightCategory, typeof FLIGHT_CATEGORIES[FlightCategory]][];
  const totalCount = Object.values(categoryCounts).reduce((a, b) => a + b, 0);

  return (
    <div style={containerStyle}>
      <div style={titleStyle}>
        <span style={{ fontSize: '16px' }}>✈️</span>
        <span>Flight Categories</span>
        <span style={{
          marginLeft: 'auto',
          fontSize: '10px',
          color: 'rgba(255,255,255,0.5)'
        }}>
          {totalCount.toLocaleString()} total
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {categories.map(([key, config]) => {
          const isSelected = selectedCategories.includes(key);
          const count = categoryCounts[key] || 0;

          return (
            <button
              key={key}
              onClick={() => onToggleCategory(key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 10px',
                borderRadius: '6px',
                background: isSelected
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(255, 255, 255, 0.02)',
                border: 'none',
                cursor: 'pointer',
                opacity: isSelected ? 1 : 0.4,
                transition: 'all 0.2s ease',
                width: '100%',
                textAlign: 'left'
              }}
            >
              <div
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: config.color,
                  flexShrink: 0,
                  boxShadow: isSelected ? `0 0 8px ${config.color}66` : 'none'
                }}
              />
              <span style={{
                fontSize: '12px',
                color: 'white',
                flex: 1
              }}>
                {config.icon} {config.name}
              </span>
              <span style={{
                fontSize: '11px',
                color: 'rgba(255,255,255,0.5)',
                background: 'rgba(255,255,255,0.1)',
                padding: '2px 8px',
                borderRadius: '10px',
                minWidth: '40px',
                textAlign: 'center'
              }}>
                {count.toLocaleString()}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{
        marginTop: '14px',
        paddingTop: '12px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        fontSize: '10px',
        color: 'rgba(255,255,255,0.4)',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>Data: OpenSky Network</span>
        <span>Click to toggle</span>
      </div>
    </div>
  );
};

export default FlightLegend;
