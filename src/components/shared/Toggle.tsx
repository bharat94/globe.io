import React from 'react';

interface ToggleProps {
  label: string;
  sublabel?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  color?: string;
}

const Toggle: React.FC<ToggleProps> = ({
  label,
  sublabel,
  checked,
  onChange,
  color = '#4FC3F7'
}) => {
  return (
    <div style={{
      padding: '12px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '8px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'white' }}>
            {label}
          </div>
          {sublabel && (
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
              {sublabel}
            </div>
          )}
        </div>
        <button
          onClick={() => onChange(!checked)}
          style={{
            background: checked ? color : 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '12px',
            width: '44px',
            height: '24px',
            cursor: 'pointer',
            position: 'relative',
            transition: 'background 0.2s'
          }}
        >
          <div style={{
            position: 'absolute',
            top: '2px',
            left: checked ? '22px' : '2px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: 'white',
            transition: 'left 0.2s'
          }} />
        </button>
      </div>
    </div>
  );
};

export default Toggle;
