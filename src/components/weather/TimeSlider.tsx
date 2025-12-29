import React from 'react';
import { getMonthName } from '../../utils/weatherUtils';

interface TimeSliderProps {
  minYear: number;
  maxYear: number;
  currentYear: number;
  currentMonth: number;
  isPlaying: boolean;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  onPlayPause: () => void;
  onSpeedChange: (speed: number) => void;
  playbackSpeed: number;
}

const TimeSlider: React.FC<TimeSliderProps> = ({
  minYear,
  maxYear,
  currentYear,
  currentMonth,
  isPlaying,
  onYearChange,
  onMonthChange,
  onPlayPause,
  playbackSpeed
}) => {
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '25px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(8px)',
    padding: '8px 16px',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    zIndex: 1000,
    border: '1px solid rgba(255, 255, 255, 0.08)'
  };

  const buttonStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.7)',
    padding: '4px 6px',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'color 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const playButtonStyle: React.CSSProperties = {
    background: isPlaying ? 'rgba(244, 109, 67, 0.8)' : 'rgba(76, 175, 80, 0.8)',
    border: 'none',
    borderRadius: '50%',
    color: 'white',
    width: '28px',
    height: '28px',
    cursor: 'pointer',
    fontSize: '11px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s'
  };

  const dateStyle: React.CSSProperties = {
    color: 'white',
    fontSize: '13px',
    fontWeight: '500',
    minWidth: '90px',
    textAlign: 'center'
  };

  const sliderStyle: React.CSSProperties = {
    width: '120px',
    height: '3px',
    borderRadius: '2px',
    background: 'rgba(255, 255, 255, 0.15)',
    appearance: 'none',
    cursor: 'pointer'
  };

  const yearLabelStyle: React.CSSProperties = {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '10px'
  };

  const handleStepBack = () => {
    if (currentMonth > 1) {
      onMonthChange(currentMonth - 1);
    } else if (currentYear > minYear) {
      onYearChange(currentYear - 1);
      onMonthChange(12);
    }
  };

  const handleStepForward = () => {
    if (currentMonth < 12) {
      onMonthChange(currentMonth + 1);
    } else if (currentYear < maxYear) {
      onYearChange(currentYear + 1);
      onMonthChange(1);
    }
  };

  return (
    <div style={containerStyle}>
      {/* Step back */}
      <button
        style={buttonStyle}
        onClick={handleStepBack}
        title="Previous"
        onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'}
      >
        ◀
      </button>

      {/* Play/Pause */}
      <button
        style={playButtonStyle}
        onClick={onPlayPause}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      {/* Step forward */}
      <button
        style={buttonStyle}
        onClick={handleStepForward}
        title="Next"
        onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'}
      >
        ▶
      </button>

      {/* Date display */}
      <div style={dateStyle}>
        {getMonthName(currentMonth, true)} {currentYear}
      </div>

      {/* Year slider */}
      <span style={yearLabelStyle}>{minYear}</span>
      <input
        type="range"
        min={minYear}
        max={maxYear}
        value={currentYear}
        onChange={(e) => onYearChange(parseInt(e.target.value))}
        style={sliderStyle}
        title={`Year: ${currentYear}`}
      />
      <span style={yearLabelStyle}>{maxYear}</span>

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
        input[type="range"]::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default TimeSlider;
