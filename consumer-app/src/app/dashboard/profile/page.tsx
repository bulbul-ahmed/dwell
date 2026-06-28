'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { TEAM, NOTIF_PREFS } from '@/lib/provider/data';
import { useToastStore } from '@/lib/provider/toast-store';

type Lang = 'en' | 'bn';
type NotifState = Record<string, boolean>;
type PayoutMethod = 'bkash' | 'bank' | 'nagad';

const LISTING_DEFAULTS = [
  { key: 'pets',       label: 'Pets allowed',      sub: 'Default for new listings' },
  { key: 'visitors',   label: 'Visitors welcome',  sub: 'Show in listing terms'   },
  { key: 'smoking',    label: 'No smoking',         sub: 'Enforce smoke-free rule' },
  { key: 'shortTerm',  label: 'Short-term ok',      sub: 'Allow <6 month leases'  },
];

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB

export default function ProfilePage() {
  const [lang, setLang]             = useState<Lang>('en');
  const [notif, setNotif]           = useState<NotifState>(() =>
    Object.fromEntries(NOTIF_PREFS.map(p => [p.key, p.def]))
  );
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>('bkash');
  const [payoutAccount, setPayoutAccount] = useState('');
  const [listingPrefs, setListingPrefs] = useState<NotifState>(() =>
    Object.fromEntries(LISTING_DEFAULTS.map(p => [p.key, false]))
  );
  const notify = useToastStore(s => s.notify);

  // ── Current user (for avatar + name) ──────────────────────────────────────
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/users/me')
      .then(r => r.json())
      .then(({ user }) => { if (user) { setName(user.name ?? ''); setAvatarUrl(user.avatarUrl ?? null); } })
      .catch(() => {});
  }, []);

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notify('Invalid file', 'Please choose an image file.', 'error');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      notify('Image too large', 'Maximum size is 5 MB.', 'error');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('files', file);
      const up = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!up.ok) throw new Error('upload');
      const { urls } = await up.json() as { urls: string[] };
      const url = urls?.[0];
      if (!url) throw new Error('no url');

      const save = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: url }),
      });
      if (!save.ok) throw new Error('save');

      setAvatarUrl(url);
      notify('Photo updated', 'Your profile photo has been saved.', 'success');
    } catch {
      notify('Upload failed', 'Could not update your photo. Try again.', 'error');
    } finally {
      setUploading(false);
    }
  }

  const initial = (name.trim()[0] ?? 'R').toUpperCase();

  return (
    <div className="animate-bvfade">
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 20, alignItems: 'start', maxWidth: 1000 }}>
        {/* Left col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Profile card */}
          <div style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18, overflow: 'hidden', boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
            <div style={{ height: 80, background: 'linear-gradient(120deg, #16273F, #2C557F)' }} />
            <div style={{ padding: '0 24px 22px' }}>
              <input ref={fileRef} type="file" accept="image/*" onChange={onPickPhoto} style={{ display: 'none' }} />
              <button
                type="button"
                onClick={() => !uploading && fileRef.current?.click()}
                aria-label="Change profile photo"
                style={{
                  position: 'relative', padding: 0, marginTop: -38,
                  width: 76, height: 76, borderRadius: 20,
                  backgroundColor: '#2C557F',
                  backgroundImage: avatarUrl ? `url('${avatarUrl}')` : 'linear-gradient(140deg, #3C6E9E, #2C557F)',
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 28,
                  border: '4px solid #fff', boxShadow: '0 8px 20px -8px rgba(20,40,70,.4)',
                  cursor: uploading ? 'wait' : 'pointer', overflow: 'hidden',
                }}
              >
                {!avatarUrl && initial}
                {/* camera badge */}
                <span style={{ position: 'absolute', right: -2, bottom: -2, width: 26, height: 26, borderRadius: '50%', background: '#1E3A5C', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {uploading ? (
                    <span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'block', animation: 'spin .7s linear infinite' }} />
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M4 8h3l1.5-2h7L17 8h3v11H4V8z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round"/><circle cx="12" cy="13" r="3.2" stroke="#fff" strokeWidth="1.8"/></svg>
                  )}
                </span>
              </button>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 12 }}>
                <h2 style={{ fontSize: 21, fontWeight: 800, color: '#15243B', margin: 0 }}>{name || 'Rahima Properties'}</h2>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#2E7D55', background: '#E7F1EC', padding: '4px 11px', borderRadius: 999 }}>✓ Verified agency</span>
              </div>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: '#8893A4', margin: '10px 0 0' }}>
                Trusted agency serving Aftab Nagar since 2019. We physically verify every listing and respond within 15 minutes on average.
              </p>
              <div style={{ display: 'flex', gap: 22, marginTop: 16, paddingTop: 16, borderTop: '1px solid #F2F4F7' }}>
                <div><div style={{ fontSize: 19, fontWeight: 800, color: '#15243B' }}>14</div><div style={{ fontSize: 11.5, color: '#9AA6B6' }}>Listings</div></div>
                <div><div style={{ fontSize: 19, fontWeight: 800, color: '#15243B' }}>4.8★</div><div style={{ fontSize: 11.5, color: '#9AA6B6' }}>Rating</div></div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ fontSize: 19, fontWeight: 800, color: '#2E7D55' }}>96%</div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#2E7D55', background: '#E7F1EC', padding: '2px 6px', borderRadius: 999 }}>Excellent</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: '#9AA6B6' }}>Response rate</div>
                </div>
              </div>
              <div style={{ marginTop: 12, padding: '10px 13px', borderRadius: 12, background: '#F0FBF5', border: '1px solid #C0E4D0', display: 'flex', alignItems: 'center', gap: 9 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#2E7D55" strokeWidth="1.8"/><path d="M9 12l2 2 4-4" stroke="#2E7D55" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span style={{ fontSize: 12.5, color: '#2E7D55', fontWeight: 700 }}>Top responder · You reply within ~15 min on average</span>
              </div>
              <button
                onClick={() => notify('Opening profile editor', 'Edit your public agency profile.', 'info')}
                className="bv-press bv-fill"
                style={{ '--fill': '#EEF2F7', marginTop: 16, width: '100%', height: 42, borderRadius: 12, border: '1px solid #ECEEF1', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700, color: '#44506A' } as React.CSSProperties}
              >
                Edit public profile
              </button>
            </div>
          </div>

          {/* Team seats */}
          <div style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18, padding: 24, boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#15243B', margin: '0 0 16px' }}>Team seats</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {TEAM.map(t => (
                <div key={t.initial} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 11px', border: '1px solid #ECEEF1', borderRadius: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: t.avBg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>
                    {t.initial}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#15243B' }}>{t.name}</div>
                    <div style={{ fontSize: 11.5, color: '#9AA6B6' }}>{t.email}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: t.roleFg, background: t.roleBg, padding: '4px 10px', borderRadius: 999 }}>{t.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Account mode */}
          <div style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18, padding: 24, boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#15243B', margin: '0 0 6px' }}>Account mode</h3>
            <p style={{ fontSize: 12.5, color: '#8893A4', margin: '0 0 14px' }}>Switch between finding and listing without signing out.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 10 }}>
              <div style={{ padding: 14, borderRadius: 13, border: '1.5px solid #1E3A5C', background: 'rgba(30,58,92,0.05)' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1E3A5C' }}>🏠 Provider</div>
                <div style={{ fontSize: 11.5, color: '#8893A4', marginTop: 3 }}>Current mode</div>
              </div>
              <Link href="http://localhost:3001" target="_blank" style={{ textDecoration: 'none' }}>
                <div className="bv-press bv-fill" style={{ '--fill': '#EEF2F7', padding: 14, borderRadius: 13, border: '1.5px solid #ECEEF1', background: '#fff', cursor: 'pointer' } as React.CSSProperties}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#44506A' }}>🔑 Seeker</div>
                  <div style={{ fontSize: 11.5, color: '#8893A4', marginTop: 3 }}>Browse &amp; rent</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Language */}
          <div style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18, padding: 24, boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#15243B', margin: '0 0 6px' }}>Language</h3>
            <p style={{ fontSize: 12.5, color: '#8893A4', margin: '0 0 14px' }}>Bangla numerals &amp; ৳ formatting apply automatically.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              {(['en', 'bn'] as Lang[]).map(k => {
                const on = lang === k;
                return (
                  <button
                    key={k}
                    onClick={() => setLang(k)}
                    className="bv-press"
                    style={{
                      flex: 1, height: 44, borderRadius: 12,
                      border: `1.5px solid ${on ? '#1E3A5C' : '#ECEEF1'}`,
                      background: on ? 'rgba(30,58,92,0.05)' : '#fff',
                      cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
                      color: on ? '#1E3A5C' : '#44506A',
                    }}
                  >
                    {k === 'en' ? 'English' : 'বাংলা'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payout preferences */}
          <div style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18, padding: 24, boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#15243B', margin: '0 0 4px' }}>Payout preferences</h3>
            <p style={{ fontSize: 12.5, color: '#8893A4', margin: '0 0 16px' }}>Where we send your rental income.</p>
            <div style={{ display: 'flex', gap: 7, marginBottom: 14 }}>
              {([['bkash', 'bKash'], ['nagad', 'Nagad'], ['bank', 'Bank']] as [PayoutMethod, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setPayoutMethod(key)}
                  style={{
                    flex: 1, height: 40, borderRadius: 10,
                    border: payoutMethod === key ? '2px solid #1E3A5C' : '1px solid #ECEEF1',
                    background: payoutMethod === key ? '#EEF3FB' : '#fff',
                    color: payoutMethod === key ? '#1E3A5C' : '#5A6172',
                    fontSize: 13, fontWeight: payoutMethod === key ? 800 : 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#41495A', display: 'block', marginBottom: 6 }}>
                {payoutMethod === 'bank' ? 'Bank account number' : `${payoutMethod === 'bkash' ? 'bKash' : 'Nagad'} number`}
              </label>
              <input
                type="text"
                value={payoutAccount}
                onChange={e => setPayoutAccount(e.target.value)}
                placeholder={payoutMethod === 'bank' ? 'Account number' : '01XXXXXXXXX'}
                style={{ width: '100%', height: 42, borderRadius: 10, border: '1px solid #ECEEF1', padding: '0 13px', fontSize: 13.5, fontFamily: 'inherit', color: '#15243B', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <button
              onClick={() => notify('Payout preferences saved', 'We will send your next payout to this account.', 'success')}
              style={{ height: 38, padding: '0 18px', borderRadius: 10, border: 'none', background: '#1E3A5C', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Save payout info
            </button>
          </div>

          {/* Listing defaults */}
          <div style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18, padding: 24, boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#15243B', margin: '0 0 4px' }}>Listing defaults</h3>
            <p style={{ fontSize: 12.5, color: '#8893A4', margin: '0 0 14px' }}>Pre-fill these when you create a new listing.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {LISTING_DEFAULTS.map(p => {
                const on = listingPrefs[p.key] ?? false;
                return (
                  <div key={p.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F2F4F7' }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#15243B' }}>{p.label}</div>
                      <div style={{ fontSize: 12, color: '#8893A4', marginTop: 1 }}>{p.sub}</div>
                    </div>
                    <button
                      onClick={() => setListingPrefs(prev => ({ ...prev, [p.key]: !on }))}
                      style={{ width: 46, height: 27, borderRadius: 999, border: 'none', background: on ? '#2E7D55' : '#CCD3DB', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background .25s' }}
                    >
                      <span style={{ position: 'absolute', top: 2.5, left: on ? 21 : 2.5, width: 22, height: 22, borderRadius: '50%', background: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,.25)', transition: 'left .25s cubic-bezier(.34,1.56,.64,1)', display: 'block' }} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notifications */}
          <div style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18, padding: 24, boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#15243B', margin: '0 0 14px' }}>Notifications</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {NOTIF_PREFS.map(p => {
                const on = notif[p.key] ?? p.def;
                return (
                  <div key={p.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid #F2F4F7' }}>
                    <div style={{ flex: 1, paddingRight: 14 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#15243B' }}>{p.label}</div>
                      <div style={{ fontSize: 12, color: '#8893A4', marginTop: 1 }}>{p.sub}</div>
                    </div>
                    <button
                      onClick={() => setNotif(prev => ({ ...prev, [p.key]: !on }))}
                      style={{
                        width: 46, height: 27, borderRadius: 999,
                        border: 'none', background: on ? '#2E7D55' : '#CCD3DB',
                        cursor: 'pointer', position: 'relative', flexShrink: 0,
                        transition: 'background .25s',
                      }}
                    >
                      <span style={{
                        position: 'absolute', top: 2.5,
                        left: on ? 21 : 2.5,
                        width: 22, height: 22, borderRadius: '50%',
                        background: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,.25)',
                        transition: 'left .25s cubic-bezier(.34,1.56,.64,1)',
                        display: 'block',
                      }} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
