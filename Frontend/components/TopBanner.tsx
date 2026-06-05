interface TopBannerProps {
  onClick?: () => void;
  statusText?: string;
  updateTime?: string;
  isLightTheme: boolean;
  onThemeToggle: () => void;
}

export default function TopBanner({
  onClick,
  statusText = "Nouzový Offline Režim",
  updateTime = "08:12",
  isLightTheme,
  onThemeToggle
}: TopBannerProps) {
  return (
    <div 
      className="liquid-glass-yellow-banner"
      onClick={onClick}
      style={{
        width: '100%',
        padding: '14px 16px',
        fontSize: '13px',
        fontWeight: '600',
        color: '#FFD60A',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxSizing: 'border-box',
        zIndex: 10,
        cursor: 'pointer',
        userSelect: 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ 
          width: '8px', 
          height: '8px', 
          borderRadius: '50%', 
          background: '#FFD60A', 
          display: 'inline-block'
        }}></span>
        <span>{statusText}</span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <span style={{ opacity: 0.8 }}>Aktualizováno: {updateTime}</span>
        
        {/* Theme Toggle Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onThemeToggle();
          }}
          className="scale-active-click"
          style={{
            background: 'rgba(255, 214, 10, 0.08)',
            border: '1.5px solid rgba(255, 214, 10, 0.25)',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            color: '#FFD60A',
            transition: 'all 0.2s ease',
            outline: 'none'
          }}
          title={isLightTheme ? "Aktivovat tmavý režim" : "Aktivovat světlý režim"}
        >
          {isLightTheme ? (
            /* Moon icon */
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            /* Sun icon */
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" fill="rgba(255, 214, 10, 0.1)"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="7.07"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
