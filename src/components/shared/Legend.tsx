import React from 'react';

interface LegendItem {
  color: string;
  label: string;
  value?: string | number;
}

interface LegendProps {
  title?: string;
  items: LegendItem[];
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  gradient?: {
    colors: string[];
    min: string;
    max: string;
  };
}

const Legend: React.FC<LegendProps> = ({
  title,
  items,
  position = 'bottom-right',
  gradient
}) => {
  const positionStyles: Record<string, React.CSSProperties> = {
    'bottom-right': { bottom: '20px', right: '20px' },
    'bottom-left': { bottom: '20px', left: '20px' },
    'top-right': { top: '20px', right: '20px' },
    'top-left': { top: '20px', left: '20px' }
  };

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    ...positionStyles[position],
    background: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(10px)',
    padding: '16px',
    borderRadius: '12px',
    color: 'white',
    zIndex: 400,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
    minWidth: '140px'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    fontSize: '12px'
  };

  const colorDotStyle = (color: string): React.CSSProperties => ({
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: color,
    flexShrink: 0
  });

  return (
    <div style={containerStyle}>
      {title && <div style={titleStyle}>{title}</div>}

      {gradient && (
        <div style={{ marginBottom: items.length ? '12px' : 0 }}>
          <div style={{
            height: '12px',
            borderRadius: '6px',
            background: `linear-gradient(to right, ${gradient.colors.join(', ')})`,
            marginBottom: '4px'
          }} />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            <span>{gradient.min}</span>
            <span>{gradient.max}</span>
          </div>
        </div>
      )}

      {items.map((item, index) => (
        <div key={index} style={itemStyle}>
          <div style={colorDotStyle(item.color)} />
          <span style={{ flex: 1, color: 'rgba(255, 255, 255, 0.8)' }}>
            {item.label}
          </span>
          {item.value !== undefined && (
            <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '11px' }}>
              {item.value}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default Legend;
