import React, { useState, useRef, useEffect } from 'react';
import type { Flight, FlightMetadata } from '../../types/flights';
import { FLIGHT_CATEGORIES } from '../../types/flights';

interface FlightControlsProps {
  metadata: FlightMetadata | null;
  loading: boolean;
  onRefresh: () => void;
  isAutoRefreshing: boolean;
  onToggleAutoRefresh: (enabled: boolean) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchResults: Flight[];
  onSelectFlight: (flight: Flight) => void;
  filteredCount: number;
}

const FlightControls: React.FC<FlightControlsProps> = ({
  metadata,
  loading,
  onRefresh,
  isAutoRefreshing,
  onToggleAutoRefresh,
  searchQuery,
  onSearchChange,
  searchResults,
  onSelectFlight,
  filteredCount
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    gap: '16px'
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSelectFlight = (flight: Flight) => {
    onSelectFlight(flight);
    setShowDropdown(false);
    onSearchChange('');
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
            {filteredCount.toLocaleString()}
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>
            visible
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{
        width: '1px',
        height: '30px',
        background: 'rgba(255, 255, 255, 0.2)'
      }} />

      {/* Search input */}
      <div style={{ position: 'relative' }} ref={dropdownRef}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            onSearchChange(e.target.value);
            setShowDropdown(e.target.value.length > 0);
          }}
          onFocus={() => searchQuery && setShowDropdown(true)}
          placeholder="Search callsign..."
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '16px',
            padding: '8px 14px',
            color: 'white',
            width: '140px',
            fontSize: '12px',
            outline: 'none',
            transition: 'all 0.2s'
          }}
        />
        {searchQuery && (
          <button
            onClick={() => {
              onSearchChange('');
              setShowDropdown(false);
            }}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '2px'
            }}
          >
            x
          </button>
        )}

        {/* Search results dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: '0',
            marginBottom: '8px',
            background: 'rgba(0, 0, 0, 0.95)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)',
            maxHeight: '250px',
            overflowY: 'auto',
            minWidth: '220px',
            zIndex: 1001
          }}>
            <div style={{
              padding: '8px 12px',
              fontSize: '10px',
              color: 'rgba(255,255,255,0.4)',
              borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
            </div>
            {searchResults.map((flight) => {
              const categoryConfig = FLIGHT_CATEGORIES[flight.category];
              return (
                <button
                  key={flight.icao24}
                  onClick={() => handleSelectFlight(flight)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: categoryConfig?.color || '#fff',
                    flexShrink: 0
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: categoryConfig?.color || '#fff'
                    }}>
                      {flight.callsign || 'Unknown'}
                    </div>
                    <div style={{
                      fontSize: '10px',
                      color: 'rgba(255,255,255,0.5)'
                    }}>
                      {categoryConfig?.name} - {flight.originCountry}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: 'rgba(255,255,255,0.4)',
                    textAlign: 'right'
                  }}>
                    {flight.altitudeFt?.toLocaleString() || 0} ft
                  </div>
                </button>
              );
            })}
          </div>
        )}
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
