import React from 'react';
import type { FlightMetadata } from '../../types/flights';

interface FlightControlsProps {
  metadata: FlightMetadata | null;
  loading: boolean;
  onRefresh: () => void;
  isAutoRefreshing: boolean;
  onToggleAutoRefresh: (enabled: boolean) => void;
}

const FlightControls: React.FC<FlightControlsProps> = ({
  metadata,
  loading,
  onRefresh,
  isAutoRefreshing,
  onToggleAutoRefresh
}) => {
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(10px)',
    padding: '14px 24px',
    borderRadius: '40px',
    color: 'white',
    zIndex: 1000,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={containerStyle}>
      {/* Loading indicator */}
      {loading && (
        <div style={{
          position: 'absolute',
          top: '-30px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.9)',
          padding: '8px 16px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: '500',
          color: '#4FC3F7',
          border: '1px solid rgba(79, 195, 247, 0.3)'
        }}>
          Loading flight data...
        </div>
      )}

      {/* Flight count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '20px' }}>✈️</span>
        <div>
          <div style={{ fontSize: '16px', fontWeight: '600' }}>
            {metadata?.totalFlights?.toLocaleString() || 0}
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>
            aircraft
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{
        width: '1px',
        height: '30px',
        background: 'rgba(255, 255, 255, 0.2)'
      }} />

      {/* Last updated */}
      {metadata?.timestamp && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Updated
          </span>
          <span style={{ fontSize: '12px', fontWeight: '500' }}>
            {formatTime(metadata.timestamp)}
          </span>
        </div>
      )}

      {/* Divider */}
      <div style={{
        width: '1px',
        height: '30px',
        background: 'rgba(255, 255, 255, 0.2)'
      }} />

      {/* Auto-refresh toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Auto</span>
        <button
          onClick={() => onToggleAutoRefresh(!isAutoRefreshing)}
          style={{
            background: isAutoRefreshing ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255,255,255,0.1)',
            border: isAutoRefreshing ? '1px solid #4CAF50' : '1px solid rgba(255,255,255,0.2)',
            borderRadius: '12px',
            width: '40px',
            height: '22px',
            position: 'relative',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <div style={{
            position: 'absolute',
            top: '2px',
            left: isAutoRefreshing ? '20px' : '2px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: isAutoRefreshing ? '#4CAF50' : 'rgba(255,255,255,0.5)',
            transition: 'all 0.2s'
          }} />
        </button>
      </div>

      {/* Divider */}
      <div style={{
        width: '1px',
        height: '30px',
        background: 'rgba(255, 255, 255, 0.2)'
      }} />

      {/* Refresh button */}
      <button
        onClick={onRefresh}
        disabled={loading}
        style={{
          background: loading ? 'rgba(255,255,255,0.1)' : 'rgba(79, 195, 247, 0.2)',
          border: '1px solid ' + (loading ? 'rgba(255,255,255,0.1)' : 'rgba(79, 195, 247, 0.4)'),
          color: loading ? 'rgba(255,255,255,0.4)' : '#4FC3F7',
          padding: '8px 16px',
          borderRadius: '20px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '12px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.background = 'rgba(79, 195, 247, 0.3)';
          }
        }}
        onMouseLeave={(e) => {
          if (!loading) {
            e.currentTarget.style.background = 'rgba(79, 195, 247, 0.2)';
          }
        }}
      >
        <span style={{
          display: 'inline-block',
          animation: loading ? 'spin 1s linear infinite' : 'none'
        }}>↻</span>
        Refresh
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

export default FlightControls;
