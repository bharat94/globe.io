import React from 'react';
import type { EarthquakeMetadata } from '../../types/earthquake';

interface EarthquakeLegendProps {
  metadata: EarthquakeMetadata | null;
  lastUpdated: Date | null;
  onRefresh: () => void;
}

const EarthquakeLegend: React.FC<EarthquakeLegendProps> = ({
  metadata,
  lastUpdated,
  onRefresh
}) => {
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '20px',
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

  const magnitudeScale = [
    { mag: '2.5+', size: 8, color: '#88cc00', label: 'Minor' },
    { mag: '4.0+', size: 12, color: '#ffdd00', label: 'Light' },
    { mag: '5.0+', size: 16, color: '#ffaa00', label: 'Moderate' },
    { mag: '6.0+', size: 22, color: '#ff6600', label: 'Strong' },
    { mag: '7.0+', size: 28, color: '#ff2222', label: 'Major' },
  ];

  const depthColors = [
    { depth: '0-30km', color: '#ff4444', label: 'Very Shallow' },
    { depth: '30-70km', color: '#ff8800', label: 'Shallow' },
    { depth: '70-150km', color: '#ffcc00', label: 'Intermediate' },
    { depth: '150-300km', color: '#44cc44', label: 'Deep' },
    { depth: '300+km', color: '#4488ff', label: 'Very Deep' },
  ];

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={titleStyle}>
        <span>Earthquake Legend</span>
        <button
          onClick={onRefresh}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: 'rgba(255,255,255,0.7)',
            padding: '4px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
          title="Refresh data"
        >
          ↻
        </button>
      </div>

      {/* Magnitude Scale */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Magnitude (Size)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {magnitudeScale.map(({ mag, size, color }) => (
            <div key={mag} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div
                style={{
                  width: size,
                  height: size,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${color}88 0%, ${color}44 70%)`,
                  border: `2px solid ${color}`,
                  flexShrink: 0
                }}
              />
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>{mag}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Depth Colors */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Depth (Color)
        </div>
        <div style={{ display: 'flex', gap: '2px', borderRadius: '4px', overflow: 'hidden' }}>
          {depthColors.map(({ color, label }) => (
            <div
              key={label}
              style={{
                flex: 1,
                height: '8px',
                background: color
              }}
              title={label}
            />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)' }}>Shallow</span>
          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)' }}>Deep</span>
        </div>
      </div>

      {/* Stats */}
      {metadata && (
        <div style={{
          paddingTop: '12px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '18px', fontWeight: '700', color: '#4FC3F7' }}>
              {metadata.count}
            </span>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginLeft: '6px' }}>
              earthquakes
            </span>
          </div>
          {lastUpdated && (
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
              Updated {formatTime(lastUpdated)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function formatTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default EarthquakeLegend;
