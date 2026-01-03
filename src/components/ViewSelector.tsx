import type { ViewConfig, ViewType } from '../types/views';

interface ViewSelectorProps {
  views: ViewConfig[];
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const ViewSelector = ({ views, currentView, onViewChange }: ViewSelectorProps) => {
  // Show 4.5 items to hint there's more content
  // Each item: 60px height, gap: 16px
  // 4 full items + half of 5th = (4 * 60) + (4 * 16) + 30 = 240 + 64 + 30 = 334px
  const scrollableHeight = 334;

  return (
    <div style={{
      position: 'absolute',
      left: '20px',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 1000,
      background: 'rgba(0, 0, 0, 0.7)',
      padding: '15px',
      borderRadius: '30px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          height: `${scrollableHeight}px`,
          overflowY: 'scroll',
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE/Edge
        }}
        className="view-list"
      >
      {views.map((view) => (
        <div
          key={view.id}
          onClick={() => view.enabled && onViewChange(view.id)}
          style={{
            cursor: view.enabled ? 'pointer' : 'not-allowed',
            opacity: view.enabled ? 1 : 0.4,
            transition: 'all 0.3s',
            position: 'relative',
            flexShrink: 0,
          }}
          title={view.description}
        >
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: currentView === view.id
              ? 'rgba(255, 255, 255, 0.2)'
              : 'rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            transition: 'all 0.3s',
            border: currentView === view.id
              ? '2px solid rgba(255, 255, 255, 0.5)'
              : '2px solid transparent',
            transform: currentView === view.id ? 'scale(1.1)' : 'scale(1)'
          }}
          onMouseEnter={(e) => {
            if (view.enabled) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (view.enabled) {
              e.currentTarget.style.background = currentView === view.id
                ? 'rgba(255, 255, 255, 0.2)'
                : 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.transform = currentView === view.id ? 'scale(1.1)' : 'scale(1)';
            }
          }}
          >
            {view.icon}
          </div>

          {/* View name label */}
          <div style={{
            position: 'absolute',
            left: '75px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(0, 0, 0, 0.9)',
            padding: '8px 12px',
            borderRadius: '6px',
            whiteSpace: 'nowrap',
            fontSize: '13px',
            color: 'white',
            opacity: 0,
            pointerEvents: 'none',
            transition: 'opacity 0.2s'
          }}
          className="view-label"
          >
            {view.name}
          </div>
        </div>
      ))}
      </div>

      <style>{`
        .view-list::-webkit-scrollbar {
          display: none;
        }
        .view-label {
          opacity: 0 !important;
        }
        div:hover .view-label {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
};

export default ViewSelector;
