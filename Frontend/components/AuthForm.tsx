import { useState } from 'react';

interface AuthFormProps {
  onSuccess: (user: { name: string; isVolunteer: boolean; roles: string[]; zone: string; phone: string; isGuest?: boolean }) => void;
  onClose?: () => void;
}

type Mode = 'LOGIN' | 'REGISTER';

export default function AuthForm({ onSuccess, onClose }: AuthFormProps) {
  const [mode, setMode] = useState<Mode>('LOGIN');
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [zone, setZone] = useState('Praha 4 (Zóna A - Pankrác)');
  const [isVolunteer, setIsVolunteer] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // Toggle role helper
  const toggleRole = (role: string) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Simple validations
    if (!phone.trim()) {
      setError('Zadejte prosím své telefonní číslo.');
      return;
    }
    if (pin.length < 6) {
      setError('PIN musí mít alespoň 6 číslic.');
      return;
    }

    if (mode === 'REGISTER') {
      if (!name.trim()) {
        setError('Zadejte prosím své celé jméno.');
        return;
      }
      
      // Success Registration
      onSuccess({
        name: name.trim(),
        isVolunteer,
        roles: isVolunteer ? selectedRoles : [],
        zone,
        phone: phone.trim(),
        isGuest: false
      });
    } else {
      // Success Login
      onSuccess({
        name: 'Jan Dvořák',
        isVolunteer: true,
        roles: ['Aktivní Dobrovolník', 'Zóna A (Pankrác)'],
        zone: 'Praha 4 (Zóna A - Pankrác)',
        phone: phone.trim(),
        isGuest: false
      });
    }
  };

  // Bypass login for quick developer preview
  const handleBypass = () => {
    onSuccess({
      name: 'Jan Dvořák',
      isVolunteer: true,
      roles: ['Aktivní Dobrovolník', 'Zóna A (Pankrác)'],
      zone: 'Praha 4 (Zóna A - Pankrác)',
      phone: '+420 777 123 456',
      isGuest: false
    });
  };

  return (
    <div 
      className="liquid-glass-panel"
      style={{
        width: '100%',
        padding: '32px 24px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        animation: 'fadeIn 0.3s ease-out',
        position: 'relative',
        background: 'var(--modal-bg)', /* Solid apple slate glass for modal overlay */
        border: '1px solid var(--modal-border)'
      }}
    >
      {/* Optional Close Button */}
      {onClose && (
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-tertiary)',
            fontSize: '22px',
            cursor: 'pointer',
            lineHeight: '1',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
          }}
          title="Zavřít"
        >
          ×
        </button>
      )}

      {/* Header / Logo Icon */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: 'rgba(10, 132, 255, 0.1)',
          border: '1.5px solid rgba(10, 132, 255, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#0A84FF',
          marginBottom: '4px'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <span style={{ fontSize: '11px', fontWeight: '800', color: '#0A84FF', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Nouzová Mesh Síť
        </span>
        <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          {mode === 'LOGIN' ? 'Přihlášení k profilu' : 'Vytvořit krizový profil'}
        </h2>
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
          {mode === 'LOGIN' 
            ? 'Přihlaste se ke svému krizovému účtu pomocí telefonu a zabezpečeného PINu.'
            : 'Zaregistrujte svůj profil offline do mesh sítě, abyste mohli koordinovat pomoc.'}
        </p>
      </div>

      {/* Mode switcher tabs */}
      <div className="glass-segmented-control">
        <button 
          type="button"
          className={`glass-segment ${mode === 'LOGIN' ? 'active' : ''}`}
          onClick={() => { setMode('LOGIN'); setError(null); }}
        >
          Přihlášení
        </button>
        <button 
          type="button"
          className={`glass-segment ${mode === 'REGISTER' ? 'active' : ''}`}
          onClick={() => { setMode('REGISTER'); setError(null); }}
        >
          Registrace
        </button>
      </div>

      {/* Error alert */}
      {error && (
        <div style={{
          background: 'rgba(255, 69, 58, 0.08)',
          border: '1px solid rgba(255, 69, 58, 0.25)',
          borderRadius: '10px',
          padding: '12px 14px',
          color: '#FF453A',
          fontSize: '12.5px',
          fontWeight: '600',
          lineHeight: '1.4',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Main form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        
        {mode === 'REGISTER' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Celé jméno
            </label>
            <input 
              type="text" 
              className="glass-input" 
              placeholder="Např. Jan Dvořák"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Telefonní číslo
          </label>
          <input 
            type="tel" 
            className="glass-input" 
            placeholder="Např. +420 777 123 456"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {mode === 'LOGIN' ? 'Krizový PIN (kód)' : 'Vytvořit zabezpečovací PIN (min. 6 číslic)'}
          </label>
          <input 
            type="password" 
            maxLength={12}
            className="glass-input" 
            placeholder="••••••"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          />
        </div>

        {mode === 'REGISTER' && (
          <>
            {/* Zone Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Krizová lokální zóna
              </label>
              <select 
                className="glass-input glass-select"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                <option value="Praha 4 (Zóna A - Pankrác)">Praha 4 (Zóna A - Pankrác)</option>
                <option value="Praha 1 (Zóna B - Staré Město)">Praha 1 (Zóna B - Staré Město)</option>
                <option value="Praha 8 (Zóna C - Karlín)">Praha 8 (Zóna C - Karlín)</option>
                <option value="Praha 5 (Zóna D - Smíchov)">Praha 5 (Zóna D - Smíchov)</option>
              </select>
            </div>

            {/* Volunteer Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
              <div 
                className="glass-checkbox-container"
                onClick={() => setIsVolunteer(!isVolunteer)}
              >
                <div className={`glass-checkbox ${isVolunteer ? 'checked' : ''}`}>
                  {isVolunteer && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <span style={{ fontWeight: '600' }}>Nabídnout pomoc jako dobrovolník</span>
              </div>

              {isVolunteer && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  padding: '12px 14px',
                  background: 'var(--segmented-bg)',
                  borderRadius: '8px',
                  border: '1px solid var(--input-border)',
                  marginTop: '2px',
                  animation: 'fadeIn 0.2s ease-out'
                }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '2px' }}>
                    Vyberte dovednosti/prostředky:
                  </span>
                  
                  <div className="glass-checkbox-container" onClick={() => toggleRole('Aktivní Dobrovolník')}>
                    <div className={`glass-checkbox ${selectedRoles.includes('Aktivní Dobrovolník') ? 'checked' : ''}`}>
                      {selectedRoles.includes('Aktivní Dobrovolník') && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <span>🙋‍♂️ Fyzická pomoc (klízení zátarasů)</span>
                  </div>

                  <div className="glass-checkbox-container" onClick={() => toggleRole('První Pomoc')}>
                    <div className={`glass-checkbox ${selectedRoles.includes('První Pomoc') ? 'checked' : ''}`}>
                      {selectedRoles.includes('První Pomoc') && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <span>🚑 Zdravotník / První pomoc</span>
                  </div>

                  <div className="glass-checkbox-container" onClick={() => toggleRole('Transport')}>
                    <div className={`glass-checkbox ${selectedRoles.includes('Transport') ? 'checked' : ''}`}>
                      {selectedRoles.includes('Transport') && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <span>🚗 Přeprava osob (4x4 auto)</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Action button */}
        <button 
          type="submit"
          className="scale-active-click"
          style={{
            width: '100%',
            padding: '13px',
            background: '#30D158', /* Strict Apple green accent button */
            border: 'none',
            borderRadius: '10px',
            color: '#FFFFFF',
            fontSize: '14px',
            fontWeight: '750',
            cursor: 'pointer',
            outline: 'none',
            boxShadow: '0 4px 12px rgba(48, 209, 88, 0.2)',
            marginTop: '8px'
          }}
        >
          {mode === 'LOGIN' ? 'Přihlásit se' : 'Zaregistrovat profil'}
        </button>
      </form>

      {/* Separator / Bypass */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        borderTop: '1px solid var(--glass-border)',
        paddingTop: '18px',
        marginTop: '6px'
      }}>
        <span 
          onClick={handleBypass}
          style={{ 
            fontSize: '12.5px', 
            color: '#0A84FF', 
            fontWeight: '600', 
            cursor: 'pointer',
            transition: 'opacity 0.15s ease'
          }}
          className="scale-active-click"
        >
          Přihlásit se jako host (Jan Dvořák) ↗
        </span>
      </div>
    </div>
  );
}
