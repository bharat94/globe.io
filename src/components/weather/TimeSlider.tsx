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
  onSpeedChange,
  playbackSpeed
}) => {
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '80px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(10px)',
    padding: '15px 25px',
    borderRadius: '15px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    zIndex: 1000,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    minWidth: '400px'
  };

  const topRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '15px'
  };

  const dateDisplayStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 'bold',
    color: 'white',
    minWidth: '140px',
    textAlign: 'center'
  };

  const controlsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const buttonStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background 0.2s'
  };

  const playButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: isPlaying ? '#f46d43' : '#4CAF50',
    padding: '8px 16px',
    fontWeight: 'bold'
  };

  const sliderContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  };

  const sliderStyle: React.CSSProperties = {
    flex: 1,
    height: '6px',
    borderRadius: '3px',
    background: 'rgba(255, 255, 255, 0.2)',
    appearance: 'none',
    cursor: 'pointer'
  };

  const labelStyle: React.CSSProperties = {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '12px',
    minWidth: '40px'
  };

  const bottomRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '15px'
  };

  const monthSelectStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '6px',
    color: 'white',
    padding: '6px 10px',
    fontSize: '13px',
    cursor: 'pointer'
  };

  const speedSelectStyle: React.CSSProperties = {
    ...monthSelectStyle,
    fontSize: '12px'
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

  const handleYearJumpBack = () => {
    if (currentYear > minYear) {
      onYearChange(currentYear - 1);
    }
  };

  const handleYearJumpForward = () => {
    if (currentYear < maxYear) {
      onYearChange(currentYear + 1);
    }
  };

  return (
    <div style={containerStyle}>
      {/* Top row: Controls and date display */}
      <div style={topRowStyle}>
        <div style={controlsStyle}>
          <button
            style={buttonStyle}
            onClick={handleYearJumpBack}
            title="Previous Year"
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          >
            ⏮
          </button>
          <button
            style={buttonStyle}
            onClick={handleStepBack}
            title="Previous Month"
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          >
            ◀
          </button>
          <button
            style={playButtonStyle}
            onClick={onPlayPause}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button
            style={buttonStyle}
            onClick={handleStepForward}
            title="Next Month"
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          >
            ▶
          </button>
          <button
            style={buttonStyle}
            onClick={handleYearJumpForward}
            title="Next Year"
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          >
            ⏭
          </button>
        </div>

        <div style={dateDisplayStyle}>
          {getMonthName(currentMonth)} {currentYear}
        </div>

        <div style={controlsStyle}>
          <select
            style={monthSelectStyle}
            value={currentMonth}
            onChange={(e) => onMonthChange(parseInt(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {getMonthName(i + 1, true)}
              </option>
            ))}
          </select>

          <select
            style={speedSelectStyle}
            value={playbackSpeed}
            onChange={(e) => onSpeedChange(parseInt(e.target.value))}
            title="Playback Speed"
          >
            <option value={3000}>0.5x</option>
            <option value={1500}>1x</option>
            <option value={750}>2x</option>
            <option value={375}>4x</option>
          </select>
        </div>
      </div>

      {/* Bottom row: Year slider */}
      <div style={bottomRowStyle}>
        <span style={labelStyle}>{minYear}</span>
        <input
          type="range"
          min={minYear}
          max={maxYear}
          value={currentYear}
          onChange={(e) => onYearChange(parseInt(e.target.value))}
          style={sliderStyle}
        />
        <span style={labelStyle}>{maxYear}</span>
      </div>

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #4CAF50;
          cursor: pointer;
          box-shadow: 0 0 4px rgba(0,0,0,0.3);
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #4CAF50;
          cursor: pointer;
          border: none;
        }
        select {
          outline: none;
        }
        select option {
          background: #1a1a1a;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default TimeSlider;
