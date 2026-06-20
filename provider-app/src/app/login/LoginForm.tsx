'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, remember }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid credentials');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('Network error — try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      <label style={{ display: 'block' }}>
        <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#44506A', marginBottom: 8 }}>
          Email address
        </span>
        <div style={{ position: 'relative' }}>
          <Mail size={15} color="#AEB8C6" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@dwell.bd"
            required
            autoComplete="email"
            style={{
              width: '100%', height: 46, border: '1.5px solid #E2E7EE', borderRadius: 12,
              padding: '0 14px 0 40px', fontFamily: 'inherit', fontSize: 14, color: '#15243B',
              outline: 'none', boxSizing: 'border-box', background: '#fff',
              transition: 'border-color .2s',
            }}
            onFocus={e => (e.target.style.borderColor = '#2E7D55')}
            onBlur={e => (e.target.style.borderColor = '#E2E7EE')}
          />
        </div>
      </label>

      <label style={{ display: 'block' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#44506A' }}>Password</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#C9A24B', cursor: 'pointer' }}>
            Forgot password?
          </span>
        </div>
        <div style={{ position: 'relative' }}>
          <Lock size={15} color="#AEB8C6" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••••"
            required
            autoComplete="current-password"
            style={{
              width: '100%', height: 46, border: '1.5px solid #E2E7EE', borderRadius: 12,
              padding: '0 44px 0 40px', fontFamily: 'inherit', fontSize: 14, color: '#15243B',
              outline: 'none', boxSizing: 'border-box', background: '#fff',
              transition: 'border-color .2s',
            }}
            onFocus={e => (e.target.style.borderColor = '#2E7D55')}
            onBlur={e => (e.target.style.borderColor = '#E2E7EE')}
          />
          <button
            type="button"
            onClick={() => setShowPw(v => !v)}
            style={{
              position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              color: '#AEB8C6', display: 'flex', alignItems: 'center',
            }}
          >
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
        <div
          onClick={() => setRemember(v => !v)}
          style={{
            width: 18, height: 18, borderRadius: 5, flexShrink: 0,
            border: remember ? 'none' : '1.5px solid #D0D7E0',
            background: remember ? '#2E7D55' : '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'background .2s, border .2s',
          }}
        >
          {remember && (
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#44506A' }}>Keep me signed in on this device</span>
      </label>

      {error && (
        <div style={{
          fontSize: 13, fontWeight: 600, color: '#B4402B',
          background: '#F8E8E3', border: '1px solid #F0D9D2',
          borderRadius: 10, padding: '10px 14px',
        }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          marginTop: 2, width: '100%', height: 50, borderRadius: 13, border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit', fontSize: 15, fontWeight: 700, color: '#fff',
          background: loading
            ? '#AEB8C6'
            : 'linear-gradient(135deg, #3D9966 0%, #2E7D55 40%, #1E5C3A 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: loading ? 'none' : '0 12px 28px -8px rgba(46,125,85,.45)',
          transition: 'opacity .2s, box-shadow .2s',
          letterSpacing: 0.2,
        }}
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : null}
        {loading ? 'Signing in…' : 'Sign in to dashboard'}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 4 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="11" width="18" height="11" rx="2" stroke="#AEB8C6" strokeWidth="1.8" />
          <path d="M7 11V7a5 5 0 0110 0v4" stroke="#AEB8C6" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span style={{ fontSize: 11.5, color: '#AEB8C6', fontWeight: 500 }}>
          Owner portal · secured by Dwell
        </span>
      </div>
    </form>
  );
}
