import React from 'react';
import type { TimeRange } from '../../types/earthquake';

interface EarthquakeControlsProps {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  minMagnitude: number;
  onMinMagnitudeChange: (mag: number) => void;
  loading: boolean;
}

const EarthquakeControls: React.FC<EarthquakeControlsProps> = ({
  timeRange,
  onTimeRangeChange,
  minMagnitude,
  onMinMagnitudeChange,
  loading
}) => {
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(10px)',
    padding: '14px 20px',
    borderRadius: '40px',
    color: 'white',
    zIndex: 1000,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '24px'
  };

  const timeRanges: { value: TimeRange; label: string; icon: string }[] = [
    { value: 'hour', label: '1 Hour', icon: '⏱️' },
    { value: 'day', label: '24 Hours', icon: '📅' },
    { value: 'week', label: '7 Days', icon: '📆' },
    { value: 'month', label: '30 Days', icon: '🗓️' },
  ];

  const magnitudes = [
    { value: 2.5, label: 'All (2.5+)' },
    { value: 4.5, label: 'Light (4.5+)' },
    { value: 5.5, label: 'Moderate (5.5+)' },
    { value: 6.5, label: 'Strong (6.5+)' },
  ];

  const buttonStyle = (isActive: boolean): React.CSSProperties => ({
    background: isActive ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
    border: isActive ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid transparent',
    color: isActive ? 'white' : 'rgba(255, 255, 255, 0.6)',
    padding: '8px 14px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: isActive ? '600' : '400',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  });

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: '10px',
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginRight: '8px'
  };

  return (
    <div style={containerStyle}>
      {/* Loading indicator */}
      {loading && (
        <div style={{
          position: 'absolute',
          top: '-8px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#4FC3F7',
          padding: '2px 10px',
          borderRadius: '10px',
          fontSize: '10px',
          fontWeight: '600'
        }}>
          Loading...
        </div>
      )}

      {/* Time Range */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={sectionLabelStyle}>Time</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {timeRanges.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onTimeRangeChange(value)}
              style={buttonStyle(timeRange === value)}
              onMouseEnter={(e) => {
                if (timeRange !== value) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (timeRange !== value) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{
        width: '1px',
        height: '24px',
        background: 'rgba(255, 255, 255, 0.2)'
      }} />

      {/* Magnitude Filter */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={sectionLabelStyle}>Min Mag</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {magnitudes.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onMinMagnitudeChange(value)}
              style={buttonStyle(minMagnitude === value)}
              onMouseEnter={(e) => {
                if (minMagnitude !== value) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (minMagnitude !== value) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EarthquakeControls;
