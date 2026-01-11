import React from 'react';
import type { AuroraMetadata } from '../../types/aurora';

interface AuroraControlsProps {
  metadata: AuroraMetadata | null;
  loading: boolean;
  lastUpdated: Date | null;
  onRefresh: () => void;
}

const AuroraControls: React.FC<AuroraControlsProps> = ({
  metadata,
  loading,
  lastUpdated,
  onRefresh
}) => {
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(10px)',
    padding: '10px 20px',
    borderRadius: '24px',
    border: '1px solid rgba(100, 255, 100, 0.2)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    zIndex: 500
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: '#66ff66'
  };

  const dividerStyle: React.CSSProperties = {
    width: '1px',
    height: '30px',
    background: 'rgba(255, 255, 255, 0.2)'
  };

  const buttonStyle: React.CSSProperties = {
    background: 'rgba(100, 255, 100, 0.15)',
    border: '1px solid rgba(100, 255, 100, 0.3)',
    borderRadius: '16px',
    padding: '6px 12px',
    color: '#66ff66',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={containerStyle}>
      {/* Kp Index */}
      <div style={{ textAlign: 'center' }}>
        <div style={labelStyle}>Kp Index</div>
        <div style={valueStyle}>
          {metadata?.kpIndex?.toFixed(1) || '--'}
        </div>
      </div>

      <div style={dividerStyle} />

      {/* Forecast */}
      <div style={{ textAlign: 'center' }}>
        <div style={labelStyle}>Activity</div>
        <div style={{ ...valueStyle, color: 'white' }}>
          {metadata?.forecast || '--'}
        </div>
      </div>

      <div style={dividerStyle} />

      {/* Data Points */}
      <div style={{ textAlign: 'center' }}>
        <div style={labelStyle}>Data Points</div>
        <div style={{ ...valueStyle, color: 'white' }}>
          {metadata?.totalPoints || 0}
        </div>
      </div>

      <div style={dividerStyle} />

      {/* Refresh */}
      <button
        style={buttonStyle}
        onClick={onRefresh}
        disabled={loading}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(100, 255, 100, 0.25)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(100, 255, 100, 0.15)';
        }}
      >
        <span style={{
          display: 'inline-block',
          animation: loading ? 'spin 1s linear infinite' : 'none'
        }}>
          ↻
        </span>
        {lastUpdated ? formatTime(lastUpdated) : 'Refresh'}
      </button>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AuroraControls;
