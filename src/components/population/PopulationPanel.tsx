import React from 'react';
import type { PopulationDataPoint } from '../../types/population';

interface PopulationPanelProps {
  country: PopulationDataPoint;
  currentYear: number;
  onClose: () => void;
}

const PopulationPanel: React.FC<PopulationPanelProps> = ({
  country,
  currentYear,
  onClose
}) => {
  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(10px)',
    padding: '20px',
    borderRadius: '12px',
    color: 'white',
    minWidth: '280px',
    maxWidth: '320px',
    zIndex: 1000,
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  };

  const closeButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'transparent',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'color 0.2s'
  };

  const flagStyle: React.CSSProperties = {
    fontSize: '48px',
    marginBottom: '12px'
  };

  const countryNameStyle: React.CSSProperties = {
    fontSize: '22px',
    fontWeight: '600',
    marginBottom: '4px'
  };

  const codeStyle: React.CSSProperties = {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: '16px'
  };

  const statStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
  };

  const labelStyle: React.CSSProperties = {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '13px'
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: '500'
  };

  const populationValueStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: '700',
    color: '#4FC3F7'
  };

  return (
    <div style={panelStyle}>
      <button
        style={closeButtonStyle}
        onClick={onClose}
        onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'}
      >
        &#10005;
      </button>

      <div style={flagStyle}>
        {getCountryFlag(country.countryCode)}
      </div>

      <div style={countryNameStyle}>{country.name}</div>
      <div style={codeStyle}>
        {country.countryCode} / {country.countryCode3}
      </div>

      <div style={statStyle}>
        <span style={labelStyle}>Population ({currentYear})</span>
      </div>
      <div style={{ padding: '12px 0 16px' }}>
        <div style={populationValueStyle}>{country.populationFormatted}</div>
        <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' }}>
          {country.population.toLocaleString()} people
        </div>
      </div>

      <div style={statStyle}>
        <span style={labelStyle}>Coordinates</span>
        <span style={valueStyle}>
          {country.lat.toFixed(2)}, {country.lng.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

function getCountryFlag(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export default PopulationPanel;
