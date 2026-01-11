import React from 'react';
import type { SpaceWeather, AuroraMetadata } from '../../types/aurora';
import { getKpColor } from '../../types/aurora';

interface AuroraPanelProps {
  spaceWeather: SpaceWeather;
  metadata: AuroraMetadata;
  onClose: () => void;
}

const AuroraPanel: React.FC<AuroraPanelProps> = ({
  spaceWeather,
  metadata,
  onClose
}) => {
  const kpColor = getKpColor(spaceWeather.kpIndex);

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'rgba(0, 0, 0, 0.92)',
    backdropFilter: 'blur(12px)',
    padding: '24px',
    borderRadius: '16px',
    color: 'white',
    width: '320px',
    maxHeight: '85vh',
    overflowY: 'auto',
    zIndex: 1000,
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    border: '1px solid rgba(100, 255, 100, 0.2)'
  };

  const closeButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'transparent',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px'
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '6px'
  };

  const statBoxStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    padding: '14px',
    borderRadius: '10px',
    textAlign: 'center'
  };

  return (
    <div style={panelStyle}>
      <button
        style={closeButtonStyle}
        onClick={onClose}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'white';
          e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
          e.currentTarget.style.background = 'transparent';
        }}
      >
        &#10005;
      </button>

      {/* Aurora Icon */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(100,255,100,0.3) 0%, transparent 70%)',
            border: '3px solid #66ff66',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            animation: 'auroraPulse 3s infinite'
          }}
        >
          <span style={{ fontSize: '36px' }}>🌌</span>
        </div>
        <div style={{
          fontSize: '12px',
          fontWeight: '600',
          color: '#66ff66',
          textTransform: 'uppercase',
          letterSpacing: '2px'
        }}>
          Aurora Forecast
        </div>
      </div>

      {/* Kp Index Display */}
      <div style={{
        textAlign: 'center',
        marginBottom: '20px',
        padding: '20px',
        background: `linear-gradient(135deg, ${kpColor}22 0%, transparent 100%)`,
        borderRadius: '12px',
        border: `1px solid ${kpColor}44`
      }}>
        <div style={labelStyle}>Kp Index</div>
        <div style={{
          fontSize: '48px',
          fontWeight: 700,
          color: kpColor,
          lineHeight: 1
        }}>
          {spaceWeather.kpIndex.toFixed(1)}
        </div>
        <div style={{
          fontSize: '14px',
          color: 'white',
          marginTop: '8px'
        }}>
          {spaceWeather.scale.description}
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div style={statBoxStyle}>
          <div style={labelStyle}>Activity</div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#66ff66' }}>
            {spaceWeather.forecast}
          </div>
        </div>

        <div style={statBoxStyle}>
          <div style={labelStyle}>Visible From</div>
          <div style={{ fontSize: '14px', fontWeight: '500' }}>
            {spaceWeather.viewingLatitude}
          </div>
        </div>

        <div style={statBoxStyle}>
          <div style={labelStyle}>Data Points</div>
          <div style={{ fontSize: '16px', fontWeight: '600' }}>
            {metadata.totalPoints}
          </div>
        </div>

        <div style={statBoxStyle}>
          <div style={labelStyle}>Max Probability</div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#adff2f' }}>
            {metadata.maxProbability}%
          </div>
        </div>
      </div>

      {/* Aurora Info */}
      <div style={{
        padding: '12px',
        background: 'rgba(100, 255, 100, 0.1)',
        border: '1px solid rgba(100, 255, 100, 0.2)',
        borderRadius: '8px',
        fontSize: '12px',
        color: 'rgba(255,255,255,0.8)'
      }}>
        <strong style={{ color: '#66ff66' }}>About Aurora</strong>
        <p style={{ margin: '8px 0 0 0', lineHeight: 1.4 }}>
          The Northern Lights (Aurora Borealis) and Southern Lights (Aurora Australis)
          are caused by charged particles from the Sun colliding with atmospheric gases.
          Higher Kp values indicate stronger geomagnetic activity and more visible auroras.
        </p>
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes auroraPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(100, 255, 100, 0.4); }
          50% { box-shadow: 0 0 30px 15px rgba(100, 255, 100, 0.1); }
        }
      `}</style>
    </div>
  );
};

export default AuroraPanel;
