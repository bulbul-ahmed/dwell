'use client';

import { useEffect, useRef, useState } from 'react';

const ACCENT = '#1E3A5C';
const RESEND_COOLDOWN = 30; // seconds

type OwnerType = 'Owner' | 'Agency';
type Step = 'type' | 'phone' | 'verify' | 'kyc';

// The input holds the LOCAL part only (10 digits, starting 1[3-9]); the +880
// country code is fixed by the prefix chip. Strip any code the user pastes in.
function toLocal(raw: string): string {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('880')) d = d.slice(3);
  if (d.startsWith('0'))   d = d.slice(1);
  return d.slice(0, 10);
}
function isValidLocal(local: string): boolean {
  return /^1[3-9]\d{8}$/.test(local);
}
function maskFull(local: string): string {
  // +880 1723-79••17
  return `+880 ${local.slice(0, 4)}-${local.slice(4, 6)}••${local.slice(8)}`;
}

// Become-owner onboarding wizard: type → phone (OTP) → verify+address →
// optional KYC. Phone verification is the publish gate (MVP); KYC is optional
// and earns the verified badge after manual admin review.
export default function BecomeOwnerSheet({ onClose, redirectTo }: { onClose: () => void; redirectTo?: string }) {
  const dest = redirectTo || '/dashboard';
  const [step, setStep]       = useState<Step>('type');
  const [type, setType]       = useState<OwnerType>('Owner');
  const [phone, setPhone]     = useState('');   // local part, 10 digits
  const [code, setCode]       = useState('');
  const [address, setAddress] = useState('');
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState('');

  // OTP timing
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [secsLeft, setSecsLeft]   = useState(0);   // until code expiry
  const [resendIn, setResendIn]   = useState(0);   // resend cooldown

  const fullPhone = '+880' + phone;

  // 1s ticker while on the verify step — drives expiry countdown + resend cooldown.
  useEffect(() => {
    if (step !== 'verify') return;
    const t = setInterval(() => {
      setSecsLeft(expiresAt ? Math.max(0, Math.round((expiresAt - Date.now()) / 1000)) : 0);
      setResendIn(v => (v > 0 ? v - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [step, expiresAt]);

  function fmtClock(s: number) {
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  }

  // KYC fields
  const [nidNumber, setNidNumber]       = useState('');
  const [businessName, setBusinessName] = useState('');
  const [tradeLicense, setTradeLicense] = useState('');
  const [docUrl, setDocUrl]             = useState('');
  const [docName, setDocName]           = useState('');
  const [uploading, setUploading]       = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function chooseType() {
    setError('');
    setBusy(true);
    try {
      // Create owner profile + flip role now; verify-phone needs the owner row.
      await fetch('/api/owners/intent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      setStep('phone');
    } catch {
      setError('Something went wrong. Try again.');
    } finally { setBusy(false); }
  }

  async function requestOtp() {
    const res = await fetch('/api/owners/verify-phone', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: fullPhone }),
    });
    if (!res.ok) throw new Error();
    const { expiresAt: exp } = await res.json().catch(() => ({})) as { expiresAt?: string };
    const ms = exp ? new Date(exp).getTime() : Date.now() + 10 * 60 * 1000;
    setExpiresAt(ms);
    setSecsLeft(Math.max(0, Math.round((ms - Date.now()) / 1000)));
    setResendIn(RESEND_COOLDOWN);
  }

  async function sendCode() {
    setError('');
    if (!isValidLocal(phone)) { setError('Enter a valid Bangladeshi mobile number (e.g. 1711 234567).'); return; }
    setBusy(true);
    try {
      await requestOtp();
      setStep('verify');
    } catch {
      setError('Could not send code. Try again.');
    } finally { setBusy(false); }
  }

  async function resend() {
    if (resendIn > 0 || busy) return;
    setError(''); setCode(''); setBusy(true);
    try {
      await requestOtp();
    } catch {
      setError('Could not resend code. Try again.');
    } finally { setBusy(false); }
  }

  async function verify() {
    setError('');
    if (secsLeft <= 0) { setError('Code expired. Tap resend for a new one.'); return; }
    if (!/^\d{4,6}$/.test(code.trim())) { setError('Enter the numeric code sent to your phone.'); return; }
    if (!address.trim()) { setError('Enter your address.'); return; }
    setBusy(true);
    try {
      await fetch('/api/owners/intent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address.trim(), type }),
      });
      const res = await fetch('/api/owners/verify-phone', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, code: code.trim() }),
      });
      if (!res.ok) throw new Error();
      setStep('kyc'); // phone verified — can publish now; KYC optional
    } catch {
      setError('Invalid or expired code.');
    } finally { setBusy(false); }
  }

  async function onPickDoc(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setError('Upload an image or PDF.'); return;
    }
    if (file.size > 8 * 1024 * 1024) { setError('File must be under 8 MB.'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('files', file);
      const up = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!up.ok) throw new Error();
      const { urls } = await up.json() as { urls: string[] };
      if (!urls?.[0]) throw new Error();
      setDocUrl(urls[0]);
      setDocName(file.name);
    } catch {
      setError('Upload failed. Try again.');
    } finally { setUploading(false); }
  }

  async function submitKyc() {
    setError('');
    if (type === 'Agency') {
      if (!businessName.trim() || !tradeLicense.trim() || !docUrl) {
        setError('Business name, trade license no. and a document are required.'); return;
      }
    } else if (!nidNumber.trim() || !docUrl) {
      setError('NID number and a document image are required.'); return;
    }
    setBusy(true);
    try {
      const payload = type === 'Agency'
        ? { businessName: businessName.trim(), tradeLicense: tradeLicense.trim(), businessDocUrl: docUrl }
        : { nidNumber: nidNumber.trim(), nidDocUrl: docUrl };
      const res = await fetch('/api/owners/verify-kyc', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      window.location.href = dest;
    } catch {
      setError('Could not submit documents. Try again.');
      setBusy(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 44, padding: '0 14px', borderRadius: 12,
    border: '1px solid #DCE2EA', fontFamily: 'inherit', fontSize: 14, color: '#15243B', outline: 'none',
    boxSizing: 'border-box',
  };

  const titleByStep: Record<Step, string> = {
    type:   'Become an owner',
    phone:  'Verify your phone',
    verify: 'Enter the code',
    kyc:    type === 'Agency' ? 'Verify your agency' : 'Verify your identity',
  };
  const subByStep: Record<Step, string> = {
    type:   'List and manage properties on Dwell. First, tell us who you are.',
    phone:  'We’ll text a code to confirm your number. This lets you publish listings.',
    verify: `Enter the code sent to ${maskFull(phone)} and your address.`,
    kyc:    'Optional — submit documents to earn a “Verified” badge. You can skip and do this later.',
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(20,36,59,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: 20, padding: 26, boxShadow: '0 18px 50px rgba(20,36,59,.25)' }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: '#15243B', marginBottom: 4 }}>{titleByStep[step]}</div>
        <p style={{ fontSize: 13, color: '#8893A4', margin: '0 0 18px' }}>{subByStep[step]}</p>

        {/* ── Step: type ── */}
        {step === 'type' && (
          <div style={{ display: 'flex', gap: 10 }}>
            {(['Owner', 'Agency'] as OwnerType[]).map(t => {
              const on = type === t;
              return (
                <button key={t} onClick={() => setType(t)}
                  style={{ flex: 1, padding: '16px 14px', borderRadius: 14, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                    border: `1.5px solid ${on ? ACCENT : '#E2E7EE'}`, background: on ? 'rgba(30,58,92,0.05)' : '#fff' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: on ? ACCENT : '#15243B' }}>{t === 'Owner' ? '🏠 Individual' : '🏢 Agency'}</div>
                  <div style={{ fontSize: 11.5, color: '#8893A4', marginTop: 4, lineHeight: 1.4 }}>
                    {t === 'Owner' ? 'I own/manage my own property' : 'I represent a property business'}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Step: phone ── */}
        {step === 'phone' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'stretch', border: `1px solid ${phone && !isValidLocal(phone) ? '#E0A8A0' : '#DCE2EA'}`, borderRadius: 12, overflow: 'hidden' }}>
              <span style={{ padding: '0 14px', display: 'flex', alignItems: 'center', fontSize: 14, fontWeight: 700, color: '#5A6172', background: '#F4F6F9', borderRight: '1px solid #DCE2EA' }}>+880</span>
              <input
                type="tel" inputMode="numeric" autoComplete="tel" autoFocus maxLength={12}
                style={{ ...inputStyle, border: 'none', borderRadius: 0, letterSpacing: 0.5 }}
                placeholder="1711 234567"
                value={phone}
                onChange={e => setPhone(toLocal(e.target.value))}
                onKeyDown={e => { if (e.key === 'Enter') sendCode(); }}
              />
            </div>
            {phone.length > 0 && !isValidLocal(phone) && (
              <div style={{ marginTop: 7, fontSize: 12, color: '#B4402B' }}>Bangladeshi mobile: 10 digits starting 1[3–9] (e.g. 1711234567).</div>
            )}
          </div>
        )}

        {/* ── Step: verify ── */}
        {step === 'verify' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="tel" inputMode="numeric" autoComplete="one-time-code" autoFocus maxLength={6}
              style={{ ...inputStyle, letterSpacing: 4, fontWeight: 700, fontSize: 16 }}
              placeholder="6-digit code" value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => { if (e.key === 'Enter') verify(); }}
            />
            {/* expiry + resend row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12.5, color: secsLeft <= 30 ? '#B4402B' : '#8893A4' }}>
                {secsLeft > 0 ? `Code expires in ${fmtClock(secsLeft)}` : 'Code expired'}
              </span>
              <button onClick={resend} disabled={resendIn > 0 || busy}
                style={{ background: 'none', border: 'none', padding: 0, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700,
                  color: resendIn > 0 ? '#A8AEB9' : ACCENT, cursor: resendIn > 0 || busy ? 'default' : 'pointer' }}>
                {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
              </button>
            </div>
            <input style={inputStyle} placeholder="Address (house, road, area)" value={address} onChange={e => setAddress(e.target.value)} />
            <button onClick={() => { setStep('phone'); setCode(''); setError(''); }}
              style={{ alignSelf: 'flex-start', background: 'none', border: 'none', padding: 0, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, color: '#5A6172', cursor: 'pointer' }}>
              ← Change number
            </button>
          </div>
        )}

        {/* ── Step: kyc ── */}
        {step === 'kyc' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {type === 'Agency' ? (
              <>
                <input style={inputStyle} placeholder="Business / agency name" value={businessName} onChange={e => setBusinessName(e.target.value)} />
                <input style={inputStyle} placeholder="Trade license number" value={tradeLicense} onChange={e => setTradeLicense(e.target.value)} />
              </>
            ) : (
              <input style={inputStyle} inputMode="numeric" placeholder="NID number" value={nidNumber} onChange={e => setNidNumber(e.target.value)} />
            )}

            <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={onPickDoc} />
            <button onClick={() => !uploading && fileRef.current?.click()}
              style={{ width: '100%', minHeight: 44, padding: '10px 14px', borderRadius: 12, border: `1px dashed ${docUrl ? '#2E7D55' : '#C7CFDA'}`, background: docUrl ? '#F0F7F2' : '#FAFBFC', cursor: uploading ? 'wait' : 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: docUrl ? '#2E7D55' : '#5A6172' }}>
              {uploading ? 'Uploading…' : docUrl ? `✓ ${docName}` : type === 'Agency' ? '+ Upload trade license (image/PDF)' : '+ Upload NID (image/PDF)'}
            </button>
          </div>
        )}

        {error && <div style={{ marginTop: 12, fontSize: 12.5, color: '#C0392B' }}>{error}</div>}

        {/* ── Actions ── */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          {step === 'kyc' ? (
            <>
              <button onClick={() => { window.location.href = dest; }} disabled={busy}
                style={{ flex: '0 0 auto', height: 44, padding: '0 18px', borderRadius: 12, border: '1px solid #E2E7EE', background: '#fff', color: '#44506A', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Skip for now
              </button>
              <button onClick={submitKyc} disabled={busy || uploading}
                style={{ flex: 1, height: 44, borderRadius: 12, border: 'none', background: ACCENT, color: '#fff', fontSize: 14, fontWeight: 700, cursor: busy ? 'default' : 'pointer', fontFamily: 'inherit', opacity: busy ? 0.6 : 1 }}>
                {busy ? 'Submitting…' : 'Submit for verification'}
              </button>
            </>
          ) : (
            <>
              <button onClick={onClose} disabled={busy}
                style={{ flex: '0 0 auto', height: 44, padding: '0 18px', borderRadius: 12, border: '1px solid #E2E7EE', background: '#fff', color: '#44506A', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
              <button
                onClick={step === 'type' ? chooseType : step === 'phone' ? sendCode : verify}
                disabled={busy}
                style={{ flex: 1, height: 44, borderRadius: 12, border: 'none', background: ACCENT, color: '#fff', fontSize: 14, fontWeight: 700, cursor: busy ? 'default' : 'pointer', fontFamily: 'inherit', opacity: busy ? 0.6 : 1 }}>
                {busy ? 'Please wait…' : step === 'type' ? 'Continue' : step === 'phone' ? 'Send code' : 'Verify'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
