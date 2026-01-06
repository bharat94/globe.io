import React from 'react';

interface SatelliteControlsProps {
  isAnimating: boolean;
  onToggleAnimation: () => void;
  timeMultiplier: number;
  onTimeMultiplierChange: (multiplier: number) => void;
  satelliteCount: number;
  loading: boolean;
}

const SatelliteControls: React.FC<SatelliteControlsProps> = ({
  isAnimating,
  onToggleAnimation,
  timeMultiplier,
  onTimeMultiplierChange,
  satelliteCount,
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
    gap: '20px'
  };

  const speeds = [
    { value: 1, label: '1x' },
    { value: 10, label: '10x' },
    { value: 60, label: '60x' },
    { value: 600, label: '10m' },
    { value: 3600, label: '1h' },
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
    transition: 'all 0.2s'
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
          Loading satellites...
        </div>
      )}

      {/* Play/Pause */}
      <button
        onClick={onToggleAnimation}
        style={{
          background: isAnimating ? 'rgba(79, 195, 247, 0.3)' : 'rgba(255, 255, 255, 0.1)',
          border: '1px solid ' + (isAnimating ? '#4FC3F7' : 'rgba(255,255,255,0.2)'),
          color: isAnimating ? '#4FC3F7' : 'white',
          padding: '10px 16px',
          borderRadius: '20px',
          cursor: 'pointer',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.2s'
        }}
      >
        {isAnimating ? '⏸️' : '▶️'}
        {isAnimating ? 'Pause' : 'Play'}
      </button>

      {/* Divider */}
      <div style={{
        width: '1px',
        height: '24px',
        background: 'rgba(255, 255, 255, 0.2)'
      }} />

      {/* Time Multiplier */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={sectionLabelStyle}>Speed</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {speeds.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onTimeMultiplierChange(value)}
              style={buttonStyle(timeMultiplier === value)}
              onMouseEnter={(e) => {
                if (timeMultiplier !== value) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (timeMultiplier !== value) {
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

      {/* Satellite Count */}
      <div style={{
        fontSize: '13px',
        color: 'rgba(255, 255, 255, 0.7)'
      }}>
        <span style={{ color: '#4FC3F7', fontWeight: '600' }}>{satelliteCount}</span>
        <span style={{ marginLeft: '4px' }}>satellites</span>
      </div>
    </div>
  );
};

export default SatelliteControls;
