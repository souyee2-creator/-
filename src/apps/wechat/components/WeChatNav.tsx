import React from 'react';

interface WeChatNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const WeChatNav: React.FC<WeChatNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'signals', symbol: '○', label: 'Signals' },
    { id: 'souls',   symbol: '◆', label: 'Souls'   },
    { id: 'orbit',   symbol: '◎', label: 'Orbit'   },
    { id: 'core',    symbol: '□', label: 'Core'    },
  ];

  return (
    <div
      style={{
        paddingLeft: 24,
        paddingRight: 24,
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 14px)',
        paddingTop: 0,
        zIndex: 10,
        background: '#ffffff',
      }}
    >
      {/* Top rule */}
      <div style={{ height: 1, background: '#111', marginBottom: 0 }} />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'stretch',
          height: 58,
        }}
      >
        {tabs.map((tab, i) => {
          const isActive = activeTab === tab.id;
          return (
            <React.Fragment key={tab.id}>
              {/* Vertical divider between tabs */}
              {i > 0 && (
                <div style={{ width: 1, background: '#e0ddd7', alignSelf: 'stretch' }} />
              )}

              <button
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                  border: 'none',
                  background: isActive ? '#111' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  padding: '8px 0',
                }}
              >
                <span
                  style={{
                    fontSize: 18,
                    color: isActive ? '#ffffff' : '#999',
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    lineHeight: 1,
                    transition: 'color 0.15s',
                  }}
                >
                  {tab.symbol}
                </span>
                <span
                  style={{
                    fontSize: 7.5,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    color: isActive ? '#ffffff' : '#aaa',
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontWeight: isActive ? 700 : 400,
                    transition: 'color 0.15s',
                  }}
                >
                  {tab.label}
                </span>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Bottom rule */}
      <div style={{ height: 0.5, background: '#ccc' }} />
    </div>
  );
};