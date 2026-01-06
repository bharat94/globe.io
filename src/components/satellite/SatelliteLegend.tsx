import React from 'react';
import type { SatelliteMetadata, SatelliteCategory } from '../../types/satellite';
import { SATELLITE_CATEGORIES } from '../../types/satellite';

interface SatelliteLegendProps {
  metadata: SatelliteMetadata | null;
  selectedCategories: SatelliteCategory[];
  onToggleCategory: (category: SatelliteCategory) => void;
  currentTime: Date;
}

const SatelliteLegend: React.FC<SatelliteLegendProps> = ({
  metadata,
  selectedCategories,
  onToggleCategory,
  currentTime
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
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  };

  const categories = Object.entries(SATELLITE_CATEGORIES) as [SatelliteCategory, typeof SATELLITE_CATEGORIES[SatelliteCategory]][];

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={titleStyle}>
        <span>Satellite Categories</span>
      </div>

      {/* Categories */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {categories.map(([key, config]) => {
          const count = metadata?.categories[key] || 0;
          const isSelected = selectedCategories.includes(key);

          return (
            <div
              key={key}
              onClick={() => onToggleCategory(key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                background: isSelected ? 'rgba(255,255,255,0.1)' : 'transparent',
                opacity: isSelected ? 1 : 0.5,
                transition: 'all 0.2s'
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: config.color,
                  boxShadow: isSelected ? `0 0 8px ${config.color}` : 'none'
                }}
              />
              <span style={{ flex: 1, fontSize: '13px' }}>
                {config.icon} {config.name}
              </span>
              <span style={{
                fontSize: '11px',
                color: 'rgba(255,255,255,0.5)',
                background: 'rgba(255,255,255,0.1)',
                padding: '2px 6px',
                borderRadius: '4px'
              }}>
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Simulation Time */}
      <div style={{
        marginTop: '14px',
        paddingTop: '14px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        fontSize: '11px',
        color: 'rgba(255,255,255,0.5)'
      }}>
        <div style={{ marginBottom: '4px' }}>Simulation Time (UTC)</div>
        <div style={{ fontSize: '13px', color: '#4FC3F7', fontFamily: 'monospace' }}>
          {currentTime.toUTCString().slice(0, -4)}
        </div>
      </div>

      {/* Total Count */}
      {metadata && (
        <div style={{
          marginTop: '10px',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.6)'
        }}>
          {metadata.totalCount} satellites tracked
        </div>
      )}
    </div>
  );
};

export default SatelliteLegend;
