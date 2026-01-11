import React from 'react';
import type { AuroraMetadata } from '../../types/aurora';
import { AURORA_COLORS } from '../../types/aurora';

interface AuroraLegendProps {
  metadata: AuroraMetadata | null;
}

const AuroraLegend: React.FC<AuroraLegendProps> = ({ metadata }) => {
  const legendStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '20px',
    right: '20px',
    background: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(10px)',
    padding: '16px',
    borderRadius: '12px',
    color: 'white',
    zIndex: 400,
    border: '1px solid rgba(100, 255, 100, 0.2)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
    minWidth: '160px'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    color: '#66ff66',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  const gradientColors = [
    AURORA_COLORS.low,
    AURORA_COLORS.medium,
    AURORA_COLORS.high,
    AURORA_COLORS.veryHigh,
    AURORA_COLORS.extreme
  ];

  return (
    <div style={legendStyle}>
      <div style={titleStyle}>Aurora Probability</div>

      {/* Gradient bar */}
      <div style={{
        height: '12px',
        borderRadius: '6px',
        background: `linear-gradient(to right, ${gradientColors.join(', ')})`,
        marginBottom: '4px'
      }} />

      {/* Labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '10px',
        color: 'rgba(255, 255, 255, 0.6)'
      }}>
        <span>10%</span>
        <span>50%</span>
        <span>100%</span>
      </div>

      {/* Stats */}
      {metadata && (
        <div style={{
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          fontSize: '11px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '4px'
          }}>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Kp Index</span>
            <span style={{ color: '#66ff66', fontWeight: 600 }}>
              {metadata.kpIndex.toFixed(1)}
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Forecast</span>
            <span style={{ color: 'white' }}>
              {metadata.forecast}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuroraLegend;
