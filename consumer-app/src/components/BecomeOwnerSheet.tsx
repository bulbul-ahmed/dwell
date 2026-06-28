'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ACCENT   = '#1E3A5C';
const SUCCESS  = '#2E7D55';
const OTP_LEN  = 6;
const RESEND_CD = 30;

type OwnerType = 'Owner' | 'Agency';
type Step = 'type' | 'phone' | 'otp' | 'profile' | 'docs' | 'done';

// ── Helpers ──────────────────────────────────────────────────────────────────

function toLocal(raw: string): string {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('880')) d = d.slice(3);
  if (d.startsWith('0'))   d = d.slice(1);
  return d.slice(0, 10);
}
function isValidLocal(v: string) { return /^1[3-9]\d{8}$/.test(v); }
function maskPhone(v: string)    { return `+880 ${v.slice(0,4)}-${v.slice(4,6)}••${v.slice(8)}`; }
function fmtClock(s: number)     { return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; }

// ── OTP cells ────────────────────────────────────────────────────────────────

function OtpInput({ value, onChange, onComplete, shake }: {
  value: string; onChange:(v:string)=>void; onComplete:(v:string)=>void; shake:boolean;
}) {
  const ref  = useRef<HTMLInputElement>(null);
  const cells = Array.from({ length: OTP_LEN }, (_,i) => value[i] ?? '');
  const full  = value.length === OTP_LEN;

  function handle(raw: string) {
    const next = raw.replace(/\D/g,'').slice(0, OTP_LEN);
    onChange(next);
    if (next.length === OTP_LEN) onComplete(next);
  }

  return (
    <div onClick={() => ref.current?.focus()} style={{
      position:'relative', display:'flex', gap:8, cursor:'text',
      animation: shake ? 'bsShake .4s ease' : undefined,
    }}>
      {cells.map((ch, i) => {
        const active  = !full && i === value.length;
        const focused = typeof document !== 'undefined' && document.activeElement === ref.current;
        return (
          <div key={i} style={{
            flex:1, height:54, borderRadius:12,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:22, fontWeight:800, color:'#15243B',
            border:`2px solid ${full ? SUCCESS : active&&focused ? ACCENT : ch ? '#A0AAB8' : '#DCE2EA'}`,
            background: full ? 'rgba(46,125,85,.06)' : ch ? 'rgba(30,58,92,.04)' : '#FAFBFC',
            transition:'border-color .15s, background .15s',
          }}>
            {ch || (active && (
              <span style={{ width:2, height:22, background:ACCENT, borderRadius:2, animation:'bsBlink 1s step-end infinite' }} />
            ))}
          </div>
        );
      })}
      <input
        ref={ref} type="tel" inputMode="numeric" autoComplete="one-time-code"
        autoFocus maxLength={OTP_LEN} value={value}
        onChange={e => handle(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && full) onComplete(value); }}
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0, cursor:'text', zIndex:1 }}
      />
    </div>
  );
}

// ── Step progress dots ────────────────────────────────────────────────────────

const STEPS: Step[] = ['type','phone','otp','profile','docs'];

function StepDots({ current }: { current: Step }) {
  const idx = STEPS.indexOf(current);
  if (idx < 0) return null;
  return (
    <div style={{ display:'flex', gap:5, alignItems:'center', marginBottom:24 }}>
      {STEPS.map((_, i) => (
        <div key={i} style={{
          height:5, borderRadius:99,
          width: i === idx ? 24 : 5,
          background: i < idx ? SUCCESS : i === idx ? ACCENT : '#DCE2EA',
          transition:'all .25s cubic-bezier(.34,1.56,.64,1)',
        }} />
      ))}
    </div>
  );
}

// ── Input style helper ────────────────────────────────────────────────────────

const inp: React.CSSProperties = {
  width:'100%', height:46, padding:'0 14px', borderRadius:12,
  border:'1px solid #DCE2EA', fontFamily:'inherit', fontSize:14, color:'#15243B',
  outline:'none', boxSizing:'border-box', background:'#fff',
};

// ── Main ─────────────────────────────────────────────────────────────────────

export default function BecomeOwnerSheet({
  onClose,
  initialStep = 'type',
}: {
  onClose: () => void;
  initialStep?: Step;
}) {
  const router = useRouter();

  const [step,        setStep]       = useState<Step>(initialStep);
  const [ownerType,   setOwnerType]  = useState<OwnerType>('Owner');
  const [phone,       setPhone]      = useState('');
  const [code,        setCode]       = useState('');
  const [address,     setAddress]    = useState('');
  const [busy,        setBusy]       = useState(false);
  const [verifying,   setVerifying]  = useState(false);
  const [shake,       setShake]      = useState(false);
  const [error,       setError]      = useState('');
  const [expiresAt,   setExpiresAt]  = useState<number|null>(null);
  const [secsLeft,    setSecsLeft]   = useState(0);
  const [resendIn,    setResendIn]   = useState(0);
  const [submittedDocs, setSubmitted] = useState(false);

  // Doc fields
  const [nidNumber,    setNidNumber]    = useState('');
  const [bizName,      setBizName]      = useState('');
  const [tradeLic,     setTradeLic]     = useState('');
  const [docUrl,       setDocUrl]       = useState('');
  const [docLabel,     setDocLabel]     = useState('');
  const [uploading,    setUploading]    = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fullPhone = '+880' + phone;

  // OTP countdown
  useEffect(() => {
    if (step !== 'otp') return;
    const t = setInterval(() => {
      setSecsLeft(expiresAt ? Math.max(0, Math.round((expiresAt - Date.now()) / 1000)) : 0);
      setResendIn(v => (v > 0 ? v - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [step, expiresAt]);

  function closeAndRefresh() { onClose(); router.refresh(); }

  // ── API calls ─────────────────────────────────────────────────────────────

  async function submitType() {
    setError(''); setBusy(true);
    try {
      await fetch('/api/owners/intent', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ type: ownerType }),
      });
      setStep('phone');
    } catch { setError('Something went wrong. Try again.'); }
    finally { setBusy(false); }
  }

  async function requestOtp() {
    const res = await fetch('/api/owners/verify-phone', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ phone: fullPhone }),
    });
    if (!res.ok) throw new Error();
    const { expiresAt: exp } = await res.json().catch(() => ({})) as { expiresAt?: string };
    const ms = exp ? new Date(exp).getTime() : Date.now() + 10 * 60 * 1000;
    setExpiresAt(ms);
    setSecsLeft(Math.max(0, Math.round((ms - Date.now()) / 1000)));
    setResendIn(RESEND_CD);
  }

  async function sendCode() {
    setError('');
    if (!isValidLocal(phone)) { setError('Enter a valid Bangladeshi number (e.g. 1711 234567).'); return; }
    setBusy(true);
    try { await requestOtp(); setStep('otp'); }
    catch { setError('Could not send code. Try again.'); }
    finally { setBusy(false); }
  }

  async function resendCode() {
    if (resendIn > 0 || busy) return;
    setError(''); setCode(''); setBusy(true);
    try { await requestOtp(); }
    catch { setError('Could not resend. Try again.'); }
    finally { setBusy(false); }
  }

  async function verifyCode(pin = code) {
    if (verifying || busy) return;
    setError('');
    if (secsLeft <= 0) { setError('Code expired — tap Resend for a new one.'); return; }
    if (!/^\d{6}$/.test(pin)) { setError('Enter the 6-digit code.'); return; }
    setVerifying(true);
    try {
      const res = await fetch('/api/owners/verify-phone', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ phone: fullPhone, code: pin }),
      });
      if (!res.ok) throw new Error();
      setStep('profile');
    } catch {
      setError('Wrong code. Try again.');
      setVerifying(false);
      setCode('');
      setShake(true);
      setTimeout(() => setShake(false), 450);
    }
  }

  async function submitProfile() {
    setError('');
    if (!address.trim()) { setError('Enter your address.'); return; }
    setBusy(true);
    try {
      await fetch('/api/owners/intent', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ address: address.trim() }),
      });
      setStep('docs');
    } catch { setError('Could not save. Try again.'); }
    finally { setBusy(false); }
  }

  async function uploadFile(file: File): Promise<string> {
    const fd = new FormData();
    fd.append('files', file);
    const res = await fetch('/api/upload', { method:'POST', body: fd });
    if (!res.ok) throw new Error();
    const { urls } = await res.json() as { urls: string[] };
    if (!urls?.[0]) throw new Error();
    return urls[0];
  }

  async function onPickDoc(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setError('Upload an image or PDF.'); return;
    }
    if (file.size > 8 * 1024 * 1024) { setError('File must be under 8 MB.'); return; }
    setError(''); setUploading(true);
    try {
      const url = await uploadFile(file);
      setDocUrl(url); setDocLabel(file.name);
    } catch { setError('Upload failed. Try again.'); }
    finally { setUploading(false); }
  }

  async function submitDocs() {
    setError('');
    if (ownerType === 'Agency') {
      if (!bizName.trim() || !tradeLic.trim() || !docUrl) {
        setError('Business name, trade license number and document are required.'); return;
      }
    } else {
      if (!nidNumber.trim() || !docUrl) {
        setError('NID number and document image are required.'); return;
      }
    }
    setBusy(true);
    try {
      const payload = ownerType === 'Agency'
        ? { businessName: bizName.trim(), tradeLicense: tradeLic.trim(), businessDocUrl: docUrl }
        : { nidNumber: nidNumber.trim(), nidDocUrl: docUrl };
      const res = await fetch('/api/owners/verify-kyc', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
      setStep('done');
    } catch { setError('Could not submit. Try again.'); }
    finally { setBusy(false); }
  }

  // ── Done screen ───────────────────────────────────────────────────────────

  if (step === 'done') {
    return (
      <div
        onClick={closeAndRefresh}
        style={{
          position:'fixed', inset:0, background:'rgba(20,36,59,.55)', zIndex:9999,
          display:'flex', alignItems:'flex-start', justifyContent:'center',
          paddingTop:80, padding:'80px 20px 24px', overflowY:'auto',
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width:'100%', maxWidth:440, background:'#fff', borderRadius:24,
            padding:'36px 28px 28px', boxShadow:'0 24px 60px rgba(20,36,59,.22)',
            textAlign:'center', marginBottom:20,
          }}
        >
          <div style={{
            width:76, height:76, borderRadius:'50%', margin:'0 auto 22px',
            background: submittedDocs ? 'rgba(46,125,85,.09)' : 'rgba(30,58,92,.07)',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:34,
          }}>
            {submittedDocs ? '📋' : '🏠'}
          </div>

          <div style={{ fontSize:21, fontWeight:800, color:'#15243B', marginBottom:10 }}>
            {submittedDocs ? 'Documents submitted!' : "You're set up as an owner!"}
          </div>

          <p style={{ fontSize:14, color:'#6A7585', lineHeight:1.65, margin:'0 0 22px' }}>
            {submittedDocs
              ? `Your documents are being reviewed. We'll notify you when approved — usually within 24 hours. In the meantime you can browse the app.`
              : `You can now list ${ownerType === 'Agency' ? 'properties' : 'your property'} on Dwell. Add identity documents anytime to earn the Verified badge and build renter trust.`
            }
          </p>

          {!submittedDocs && (
            <div style={{
              background:'#F4F7FB', borderRadius:12, padding:'12px 16px',
              fontSize:13, color:'#5A6880', margin:'0 0 22px', textAlign:'left', lineHeight:1.5,
            }}>
              <strong>Tip:</strong> Verified owners get significantly more enquiries. Add your {ownerType === 'Agency' ? 'trade license' : 'NID'} from your account page anytime.
            </div>
          )}

          <button onClick={closeAndRefresh} style={{
            width:'100%', height:50, borderRadius:14, border:'none',
            background:ACCENT, color:'#fff', fontSize:15, fontWeight:700,
            cursor:'pointer', fontFamily:'inherit',
          }}>
            Done
          </button>
        </div>
      </div>
    );
  }

  // ── Steps 1-5 ─────────────────────────────────────────────────────────────

  const TITLES: Record<Step, string> = {
    type:    'Become an owner',
    phone:   'Verify your phone',
    otp:     'Enter the code',
    profile: 'Your profile',
    docs:    ownerType === 'Agency' ? 'Verify your agency' : 'Verify your identity',
    done:    '',
  };
  const SUBS: Record<Step, string> = {
    type:    'List and manage properties on Dwell.',
    phone:   'Renters contact you through this number about your listings.',
    otp:     `We sent a 6-digit code to ${maskPhone(phone)}.`,
    profile: 'Shown on your listings to help renters trust you.',
    docs:    'Upload documents to earn the Verified badge. You can skip and do this later.',
    done:    '',
  };

  return (
    <div
      onClick={closeAndRefresh}
      style={{
        position:'fixed', inset:0, background:'rgba(20,36,59,.55)', zIndex:9999,
        display:'flex', alignItems:'flex-start', justifyContent:'center',
        padding:'80px 20px 24px', overflowY:'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width:'100%', maxWidth:460, background:'#fff', borderRadius:24,
          padding:'28px 26px 26px', boxShadow:'0 24px 60px rgba(20,36,59,.22)', marginBottom:20,
        }}
      >
        {/* Top row: progress + X */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
          <StepDots current={step} />
          <button
            onClick={closeAndRefresh}
            style={{
              width:30, height:30, borderRadius:'50%', border:'1px solid #E2E7EE',
              background:'#F4F6F9', cursor:'pointer', display:'flex', alignItems:'center',
              justifyContent:'center', fontSize:16, color:'#6A7585', flexShrink:0,
              lineHeight:1, fontFamily:'inherit',
            }}
            aria-label="Close"
          >×</button>
        </div>

        <div style={{ fontSize:20, fontWeight:800, color:'#15243B', marginBottom:5 }}>{TITLES[step]}</div>
        <p style={{ fontSize:13, color:'#8893A4', margin:'0 0 22px', lineHeight:1.5 }}>{SUBS[step]}</p>

        {/* ── type ── */}
        {step === 'type' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {(['Owner','Agency'] as OwnerType[]).map(t => {
              const on = ownerType === t;
              return (
                <button key={t} onClick={() => setOwnerType(t)} style={{
                  display:'flex', alignItems:'flex-start', gap:14, padding:'16px 18px',
                  borderRadius:16, cursor:'pointer', fontFamily:'inherit', textAlign:'left',
                  border:`2px solid ${on ? ACCENT : '#E2E7EE'}`,
                  background: on ? 'rgba(30,58,92,.04)' : '#FAFBFC',
                  transition:'border-color .15s, background .15s',
                }}>
                  <div style={{
                    width:44, height:44, borderRadius:12, flexShrink:0, marginTop:1,
                    background: on ? 'rgba(30,58,92,.1)' : '#EFF1F5',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:20,
                  }}>
                    {t === 'Owner' ? '🏠' : '🏢'}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14.5, fontWeight:800, color: on ? ACCENT : '#15243B', marginBottom:3 }}>
                      {t === 'Owner' ? 'Individual owner' : 'Property agency'}
                    </div>
                    <div style={{ fontSize:12.5, color:'#8893A4', lineHeight:1.45 }}>
                      {t === 'Owner' ? 'I own or manage my own property' : 'I represent a property business'}
                    </div>
                    <div style={{ fontSize:11.5, color:'#B0B9C8', marginTop:4 }}>
                      {t === 'Owner' ? 'NID required for Verified badge' : 'Trade license required for Verified badge'}
                    </div>
                  </div>
                  <div style={{
                    width:20, height:20, borderRadius:'50%', flexShrink:0, marginTop:3,
                    border:`2px solid ${on ? ACCENT : '#C8D0DA'}`,
                    background: on ? ACCENT : 'transparent',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    {on && <div style={{ width:8, height:8, borderRadius:'50%', background:'#fff' }} />}
                  </div>
                </button>
              );
            })}
            <div style={{
              display:'flex', gap:8, padding:'10px 14px', background:'#F6F8FB',
              borderRadius:10, marginTop:2, alignItems:'center',
            }}>
              <span style={{ fontSize:13 }}>🔒</span>
              <span style={{ fontSize:12, color:'#8893A4' }}>
                Your data is encrypted and only shared with Dwell staff.
              </span>
            </div>
          </div>
        )}

        {/* ── phone ── */}
        {step === 'phone' && (
          <div>
            <div style={{
              display:'flex', alignItems:'stretch',
              border:`1.5px solid ${phone && !isValidLocal(phone) ? '#E0A8A0' : '#DCE2EA'}`,
              borderRadius:12, overflow:'hidden',
            }}>
              <span style={{
                padding:'0 14px', display:'flex', alignItems:'center',
                fontSize:14, fontWeight:700, color:'#5A6172',
                background:'#F4F6F9', borderRight:'1px solid #DCE2EA', whiteSpace:'nowrap',
              }}>+880</span>
              <input
                type="tel" inputMode="numeric" autoComplete="tel" autoFocus maxLength={12}
                style={{ ...inp, border:'none', borderRadius:0, letterSpacing:.5 }}
                placeholder="1711 234567"
                value={phone}
                onChange={e => setPhone(toLocal(e.target.value))}
                onKeyDown={e => { if (e.key === 'Enter') sendCode(); }}
              />
            </div>
            {phone.length > 0 && !isValidLocal(phone) && (
              <div style={{ marginTop:7, fontSize:12, color:'#B4402B' }}>
                10 digits starting 1[3–9], e.g. 1711234567
              </div>
            )}
          </div>
        )}

        {/* ── otp ── */}
        {step === 'otp' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <OtpInput value={code} onChange={setCode} onComplete={verifyCode} shake={shake} />
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:12.5, color: secsLeft <= 30 ? '#B4402B' : '#8893A4' }}>
                {secsLeft > 0 ? `Expires in ${fmtClock(secsLeft)}` : 'Code expired'}
              </span>
              <button
                onClick={resendCode} disabled={resendIn > 0 || busy || verifying}
                style={{
                  background:'none', border:'none', padding:0, fontFamily:'inherit',
                  fontSize:12.5, fontWeight:700,
                  color: resendIn > 0 ? '#A8AEB9' : ACCENT,
                  cursor: resendIn > 0 ? 'default' : 'pointer',
                }}
              >
                {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
              </button>
            </div>
            <button
              onClick={() => { setStep('phone'); setCode(''); setError(''); setVerifying(false); }}
              style={{
                alignSelf:'flex-start', background:'none', border:'none', padding:0,
                fontFamily:'inherit', fontSize:12.5, fontWeight:600, color:'#5A6172', cursor:'pointer',
              }}
            >
              ← Change number
            </button>
          </div>
        )}

        {/* ── profile ── */}
        {step === 'profile' && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div>
              <label style={{ display:'block', fontSize:12.5, fontWeight:700, color:'#4A5161', marginBottom:7 }}>
                Your address <span style={{ color:'#C0392B' }}>*</span>
              </label>
              <input
                autoFocus style={inp}
                placeholder="House, road, area — e.g. House 7, Road 12, Aftab Nagar"
                value={address}
                onChange={e => setAddress(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') submitProfile(); }}
              />
            </div>
            <div style={{
              padding:'10px 14px', background:'#F6F8FB', borderRadius:10,
              fontSize:12.5, color:'#6A7585',
            }}>
              ℹ️ Your name from your Dwell account will appear on your listings.
            </div>
          </div>
        )}

        {/* ── docs ── */}
        {step === 'docs' && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {ownerType === 'Agency' ? (
              <>
                <div>
                  <label style={{ display:'block', fontSize:12.5, fontWeight:700, color:'#4A5161', marginBottom:7 }}>
                    Business / agency name
                  </label>
                  <input
                    autoFocus style={inp}
                    placeholder="e.g. Rahima Properties"
                    value={bizName} onChange={e => setBizName(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:12.5, fontWeight:700, color:'#4A5161', marginBottom:7 }}>
                    Trade license number
                  </label>
                  <input
                    style={inp} placeholder="Enter trade license no."
                    value={tradeLic} onChange={e => setTradeLic(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <div>
                <label style={{ display:'block', fontSize:12.5, fontWeight:700, color:'#4A5161', marginBottom:7 }}>
                  NID number
                </label>
                <input
                  autoFocus style={inp} inputMode="numeric"
                  placeholder="Enter your national ID number"
                  value={nidNumber} onChange={e => setNidNumber(e.target.value)}
                />
              </div>
            )}

            <div>
              <label style={{ display:'block', fontSize:12.5, fontWeight:700, color:'#4A5161', marginBottom:7 }}>
                {ownerType === 'Agency' ? 'Trade license document' : 'NID photo (front)'}
              </label>
              <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{ display:'none' }} onChange={onPickDoc} />
              <button
                onClick={() => !uploading && fileRef.current?.click()}
                style={{
                  width:'100%', minHeight:70, padding:'14px 16px', borderRadius:14,
                  border:`1.5px dashed ${docUrl ? SUCCESS : '#C7CFDA'}`,
                  background: docUrl ? '#F0F7F2' : '#FAFBFC',
                  cursor: uploading ? 'wait' : 'pointer',
                  fontFamily:'inherit', fontSize:13.5, fontWeight:600,
                  color: docUrl ? SUCCESS : '#5A6172',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                }}
              >
                {uploading ? (
                  <><span>⏳</span> Uploading…</>
                ) : docUrl ? (
                  <><span>✓</span> {docLabel}</>
                ) : (
                  <><span>📎</span> Upload image or PDF (max 8 MB)</>
                )}
              </button>
            </div>

            <div style={{
              padding:'10px 14px', background:'#FFFBF0', borderRadius:10,
              fontSize:12.5, color:'#8A6A30', border:'1px solid #F0E5C0',
            }}>
              🔒 Documents are encrypted and reviewed only by Dwell staff.
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            marginTop:14, padding:'10px 14px', background:'#FEF2F2', borderRadius:10,
            fontSize:13, color:'#B91C1C', border:'1px solid #FEE2E2',
          }}>
            {error}
          </div>
        )}

        {/* ── Actions ── */}
        <div style={{ marginTop:22 }}>

          {/* Docs step: stacked buttons */}
          {step === 'docs' && (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <button onClick={submitDocs} disabled={busy || uploading} style={{
                width:'100%', height:50, borderRadius:14, border:'none',
                background:ACCENT, color:'#fff', fontSize:15, fontWeight:700,
                cursor: busy ? 'default' : 'pointer', fontFamily:'inherit',
                opacity: busy || uploading ? .7 : 1,
              }}>
                {busy ? 'Submitting…' : 'Submit for verification'}
              </button>
              <button onClick={() => { setSubmitted(false); setStep('done'); }} disabled={busy} style={{
                width:'100%', height:44, borderRadius:14, border:'1px solid #E2E7EE',
                background:'#fff', color:'#5A6880', fontSize:13.5, fontWeight:700,
                cursor:'pointer', fontFamily:'inherit',
              }}>
                Skip — I'll add documents later
              </button>
              <button onClick={() => setStep('profile')} disabled={busy} style={{
                alignSelf:'center', background:'none', border:'none', padding:0,
                fontFamily:'inherit', fontSize:12.5, fontWeight:600, color:'#8893A4', cursor:'pointer',
              }}>
                ← Back
              </button>
            </div>
          )}

          {/* OTP verifying spinner */}
          {step === 'otp' && verifying && (
            <div style={{ display:'flex', gap:10 }}>
              <button disabled style={{
                flex:'0 0 auto', height:50, padding:'0 18px', borderRadius:14,
                border:'1px solid #E2E7EE', background:'#fff', color:'#C0C7D2',
                fontSize:14, fontWeight:700, cursor:'default', fontFamily:'inherit',
              }}>Cancel</button>
              <div style={{
                flex:1, height:50, borderRadius:14, background:ACCENT,
                display:'flex', alignItems:'center', justifyContent:'center', gap:10,
              }}>
                <span style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,.85)' }}>Verifying</span>
                {[0,1,2].map(i => (
                  <span key={i} style={{
                    width:5, height:5, borderRadius:'50%', background:'#fff',
                    display:'inline-block', animation:`bsDot 1.1s ease-in-out ${i*.18}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}

          {/* All other steps */}
          {step !== 'docs' && !(step === 'otp' && verifying) && (
            <div style={{ display:'flex', gap:10 }}>
              {/* Back / Cancel */}
              <button
                onClick={() => {
                  if (step === 'type' || step === 'phone' || step === 'profile') {
                    if (step === 'phone') { setStep('type'); return; }
                    closeAndRefresh(); return;
                  }
                  if (step === 'otp') { setStep('phone'); setCode(''); setError(''); }
                }}
                disabled={busy}
                style={{
                  flex:'0 0 auto', height:50, padding:'0 18px', borderRadius:14,
                  border:'1px solid #E2E7EE', background:'#fff', color:'#44506A',
                  fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                }}
              >
                {step === 'type' || step === 'profile' ? 'Cancel' : step === 'phone' ? '← Back' : '← Back'}
              </button>

              {/* Primary action */}
              <button
                onClick={
                  step === 'type'    ? submitType    :
                  step === 'phone'   ? sendCode      :
                  step === 'otp'     ? () => verifyCode() :
                  submitProfile
                }
                disabled={busy}
                style={{
                  flex:1, height:50, borderRadius:14, border:'none',
                  background:ACCENT, color:'#fff', fontSize:15, fontWeight:700,
                  cursor: busy ? 'default' : 'pointer', fontFamily:'inherit', opacity: busy ? .7 : 1,
                }}
              >
                {busy ? 'Please wait…' :
                  step === 'type'    ? 'Continue →'   :
                  step === 'phone'   ? 'Send code'    :
                  step === 'otp'     ? 'Verify'       :
                  'Continue →'
                }
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes bsBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes bsShake {
          0%,100%{transform:translateX(0)} 15%{transform:translateX(-6px)}
          30%{transform:translateX(5px)} 45%{transform:translateX(-4px)}
          60%{transform:translateX(3px)} 75%{transform:translateX(-2px)}
        }
        @keyframes bsDot {
          0%,80%,100%{transform:translateY(0);opacity:.5}
          40%{transform:translateY(-5px);opacity:1}
        }
      `}</style>
    </div>
  );
}
