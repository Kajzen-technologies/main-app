import { useState } from 'react';
import Sidebar from './components/Sidebar.tsx';
import TopBanner from './components/TopBanner.tsx';
import MapCard from './components/MapCard.tsx';
import ActionButtons from './components/ActionButtons.tsx';
import BottomNavbar, { TabType } from './components/BottomNavbar.tsx';
import AuthForm from './components/AuthForm.tsx';

interface User {
  name: string;
  isVolunteer: boolean;
  roles: string[];
  zone: string;
  phone: string;
  isGuest?: boolean;
}

const GUEST_USER: User = {
  name: 'Host',
  isGuest: true,
  isVolunteer: false,
  roles: [],
  zone: 'Nespecifikováno',
  phone: 'Není k dispozici'
};



const LATEST_MESSAGES = [
  {
    type: 'alert',
    badgeLabel: 'NEBEZPEČÍ',
    badgeColor: '#FF453A',
    badgeBg: 'rgba(255, 69, 58, 0.10)',
    badgeBorder: 'rgba(255, 69, 58, 0.20)',
    title: 'Kulminace toku řeky očekávána ve 20:00',
    time: 'Před 10 min • Městský rozhlas',
    desc: 'Hladina řeky stoupá. Evakuujte nízko položené oblasti a zabezpečte svůj majetek.'
  },
  {
    type: 'mesh',
    badgeLabel: 'PEER-TO-PEER',
    badgeColor: '#0A84FF',
    badgeBg: 'rgba(10, 132, 255, 0.10)',
    badgeBorder: 'rgba(10, 132, 255, 0.20)',
    title: 'Zprovozněno nouzové Wi-Fi u radnice',
    time: 'Před 45 min • Lokální mesh-nod',
    desc: 'Wi-Fi funguje lokálně bez internetu pro zprávy a stahování map. Připojení zdarma.'
  },
  {
    type: 'supply',
    badgeLabel: 'ZÁSOBOVÁNÍ',
    badgeColor: '#30D158',
    badgeBg: 'rgba(48, 209, 88, 0.10)',
    badgeBorder: 'rgba(48, 209, 88, 0.20)',
    title: 'Výdej pitné vody u hasičské zbrojnice',
    time: 'Před 2 hod • Krizové centrum',
    desc: 'Hasiči rozváží pitnou vodu. Množství na osobu je omezeno na 5 litrů na den.'
  },
  {
    type: 'infra',
    badgeLabel: 'OPRAVA SÍTĚ',
    badgeColor: '#FF9F0A',
    badgeBg: 'rgba(255, 159, 10, 0.10)',
    badgeBorder: 'rgba(255, 159, 10, 0.20)',
    title: 'Most v ulici Nádražní preventivně uzavřen',
    time: 'Před 3 hod • Policie ČR',
    desc: 'Statika mostu se prověřuje z důvodu vysokého průtoku. Využijte vyznačené objížďky.'
  },
  {
    type: 'info',
    badgeLabel: 'INFO KANÁL',
    badgeColor: '#BF5AF2',
    badgeBg: 'rgba(191, 90, 242, 0.10)',
    badgeBorder: 'rgba(191, 90, 242, 0.20)',
    title: 'Prohlášení starosty k nouzovému stavu',
    time: 'Před 5 hod • Městský úřad',
    desc: 'Starosta vyzývá obyvatele ke klidu. Zásoby potravin v obchodech jsou dostatečné na 3 dny.'
  }
];

function renderMessageIcon(type: string) {
  switch (type) {
    case 'alert':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF453A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="rgba(255, 69, 58, 0.1)"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      );
    case 'mesh':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5" r="2.5" fill="rgba(10, 132, 255, 0.15)"/>
          <circle cx="5" cy="18" r="2.5" fill="rgba(10, 132, 255, 0.15)"/>
          <circle cx="19" cy="18" r="2.5" fill="rgba(10, 132, 255, 0.15)"/>
          <line x1="12" y1="7.5" x2="6.5" y2="15.5"/>
          <line x1="12" y1="7.5" x2="17.5" y2="15.5"/>
          <line x1="7.5" y1="18" x2="16.5" y2="18"/>
        </svg>
      );
    case 'supply':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#30D158" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="6" width="18" height="14" rx="2" fill="rgba(48, 209, 88, 0.1)"/>
          <path d="M12 10v6M9 13h6"/>
          <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
        </svg>
      );
    case 'infra':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF9F0A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="rgba(255, 159, 10, 0.1)"/>
        </svg>
      );
    case 'info':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#BF5AF2" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5L6 9H2v6h4l5 4V5z" fill="rgba(191, 90, 242, 0.1)"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/>
        </svg>
      );
    default:
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
      );
  }
}


export default function App() {
  const [isLightTheme, setIsLightTheme] = useState(false);

  const toggleTheme = () => {
    setIsLightTheme((prev) => {
      const newVal = !prev;
      if (newVal) {
        document.body.classList.add('light-theme');
      } else {
        document.body.classList.remove('light-theme');
      }
      return newVal;
    });
  };

  const [user, setUser] = useState<User>(GUEST_USER);
  const [activeTab, setActiveTab] = useState<TabType>('MAPA');
  const [modalType, setModalType] = useState<'NONE' | 'SYNC' | 'LEGEND' | 'MAP_FULL' | 'SOS' | 'VOLUNTEER' | 'AI' | 'AUTH'>('NONE');
  const [activeMarker, setActiveMarker] = useState<{ title: string; desc: string } | null>(null);

  // Close active modal
  const closeModal = () => setModalType('NONE');

  // Handle marker clicks on map
  const handleMarkerClick = (title: string, desc: string) => {
    setActiveMarker({ title, desc });
  };

  return (
    <div className="app-layout">
      {/* ─── DESKTOP NAVIGATION SIDEBAR ─── */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* ─── MAIN CONTENT PANE ─── */}
      <div className="main-content-pane">
        
        {/* Top Status Banner */}
        <TopBanner 
          onClick={() => setModalType('SYNC')} 
          isLightTheme={isLightTheme}
          onThemeToggle={toggleTheme}
        />

        {/* Scrollable Main Area */}
        <div style={{
          flex: 1,
          padding: '24px',
          overflowY: 'auto',
          paddingBottom: '100px', /* Extra space for bottom nav on mobile */
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>

          {/* Heading */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#0A84FF', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Nouzová Aplikace
            </span>
            <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              {activeTab === 'MAPA' && 'Krizová Mapa'}
              {activeTab === 'NÁVODY' && 'Návody a Příručky'}
              {activeTab === 'POMOC' && 'Centrum Pomoci'}
              {activeTab === 'ZPRÁVY' && 'Místní Kanály'}
              {activeTab === 'PROFIL' && 'Krizový Profil'}
            </h1>
          </div>

          {/* Content Switcher */}
          {activeTab === 'MAPA' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '850px', width: '100%' }}>
              
              {/* Map block with sub-text */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <MapCard 
                  onOpenFullscreen={() => setModalType('MAP_FULL')}
                  onShowLegend={() => setModalType('LEGEND')}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-tertiary)', fontSize: '11.5px', fontWeight: '600', paddingLeft: '4px', opacity: 0.85 }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#0A84FF' }} />
                  Kliknutím zobrazíte kriticky důležité body
                </div>
              </div>
              
              <ActionButtons 
                onSosClick={() => {
                  if (user.isGuest) {
                    setModalType('AUTH');
                  } else {
                    setModalType('SOS');
                  }
                }}
                onVolunteerClick={() => {
                  if (user.isGuest) {
                    setModalType('AUTH');
                  } else {
                    setModalType('VOLUNTEER');
                  }
                }}
              />

              {/* Two latest messages */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '-4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Nejnovější hlášení
                  </span>
                  <span 
                    onClick={() => setActiveTab('ZPRÁVY')}
                    style={{ fontSize: '11px', fontWeight: '700', color: '#0A84FF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}
                  >
                    Zobrazit vše
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </span>
                </div>
                {LATEST_MESSAGES.slice(0, 2).map((msg, idx) => (
                  <div 
                    key={idx}
                    className="message-card-premium scale-active-click"
                    onClick={() => setActiveTab('ZPRÁVY')}
                    style={{ 
                      '--accent-color': msg.badgeColor,
                      textAlign: 'left'
                    } as React.CSSProperties}
                  >
                    {msg.type === 'alert' && <div className="pulse-indicator" />}
                    
                    <div className="message-icon-wrapper" style={{
                      background: msg.badgeBg,
                      border: `1.5px solid ${msg.badgeBorder}`,
                    }}>
                      {renderMessageIcon(msg.type)}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          fontSize: '9px', 
                          fontWeight: '800', 
                          textTransform: 'uppercase', 
                          color: msg.badgeColor,
                          letterSpacing: '0.05em'
                        }}>
                          {msg.badgeLabel}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>• {msg.time}</span>
                      </div>
                      <span style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: '1.3' }}>
                        {msg.title}
                      </span>
                    </div>

                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4, flexShrink: 0 }}>
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                ))}
              </div>

            </div>
          )}

          {activeTab === 'NÁVODY' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div className="liquid-glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#FFD60A' }}>💧 Jak filtrovat vodu svépomocí</span>
                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Použijte vrstvy čistého písku, aktivního uhlí a jemné tkaniny. Vodu před konzumací vždy převařte po dobu alespoň 5 minut k likvidaci mikrobů.
                </span>
              </div>
              <div className="liquid-glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#0A84FF' }}>⚡ Odpojení elektrických jističů</span>
                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Při hrozícím zatopení nemovitosti odpojte hlavní jistič ještě před příchodem vody. Nedotýkejte se elektrických jističů pod vodou či ve vlhku.
                </span>
              </div>
              <div className="liquid-glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#FF453A' }}>🚨 Evakuační zavazadlo</span>
                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Zabalte osobní doklady, léky na minimálně 3 dny, náhradní teplé oblečení, trvanlivé potraviny, pitnou vodu, svítilnu a plně nabitou powerbanku.
                </span>
              </div>
            </div>
          )}

          {activeTab === 'POMOC' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              <div className="liquid-glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-tertiary)' }}>Informační linka HZS</span>
                <span style={{ fontSize: '20px', fontWeight: '800', color: '#0A84FF' }}>950 800 111</span>
                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>Pro obecné neurgentní dotazy během povodňových stavů.</span>
              </div>
              <div className="liquid-glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-tertiary)' }}>Krizová psychologická pomoc</span>
                <span style={{ fontSize: '20px', fontWeight: '800', color: '#30D158' }}>116 123</span>
                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>Linka důvěry, k dispozici nonstop zdarma z celé ČR.</span>
              </div>
            </div>
          )}

          {activeTab === 'ZPRÁVY' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '750px', animation: 'fadeIn 0.25s ease-out' }}>
              {LATEST_MESSAGES.map((msg, idx) => (
                <div 
                  key={idx}
                  className="message-card-premium"
                  style={{ 
                    '--accent-color': msg.badgeColor,
                    alignItems: 'flex-start',
                    cursor: 'default'
                  } as React.CSSProperties}
                >
                  {msg.type === 'alert' && <div className="pulse-indicator" style={{ top: '6px', right: '6px' }} />}
                  
                  <div className="message-icon-wrapper" style={{
                    background: msg.badgeBg,
                    border: `1.5px solid ${msg.badgeBorder}`,
                    marginTop: '2px'
                  }}>
                    {renderMessageIcon(msg.type)}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        fontSize: '9px', 
                        fontWeight: '800', 
                        textTransform: 'uppercase', 
                        color: msg.badgeColor,
                        letterSpacing: '0.05em'
                      }}>
                        {msg.badgeLabel}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>• {msg.time}</span>
                    </div>
                    
                    <span style={{ fontSize: '15.5px', fontWeight: '750', color: 'var(--text-primary)', lineHeight: '1.3' }}>
                      {msg.title}
                    </span>
                    
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.45', fontWeight: '400' }}>
                      {msg.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'PROFIL' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px', animation: 'fadeIn 0.25s ease-out' }}>
              {user.isGuest ? (
                /* Guest Profile Card */
                <div className="liquid-glass-panel" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '18px', textAlign: 'center', alignItems: 'center' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'var(--segmented-bg)',
                    border: '1.5px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-tertiary)',
                    fontSize: '24px'
                  }}>
                    👤
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>Host (Nepřihlášený)</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                      Pro odesílání SOS signálů, registraci pomoci a komunikaci v síti je vyžadován ověřený krizový profil.
                    </span>
                  </div>
                  <button 
                    onClick={() => setModalType('AUTH')}
                    className="scale-active-click"
                    style={{
                      width: '100%',
                      maxWidth: '280px',
                      padding: '12px 20px',
                      background: '#0A84FF',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: '750',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(10, 132, 255, 0.2)',
                      marginTop: '8px'
                    }}
                  >
                    Vytvořit profil / Přihlásit se ↗
                  </button>
                </div>
              ) : (
                /* Normal Registered User Profile Card */
                <>
                  <div className="liquid-glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ 
                      width: '54px', 
                      height: '54px', 
                      borderRadius: '50%', 
                      background: 'rgba(10, 132, 255, 0.12)', 
                      border: '1px solid rgba(10, 132, 255, 0.25)',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '20px', 
                      fontWeight: '700',
                      color: '#0A84FF',
                      textTransform: 'uppercase'
                    }}>
                      {user.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '17px', fontWeight: '750' }}>{user.name}</span>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>📞 {user.phone}</span>
                        <span style={{ fontSize: '12px', color: '#30D158', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', marginTop: '2px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#30D158' }}></span>
                          Identifikátor ověřen offline (Mesh-ID)
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="liquid-glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Moje Skupiny & Role</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {user.isVolunteer && user.roles.length > 0 ? (
                        user.roles.map((role, rIdx) => (
                          <span 
                            key={rIdx} 
                            style={{ 
                              background: 'rgba(48, 209, 88, 0.1)', 
                              border: '1px solid rgba(48, 209, 88, 0.25)', 
                              color: '#30D158', 
                              fontSize: '11px', 
                              fontWeight: '700', 
                              padding: '6px 12px', 
                              borderRadius: '8px' 
                            }}
                          >
                            {role === 'Aktivní Dobrovolník' ? '🙋‍♂️ Fyzická pomoc' : role === 'První Pomoc' ? '🚑 První pomoc' : role === 'Transport' ? '🚗 Terénní logistika' : role}
                          </span>
                        ))
                      ) : (
                        <span style={{ background: 'var(--segmented-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: '700', padding: '6px 12px', borderRadius: '8px' }}>
                          Běžný Uživatel
                        </span>
                      )}
                      <span style={{ background: 'rgba(10, 132, 255, 0.1)', border: '1px solid rgba(10, 132, 255, 0.25)', color: '#0A84FF', fontSize: '11px', fontWeight: '700', padding: '6px 12px', borderRadius: '8px' }}>
                        📍 {user.zone.split(' - ')[1] || user.zone}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setUser(GUEST_USER)}
                    className="glass-btn-red scale-active-click"
                    style={{
                      padding: '12px 20px',
                      fontSize: '13px',
                      fontWeight: '700',
                      border: '1px solid rgba(255, 69, 58, 0.25)',
                      borderRadius: '10px',
                      color: '#FF453A',
                      cursor: 'pointer',
                      width: '100%',
                      maxWidth: '180px',
                      marginTop: '10px'
                    }}
                  >
                    Odhlásit se
                  </button>
                </>
              )}
            </div>
          )}

        </div>

        {/* ─── MOBILE BOTTOM NAVIGATION BAR ─── */}
        <BottomNavbar activeTab={activeTab} onTabChange={setActiveTab} />

      </div>

      {/* ─── INTERACTIVE MODALS (APPLE STRICT UI) ─── */}
      
      {/* 1. Offline Sync Status Modal */}
      {modalType === 'SYNC' && (
        <div className="glass-modal-backdrop" onClick={closeModal}>
          <div className="glass-modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '17px', color: '#FFD60A', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FFD60A' }} />
              Nouzová synchronizace
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0 0 20px 0' }}>
              Jste v nouzovém režimu bez připojení k internetu. Aplikace udržuje krizovou databázi zpráv a mapových podkladů sdílením s ostatními telefony v bezprostřední blízkosti (Mesh Network).
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '0 0 24px 0', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Spojení v okolí (Peer-to-Peer):</span>
                <span style={{ fontWeight: '700', color: '#30D158' }}>5 active nodes</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Velikost offline mapy:</span>
                <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>14.2 MB</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Poslední offline ověření:</span>
                <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>Dnes 08:12</span>
              </div>
            </div>
            <button 
              className="scale-active-click"
              onClick={closeModal}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--segmented-bg)',
                border: '1px solid var(--input-border)',
                borderRadius: '10px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              Hotovo
            </button>
          </div>
        </div>
      )}

      {/* 2. Map Legend Modal */}
      {modalType === 'LEGEND' && (
        <div className="glass-modal-backdrop" onClick={closeModal}>
          <div className="glass-modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', fontWeight: '700' }}>Legenda mapy</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '0 0 24px 0' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#30D158" strokeWidth="2.2">
                  <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-13-7-13S5 10.7 5 15a7 7 0 0 0 7 7z"/>
                </svg>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#30D158' }}>Odběrné místo pitné vody</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Zde je k dispozici nouzová pitná voda z cisteren nebo studní.</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2.2">
                  <path d="M19 10.5h-5.5V5h-3v5.5H5v3h5.5V19h3v-5.5H19v-3z"/>
                </svg>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#0A84FF' }}>Záchranná stanice / Pomoc</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Distribuce materiální a lékařské pomoci, přítomnost HZS.</span>
                </div>
              </div>
            </div>
            <button 
              className="scale-active-click"
              onClick={closeModal}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--segmented-bg)',
                border: '1px solid var(--input-border)',
                borderRadius: '10px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              Zavřít
            </button>
          </div>
        </div>
      )}

      {/* 3. Fullscreen Map Simulator Modal */}
      {modalType === 'MAP_FULL' && (
        <div className="glass-modal-backdrop" onClick={() => { setActiveMarker(null); closeModal(); }} style={{ padding: 0 }}>
          <div 
            className="glass-modal-content" 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              width: '100vw', 
              height: '100vh', 
              maxWidth: 'none', 
              borderRadius: 0, 
              border: 'none', 
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--bg-primary)'
            }}
          >
            {/* Interactive Full Map Grid */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div 
                style={{ 
                  position: 'absolute', 
                  inset: 0, 
                  opacity: 'var(--grid-opacity, 0.04)' as any, 
                  backgroundImage: 'linear-gradient(var(--grid-color, rgba(255,255,255,0.6)) 1px, transparent 1px), linear-gradient(90deg, var(--grid-color, rgba(255,255,255,0.6)) 1px, transparent 1px)', 
                  backgroundSize: '30px 30px' 
                }} 
              />
              
              <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', zIndex: 1, pointerEvents: 'none', position: 'absolute', top: '20px' }}>
                Simulátor Celoobrazovkové Mapy
              </div>

              {/* Water droplet */}
              <div 
                className="scale-active-click"
                onClick={() => handleMarkerClick('Odběrné místo pitné vody', 'U Vodárny 45 • Otevřeno 24/7')}
                style={{ position: 'absolute', top: '35%', left: '40%', cursor: 'pointer' }}
              >
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#30D158" strokeWidth="2.2">
                  <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-13-7-13S5 10.7 5 15a7 7 0 0 0 7 7z"/>
                </svg>
              </div>

              {/* Red Cross */}
              <div 
                className="scale-active-click"
                onClick={() => handleMarkerClick('Krizové centrum / Pomoc', 'Hasičská zbrojnice • Volná kapacita')}
                style={{ position: 'absolute', top: '60%', left: '55%', cursor: 'pointer' }}
              >
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2.2">
                  <path d="M19 10.5h-5.5V5h-3v5.5H5v3h5.5V19h3v-5.5H19v-3z"/>
                </svg>
              </div>
            </div>

            {/* Bottom floating banner inside fullscreen map */}
            <div 
              style={{ 
                padding: '16px 20px', 
                background: 'var(--modal-bg)', 
                backdropFilter: 'blur(20px)', 
                WebkitBackdropFilter: 'blur(20px)',
                borderTop: '1px solid var(--glass-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {activeMarker ? (
                  <>
                    <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0A84FF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      📍 {activeMarker.title}
                    </span>
                    <span style={{ fontSize: '12.5px', color: 'var(--text-primary)', fontWeight: '500' }}>
                      {activeMarker.desc}
                    </span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '13px', fontWeight: '750', color: 'var(--text-primary)' }}>Offline Režim Mapy</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Kliknutím na body na mapě zobrazíte informace • 50.0755° N, 14.4378° E</span>
                  </>
                )}
              </div>
              <button 
                className="scale-active-click"
                onClick={() => {
                  setActiveMarker(null);
                  closeModal();
                }}
                style={{
                  padding: '8px 16px',
                  background: '#0A84FF',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  outline: 'none',
                  flexShrink: 0
                }}
              >
                Zavřít Mapu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. SOS Emergency Modal */}
      {modalType === 'SOS' && (
        <div className="glass-modal-backdrop" onClick={closeModal}>
          <div className="glass-modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px', border: '1px solid rgba(255, 69, 58, 0.3)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '17px', color: '#FF453A', fontWeight: '700' }}>Vyslat SOS signál?</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0 0 20px 0' }}>
              Tato akce okamžitě odešle nouzový signál s vaší aktuální polohou všem uživatelům v mesh síti a záchranným složkám. Použijte pouze v případě přímého ohrožení.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="scale-active-click"
                onClick={closeModal}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'var(--segmented-bg)',
                  border: '1px solid var(--input-border)',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                Storno
              </button>
              <button 
                className="scale-active-click"
                onClick={() => {
                  alert('SOS signál byl úspěšně registrován a vyslán do mesh sítě.');
                  closeModal();
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#FF453A',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                Vyslat SOS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Volunteer Modal */}
      {modalType === 'VOLUNTEER' && (
        <div className="glass-modal-backdrop" onClick={closeModal}>
          <div className="glass-modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px', border: '1px solid rgba(48, 209, 88, 0.3)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '17px', color: '#30D158', fontWeight: '700' }}>Registrovat pomoc</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0 0 20px 0' }}>
              Chcete nabídnout své síly či prostředky v okolí? Vaše přihlášení a zvolená role budou sdíleny s krizovým štábem a ostatními koordinátory přes mesh síť.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '0 0 20px 0' }}>
              <button 
                className="scale-active-click"
                onClick={() => {
                  alert('Byl jste registrován jako dobrovolník pro fyzickou pomoc.');
                  closeModal();
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(48, 209, 88, 0.08)',
                  border: '1px solid rgba(48, 209, 88, 0.2)',
                  borderRadius: '10px',
                  color: '#30D158',
                  fontSize: '13px',
                  fontWeight: '700',
                  textAlign: 'left',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                🙋‍♂️ Fyzická pomoc (odklízení zátarasů)
              </button>
              <button 
                className="scale-active-click"
                onClick={() => {
                  alert('Byl jste registrován jako dobrovolník pro transport.');
                  closeModal();
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(10, 132, 255, 0.08)',
                  border: '1px solid rgba(10, 132, 255, 0.2)',
                  borderRadius: '10px',
                  color: '#0A84FF',
                  fontSize: '13px',
                  fontWeight: '700',
                  textAlign: 'left',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                🚗 Transport osob (4x4 vozidlo)
              </button>
            </div>
            <button 
              className="scale-active-click"
              onClick={closeModal}
              style={{
                width: '100%',
                padding: '8px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-tertiary)',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              Zrušit
            </button>
          </div>
        </div>
      )}

      {/* 6. AI Advisor Chat Modal */}
      {modalType === 'AI' && (
        <div className="glass-modal-backdrop" onClick={closeModal}>
          <div className="glass-modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px', width: '95%', maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 16px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0A84FF' }} />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Offline AI Advisor</h3>
              </div>
              <button onClick={closeModal} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>

            {/* Chat Simulator Content */}
            <div style={{ height: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', margin: '0 0 20px 0', paddingRight: '4px' }}>
              <div style={{ alignSelf: 'flex-start', background: 'var(--segmented-bg)', padding: '10px 14px', borderRadius: '12px 12px 12px 0', fontSize: '12.5px', lineHeight: '1.45', maxWidth: '85%' }}>
                Dobrý den. Jsem lokální model běžící přímo ve Vašem zařízení. Mám uložené kompletní offline příručky civilní ochrany a první pomoci. S čím Vám mohu pomoci?
              </div>
              <div style={{ alignSelf: 'flex-end', background: '#0A84FF', padding: '10px 14px', borderRadius: '12px 12px 0 12px', fontSize: '12.5px', lineHeight: '1.45', maxWidth: '85%' }}>
                Jak si připravit pitnou vodu?
              </div>
              <div style={{ alignSelf: 'flex-start', background: 'var(--segmented-bg)', padding: '10px 14px', borderRadius: '12px 12px 12px 0', fontSize: '12.5px', lineHeight: '1.45', maxWidth: '85%' }}>
                1. <strong>Hrubá filtrace:</strong> Přefiltrujte surovou vodu přes čistou látku k odstranění hrubého sedimentu.<br/>
                2. <strong>Dezinfekce varem:</strong> Nechte přefiltrovanou vodu projít varem po dobu minimálně 1-3 minut.<br/>
                3. Alternativně lze využít certifikované chlorové tablety.
              </div>
            </div>

            {/* Input block */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="Zeptejte se offline AI..." 
                disabled
                style={{
                  flex: 1,
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: 'var(--text-primary)',
                  fontSize: '12.5px',
                  outline: 'none'
                }}
              />
              <button 
                style={{
                  background: 'var(--segmented-bg)',
                  border: '1px solid var(--input-border)',
                  borderRadius: '10px',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'not-allowed',
                  opacity: 0.6,
                  color: 'var(--text-secondary)'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Auth Modal */}
      {modalType === 'AUTH' && (
        <div className="glass-modal-backdrop" onClick={closeModal}>
          <div className="glass-modal-content" onClick={(e) => e.stopPropagation()} style={{ border: 'none', background: 'transparent' }}>
            <AuthForm 
              onSuccess={(u) => {
                setUser(u);
                closeModal();
              }}
              onClose={closeModal}
            />
          </div>
        </div>
      )}

    </div>
  );
}
