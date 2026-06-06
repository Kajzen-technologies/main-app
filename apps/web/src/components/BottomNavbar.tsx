import React from 'react';

export type TabType = 'MAPA' | 'NÁVODY' | 'POMOC' | 'ZPRÁVY' | 'PROFIL' | 'CHAT' | 'SETTINGS';

interface BottomNavbarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  lang?: "cs" | "en";
}

export default function BottomNavbar({ activeTab, onTabChange, lang = "en" }: BottomNavbarProps) {
  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
      {
          id: 'NÁVODY',
          label: lang === "cs" ? "NÁVODY" : "GUIDES",
          icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
          )
      },
    {
      id: 'MAPA',
      label: lang === "cs" ? "MAPA" : "MAP",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
          <line x1="9" y1="3" x2="9" y2="18"/>
          <line x1="15" y1="6" x2="15" y2="21"/>
        </svg>
      )
    },

      {
          id: 'ZPRÁVY',
          label: lang === "cs" ? "DOMŮ" : "HOME",
          icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
          )
      },
    {
      id: 'POMOC',
      label: lang === "cs" ? "POMOC" : "HELP",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="12" r="4"/>
          <line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/>
          <line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/>
          <line x1="19.07" y1="4.93" x2="14.83" y2="9.17"/>
          <line x1="9.17" y1="14.83" x2="4.93" y2="19.07"/>
        </svg>
      )
    },
    {
      id: 'CHAT',
      label: lang === "cs" ? "CHAT" : "CHAT",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      )
    }
  ];

  return (
    <div
      className="mobile-bottom-nav"
      style={{
        position: 'fixed',
        bottom: 'calc(12px + env(safe-area-inset-bottom))',
        left: 'calc(12px + env(safe-area-inset-left))',
        right: 'calc(12px + env(safe-area-inset-right))',
        height: '64px',
        background: 'var(--bottom-nav-bg, rgba(var(--rgb-surface-sidebar), 0.7))',
        backdropFilter: 'blur(30px) saturate(140%)',
        WebkitBackdropFilter: 'blur(30px) saturate(140%)',
        border: '1px solid var(--glass-border)',
        borderRadius: '16px',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '0 6px',
        boxShadow: '0 10px 30px var(--card-shadow)',
        zIndex: 100,
        boxSizing: 'border-box'
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button 
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="scale-active-click"
            style={{ 
              background: isActive ? 'var(--bottom-nav-active-bg, rgba(var(--rgb-overlay), 0.06))' : 'transparent',  
              border: 'none', 
              borderRadius: '12px', 
              padding: '4px 0', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '2px', 
              flex: 1, 
              margin: '0 2px', 
              height: '48px', 
              cursor: 'pointer',
              outline: 'none'
            }} 
            title={tab.label}
          >
            {React.cloneElement(tab.icon as React.ReactElement, {
              stroke: isActive ? 'var(--color-primary)' : 'var(--text-tertiary)'
            })}
            <span style={{
              fontSize: '9px',
              fontWeight: isActive ? '750' : '600',
              color: isActive ? 'var(--color-primary)' : 'var(--text-tertiary)',
              letterSpacing: '0.04em'
            }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
