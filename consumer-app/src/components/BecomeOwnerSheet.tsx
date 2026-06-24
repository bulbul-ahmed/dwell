'use client';

import { useRef, useState } from 'react';

const ACCENT = '#1E3A5C';

type OwnerType = 'Owner' | 'Agency';
type Step = 'type' | 'phone' | 'verify' | 'kyc';

// Bangladesh mobile: 11 digits starting 01[3-9], optionally +880 / 880 prefixed.
function normalizeBdPhone(raw: string): string | null {
  const d = raw.replace(/[\s-]/g, '');
  let m = d.match(/^(?:\+?880)?(01[3-9]\d{8})$/);
  if (m) return '+880' + m[1].slice(1);          // 01XXXXXXXXX → +880 1XXXXXXXXX
  m = d.match(/^(?:\+?880)(1[3-9]\d{8})$/);
  if (m) return '+880' + m[1];
  return null;
}

// Become-owner onboarding wizard: type → phone (OTP) → verify+address →
// optional KYC. Phone verification is the publish gate (MVP); KYC is optional
// and earns the verified badge after manual admin review.
export default function BecomeOwnerSheet({ onClose, redirectTo }: { onClose: () => void; redirectTo?: string }) {
  const dest = redirectTo || '/dashboard';
  const [step, setStep]       = useState<Step>('type');
  const [type, setType]       = useState<OwnerType>('Owner');
  const [phone, setPhone]     = useState('');
  const [code, setCode]       = useState('');
  const [address, setAddress] = useState('');
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState('');

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

  async function sendCode() {
    setError('');
    const norm = normalizeBdPhone(phone);
    if (!norm) { setError('Enter a valid Bangladeshi mobile number (e.g. 01711XXXXXX).'); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/owners/verify-phone', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: norm }),
      });
      if (!res.ok) throw new Error();
      setPhone(norm);
      setStep('verify');
    } catch {
      setError('Could not send code. Try again.');
    } finally { setBusy(false); }
  }

  async function verify() {
    setError('');
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
        body: JSON.stringify({ phone, code: code.trim() }),
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
    verify: `Enter the code sent to ${phone} and your address.`,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1px solid #DCE2EA', borderRadius: 12, overflow: 'hidden' }}>
            <span style={{ padding: '0 12px', height: 44, display: 'flex', alignItems: 'center', fontSize: 14, fontWeight: 700, color: '#5A6172', background: '#F4F6F9', borderRight: '1px solid #DCE2EA' }}>🇧🇩 +880</span>
            <input
              type="tel" inputMode="numeric" autoComplete="tel" maxLength={14}
              style={{ ...inputStyle, border: 'none', borderRadius: 0 }}
              placeholder="1711 234567"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/[^\d+\s-]/g, ''))}
              onKeyDown={e => { if (e.key === 'Enter') sendCode(); }}
            />
          </div>
        )}

        {/* ── Step: verify ── */}
        {step === 'verify' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input type="tel" inputMode="numeric" maxLength={6} style={inputStyle} placeholder="6-digit code" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} />
            <input style={inputStyle} placeholder="Address (house, road, area)" value={address} onChange={e => setAddress(e.target.value)} />
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
