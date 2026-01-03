import React from 'react';

interface PopulationTimeSliderProps {
  minYear: number;
  maxYear: number;
  currentYear: number;
  isPlaying: boolean;
  onYearChange: (year: number) => void;
  onPlayPause: () => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
}

const PopulationTimeSlider: React.FC<PopulationTimeSliderProps> = ({
  minYear,
  maxYear,
  currentYear,
  isPlaying,
  onYearChange,
  onPlayPause,
  playbackSpeed,
  onSpeedChange
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
    fontSize: '15px',
    fontWeight: '600',
    minWidth: '50px',
    textAlign: 'center'
  };

  const sliderStyle: React.CSSProperties = {
    width: '180px',
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

  const speedButtonStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    borderRadius: '4px',
    color: 'rgba(255, 255, 255, 0.7)',
    padding: '2px 6px',
    cursor: 'pointer',
    fontSize: '10px',
    marginLeft: '4px'
  };

  const handleStepBack = () => {
    if (currentYear > minYear) {
      onYearChange(currentYear - 1);
    }
  };

  const handleStepForward = () => {
    if (currentYear < maxYear) {
      onYearChange(currentYear + 1);
    }
  };

  const handleSpeedClick = () => {
    const speeds = [0.5, 1, 2, 4];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    onSpeedChange(speeds[nextIndex]);
  };

  return (
    <div style={containerStyle}>
      {/* Step back */}
      <button
        style={buttonStyle}
        onClick={handleStepBack}
        title="Previous year"
        onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'}
      >
        &#9664;
      </button>

      {/* Play/Pause */}
      <button
        style={playButtonStyle}
        onClick={onPlayPause}
        title={isPlaying ? 'Pause' : 'Play timeline'}
      >
        {isPlaying ? '\u23F8' : '\u25B6'}
      </button>

      {/* Step forward */}
      <button
        style={buttonStyle}
        onClick={handleStepForward}
        title="Next year"
        onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'}
      >
        &#9654;
      </button>

      {/* Year display */}
      <div style={dateStyle}>
        {currentYear}
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

      {/* Speed control */}
      <button
        style={speedButtonStyle}
        onClick={handleSpeedClick}
        title="Playback speed"
      >
        {playbackSpeed}x
      </button>

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

export default PopulationTimeSlider;
