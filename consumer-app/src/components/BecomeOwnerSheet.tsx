'use client';

import { useState } from 'react';

const ACCENT = '#1E3A5C';

// Become-owner onboarding: phone (OTP verify) + address → owner mode → redirect.
// redirectTo defaults to the provider dashboard; pass '/list' for the listing wizard.
export default function BecomeOwnerSheet({ onClose, redirectTo }: { onClose: () => void; redirectTo?: string }) {
  const dest = redirectTo || '/dashboard';
  const [step, setStep]       = useState<'phone' | 'verify'>('phone');
  const [phone, setPhone]     = useState('');
  const [code, setCode]       = useState('');
  const [address, setAddress] = useState('');
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState('');

  async function sendCode() {
    setError('');
    if (!phone.trim()) { setError('Enter your phone number'); return; }
    setBusy(true);
    try {
      // Create owner profile + flip role first (verify-phone needs the owner row).
      await fetch('/api/owners/intent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const res = await fetch('/api/owners/verify-phone', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      if (!res.ok) throw new Error();
      setStep('verify');
    } catch {
      setError('Could not send code. Try again.');
    } finally { setBusy(false); }
  }

  async function finish() {
    setError('');
    if (!code.trim()) { setError('Enter the code sent to your phone'); return; }
    if (!address.trim()) { setError('Enter your address'); return; }
    setBusy(true);
    try {
      // Save address, then verify the phone code.
      await fetch('/api/owners/intent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: address.trim() }) });
      const res = await fetch('/api/owners/verify-phone', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), code: code.trim() }),
      });
      if (!res.ok) throw new Error();
      window.location.href = dest;
    } catch {
      setError('Invalid or expired code.');
      setBusy(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 44, padding: '0 14px', borderRadius: 12,
    border: '1px solid #DCE2EA', fontFamily: 'inherit', fontSize: 14, color: '#15243B', outline: 'none',
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(20,36,59,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 20, padding: 26, boxShadow: '0 18px 50px rgba(20,36,59,.25)' }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: '#15243B', marginBottom: 4 }}>Become an owner</div>
        <p style={{ fontSize: 13, color: '#8893A4', margin: '0 0 18px' }}>
          {step === 'phone'
            ? 'Verify your phone to list and manage properties.'
            : `Enter the code sent to ${phone} and your address.`}
        </p>

        {step === 'phone' && (
          <input style={inputStyle} placeholder="Phone (e.g. 01711XXXXXX)" value={phone} onChange={e => setPhone(e.target.value)} />
        )}

        {step === 'verify' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input style={inputStyle} placeholder="6-digit code" value={code} onChange={e => setCode(e.target.value)} />
            <input style={inputStyle} placeholder="Address (house, road, area)" value={address} onChange={e => setAddress(e.target.value)} />
          </div>
        )}

        {error && <div style={{ marginTop: 12, fontSize: 12.5, color: '#C0392B' }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} disabled={busy}
            style={{ flex: '0 0 auto', height: 44, padding: '0 18px', borderRadius: 12, border: '1px solid #E2E7EE', background: '#fff', color: '#44506A', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancel
          </button>
          <button onClick={step === 'phone' ? sendCode : finish} disabled={busy}
            style={{ flex: 1, height: 44, borderRadius: 12, border: 'none', background: ACCENT, color: '#fff', fontSize: 14, fontWeight: 700, cursor: busy ? 'default' : 'pointer', fontFamily: 'inherit', opacity: busy ? 0.6 : 1 }}>
            {busy ? 'Please wait…' : step === 'phone' ? 'Send code' : 'Finish & open dashboard'}
          </button>
        </div>
      </div>
    </div>
  );
}
