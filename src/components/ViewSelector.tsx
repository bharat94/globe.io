import type { ViewConfig, ViewType } from '../types/views';
import { useIsMobile } from '../hooks/useMediaQuery';
import { useRef, memo, useEffect } from 'react';

interface ViewSelectorProps {
  views: ViewConfig[];
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const STORAGE_KEY = 'globe-viewselector-scroll';

const ViewSelector = ({ views, currentView, onViewChange }: ViewSelectorProps) => {
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Restore scroll position after mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && scrollRef.current) {
      scrollRef.current.scrollTop = parseInt(saved, 10);
    }
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    localStorage.setItem(STORAGE_KEY, String(e.currentTarget.scrollTop));
  };

  // Show 4.5 items to hint there's more content
  // Each item: 60px height, gap: 16px
  // 4 full items + half of 5th = (4 * 60) + (4 * 16) + 30 = 240 + 64 + 30 = 334px
  // Increased by 50% to 501px
  const scrollableHeight = 501;

  // Mobile layout: horizontal bar at bottom
  if (isMobile) {
    return (
      <div role="navigation" aria-label="View selector" style={{
        position: 'absolute',
        bottom: '0',
        left: '0',
        right: '0',
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '8px 0',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          maxWidth: '500px',
          margin: '0 auto',
        }}>
          {views.filter(v => v.enabled).map((view) => (
            <button
              key={view.id}
              onClick={() => onViewChange(view.id)}
              aria-label={`Switch to ${view.name} view`}
              aria-current={currentView === view.id ? 'page' : undefined}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                background: currentView === view.id
                  ? 'rgba(255, 255, 255, 0.15)'
                  : 'transparent',
                transition: 'all 0.2s',
                minWidth: '44px',
                minHeight: '44px',
              }}
            >
              <div style={{
                fontSize: '24px',
                marginBottom: '2px',
              }}>
                {view.icon}
              </div>
              <div style={{
                fontSize: '10px',
                color: currentView === view.id
                  ? 'white'
                  : 'rgba(255, 255, 255, 0.6)',
                fontWeight: currentView === view.id ? 600 : 400,
              }}>
                {view.name}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Desktop layout: vertical sidebar
  return (
    <div role="navigation" aria-label="View selector" style={{
      position: 'absolute',
      left: '20px',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 1000,
    }}>
      {/* Background container - clips vertically but allows horizontal overflow for labels */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.7)',
        padding: '15px',
        borderRadius: '30px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            height: `${scrollableHeight}px`,
            overflowY: 'scroll',
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none', // IE/Edge
            paddingRight: '100px', // Space for hover labels
            marginRight: '-100px', // Pull container back
          }}
          className="view-list"
        >
      {views.map((view) => (
        <button
          key={view.id}
          onClick={() => view.enabled && onViewChange(view.id)}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && view.enabled) {
              e.preventDefault();
              onViewChange(view.id);
            }
          }}
          aria-label={`${view.name}: ${view.description}`}
          aria-current={currentView === view.id ? 'page' : undefined}
          disabled={!view.enabled}
          style={{
            cursor: view.enabled ? 'pointer' : 'not-allowed',
            opacity: view.enabled ? 1 : 0.4,
            transition: 'all 0.3s',
            position: 'relative',
            flexShrink: 0,
            background: 'transparent',
            border: 'none',
            padding: 0,
            minWidth: '60px',
            minHeight: '60px',
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
          </button>
        ))}
        </div>
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

export default memo(ViewSelector);
