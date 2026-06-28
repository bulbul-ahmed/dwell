'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter, usePathname } from 'next/navigation';
import InsightsLink from '@/components/InsightsLink';
import BecomeOwnerSheet from '@/components/BecomeOwnerSheet';

const ACCENT = '#1E3A5C';

const NavRight = dynamic(() => import('@/components/NavRight'), { ssr: false });

const AMBER = '#C9863A';

interface SessionUser { name: string; email: string; role: string; avatarUrl?: string | null }

export default function Nav() {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [listSheet, setListSheet] = useState(false);
  const [switching, setSwitching] = useState(false);

  // "List your property": owners go straight to the studio wizard; renters verify
  // (phone+address) first; logged-out users sign in then land on the wizard.
  const onListProperty = () => {
    setMenuOpen(false);
    if (!user) { router.push('/auth?next=/dashboard/listings/new'); return; }
    if (user.role === 'owner') { router.push('/dashboard/listings/new'); return; }
    setListSheet(true);
  };

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(({ user }) => setUser(user ?? null))
      .catch(() => {});
  }, []);

  const initials = user
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '';

  async function handleSignOut() {
    setMenuOpen(false);
    await fetch('/api/auth/signout', { method: 'POST' });
    setUser(null);
    router.push('/');
    router.refresh();
  }

  const handleSwitchToOwner = async () => {
    if (switching) return;
    setSwitching(true);
    await new Promise(r => setTimeout(r, 420));
    router.push('/dashboard');
    setSwitching(false);
  };

  // Owner dashboard has its own chrome (Sidebar/Header) — hide the seeker nav there.
  if (pathname?.startsWith('/dashboard')) return null;

  return (
    <>
    <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(255,255,255,0.86)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #E7EAEE' }}>
      <div className="nav-inner">

        {/* ---- LEFT ---- */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(30,58,92,0.35)' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <path d="M3 11.5L12 4l9 7.5" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5.5 10v9.5h13V10" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 25, letterSpacing: '0.2px', color: '#15243B' }}>Dwell</span>
          </Link>

          <nav className="nav-main-links">
            {(['rent', 'buy', 'sublet', 'student'] as const).map(intent => (
              <Link
                key={intent}
                href={`/search?intent=${intent}`}
                style={{ fontSize: 14.5, fontWeight: 500, color: '#41495A', textDecoration: 'none' }}
              >
                {intent.charAt(0).toUpperCase() + intent.slice(1)}
              </Link>
            ))}
            <InsightsLink />
          </nav>
        </div>

        {/* ---- RIGHT ---- */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Owner mode toggle — desktop only, visible only to owners */}
          {user?.role === 'owner' && (
            <div className="nav-main-links" style={{ alignItems: 'center' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center',
                background: '#F0F2F6', borderRadius: 999,
                padding: 3, border: '1px solid #E2E7EE',
                opacity: switching ? 0.6 : 1,
                transition: 'opacity 0.3s ease',
              }}>
                {/* Renter tab — active */}
                <div style={{
                  height: 30, padding: '0 13px', borderRadius: 999,
                  background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
                  color: ACCENT, fontSize: 13, fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center',
                  transition: 'all 0.35s cubic-bezier(.22,1,.36,1)',
                }}>
                  Renter
                </div>
                {/* Owner tab */}
                <button
                  onClick={handleSwitchToOwner}
                  disabled={switching}
                  style={{
                    height: 30, padding: '0 13px', borderRadius: 999,
                    background: 'transparent', border: 'none',
                    color: switching ? AMBER : '#8893A4',
                    fontSize: 13, fontWeight: 600,
                    cursor: switching ? 'wait' : 'pointer',
                    fontFamily: 'inherit',
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    transition: 'all 0.35s cubic-bezier(.22,1,.36,1)',
                  }}
                >
                  {switching && <span style={{ width: 6, height: 6, borderRadius: '50%', background: AMBER, display: 'inline-block', animation: 'dwell-pulse 0.8s ease-in-out infinite' }} />}
                  Owner
                </button>
              </div>
              <style>{`
                @keyframes dwell-pulse {
                  0%, 100% { opacity: 1; transform: scale(1); }
                  50% { opacity: 0.4; transform: scale(0.7); }
                }
              `}</style>
            </div>
          )}

          <div className="nav-main-links">
            <NavRight />
          </div>

          {/* Hamburger — mobile only */}
          <button
            className="nav-hamburger"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M3 12h18M3 18h18" stroke="#41495A" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
      </header>

      {/* ---- MOBILE DRAWER (outside header — header's backdrop-filter would clip fixed children) ---- */}
      <div className={`nav-mobile-sheet${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(false)} />
      <div className={`nav-mobile-panel${menuOpen ? ' open' : ''}`}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <Link href="/" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M3 11.5L12 4l9 7.5" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5.5 10v9.5h13V10" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span style={{ fontSize: 20, color: '#15243B' }}>Dwell</span>
          </Link>
          <button onClick={() => setMenuOpen(false)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E7EAEE', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="#6A7180" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>

        {/* Profile card (logged in) */}
        {user && (
          <Link
            href="/account"
            onClick={() => setMenuOpen(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, marginBottom: 14, borderRadius: 14, background: '#F4F6F9', textDecoration: 'none' }}
          >
            <div style={{ width: 42, height: 42, borderRadius: '50%', backgroundColor: user.avatarUrl ? '#E7EAEE' : ACCENT, backgroundImage: user.avatarUrl ? `url('${user.avatarUrl}')` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, flexShrink: 0 }}>{!user.avatarUrl && initials}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: '#15243B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
              <div style={{ fontSize: 12, color: '#8893A4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
            </div>
          </Link>
        )}

        {/* Nav links */}
        <div style={{ fontSize: 12, fontWeight: 700, color: '#8B93A1', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8, marginTop: 4 }}>Browse</div>
        {(['rent', 'buy', 'sublet', 'student', 'office', 'room'] as const).map(intent => (
          <Link
            key={intent}
            href={`/search?intent=${intent}`}
            onClick={() => setMenuOpen(false)}
            style={{ display: 'block', padding: '11px 12px', borderRadius: 10, fontSize: 14.5, fontWeight: 600, color: '#15243B', textDecoration: 'none' }}
          >
            {intent.charAt(0).toUpperCase() + intent.slice(1)}
          </Link>
        ))}

        <div style={{ height: 1, background: '#F0F2F5', margin: '12px 0' }} />

        <Link href="/insights" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '11px 12px', borderRadius: 10, fontSize: 14.5, fontWeight: 600, color: '#15243B', textDecoration: 'none' }}>Market Insights</Link>
        <button onClick={onListProperty} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '11px 12px', borderRadius: 10, fontSize: 14.5, fontWeight: 600, color: '#15243B', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>List your property</button>

        {user && (
          <>
            <div style={{ height: 1, background: '#F0F2F5', margin: '12px 0' }} />

            {/* Mode toggle — mobile */}
            {user.role === 'owner' && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#B0BBC8', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 8, padding: '0 4px' }}>Mode</div>
                <div style={{
                  display: 'flex', gap: 6, padding: 4,
                  background: '#F0F2F6', borderRadius: 14, border: '1px solid #E2E7EE',
                }}>
                  {/* Renter — active in consumer app */}
                  <div style={{
                    flex: 1, height: 38, borderRadius: 10,
                    background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.09)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13.5, fontWeight: 700, color: ACCENT,
                  }}>
                    Renter
                  </div>
                  {/* Owner */}
                  <button
                    onClick={() => { setMenuOpen(false); handleSwitchToOwner(); }}
                    style={{
                      flex: 1, height: 38, borderRadius: 10, border: 'none',
                      background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      fontSize: 13.5, fontWeight: 600, color: '#8893A4',
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: AMBER, display: 'inline-block', opacity: 0.6 }} />
                    Owner
                  </button>
                </div>
              </div>
            )}
            <Link href="/saved" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '11px 12px', borderRadius: 10, fontSize: 14, fontWeight: 500, color: '#41495A', textDecoration: 'none' }}>Saved homes</Link>
            <Link href="/messages" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '11px 12px', borderRadius: 10, fontSize: 14, fontWeight: 500, color: '#41495A', textDecoration: 'none' }}>Messages</Link>
            <Link href="/visits" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '11px 12px', borderRadius: 10, fontSize: 14, fontWeight: 500, color: '#41495A', textDecoration: 'none' }}>Visits</Link>
            <Link href="/notifications" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '11px 12px', borderRadius: 10, fontSize: 14, fontWeight: 500, color: '#41495A', textDecoration: 'none' }}>Notifications</Link>
            <Link href="/account" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '11px 12px', borderRadius: 10, fontSize: 14, fontWeight: 500, color: '#41495A', textDecoration: 'none' }}>Account</Link>
          </>
        )}

        <div style={{ marginTop: 'auto', paddingTop: 20 }}>
          {user ? (
            <button onClick={handleSignOut} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '13px 0', borderRadius: 13, border: '1.5px solid #F0D9D2', background: '#fff', color: '#C7553B', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 12H2M2 12L5.5 8.5M2 12L5.5 15.5" stroke="#C7553B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 8V6C9 4.9 9.9 4 11 4H18C19.1 4 20 4.9 20 6V18C20 19.1 19.1 20 18 20H11C9.9 20 9 19.1 9 18V16" stroke="#C7553B" strokeWidth="2" strokeLinecap="round" /></svg>
              Sign out
            </button>
          ) : (
            <Link href="/auth" onClick={() => setMenuOpen(false)} style={{ display: 'block', width: '100%', padding: '13px 0', borderRadius: 13, border: `1.5px solid ${ACCENT}`, background: ACCENT, color: '#fff', fontSize: 14.5, fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>Sign in</Link>
          )}
        </div>
      </div>

      {listSheet && <BecomeOwnerSheet onClose={() => setListSheet(false)} />}
    </>
  );
}
