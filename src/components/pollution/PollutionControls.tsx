import React from 'react';
import type { PollutionMetadata } from '../../types/pollution';

interface FetchProgress {
  isLoading: boolean;
  progress: number;
  current: number;
  total: number;
}

interface PollutionControlsProps {
  metadata: PollutionMetadata | null;
  loading: boolean;
  lastUpdated: Date | null;
  onRefresh: () => void;
  fetchProgress: FetchProgress;
}

const PollutionControls: React.FC<PollutionControlsProps> = ({
  metadata,
  loading,
  lastUpdated,
  onRefresh,
  fetchProgress
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={containerStyle}>
      {/* Loading indicator with progress bar */}
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
          color: 'white',
          minWidth: '200px',
          textAlign: 'center',
          border: '1px solid rgba(79, 195, 247, 0.3)'
        }}>
          <div style={{ marginBottom: '6px' }}>
            {fetchProgress.isLoading
              ? `Fetching air quality data... ${fetchProgress.progress}%`
              : 'Loading air quality data...'}
          </div>
          {fetchProgress.isLoading && (
            <div style={{
              width: '100%',
              height: '4px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${fetchProgress.progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #4FC3F7, #00E400)',
                borderRadius: '2px',
                transition: 'width 0.3s ease'
              }} />
            </div>
          )}
          {fetchProgress.isLoading && fetchProgress.total > 0 && (
            <div style={{
              marginTop: '4px',
              fontSize: '10px',
              color: 'rgba(255,255,255,0.6)'
            }}>
              {fetchProgress.current} / {fetchProgress.total} points
            </div>
          )}
        </div>
      )}

      {/* Data points count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '18px' }}>🏭</span>
        <div>
          <div style={{ fontSize: '13px', fontWeight: '600' }}>
            {metadata?.totalPoints || 0} monitoring points
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>
            {metadata?.resolution || 10}° grid resolution
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
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
        {lastUpdated ? (
          <>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Updated: </span>
            {formatTime(lastUpdated)}
          </>
        ) : (
          'Loading...'
        )}
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

      {/* Spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PollutionControls;
