import React from 'react';

interface ControlBarProps {
  position?: 'bottom' | 'top';
  children: React.ReactNode;
}

const ControlBar: React.FC<ControlBarProps> = ({
  position = 'bottom',
  children
}) => {
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    [position]: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(10px)',
    padding: '8px 16px',
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    zIndex: 500
  };

  return (
    <div style={containerStyle}>
      {children}
    </div>
  );
};

// Divider component for separating control groups
export const ControlDivider: React.FC = () => (
  <div style={{
    width: '1px',
    height: '24px',
    background: 'rgba(255, 255, 255, 0.2)',
    margin: '0 4px'
  }} />
);

// Control button component
interface ControlButtonProps {
  active?: boolean;
  color?: string;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}

export const ControlButton: React.FC<ControlButtonProps> = ({
  active = false,
  color = '#4FC3F7',
  onClick,
  children,
  title
}) => {
  const buttonStyle: React.CSSProperties = {
    background: active ? color : 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    borderRadius: '16px',
    padding: '6px 12px',
    color: active ? 'white' : 'rgba(255, 255, 255, 0.7)',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap'
  };

  return (
    <button
      style={buttonStyle}
      onClick={onClick}
      title={title}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        }
      }}
    >
      {children}
    </button>
  );
};

export default ControlBar;
