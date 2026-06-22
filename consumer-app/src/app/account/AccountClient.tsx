'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Footer from '@/components/Footer';
import BecomeOwnerSheet from '@/components/BecomeOwnerSheet';

const ACCENT = '#1E3A5C';

const NOTIF_PREFS = [
  { label: 'Visit confirmations', sub: 'When an owner confirms or changes your visit' },
  { label: 'New matches',         sub: 'Homes matching your saved searches'           },
  { label: 'Messages',            sub: 'Replies and new conversations'                },
];

export interface UserData {
  id: number; name: string; email: string; phone: string | null;
  role: string; createdAt: string; hasPassword: boolean; avatarUrl?: string | null;
}
export interface StatsData { savedCount: number; visitsCount: number; reviewsCount: number }

export default function AccountClient({ initialUser, initialStats }: { initialUser: UserData; initialStats: StatsData }) {
  const router = useRouter();
  const [notifOn,       setNotifOn]       = useState([true, true, false]);
  const [user,          setUser]          = useState<UserData>(initialUser);
  const [stats]                           = useState<StatsData>(initialStats);
  const [editing,       setEditing]       = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [name,          setName]          = useState(initialUser.name);
  const [phone,         setPhone]         = useState(initialUser.phone ?? '');
  const [showOwnerSheet, setShowOwnerSheet] = useState(false);
  const [showChangePw,  setShowChangePw]  = useState(false);
  const [currentPw,     setCurrentPw]     = useState('');
  const [newPw,         setNewPw]         = useState('');
  const [confirmPw,     setConfirmPw]     = useState('');
  const [pwSaving,      setPwSaving]      = useState(false);
  const [pwError,       setPwError]       = useState('');
  const [pwSuccess,     setPwSuccess]     = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const cancelEdit = () => { setName(user.name); setPhone(user.phone ?? ''); setEditing(false); };
  const saveEdit = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/users/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, phone }) });
      const { user: u } = await res.json();
      if (res.ok && u) { setUser(u); setEditing(false); }
    } catch { /* keep open */ }
    finally { setSaving(false); }
  };

  // Owners jump straight to the provider dashboard (shared cookie = SSO).
  // Brief branded transition so the cross-app jump feels intentional, not a reload.
  const goToDashboard = () => {
    setSwitching(true);
    setTimeout(() => { window.location.href = '/dashboard'; }, 3500);
  };

  const savePassword = async () => {
    setPwError(''); setPwSuccess('');
    if (!newPw || newPw.length < 8) { setPwError('New password must be at least 8 characters'); return; }
    if (newPw !== confirmPw) { setPwError('Passwords do not match'); return; }
    setPwSaving(true);
    try {
      const body: Record<string, string> = { newPassword: newPw };
      if (user.hasPassword) body.currentPassword = currentPw;
      const res = await fetch('/api/auth/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setPwError(data.error ?? 'Failed to change password'); }
      else { setPwSuccess('Password updated successfully'); setCurrentPw(''); setNewPw(''); setConfirmPw(''); setShowChangePw(false); setUser(u => ({ ...u, hasPassword: true })); }
    } catch { setPwError('Network error'); }
    finally { setPwSaving(false); }
  };

  const signOut = async () => { await fetch('/api/auth/signout', { method: 'POST' }).catch(() => {}); router.push('/auth'); };

  const inputStyle = (editable: boolean): React.CSSProperties => ({
    width: '100%', height: 46, border: `1px solid ${editable ? ACCENT : '#E1E6EC'}`,
    borderRadius: 12, padding: '0 14px', fontFamily: 'inherit', fontSize: 14,
    color: '#15243B', outline: 'none', boxSizing: 'border-box',
    background: editable ? '#fff' : '#F9FAFC', transition: 'border-color .2s',
  });

  const pwInputStyle: React.CSSProperties = {
    width: '100%', height: 46, border: '1px solid #E1E6EC', borderRadius: 12,
    padding: '0 14px', fontFamily: 'inherit', fontSize: 14, color: '#15243B',
    outline: 'none', boxSizing: 'border-box', background: '#fff',
  };

  const isOwner = user?.role === 'owner';
  const [switching, setSwitching] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        .acct-link:hover { background: #F4F6F9 !important; border-color: #D0D5DE !important; }
        @keyframes bvfade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @keyframes acctspin { to { transform: rotate(360deg); } }
        @keyframes acctover { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
      <main className="pg-md" style={{ animation: 'bvfade .4s ease both' }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 400, fontSize: 34, margin: '0 0 26px', color: '#15243B' }}>Account</h1>

        <div className="g-account">

          {/* ── LEFT ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Profile card */}
            <div style={{ background: '#fff', border: '1px solid #E7EAEE', borderRadius: 20, overflow: 'hidden', boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
              <div style={{ height: 78, background: 'linear-gradient(120deg, #16273F, #2C557F)' }} />
              <div style={{ padding: '0 22px 22px' }}>
                <div style={{ position: 'relative', width: 78, marginTop: -39 }}>
                  <div style={{ width: 78, height: 78, borderRadius: 22, background: '#15243B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 30, border: '4px solid #fff' }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <button onClick={() => fileRef.current?.click()} title="Change photo" style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', background: ACCENT, border: '2.5px solid #fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={() => {}} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'nowrap' }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: '#15243B', margin: 0, whiteSpace: 'nowrap' }}>{user.name}</h2>
                </div>
                <div style={{ fontSize: 13.5, color: '#6A7180', marginTop: 5 }}>
                  Joined {new Date(user.createdAt).toLocaleDateString('en', { month: 'short', year: 'numeric' })}
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', gap: 20, marginTop: 16, paddingTop: 16, borderTop: '1px solid #F2F4F7' }}>
                  {[
                    { n: stats.savedCount,   t: 'Saved',   href: '/saved'  },
                    { n: stats.visitsCount,  t: 'Visits',  href: '/visits' },
                    { n: stats.reviewsCount, t: 'Reviews', href: '/saved'  },
                  ].map(s => (
                    <Link key={s.t} href={s.href} style={{ textDecoration: 'none' }}>
                      <div style={{ fontSize: 19, fontWeight: 800, color: '#15243B' }}>{s.n}</div>
                      <div style={{ fontSize: 11.5, color: '#9AA6B6', textDecoration: 'underline', textDecorationColor: '#D0D5DE' }}>{s.t}</div>
                    </Link>
                  ))}
                </div>

                <Link href="/messages" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, paddingTop: 16, borderTop: '1px solid #F2F4F7', textDecoration: 'none' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: '#EEF3F8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke={ACCENT} strokeWidth="1.8" strokeLinejoin="round" /></svg>
                  </div>
                  <div><div style={{ fontSize: 13.5, fontWeight: 700, color: '#15243B' }}>Messages</div><div style={{ fontSize: 11.5, color: '#8893A4' }}>Chat with owners</div></div>
                  <span style={{ marginLeft: 'auto', color: '#AEB8C6' }}>→</span>
                </Link>

                <Link href="/visits" style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 14, borderTop: '1px solid #F2F4F7', textDecoration: 'none' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: '#EEF3F8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="3" stroke={ACCENT} strokeWidth="1.8" /><path d="M16 2v4M8 2v4M3 10h18" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" /></svg>
                  </div>
                  <div><div style={{ fontSize: 13.5, fontWeight: 700, color: '#15243B' }}>Visit Requests</div><div style={{ fontSize: 11.5, color: '#8893A4' }}>Track your scheduled visits</div></div>
                  <span style={{ marginLeft: 'auto', color: '#AEB8C6' }}>→</span>
                </Link>
              </div>
            </div>

            {/* Owner mode → provider dashboard */}
            <div style={{ background: '#fff', border: '1px solid #E7EAEE', borderRadius: 20, padding: 22, boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#15243B', margin: '0 0 4px' }}>{isOwner ? 'Owner Dashboard' : 'Become an Owner'}</h3>
              <p style={{ fontSize: 12.5, color: '#8893A4', margin: '0 0 14px' }}>
                {isOwner ? 'Manage your listings, leads and visits in the owner dashboard.' : 'List your property and manage bookings as an owner.'}
              </p>
              <button onClick={isOwner ? goToDashboard : () => setShowOwnerSheet(true)} className="acct-link"
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: '1px solid #E7EAEE', borderRadius: 13, cursor: 'pointer', transition: 'background .25s, border-color .25s', background: '#fff', width: '100%', fontFamily: 'inherit' }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 11, background: '#FFF0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏢</div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#15243B' }}>Switch to Owner</div>
                  <div style={{ fontSize: 12, color: '#8893A4' }}>{isOwner ? 'Open your dashboard' : 'List & manage properties'}</div>
                </div>
                <span style={{ color: '#AEB8C6' }}>→</span>
              </button>
            </div>

          </div>

          {/* ── RIGHT ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Personal details */}
            <div style={{ background: '#fff', border: '1px solid #E7EAEE', borderRadius: 20, padding: 24, boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#15243B', margin: 0 }}>Personal details</h3>
                {!editing ? (
                  <button onClick={() => setEditing(true)} style={{ height: 34, padding: '0 16px', borderRadius: 10, border: '1px solid #E7EAEE', background: '#F4F6F9', color: '#41495A', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={cancelEdit} style={{ height: 34, padding: '0 14px', borderRadius: 10, border: '1px solid #E7EAEE', background: '#fff', color: '#6A7180', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                    <button onClick={saveEdit} disabled={saving} style={{ height: 34, padding: '0 16px', borderRadius: 10, border: 'none', background: ACCENT, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving…' : 'Save changes'}</button>
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { label: 'Full name', value: name,  setter: setName,  readOnly: !editing },
                  { label: 'Phone',     value: phone, setter: setPhone, readOnly: !editing },
                ].map(f => (
                  <label key={f.label} style={{ display: 'block' }}>
                    <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#4A5161', marginBottom: 7 }}>{f.label}</span>
                    <input value={f.value} readOnly={f.readOnly} onChange={e => f.setter(e.target.value)} style={inputStyle(!f.readOnly)} />
                  </label>
                ))}
                <label style={{ display: 'block', gridColumn: '1 / -1' }}>
                  <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#4A5161', marginBottom: 7 }}>Email address</span>
                  <input value={user.email} readOnly style={inputStyle(false)} />
                  <span style={{ fontSize: 11.5, color: '#9AA6B6', marginTop: 4, display: 'block' }}>Contact support to change your email.</span>
                </label>
              </div>
            </div>

            {/* Password / security */}
            <div style={{ background: '#fff', border: '1px solid #E7EAEE', borderRadius: 20, padding: 24, boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#15243B', margin: 0 }}>Password &amp; security</h3>
                <button onClick={() => { setShowChangePw(v => !v); setPwError(''); setPwSuccess(''); }} style={{ height: 34, padding: '0 16px', borderRadius: 10, border: '1px solid #E7EAEE', background: '#F4F6F9', color: '#41495A', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {showChangePw ? 'Cancel' : (user.hasPassword ? 'Change' : 'Set password')}
                </button>
              </div>
              {!showChangePw && <div style={{ fontSize: 13.5, color: '#8893A4' }}>{user.hasPassword ? 'Password is set. You can sign in with email + password.' : 'No password set. You sign in with Google or email OTP.'}</div>}
              {showChangePw && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
                  {user.hasPassword && (
                    <label style={{ display: 'block' }}>
                      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#4A5161', marginBottom: 7 }}>Current password</span>
                      <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="Enter current password" style={pwInputStyle} />
                    </label>
                  )}
                  <label style={{ display: 'block' }}>
                    <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#4A5161', marginBottom: 7 }}>New password</span>
                    <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="At least 8 characters" style={pwInputStyle} />
                  </label>
                  <label style={{ display: 'block' }}>
                    <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#4A5161', marginBottom: 7 }}>Confirm new password</span>
                    <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Repeat new password" style={pwInputStyle} />
                  </label>
                  {pwError   && <div style={{ fontSize: 13, color: '#C7553B' }}>{pwError}</div>}
                  {pwSuccess && <div style={{ fontSize: 13, color: '#2E7D55', background: '#EAF1ED', padding: '8px 12px', borderRadius: 9 }}>{pwSuccess}</div>}
                  <button onClick={savePassword} disabled={pwSaving} style={{ height: 44, borderRadius: 12, border: 'none', background: ACCENT, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: pwSaving ? 0.7 : 1 }}>
                    {pwSaving ? 'Saving…' : (user.hasPassword ? 'Update password' : 'Set password')}
                  </button>
                </div>
              )}
            </div>

            {/* Identity verification */}
            <div style={{ background: '#fff', border: '1px solid #E7EAEE', borderRadius: 20, padding: 24, boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#15243B', margin: '0 0 6px' }}>Identity verification</h3>
              <p style={{ fontSize: 13, color: '#8893A4', margin: '0 0 14px' }}>Your verified badge helps owners trust your visit requests.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { icon: '📄', label: 'Upload payslip or bank statement', sub: 'Unlock "Financially screened" badge' },
                  { icon: '📞', label: 'Add a reference person', sub: 'Name + phone of someone who can vouch for you' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', background: '#FAFBFC', border: '1px dashed #D0D7E0', borderRadius: 12 }}>
                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                    <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: '#15243B' }}>{item.label}</div><div style={{ fontSize: 11.5, color: '#8893A4' }}>{item.sub}</div></div>
                    <button style={{ height: 30, padding: '0 12px', borderRadius: 8, border: '1px solid #D0D7E0', background: '#fff', color: '#41495A', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Add</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Notifications */}
            <div style={{ background: '#fff', border: '1px solid #E7EAEE', borderRadius: 20, padding: 24, boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#15243B', margin: '0 0 4px' }}>Notifications</h3>
              <p style={{ fontSize: 12.5, color: '#8893A4', margin: '0 0 14px' }}>Choose what you hear about.</p>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {NOTIF_PREFS.map((p, i) => {
                  const on = notifOn[i];
                  return (
                    <div key={p.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < NOTIF_PREFS.length - 1 ? '1px solid #F2F4F7' : 'none' }}>
                      <div style={{ flex: 1, paddingRight: 14 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#15243B' }}>{p.label}</div>
                        <div style={{ fontSize: 12, color: '#8893A4', marginTop: 1 }}>{p.sub}</div>
                      </div>
                      <button onClick={() => setNotifOn(prev => prev.map((v, j) => j === i ? !v : v))}
                        style={{ width: 46, height: 27, borderRadius: 999, border: 'none', background: on ? ACCENT : '#D1D9E0', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background .25s' }}
                      >
                        <span style={{ position: 'absolute', top: 2.5, left: on ? 21 : 2.5, width: 22, height: 22, borderRadius: '50%', background: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,.25)', transition: 'left .25s cubic-bezier(.34,1.56,.64,1)' }} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Sign out — full width, end of page */}
        <button onClick={signOut} style={{ width: '100%', marginTop: 22, padding: '14px 0', borderRadius: 14, border: '1px solid #F2D0CC', background: '#FFF8F7', color: '#C0392B', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Sign out</button>
      </main>
      {showOwnerSheet && <BecomeOwnerSheet onClose={() => setShowOwnerSheet(false)} />}

      {/* Cross-app transition splash → owner dashboard */}
      {switching && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'linear-gradient(150deg, #16273F, #2C557F)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 22, animation: 'acctover .25s ease both',
        }}>
          <div style={{ width: 62, height: 62, borderRadius: 18, background: 'rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>🏢</div>
          <div style={{ textAlign: 'center', color: '#fff' }}>
            <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: -0.3 }}>Opening your Owner Dashboard</div>
            <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,.7)', marginTop: 5 }}>Signing you in to Dwell for Owners…</div>
          </div>
          <div style={{ width: 30, height: 30, borderRadius: '50%', border: '3px solid rgba(255,255,255,.25)', borderTopColor: '#fff', animation: 'acctspin .8s linear infinite' }} />
        </div>
      )}

      <Footer />
    </div>
  );
}
