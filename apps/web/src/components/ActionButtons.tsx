interface ActionButtonsProps {
  onSosClick?: () => void;
  onVolunteerClick?: () => void;
  lang?: "cs" | "en";
}

export default function ActionButtons({
  onSosClick,
  onVolunteerClick,
  lang = "en"
}: ActionButtonsProps) {
  return (
    <div className="action-buttons-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', width: '100%', boxSizing: 'border-box' }}>
      
      {/* SOS NOUZE BUTTON */}
      <button 
        className="glass-btn-red"
        onClick={onSosClick}
        style={{
          padding: '18px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          textAlign: 'left',
          alignItems: 'flex-start',
          justifyContent: 'center',
          outline: 'none'
        }}
      >
        <span style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '0.01em', color: 'var(--color-danger)' }}>
          {lang === "cs" ? "SOS NOUZE" : "SOS EMERGENCY"}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--color-danger)', opacity: 0.8, fontWeight: '600' }}>
          {lang === "cs" ? "Potřebuji pomoc" : "I need help"}
        </span>
      </button>

      {/* DOBROVOLNÍK BUTTON */}
      <button 
        className="glass-btn-green"
        onClick={onVolunteerClick}
        style={{
          padding: '18px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          textAlign: 'left',
          alignItems: 'flex-start',
          justifyContent: 'center',
          outline: 'none'
        }}
      >
        <span style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '0.01em', color: 'var(--color-success)' }}>
          {lang === "cs" ? "DOBROVOLNÍK" : "VOLUNTEER"}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--color-success)', opacity: 0.8, fontWeight: '600' }}>
          {lang === "cs" ? "Mohu pomoct" : "I can help"}
        </span>
      </button>

    </div>
  );
}
