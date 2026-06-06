interface TopBannerProps {
  onClick?: () => void;
  statusText?: string;
  updateTime?: string;
  onProfileClick: () => void;
  lang?: "cs" | "en";
}

export default function TopBanner({
  onClick,
  statusText,
  updateTime = "08:12",
  onProfileClick,
  lang = "en"
}: TopBannerProps) {
  const resolvedStatus = statusText || (lang === "cs" ? "Nouzový Offline Režim" : "Emergency Offline Mode");

  return (
    <div
      className="liquid-glass-yellow-banner top-banner-mobile-trim"
      onClick={onClick}
      style={{
        width: '100%',
        padding: '14px 16px',
        paddingTop: 'calc(14px + env(safe-area-inset-top))',
        paddingLeft: 'calc(16px + env(safe-area-inset-left))',
        paddingRight: 'calc(16px + env(safe-area-inset-right))',
        fontSize: '13px',
        fontWeight: '600',
        color: 'var(--color-accent)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxSizing: 'border-box',
        zIndex: 10,
        cursor: 'pointer',
        userSelect: 'none',
        gap: '8px',
        flexWrap: 'wrap'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ 
          width: '8px', 
          height: '8px', 
          borderRadius: '50%', 
          background: 'var(--color-accent)', 
          display: 'inline-block'
        }}></span>
        <span>{resolvedStatus}</span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <span style={{ opacity: 0.8 }}>{lang === "cs" ? "Aktualizováno" : "Updated"}: {updateTime}</span>
        
        {/* Settings Button (formerly Profile) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onProfileClick();
          }}
          className="scale-active-click"
          style={{
            background: 'rgba(var(--prague-yellow-rgb), 0.08)',
            border: '1.5px solid rgba(var(--prague-yellow-rgb), 0.25)',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            color: 'var(--color-accent)',
            transition: 'all 0.2s ease',
            outline: 'none',
            flexShrink: 0,
            aspectRatio: '1/1'
          }}
          title={lang === "cs" ? "Nastavení" : "Settings"}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
