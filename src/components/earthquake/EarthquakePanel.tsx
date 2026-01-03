import React from 'react';
import type { Earthquake, EarthquakeDetail } from '../../types/earthquake';

interface EarthquakePanelProps {
  earthquake: Earthquake;
  details: EarthquakeDetail | null;
  loading: boolean;
  onClose: () => void;
}

const EarthquakePanel: React.FC<EarthquakePanelProps> = ({
  earthquake,
  details,
  loading,
  onClose
}) => {
  const getMagnitudeLabel = (mag: number): string => {
    if (mag >= 8) return 'Great';
    if (mag >= 7) return 'Major';
    if (mag >= 6) return 'Strong';
    if (mag >= 5) return 'Moderate';
    if (mag >= 4) return 'Light';
    return 'Minor';
  };

  const getMagnitudeColor = (mag: number): string => {
    if (mag >= 7) return '#ff2222';
    if (mag >= 6) return '#ff6600';
    if (mag >= 5) return '#ffaa00';
    if (mag >= 4) return '#ffdd00';
    return '#88cc00';
  };

  const getIntensityDescription = (mmi: number | null): string => {
    if (!mmi) return 'Not measured';
    if (mmi >= 10) return 'Extreme';
    if (mmi >= 8) return 'Severe';
    if (mmi >= 6) return 'Strong';
    if (mmi >= 4) return 'Light';
    return 'Weak';
  };

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'rgba(0, 0, 0, 0.92)',
    backdropFilter: 'blur(12px)',
    padding: '24px',
    borderRadius: '16px',
    color: 'white',
    width: '340px',
    maxHeight: '85vh',
    overflowY: 'auto',
    zIndex: 1000,
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    border: '1px solid rgba(255, 255, 255, 0.1)'
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
    borderRadius: '4px',
    transition: 'all 0.2s'
  };

  const sectionStyle: React.CSSProperties = {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '8px'
  };

  const statBoxStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    padding: '14px',
    borderRadius: '10px',
    textAlign: 'center' as const
  };

  const data = details || earthquake;

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

      {/* Magnitude Display - Hero Section */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div
          style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${getMagnitudeColor(earthquake.magnitude)}44 0%, transparent 70%)`,
            border: `3px solid ${getMagnitudeColor(earthquake.magnitude)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            animation: earthquake.isRecent ? 'pulse 2s infinite' : 'none'
          }}
        >
          <span style={{
            fontSize: '36px',
            fontWeight: '700',
            color: getMagnitudeColor(earthquake.magnitude)
          }}>
            {earthquake.magnitude.toFixed(1)}
          </span>
        </div>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: getMagnitudeColor(earthquake.magnitude),
          textTransform: 'uppercase',
          letterSpacing: '2px'
        }}>
          {getMagnitudeLabel(earthquake.magnitude)} Earthquake
        </div>
      </div>

      {/* Location */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '18px', fontWeight: '500', lineHeight: 1.4 }}>
          {earthquake.place}
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '6px' }}>
          {earthquake.lat.toFixed(3)}°, {earthquake.lng.toFixed(3)}°
        </div>
      </div>

      {/* Time */}
      <div style={{ textAlign: 'center' }}>
        <span style={{
          background: earthquake.isRecent ? 'rgba(255, 68, 68, 0.3)' : 'rgba(255,255,255,0.1)',
          padding: '6px 14px',
          borderRadius: '20px',
          fontSize: '13px',
          color: earthquake.isRecent ? '#ff6666' : 'rgba(255,255,255,0.7)'
        }}>
          {earthquake.isRecent ? '🔴 ' : ''}{earthquake.timeAgo}
        </span>
      </div>

      {/* Key Stats */}
      <div style={sectionStyle}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={statBoxStyle}>
            <div style={labelStyle}>Depth</div>
            <div style={{ fontSize: '20px', fontWeight: '600', color: earthquake.color }}>
              {earthquake.depth.toFixed(1)} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>km</span>
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
              {earthquake.depthCategory}
            </div>
          </div>

          {earthquake.felt !== null && earthquake.felt > 0 && (
            <div style={statBoxStyle}>
              <div style={labelStyle}>Felt Reports</div>
              <div style={{ fontSize: '20px', fontWeight: '600', color: '#4FC3F7' }}>
                {earthquake.felt.toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                people
              </div>
            </div>
          )}

          {details?.mmi && (
            <div style={statBoxStyle}>
              <div style={labelStyle}>Intensity</div>
              <div style={{ fontSize: '20px', fontWeight: '600', color: '#FFA726' }}>
                {details.mmi.toFixed(1)}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                {getIntensityDescription(details.mmi)}
              </div>
            </div>
          )}

          <div style={statBoxStyle}>
            <div style={labelStyle}>Significance</div>
            <div style={{ fontSize: '20px', fontWeight: '600', color: '#AB47BC' }}>
              {earthquake.significance}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
              / 1000
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {earthquake.tsunami && (
        <div style={{
          ...sectionStyle,
          background: 'rgba(255, 68, 68, 0.2)',
          border: '1px solid rgba(255, 68, 68, 0.4)',
          borderRadius: '10px',
          padding: '14px',
          marginTop: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '24px' }}>🌊</span>
          <div>
            <div style={{ fontWeight: '600', color: '#ff6666' }}>Tsunami Warning</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
              This earthquake may have caused a tsunami
            </div>
          </div>
        </div>
      )}

      {/* More Info Link */}
      {earthquake.url && (
        <div style={{ ...sectionStyle, textAlign: 'center' }}>
          <a
            href={earthquake.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#4FC3F7',
              textDecoration: 'none',
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
          >
            View on USGS <span style={{ fontSize: '10px' }}>↗</span>
          </a>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '10px', color: 'rgba(255,255,255,0.5)' }}>
          Loading details...
        </div>
      )}

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 ${getMagnitudeColor(earthquake.magnitude)}44; }
          50% { box-shadow: 0 0 20px 10px ${getMagnitudeColor(earthquake.magnitude)}22; }
        }
      `}</style>
    </div>
  );
};

export default EarthquakePanel;
