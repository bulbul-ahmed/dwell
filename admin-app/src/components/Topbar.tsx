'use client';

import { Bell, ChevronLeft, LogOut, User } from 'lucide-react';
// Search bar removed from topbar — each page has its own contextual search
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

interface Props {
  crumb: string;
  title: string;
  showBack?: boolean;
  adminInitials: string;
  adminName?: string;
  adminEmail?: string;
}

export default function Topbar({ crumb, title, showBack, adminInitials, adminName, adminEmail }: Props) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    router.push('/login');
    router.refresh();
  }

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 30,
      background: 'rgba(244,246,249,0.82)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #E6E9EE',
      padding: '0 34px', height: 70,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
        {showBack && (
          <button
            onClick={() => router.back()}
            className="bv-press bv-fill"
            style={{
              '--fill': '#EEF2F7',
              display: 'flex', alignItems: 'center', gap: 7,
              height: 36, padding: '0 13px', borderRadius: 10,
              border: '1px solid #E2E7EE', background: '#fff',
              cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 13, fontWeight: 700, color: '#44506A',
            } as React.CSSProperties}
          >
            <ChevronLeft size={15} color="#44506A" />
            Back
          </button>
        )}
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#93A0B2', letterSpacing: 0.2 }}>
            {crumb}
          </div>
          <h1 style={{
            fontSize: 21, fontWeight: 800, letterSpacing: -0.4,
            color: '#15243B', margin: '1px 0 0', whiteSpace: 'nowrap',
          }}>
            {title}
          </h1>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Bell */}
        <button
          className="bv-press bv-fill"
          style={{
            '--fill': '#EEF2F7',
            position: 'relative', width: 40, height: 40, borderRadius: 11,
            border: '1px solid #E5E9EF', background: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          } as React.CSSProperties}
        >
          <Bell size={18} color="#44506A" strokeWidth={1.8} />
          <span style={{
            position: 'absolute', top: 8, right: 9,
            width: 8, height: 8, borderRadius: '50%',
            background: '#C7553B', border: '2px solid #fff',
          }} />
        </button>

        <div style={{ width: 1, height: 26, background: '#E2E7EE' }} />

        {/* Admin avatar + dropdown */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="bv-press"
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              cursor: 'pointer', background: 'none', border: 'none', padding: 0,
            }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: 11,
              background: 'linear-gradient(140deg, #C9A24B, #A67C2E)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 14,
            }}>
              {adminInitials}
            </div>
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 10px)', right: 0,
              width: 220, background: '#fff',
              border: '1px solid #E5E9EF',
              borderRadius: 14,
              boxShadow: '0 16px 40px -12px rgba(15,30,60,.18)',
              zIndex: 100, overflow: 'hidden',
              animation: 'bvpop .2s cubic-bezier(.22,1,.36,1) both',
            }}>
              {/* Admin info */}
              <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid #F0F3F7' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                    background: 'linear-gradient(140deg, #C9A24B, #A67C2E)',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 12,
                  }}>
                    {adminInitials}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#15243B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {adminName || 'Admin'}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#93A0B2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {adminEmail || ''}
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div style={{ padding: '6px 0' }}>
                <button
                  onClick={() => { setMenuOpen(false); router.push('/settings'); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 16px', background: 'none', border: 'none',
                    cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5,
                    fontWeight: 600, color: '#44506A', textAlign: 'left',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F4F6F9')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <User size={15} color="#7A8CA3" />
                  Profile &amp; settings
                </button>

                <div style={{ height: 1, background: '#F0F3F7', margin: '4px 0' }} />

                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 16px', background: 'none', border: 'none',
                    cursor: signingOut ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', fontSize: 13.5,
                    fontWeight: 600, color: '#B4402B', textAlign: 'left',
                    opacity: signingOut ? 0.6 : 1,
                  }}
                  onMouseEnter={e => { if (!signingOut) e.currentTarget.style.background = '#FEF3F0'; }}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <LogOut size={15} color="#B4402B" />
                  {signingOut ? 'Signing out…' : 'Sign out'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
