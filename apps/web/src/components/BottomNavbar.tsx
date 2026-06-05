import React from 'react';

export type TabType = 'MAPA' | 'NÁVODY' | 'POMOC' | 'ZPRÁVY' | 'PROFIL';

interface BottomNavbarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function BottomNavbar({ activeTab, onTabChange }: BottomNavbarProps) {
  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
      id: 'MAPA',
      label: 'MAPA',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
          <line x1="9" y1="3" x2="9" y2="18"/>
          <line x1="15" y1="6" x2="15" y2="21"/>
        </svg>
      )
    },
    {
      id: 'NÁVODY',
      label: 'NÁVODY',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
      )
    },
    {
      id: 'POMOC',
      label: 'POMOC',
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
      id: 'ZPRÁVY',
      label: 'ZPRÁVY',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 11a9 9 0 0 1 9 9"/>
          <path d="M4 4a16 16 0 0 1 16 16"/>
          <circle cx="5" cy="19" r="1"/>
        </svg>
      )
    },
    {
      id: 'PROFIL',
      label: 'PROFIL',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      )
    }
  ];

  return (
    <div 
      className="mobile-bottom-nav"
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '16px',
        right: '16px',
        height: '64px',
        background: 'var(--bottom-nav-bg, rgba(30, 30, 30, 0.7))',
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
              background: isActive ? 'var(--bottom-nav-active-bg, rgba(255, 255, 255, 0.06))' : 'transparent',  
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
              stroke: isActive ? '#0A84FF' : '#8E8E93'
            })}
            <span style={{ 
              fontSize: '8px', 
              fontWeight: isActive ? '750' : '600', 
              color: isActive ? '#0A84FF' : '#8E8E93', 
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
