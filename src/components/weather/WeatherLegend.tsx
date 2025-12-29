import React from 'react';
import { temperatureGradient, temperatureScaleTicks } from '../../utils/weatherUtils';

interface WeatherLegendProps {
  title?: string;
}

const WeatherLegend: React.FC<WeatherLegendProps> = ({ title = 'Temperature' }) => {
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '20px',
    right: '20px',
    background: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(10px)',
    padding: '12px 15px',
    borderRadius: '10px',
    zIndex: 1000,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    minWidth: '180px'
  };

  const titleStyle: React.CSSProperties = {
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
    marginBottom: '8px',
    opacity: 0.9
  };

  const gradientBarStyle: React.CSSProperties = {
    height: '12px',
    borderRadius: '3px',
    background: temperatureGradient,
    marginBottom: '6px'
  };

  const ticksContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '10px',
    color: 'rgba(255, 255, 255, 0.7)'
  };

  return (
    <div style={containerStyle}>
      <div style={titleStyle}>{title}</div>
      <div style={gradientBarStyle} />
      <div style={ticksContainerStyle}>
        {temperatureScaleTicks.map((tick, index) => (
          <span key={index}>{tick.label}</span>
        ))}
      </div>
    </div>
  );
};

export default WeatherLegend;
