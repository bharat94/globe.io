import React from 'react';

interface BasePanelProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  accentColor?: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
  maxHeight?: string;
}

const BasePanel: React.FC<BasePanelProps> = ({
  title,
  subtitle,
  icon,
  accentColor = '#4FC3F7',
  onClose,
  children,
  width = 320,
  maxHeight = '85vh'
}) => {
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'rgba(0, 0, 0, 0.92)',
    backdropFilter: 'blur(12px)',
    padding: '24px',
    borderRadius: '16px',
    color: 'white',
    width: `${width}px`,
    maxHeight,
    overflowY: 'auto',
    zIndex: 1000,
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    border: `1px solid ${accentColor}33`
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px'
  };

  const closeButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'transparent',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '18px',
    cursor: 'pointer',
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    transition: 'all 0.2s'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 700,
    color: accentColor,
    marginBottom: subtitle ? '4px' : 0
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.6)'
  };

  return (
    <div style={containerStyle} role="dialog" aria-modal="true" aria-label={title} className="base-panel">
      <button
        style={closeButtonStyle}
        onClick={onClose}
        aria-label={`Close ${title} panel`}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'white';
          e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
          e.currentTarget.style.background = 'transparent';
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
      >
        &#10005;
      </button>
      <style>{`
        @media (max-width: 640px) {
          .base-panel {
            left: 10px !important;
            right: 10px !important;
            width: auto !important;
            top: auto !important;
            bottom: 70px !important;
            max-height: 50vh !important;
            border-radius: 16px !important;
          }
        }
      `}</style>

      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {icon && (
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: `${accentColor}22`,
              border: `2px solid ${accentColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px'
            }}>
              {icon}
            </div>
          )}
          <div>
            <div style={titleStyle}>{title}</div>
            {subtitle && <div style={subtitleStyle}>{subtitle}</div>}
          </div>
        </div>
      </div>

      {children}
    </div>
  );
};

export default BasePanel;
