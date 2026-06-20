'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { AuthMode } from '@/types';

const ACCENT = '#1E3A5C';

const COPY: Record<AuthMode, { badge: string; title: string; sub: string; cta: string; switchText: string; switchCta: string }> = {
  signin: {
    badge: 'Sign in to Dwell',
    title: 'Welcome back.',
    sub: 'Sign in to your account to continue browsing listings and managing your visits.',
    cta: 'Sign in',
    switchText: "Don't have an account?",
    switchCta: 'Sign up',
  },
  signup: {
    badge: 'Join Dwell free',
    title: 'Find your home in Aftab Nagar.',
    sub: 'Create a free account to save listings, request visits, and chat with owners directly.',
    cta: 'Create account',
    switchText: 'Already have an account?',
    switchCta: 'Sign in',
  },
};

const AUTH_ROLES = [
  { id: 'rent', icon: '🏠', label: 'Find a home' },
  { id: 'own', icon: '🏢', label: 'List a property' },
] as const;

type Flow = 'password' | 'otp-email' | 'otp-verify' | 'forgot-email' | 'forgot-verify';

function AuthPageInner() {
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') ?? '/';

  const [mode,      setMode]      = useState<AuthMode>('signin');
  const [flow,      setFlow]      = useState<Flow>('password');
  const [role,      setRole]      = useState<'rent' | 'own'>('rent');
  const [pwVisible, setPwVisible] = useState(false);
  const [name,      setName]      = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [otpCode,   setOtpCode]   = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [newPwVis,  setNewPwVis]  = useState(false);
  const [error,     setError]     = useState('');
  const [info,      setInfo]      = useState('');
  const [loading,   setLoading]   = useState(false);

  const copy = COPY[mode];
  const isSignup = mode === 'signup';
  const isForgot = flow === 'forgot-email' || flow === 'forgot-verify';

  const redirect = () => { window.location.href = nextUrl; };

  const handlePasswordSubmit = async () => {
    setError('');
    if (!email)    { setError('Email is required'); return; }
    if (!password) { setError('Password is required'); return; }
    if (isSignup && !name)               { setError('Full name is required'); return; }
    if (isSignup && password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/signin';
      const body = isSignup
        ? { name, email, password, role: role === 'own' ? 'owner' : 'renter' }
        : { email, password };
      const res  = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? 'Something went wrong'); }
      else { redirect(); }
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleSendOTP = async () => {
    setError(''); setInfo('');
    if (!email) { setError('Email is required'); return; }
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/otp/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? 'Failed to send code'); }
      else { setFlow('otp-verify'); setInfo(`Code sent to ${email}. Check inbox (or server console in dev).`); }
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleVerifyOTP = async () => {
    setError('');
    if (!otpCode) { setError('Enter the 6-digit code'); return; }
    setLoading(true);
    try {
      const body = {
        email,
        code: otpCode,
        role: role === 'own' ? 'owner' : 'renter',
        ...(isSignup && name ? { name } : {}),
      };
      const res  = await fetch('/api/auth/otp/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? 'Invalid or expired code'); }
      else { redirect(); }
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleForgotSend = async () => {
    setError(''); setInfo('');
    if (!email) { setError('Email is required'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? 'Failed to send code'); }
      else { setFlow('forgot-verify'); setInfo(`Reset code sent to ${email}.`); }
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  const handleForgotReset = async () => {
    setError('');
    if (!otpCode) { setError('Enter the 6-digit code'); return; }
    if (!newPw || newPw.length < 8) { setError('New password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otpCode, newPassword: newPw }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? 'Failed to reset password'); }
      else { redirect(); }
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  const handleSubmit =
    flow === 'otp-verify'    ? handleVerifyOTP    :
    flow === 'otp-email'     ? handleSendOTP      :
    flow === 'forgot-email'  ? handleForgotSend   :
    flow === 'forgot-verify' ? handleForgotReset  :
    handlePasswordSubmit;

  const ctaLabel =
    flow === 'otp-email'     ? (loading ? 'Sending…'    : 'Send code')       :
    flow === 'otp-verify'    ? (loading ? 'Verifying…'  : 'Verify code')     :
    flow === 'forgot-email'  ? (loading ? 'Sending…'    : 'Send reset code') :
    flow === 'forgot-verify' ? (loading ? 'Resetting…'  : 'Set new password'):
    (loading ? 'Please wait…' : copy.cta);

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 48, border: '1px solid #E1E6EC', borderRadius: 13,
    padding: '0 15px', fontFamily: 'inherit', fontSize: 15, color: '#15243B',
    outline: 'none', background: '#fff', boxSizing: 'border-box',
  };

  return (
    <div className="g-auth" style={{ background: '#FFFFFF', fontFamily: "'Plus Jakarta Sans', sans-serif", animation: 'bvfade .3s ease' }}>

      {/* ===== LEFT: FORM ===== */}
      <div style={{ position: 'relative', height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '26px 40px 0' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', textDecoration: 'none' }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(30,58,92,0.35)' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <path d="M3 11.5L12 4l9 7.5" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5.5 10v9.5h13V10" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span style={{ fontSize: 24, letterSpacing: '0.2px', color: '#15243B' }}>Dwell</span>
          </Link>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 600, color: '#6A7180', cursor: 'pointer', textDecoration: 'none' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M15 6l-6 6 6 6" stroke="#6A7180" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to home
          </Link>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '28px 40px 40px' }}>
          <div style={{ width: '100%', maxWidth: 412 }}>

            {/* Forgot password flow */}
            {isForgot ? (
              <>
                <button
                  onClick={() => { setFlow('password'); setError(''); setInfo(''); setOtpCode(''); setNewPw(''); }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#6A7180', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 24, padding: 0 }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="#6A7180" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Back to sign in
                </button>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#F4F1EB', border: '1px solid #ECE6DA', borderRadius: 999, padding: '6px 13px', fontSize: 12, fontWeight: 600, color: '#8A7E66', marginBottom: 22 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4F8A6B' }} />
                  Reset your password
                </div>
                <h1 style={{ fontWeight: 800, fontSize: 34, lineHeight: 1.1, letterSpacing: '-0.5px', margin: '0 0 9px', color: '#15243B' }}>Forgot password?</h1>
                <p style={{ fontSize: 15, lineHeight: 1.55, color: '#6A7180', margin: '0 0 26px' }}>Enter your email and we'll send a code to reset your password.</p>

                {flow === 'forgot-email' && (
                  <label style={{ display: 'block', marginBottom: 16 }}>
                    <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#4A5161', marginBottom: 7 }}>Email address</span>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" style={inputStyle} />
                  </label>
                )}

                {flow === 'forgot-verify' && (
                  <>
                    <div style={{ fontSize: 13, color: '#2E7D55', background: '#EAF1ED', border: '1px solid #C5DDD0', borderRadius: 12, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Code sent to <strong>{email}</strong></span>
                      <button onClick={() => { setFlow('forgot-email'); setOtpCode(''); setError(''); }} style={{ fontSize: 12, fontWeight: 700, color: ACCENT, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Change</button>
                    </div>
                    <label style={{ display: 'block', marginBottom: 14 }}>
                      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#4A5161', marginBottom: 7 }}>6-digit code</span>
                      <input
                        value={otpCode}
                        onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        maxLength={6}
                        style={{ ...inputStyle, fontSize: 26, letterSpacing: 12, textAlign: 'center', fontWeight: 800 }}
                      />
                    </label>
                    <label style={{ display: 'block', marginBottom: 16 }}>
                      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#4A5161', marginBottom: 7 }}>New password</span>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={newPwVis ? 'text' : 'password'}
                          value={newPw}
                          onChange={e => setNewPw(e.target.value)}
                          placeholder="At least 8 characters"
                          style={{ ...inputStyle, padding: '0 46px 0 15px' }}
                        />
                        <button type="button" onClick={() => setNewPwVis(v => !v)} style={{ position: 'absolute', right: 6, top: 6, width: 36, height: 36, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {newPwVis
                            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" stroke="#8A91A0" strokeWidth="1.8" strokeLinecap="round" /></svg>
                            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#8A91A0" strokeWidth="1.8" /><circle cx="12" cy="12" r="3" stroke="#8A91A0" strokeWidth="1.8" /></svg>
                          }
                        </button>
                      </div>
                    </label>
                  </>
                )}
              </>
            ) : (
              <>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#F4F1EB', border: '1px solid #ECE6DA', borderRadius: 999, padding: '6px 13px', fontSize: 12, fontWeight: 600, color: '#8A7E66', marginBottom: 22 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4F8A6B' }} />
                  {copy.badge}
                </div>

                <h1 style={{ fontWeight: 800, fontSize: 34, lineHeight: 1.1, letterSpacing: '-0.5px', margin: '0 0 9px', color: '#15243B' }}>{copy.title}</h1>
                <p style={{ fontSize: 15, lineHeight: 1.55, color: '#6A7180', margin: '0 0 26px' }}>{copy.sub}</p>

                {/* social buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  <button
                    onClick={() => { window.location.href = '/api/auth/google'; }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 11, width: '100%', height: 48, border: '1px solid #E1E6EC', borderRadius: 13, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14.5, fontWeight: 600, color: '#2A3344' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0012 23z" />
                      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 010-4.2V7.06H2.18a11 11 0 000 9.88l3.66-2.84z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 002.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
                    </svg>
                    Continue with Google
                  </button>

                  <button
                    onClick={() => { setFlow(f => f === 'password' ? 'otp-email' : 'password'); setError(''); setInfo(''); setOtpCode(''); }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 11, width: '100%', height: 48, border: `1px solid ${flow !== 'password' ? ACCENT : '#E1E6EC'}`, borderRadius: 13, background: flow !== 'password' ? '#EEF3F8' : '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14.5, fontWeight: 600, color: flow !== 'password' ? ACCENT : '#2A3344' }}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    {flow !== 'password' ? 'Use password instead' : 'Sign in with email OTP'}
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                  <div style={{ flex: 1, height: 1, background: '#ECEEF1' }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#9AA1AD', letterSpacing: '0.3px' }}>
                    {flow !== 'password' ? 'enter email below' : 'or with email & password'}
                  </span>
                  <div style={{ flex: 1, height: 1, background: '#ECEEF1' }} />
                </div>

                {/* role selector (signup only) */}
                {isSignup && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#4A5161', marginBottom: 8 }}>I'm here to</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {AUTH_ROLES.map(r => {
                        const active = role === r.id;
                        return (
                          <button key={r.id} onClick={() => setRole(r.id)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 13px', border: `1.5px solid ${active ? ACCENT : '#E1E6EC'}`, background: active ? '#EEF3F8' : '#fff', borderRadius: 13, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                            <span style={{ fontSize: 17 }}>{r.icon}</span>
                            <span style={{ fontSize: 13.5, fontWeight: 700, color: active ? ACCENT : '#41495A' }}>{r.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* name (signup only) */}
                {isSignup && (
                  <label style={{ display: 'block', marginBottom: 14 }}>
                    <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#4A5161', marginBottom: 7 }}>Full name</span>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Anika Rahman" style={inputStyle} />
                  </label>
                )}

                {/* email (hidden on otp-verify) */}
                {flow !== 'otp-verify' && (
                  <label style={{ display: 'block', marginBottom: 14 }}>
                    <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#4A5161', marginBottom: 7 }}>Email address</span>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" style={inputStyle} />
                  </label>
                )}

                {/* OTP verify */}
                {flow === 'otp-verify' && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 13, color: '#2E7D55', background: '#EAF1ED', border: '1px solid #C5DDD0', borderRadius: 12, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Code sent to <strong>{email}</strong></span>
                      <button onClick={() => { setFlow('otp-email'); setOtpCode(''); setError(''); }} style={{ fontSize: 12, fontWeight: 700, color: ACCENT, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Change</button>
                    </div>
                    <label style={{ display: 'block' }}>
                      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#4A5161', marginBottom: 7 }}>6-digit code</span>
                      <input
                        value={otpCode}
                        onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        maxLength={6}
                        onKeyDown={e => { if (e.key === 'Enter') handleVerifyOTP(); }}
                        style={{ ...inputStyle, fontSize: 26, letterSpacing: 12, textAlign: 'center', fontWeight: 800 }}
                      />
                    </label>
                  </div>
                )}

                {/* password */}
                {flow === 'password' && (
                  <label style={{ display: 'block', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#4A5161' }}>Password</span>
                      {mode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => { setFlow('forgot-email'); setError(''); setInfo(''); setOtpCode(''); setNewPw(''); }}
                          style={{ fontSize: 12.5, fontWeight: 600, color: ACCENT, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
                        >
                          Forgot?
                        </button>
                      )}
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={pwVisible ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder={isSignup ? 'Create a password (min. 8 chars)' : 'Enter your password'}
                        onKeyDown={e => { if (e.key === 'Enter') handlePasswordSubmit(); }}
                        style={{ ...inputStyle, padding: '0 46px 0 15px' }}
                      />
                      <button type="button" onClick={() => setPwVisible(v => !v)} style={{ position: 'absolute', right: 6, top: 6, width: 36, height: 36, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {pwVisible ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" stroke="#8A91A0" strokeWidth="1.8" strokeLinecap="round" /></svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#8A91A0" strokeWidth="1.8" /><circle cx="12" cy="12" r="3" stroke="#8A91A0" strokeWidth="1.8" /></svg>
                        )}
                      </button>
                    </div>
                  </label>
                )}
              </>
            )}

            {info  && <div style={{ fontSize: 13, color: '#2E7D55', background: '#EAF1ED', border: '1px solid #C5DDD0', borderRadius: 10, padding: '9px 13px', marginBottom: 12 }}>{info}</div>}
            {error && <div style={{ fontSize: 13, color: '#C7553B', marginBottom: 12 }}>{error}</div>}

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{ width: '100%', height: 50, background: ACCENT, color: '#fff', border: 'none', borderRadius: 13, fontFamily: 'inherit', fontSize: 15.5, fontWeight: 700, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 12px 24px -10px rgba(30,58,92,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}
            >
              {ctaLabel}
              {!loading && <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M5 12h13M13 6l6 6-6 6" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </button>

            {!isForgot && (
              <p style={{ textAlign: 'center', fontSize: 14, color: '#6A7180', margin: '22px 0 0' }}>
                {copy.switchText}{' '}
                <span onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError(''); setInfo(''); setFlow('password'); }} style={{ fontWeight: 700, color: ACCENT, cursor: 'pointer' }}>
                  {copy.switchCta}
                </span>
              </p>
            )}

            <p style={{ textAlign: 'center', fontSize: 11.5, color: '#A2A8B2', lineHeight: 1.5, margin: '26px 0 0' }}>
              By continuing you agree to Dwell's{' '}
              <span style={{ color: '#6A7180', textDecoration: 'underline', cursor: 'pointer' }}>Terms</span>{' '}
              &amp;{' '}
              <span style={{ color: '#6A7180', textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span>.
            </p>
          </div>
        </div>
      </div>

      {/* ===== RIGHT: VISUAL ===== */}
      <div className="auth-right-panel">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1100&q=78" alt="home interior" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(21,36,59,0.30) 0%, rgba(21,36,59,0.55) 52%, rgba(15,28,48,0.92) 100%)' }} />
        <div style={{ position: 'absolute', top: 34, right: 36, display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 999, padding: '8px 14px' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#A8E0C0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: '#fff' }}>Every owner &amp; document verified</span>
        </div>
        <div style={{ position: 'absolute', left: 44, right: 44, bottom: 44 }}>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: 46, lineHeight: 1.08, color: '#fff', margin: '0 0 14px', letterSpacing: '0.2px' }}>
            A calmer way to find<br />your next <em>home</em> in Dhaka.
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: 'rgba(255,255,255,0.78)', margin: '0 0 26px', maxWidth: 380 }}>
            Browse honest listings across Aftab Nagar, chat with owners directly, and book a visit — no brokers, no surprises.
          </p>
          <div style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 18, padding: '18px 20px', maxWidth: 420 }}>
            <div style={{ display: 'flex', gap: 3, marginBottom: 10 }}><span style={{ color: '#FFC56B', fontSize: 14 }}>★★★★★</span></div>
            <p style={{ fontSize: 14.5, lineHeight: 1.55, color: '#fff', margin: '0 0 14px', fontWeight: 500 }}>"Found our flat in Block B in three days. The owner was verified and the visit was booked right inside the app."</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#E8C9A0,#C99B6E)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#5A3E22' }}>S</div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff' }}>Sadia &amp; Tanvir</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>Moved to Aftab Nagar, 2025</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 26, marginTop: 26 }}>
            <div><div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>1,200+</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Verified listings</div></div>
            <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.22)' }} />
            <div><div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>4.8★</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Avg owner rating</div></div>
            <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.22)' }} />
            <div><div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>0</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Broker fees</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthPageInner />
    </Suspense>
  );
}
