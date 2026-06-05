interface ActionButtonsProps {
  onSosClick?: () => void;
  onVolunteerClick?: () => void;
}

export default function ActionButtons({
  onSosClick,
  onVolunteerClick
}: ActionButtonsProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', width: '100%', boxSizing: 'border-box' }}>
      
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
        <span style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '0.01em', color: '#FF453A' }}>SOS NOUZE</span>
        <span style={{ fontSize: '11px', color: '#FF453A', opacity: 0.8, fontWeight: '600' }}>Potřebuji pomoc</span>
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
        <span style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '0.01em', color: '#30D158' }}>DOBROVOLNÍK</span>
        <span style={{ fontSize: '11px', color: '#30D158', opacity: 0.8, fontWeight: '600' }}>Mohu pomoct</span>
      </button>

    </div>
  );
}
