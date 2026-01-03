import React from 'react';

const PopulationLegend: React.FC = () => {
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '80px',
    right: '20px',
    background: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(8px)',
    padding: '12px 16px',
    borderRadius: '10px',
    color: 'white',
    zIndex: 1000,
    border: '1px solid rgba(255, 255, 255, 0.1)'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: '600',
    marginBottom: '10px',
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  const scaleStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
    marginBottom: '6px'
  };

  const bubbleStyle = (size: number): React.CSSProperties => ({
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    background: 'rgba(79, 195, 247, 0.6)',
    border: '2px solid rgba(79, 195, 247, 0.9)',
    boxShadow: '0 0 10px rgba(79, 195, 247, 0.4)'
  });

  const labelContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '10px',
    color: 'rgba(255, 255, 255, 0.5)'
  };

  return (
    <div style={containerStyle}>
      <div style={titleStyle}>Population Scale</div>
      <div style={scaleStyle}>
        <div style={bubbleStyle(8)} title="< 10M" />
        <div style={bubbleStyle(14)} title="10M - 100M" />
        <div style={bubbleStyle(22)} title="100M - 500M" />
        <div style={bubbleStyle(32)} title="> 500M" />
      </div>
      <div style={labelContainerStyle}>
        <span>&lt;10M</span>
        <span>100M</span>
        <span>&gt;500M</span>
      </div>
    </div>
  );
};

export default PopulationLegend;
