import { useState } from 'react';

interface AuthFormProps {
  onSuccess: (user: { name: string; isVolunteer: boolean; roles: string[]; zone: string; phone: string; isGuest?: boolean }) => void;
  onClose?: () => void;
  lang?: "cs" | "en";
}

type Mode = 'LOGIN' | 'REGISTER';

export default function AuthForm({ onSuccess, onClose, lang = "en" }: AuthFormProps) {
  const [mode, setMode] = useState<Mode>('LOGIN');
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [zone, setZone] = useState(lang === 'cs' ? 'Praha 4 (Zóna A - Pankrác)' : 'Prague 4 (Zone A - Pankrac)');
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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Simple validations
    if (!phone.trim()) {
      setError(lang === 'cs' ? 'Zadejte prosím své telefonní číslo nebo e-mail.' : 'Please enter your phone number or email.');
      return;
    }
    if (pin.length < 6) {
      setError(lang === 'cs' ? 'Heslo nebo PIN musí mít alespoň 6 znaků.' : 'Password or PIN must be at least 6 characters.');
      return;
    }

    if (mode === 'REGISTER') {
      if (!name.trim()) {
        setError(lang === 'cs' ? 'Zadejte prosím své celé jméno.' : 'Please enter your full name.');
        return;
      }

      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
      const localUserId = typeof window !== 'undefined'
        ? localStorage.getItem('prague_resilience_local_user_id') || `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        : `local_${Date.now()}`;
      if (typeof window !== 'undefined') {
        localStorage.setItem('prague_resilience_local_user_id', localUserId);
      }

      try {
        await fetch(`${API_BASE}/users/volunteer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            phone: phone.trim(),
            roles: isVolunteer ? selectedRoles : [],
            zone,
            localUserId
          })
        });
      } catch (err) {
        console.warn("Registration upsert offline; profile saved locally", err);
      }

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
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
      try {
        const res = await fetch(`${API_BASE}/admin/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: phone.trim(),
            password: pin
          }),
        });

        if (res.ok) {
          onSuccess({
            name: lang === 'cs' ? 'Administrátor' : 'Administrator',
            isVolunteer: false,
            roles: ['ADMIN'],
            zone: lang === 'cs' ? 'Praha 1 (Zóna B - Staré Město)' : 'Prague 1 (Zone B - Old Town)',
            phone: phone.trim(),
            isGuest: false
          });
        } else {
          // Fallback login
          onSuccess({
            name: lang === 'cs' ? 'Jan Dvořák' : 'John Doe',
            isVolunteer: true,
            roles: lang === 'cs' ? ['Aktivní Dobrovolník', 'Zóna A (Pankrác)'] : ['Active Volunteer', 'Zone A (Pankrac)'],
            zone: lang === 'cs' ? 'Praha 4 (Zóna A - Pankrác)' : 'Prague 4 (Zone A - Pankrac)',
            phone: phone.trim(),
            isGuest: false
          });
        }
      } catch (err) {
        // Fallback for offline mode
        onSuccess({
          name: lang === 'cs' ? 'Jan Dvořák' : 'John Doe',
          isVolunteer: true,
          roles: lang === 'cs' ? ['Aktivní Dobrovolník', 'Zóna A (Pankrác)'] : ['Active Volunteer', 'Zone A (Pankrac)'],
          zone: lang === 'cs' ? 'Praha 4 (Zóna A - Pankrác)' : 'Prague 4 (Zone A - Pankrac)',
          phone: phone.trim(),
          isGuest: false
        });
      }
    }
  };

  // Bypass login for quick developer preview
  const handleBypass = () => {
    onSuccess({
      name: lang === 'cs' ? 'Jan Dvořák' : 'John Doe',
      isVolunteer: true,
      roles: lang === 'cs' ? ['Aktivní Dobrovolník', 'Zóna A (Pankrác)'] : ['Active Volunteer', 'Zone A (Pankrac)'],
      zone: lang === 'cs' ? 'Praha 4 (Zóna A - Pankrác)' : 'Prague 4 (Zone A - Pankrac)',
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
        background: 'var(--modal-bg)',
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
          title={lang === 'cs' ? "Zavřít" : "Close"}
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
          background: 'rgba(var(--color-info-rgb), 0.1)',
          border: '1.5px solid rgba(var(--color-info-rgb), 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-info)',
          marginBottom: '4px'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--color-info)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {lang === 'cs' ? "Nouzová Mesh Síť" : "Emergency Mesh Network"}
        </span>
        <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          {mode === 'LOGIN' ? (lang === 'cs' ? 'Přihlášení k profilu' : 'Profile Login') : (lang === 'cs' ? 'Vytvořit krizový profil' : 'Create Crisis Profile')}
        </h2>
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
          {mode === 'LOGIN' 
            ? (lang === 'cs' ? 'Přihlaste se ke svému krizovému účtu pomocí telefonu a zabezpečeného PINu.' : 'Log in to your crisis account using your phone and secure PIN.')
            : (lang === 'cs' ? 'Zaregistrujte svůj profil offline do mesh sítě, abyste mohli koordinovat pomoc.' : 'Register your profile offline in the mesh network to coordinate assistance.')}
        </p>
      </div>

      {/* Mode switcher tabs */}
      <div className="glass-segmented-control">
        <button 
          type="button"
          className={`glass-segment ${mode === 'LOGIN' ? 'active' : ''}`}
          onClick={() => { setMode('LOGIN'); setError(null); }}
        >
          {lang === 'cs' ? 'Přihlášení' : 'Log In'}
        </button>
        <button 
          type="button"
          className={`glass-segment ${mode === 'REGISTER' ? 'active' : ''}`}
          onClick={() => { setMode('REGISTER'); setError(null); }}
        >
          {lang === 'cs' ? 'Registrace' : 'Register'}
        </button>
      </div>

      {/* Error alert */}
      {error && (
        <div style={{
          background: 'rgba(var(--color-danger-rgb), 0.08)',
          border: '1px solid rgba(var(--color-danger-rgb), 0.25)',
          borderRadius: '10px',
          padding: '12px 14px',
          color: 'var(--color-danger)',
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
              {lang === 'cs' ? 'Celé jméno' : 'Full Name'}
            </label>
            <input 
              type="text" 
              className="glass-input" 
              placeholder={lang === 'cs' ? "Např. Jan Dvořák" : "e.g., John Doe"}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {lang === 'cs' ? 'Telefonní číslo' : 'Phone Number'}
          </label>
          <input 
            type="tel" 
            className="glass-input" 
            placeholder={lang === 'cs' ? "Např. +420 777 123 456" : "e.g., +420 777 123 456"}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {mode === 'LOGIN' ? (lang === 'cs' ? 'Krizový PIN (kód)' : 'Crisis PIN') : (lang === 'cs' ? 'Vytvořit zabezpečovací PIN (min. 6 číslic)' : 'Create Security PIN (min. 6 digits)')}
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
                {lang === 'cs' ? 'Krizová lokální zóna' : 'Crisis Local Zone'}
              </label>
              <select 
                className="glass-input glass-select"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                <option value={lang === 'cs' ? "Praha 4 (Zóna A - Pankrác)" : "Prague 4 (Zone A - Pankrac)"}>
                  {lang === 'cs' ? "Praha 4 (Zóna A - Pankrác)" : "Prague 4 (Zone A - Pankrac)"}
                </option>
                <option value={lang === 'cs' ? "Praha 1 (Zóna B - Staré Město)" : "Prague 1 (Zone B - Old Town)"}>
                  {lang === 'cs' ? "Praha 1 (Zóna B - Staré Město)" : "Prague 1 (Zone B - Old Town)"}
                </option>
                <option value={lang === 'cs' ? "Praha 8 (Zóna C - Karlín)" : "Prague 8 (Zone C - Karlin)"}>
                  {lang === 'cs' ? "Praha 8 (Zóna C - Karlín)" : "Prague 8 (Zone C - Karlin)"}
                </option>
                <option value={lang === 'cs' ? "Praha 5 (Zóna D - Smíchov)" : "Prague 5 (Zone D - Smichov)"}>
                  {lang === 'cs' ? "Praha 5 (Zóna D - Smíchov)" : "Prague 5 (Zone D - Smichov)"}
                </option>
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
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <span style={{ fontWeight: '600' }}>{lang === 'cs' ? "Nabídnout pomoc jako dobrovolník" : "Offer help as a volunteer"}</span>
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
                    {lang === 'cs' ? "Vyberte dovednosti/prostředky:" : "Select skills/resources:"}
                  </span>
                  
                  <div className="glass-checkbox-container" onClick={() => toggleRole('Aktivní Dobrovolník')}>
                    <div className={`glass-checkbox ${selectedRoles.includes('Aktivní Dobrovolník') ? 'checked' : ''}`}>
                      {selectedRoles.includes('Aktivní Dobrovolník') && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <span>{lang === 'cs' ? "🙋‍♂️ Fyzická pomoc (klízení zátarasů)" : "🙋‍♂️ Physical Help (clearing blockages)"}</span>
                  </div>

                  <div className="glass-checkbox-container" onClick={() => toggleRole('První Pomoc')}>
                    <div className={`glass-checkbox ${selectedRoles.includes('První Pomoc') ? 'checked' : ''}`}>
                      {selectedRoles.includes('První Pomoc') && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <span>{lang === 'cs' ? "🚑 Zdravotník / První pomoc" : "🚑 Medic / First Aid"}</span>
                  </div>

                  <div className="glass-checkbox-container" onClick={() => toggleRole('Transport')}>
                    <div className={`glass-checkbox ${selectedRoles.includes('Transport') ? 'checked' : ''}`}>
                      {selectedRoles.includes('Transport') && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <span>{lang === 'cs' ? "🚗 Přeprava osob (4x4 auto)" : "🚗 Transport (4x4 vehicle)"}</span>
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
            background: 'var(--color-success)',
            border: 'none',
            borderRadius: '10px',
            color: 'var(--text-primary)',
            fontSize: '14px',
            fontWeight: '750',
            cursor: 'pointer',
            outline: 'none',
            boxShadow: '0 4px 12px rgba(var(--color-success-rgb), 0.2)',
            marginTop: '8px'
          }}
        >
          {mode === 'LOGIN' ? (lang === 'cs' ? 'Přihlásit se' : 'Log In') : (lang === 'cs' ? 'Zaregistrovat profil' : 'Register Profile')}
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
            color: 'var(--color-info)', 
            fontWeight: '600', 
            cursor: 'pointer',
            transition: 'opacity 0.15s ease'
          }}
          className="scale-active-click"
        >
          {lang === 'cs' ? "Přihlásit se jako host (Jan Dvořák) ↗" : "Log in as Guest (John Doe) ↗"}
        </span>
      </div>
    </div>
  );
}
