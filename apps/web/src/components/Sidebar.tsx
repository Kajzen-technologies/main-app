import React from 'react';
import { TabType } from './BottomNavbar';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
      id: 'MAPA',
      label: 'Krizová Mapa',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
          <line x1="9" y1="3" x2="9" y2="18"/>
          <line x1="15" y1="6" x2="15" y2="21"/>
        </svg>
      )
    },
    {
      id: 'NÁVODY',
      label: 'Návody a Příručky',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
      )
    },
    {
      id: 'POMOC',
      label: 'Centrum Pomoci',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
      label: 'Místní Kanály',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 11a9 9 0 0 1 9 9"/>
          <path d="M4 4a16 16 0 0 1 16 16"/>
          <circle cx="5" cy="19" r="1"/>
        </svg>
      )
    },
    {
      id: 'PROFIL',
      label: 'Krizový Profil',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      )
    }
  ];

  return (
    <div className="desktop-sidebar">
      {/* Brand Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '28px', paddingLeft: '8px' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#0A84FF', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Nouzový Režim
        </span>
        <span style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          RescueMesh
        </span>
      </div>

      {/* Nav List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`nav-item-strict ${isActive ? 'active' : ''}`}
            >
              {React.cloneElement(tab.icon as React.ReactElement, {
                stroke: isActive ? '#0A84FF' : '#8E8E93'
              })}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Connection Status Footer */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>Mesh Status</span>
        <span style={{ fontSize: '11px', fontWeight: '600', color: '#30D158', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#30D158' }}></span>
          Připojeno k 5 nodům
        </span>
      </div>
    </div>
  );
}
