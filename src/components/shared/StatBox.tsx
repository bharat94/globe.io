import React from 'react';

interface StatBoxProps {
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
  subtext?: string;
}

const StatBox: React.FC<StatBoxProps> = ({
  label,
  value,
  unit,
  color = 'white',
  subtext
}) => {
  const containerStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '14px',
    borderRadius: '10px',
    textAlign: 'center'
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '6px'
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 600,
    color
  };

  const unitStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 'normal',
    marginLeft: '4px',
    opacity: 0.7
  };

  const subtextStyle: React.CSSProperties = {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: '4px'
  };

  return (
    <div style={containerStyle}>
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>
        {value}
        {unit && <span style={unitStyle}>{unit}</span>}
      </div>
      {subtext && <div style={subtextStyle}>{subtext}</div>}
    </div>
  );
};

// Grid container for stat boxes
interface StatGridProps {
  columns?: number;
  children: React.ReactNode;
}

export const StatGrid: React.FC<StatGridProps> = ({
  columns = 2,
  children
}) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: '12px'
  }}>
    {children}
  </div>
);

export default StatBox;
