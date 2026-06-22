'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';

const ROUTE_META: Record<string, { crumb: string; title: string; back?: string }> = {
  '/':           { crumb: 'Workspace', title: 'Overview'           },
  '/listings':   { crumb: 'Workspace', title: 'My Listings'        },
  '/leads':      { crumb: 'Workspace', title: 'Leads & inquiries'  },
  '/visits':     { crumb: 'Workspace', title: 'Visits'             },
  '/reviews':    { crumb: 'Workspace', title: 'Reviews'            },
  '/boost':      { crumb: 'Growth',    title: 'Boost & promote'    },
  '/analytics':  { crumb: 'Growth',    title: 'Analytics'          },
  '/profile':    { crumb: 'Account',   title: 'Profile & settings' },
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch('/api/notifications/unread', { cache: 'no-store' })
        .then(r => r.ok ? r.json() : { count: 0 })
        .then(d => { if (!cancelled) setUnread(Number(d.count) || 0); })
        .catch(() => {});
    };
    load();
    const t = setInterval(load, 15000);
    return () => { cancelled = true; clearInterval(t); };
  }, [pathname]);

  const isListingDetail = pathname.startsWith('/listings/') && pathname !== '/listings';
  const meta = isListingDetail
    ? { crumb: 'Workspace · Listings', title: 'Listing performance', back: '/listings' }
    : ROUTE_META[pathname] ?? { crumb: '', title: '' };

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 30,
      background: 'rgba(244,246,249,0.82)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #E6E9EE',
      padding: '0 34px', height: 70,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {meta.back && (
          <button
            onClick={() => router.push(meta.back!)}
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
            <ChevronLeft size={15} color="#44506A" strokeWidth={2} />
            Back
          </button>
        )}
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#93A0B2' }}>{meta.crumb}</div>
          <h1 style={{ fontSize: 21, fontWeight: 800, letterSpacing: -0.4, color: '#15243B', margin: '1px 0 0', whiteSpace: 'nowrap' }}>
            {meta.title}
          </h1>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Switch back to the consumer (seeker) app — shared cookie = SSO */}
        <a
          href={(process.env.NEXT_PUBLIC_CONSUMER_URL ?? '') || '/'}
          style={{
            height: 40, padding: '0 14px', borderRadius: 11, border: '1px solid #E2E7EE',
            background: '#fff', color: '#44506A', fontSize: 13, fontWeight: 700,
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 7,
          }}
        >
          <ChevronLeft size={15} color="#44506A" strokeWidth={2} />
          Switch to browsing
        </a>

        {/* Leads notification */}
        <Link href="/leads" style={{ textDecoration: 'none' }}>
          <button
            className="bv-press bv-fill"
            style={{
              '--fill': '#EEF2F7',
              position: 'relative', width: 40, height: 40, borderRadius: 11,
              border: '1px solid #E5E9EF', background: '#fff',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            } as React.CSSProperties}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M21 11.5a8.4 8.4 0 01-9 8.4L4 21l1.1-3.6A8.4 8.4 0 1121 11.5z" stroke="#44506A" strokeWidth={1.8} strokeLinejoin="round" />
            </svg>
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: 4, right: 4,
                minWidth: 16, height: 16, padding: '0 4px', borderRadius: 999,
                background: '#2E7D55', border: '2px solid #F4F6F9',
                color: '#fff', fontSize: 10, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1,
              }}>
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </button>
        </Link>

        {/* Boost */}
        <Link href="/boost" style={{ textDecoration: 'none' }}>
          <button
            className="bv-press"
            style={{
              height: 40, padding: '0 16px', borderRadius: 11, border: 'none',
              cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
              color: '#9A6A1F', background: '#F6EFD9',
              display: 'inline-flex', alignItems: 'center', gap: 7,
            }}
          >
            ★ Boost a listing
          </button>
        </Link>

        <div style={{ width: 1, height: 26, background: '#E2E7EE' }} />

        {/* Profile avatar */}
        <Link href="/profile" style={{ textDecoration: 'none' }}>
          <div
            className="bv-press"
            style={{
              width: 38, height: 38, borderRadius: 11,
              background: 'linear-gradient(140deg, #3C6E9E, #2C557F)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 14, cursor: 'pointer',
            }}
          >
            R
          </div>
        </Link>

        {/* Logout */}
        <button
          onClick={async () => {
            await fetch('/api/logout', { method: 'POST' });
            router.push('/login');
          }}
          className="bv-press bv-fill"
          style={{
            '--fill': '#F8E8E3',
            width: 38, height: 38, borderRadius: 11,
            border: '1px solid #F0D9D2', background: '#fff',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          } as React.CSSProperties}
          title="Sign out"
        >
          <LogOut size={15} color="#B4402B" strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
