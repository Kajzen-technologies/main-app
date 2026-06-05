interface MapCardProps {
  onOpenFullscreen?: () => void;
  onShowLegend?: () => void;
  onMarkerClick?: (markerName: string, details: string) => void;
}

export default function MapCard({
  onOpenFullscreen,
  onShowLegend
}: MapCardProps) {
  return (
    <div 
      className="liquid-glass-panel scale-active-click"
      onClick={onOpenFullscreen}
      style={{
        width: '100%',
        height: '240px',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        boxSizing: 'border-box',
        background: 'var(--glass-bg)',
        cursor: 'pointer'
      }}
    >
      {/* Muted Clean Grid Background (Strict style, not neon) */}
      <div 
        style={{ 
          position: 'absolute', 
          inset: 0, 
          opacity: 'var(--grid-opacity, 0.04)' as any, 
          backgroundImage: 'linear-gradient(var(--grid-color, rgba(255, 255, 255, 0.6)) 1px, transparent 1px), linear-gradient(90deg, var(--grid-color, rgba(255, 255, 255, 0.6)) 1px, transparent 1px)', 
          backgroundSize: '24px 24px' 
        }} 
      />

      {/* Target Reticle Indicator - Muted */}
      <div 
        style={{
          position: 'absolute',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          border: '1px solid var(--grid-color, rgba(255, 255, 255, 0.08))',
          background: 'transparent'
        }}
      />
      <div 
        style={{
          position: 'absolute',
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: '#30D158',
          opacity: 0.6
        }}
      />

      {/* ─── LEGEND BUTTON ─── */}
      <button 
        className="scale-active-click"
        onClick={(e) => {
          e.stopPropagation();
          onShowLegend?.();
        }}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '13px',
          fontWeight: '600',
          color: 'var(--text-primary)',
          zIndex: 5,
          cursor: 'pointer',
          background: 'var(--segmented-bg)',
          border: '1px solid var(--input-border)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: '0 2px 8px var(--card-shadow)'
        }} 
        title="Legenda mapy"
      >
        ?
      </button>

      {/* ─── STATIC STRICT VECTOR MARKERS (VISUAL ONLY) ─── */}
      {/* Marker: Water (Water drop) */}
      <div 
        style={{ 
          position: 'absolute', 
          top: '25%', 
          left: '25%', 
          width: '40px', 
          height: '40px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center'
        }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#30D158" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-13-7-13S5 10.7 5 15a7 7 0 0 0 7 7z"/>
        </svg>
      </div>

      {/* Marker: Medical / Crisis Center (Red Cross) */}
      <div 
        style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '68%', 
          width: '40px', 
          height: '40px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center'
        }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 10.5h-5.5V5h-3v5.5H5v3h5.5V19h3v-5.5H19v-3z"/>
        </svg>
      </div>
    </div>
  );
}
