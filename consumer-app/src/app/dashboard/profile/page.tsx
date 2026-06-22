'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TEAM, NOTIF_PREFS } from '@/lib/provider/data';
import { useToastStore } from '@/lib/provider/toast-store';

type Lang = 'en' | 'bn';
type NotifState = Record<string, boolean>;

export default function ProfilePage() {
  const [lang, setLang] = useState<Lang>('en');
  const [notif, setNotif] = useState<NotifState>(() =>
    Object.fromEntries(NOTIF_PREFS.map(p => [p.key, p.def]))
  );
  const notify = useToastStore(s => s.notify);

  return (
    <div className="animate-bvfade">
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 20, alignItems: 'start', maxWidth: 1000 }}>
        {/* Left col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Profile card */}
          <div style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18, overflow: 'hidden', boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
            <div style={{ height: 80, background: 'linear-gradient(120deg, #16273F, #2C557F)' }} />
            <div style={{ padding: '0 24px 22px' }}>
              <div style={{
                width: 76, height: 76, borderRadius: 20,
                background: 'linear-gradient(140deg, #3C6E9E, #2C557F)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 28, marginTop: -38,
                border: '4px solid #fff', boxShadow: '0 8px 20px -8px rgba(20,40,70,.4)',
              }}>
                R
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 12 }}>
                <h2 style={{ fontSize: 21, fontWeight: 800, color: '#15243B', margin: 0 }}>Rahima Properties</h2>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#2E7D55', background: '#E7F1EC', padding: '4px 11px', borderRadius: 999 }}>✓ Verified agency</span>
              </div>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: '#8893A4', margin: '10px 0 0' }}>
                Trusted agency serving Aftab Nagar since 2019. We physically verify every listing and respond within 15 minutes on average.
              </p>
              <div style={{ display: 'flex', gap: 22, marginTop: 16, paddingTop: 16, borderTop: '1px solid #F2F4F7' }}>
                <div><div style={{ fontSize: 19, fontWeight: 800, color: '#15243B' }}>14</div><div style={{ fontSize: 11.5, color: '#9AA6B6' }}>Listings</div></div>
                <div><div style={{ fontSize: 19, fontWeight: 800, color: '#15243B' }}>4.8★</div><div style={{ fontSize: 11.5, color: '#9AA6B6' }}>Rating</div></div>
                <div><div style={{ fontSize: 19, fontWeight: 800, color: '#15243B' }}>96%</div><div style={{ fontSize: 11.5, color: '#9AA6B6' }}>Response</div></div>
              </div>
              <button
                onClick={() => notify('Opening profile editor', 'Edit your public agency profile.', 'info')}
                className="bv-press bv-fill"
                style={{ '--fill': '#EEF2F7', marginTop: 16, width: '100%', height: 42, borderRadius: 12, border: '1px solid #E2E7EE', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700, color: '#44506A' } as React.CSSProperties}
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
                <div key={t.initial} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 11px', border: '1px solid #EEF1F5', borderRadius: 12 }}>
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
                <div className="bv-press bv-fill" style={{ '--fill': '#EEF2F7', padding: 14, borderRadius: 13, border: '1.5px solid #E2E7EE', background: '#fff', cursor: 'pointer' } as React.CSSProperties}>
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
                      border: `1.5px solid ${on ? '#1E3A5C' : '#E2E7EE'}`,
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
