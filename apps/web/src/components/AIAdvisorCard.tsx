interface AIAdvisorCardProps {
  onOpen?: () => void;
}

export default function AIAdvisorCard({ onOpen }: AIAdvisorCardProps) {
  return (
    <div 
      className="liquid-glass-panel"
      onClick={onOpen}
      style={{
        padding: '18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxSizing: 'border-box',
        cursor: 'pointer',
        gap: '12px',
        background: 'var(--glass-bg)'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            background: '#0A84FF', 
            display: 'inline-block'
          }} />
          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Offline AI Advisor
          </span>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
          Lokální model. Rady pro filtrování vody a zacházení s jističi bez sítě.
        </span>
      </div>
      <button 
        className="scale-active-click"
        onClick={(e) => {
          e.stopPropagation();
          onOpen?.();
        }}
        style={{ 
          color: '#0A84FF', 
          fontSize: '12px', 
          fontWeight: '700', 
          whiteSpace: 'nowrap', 
          background: 'rgba(10, 132, 255, 0.08)', 
          padding: '8px 14px', 
          borderRadius: '8px', 
          border: '1px solid rgba(10, 132, 255, 0.2)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          cursor: 'pointer'
        }}
      >
        Otevřít
      </button>
    </div>
  );
}
