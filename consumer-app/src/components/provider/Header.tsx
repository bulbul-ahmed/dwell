'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, LogOut, Menu } from 'lucide-react';
import { useEffect, useState } from 'react';

const ROUTE_META: Record<string, { crumb: string; title: string; back?: string }> = {
  '/':           { crumb: 'Workspace', title: 'Overview'           },
  '/listings':   { crumb: 'Workspace', title: 'My Listings'        },
  '/leads':      { crumb: 'Workspace', title: 'Leads & inquiries'  },
  '/visits':     { crumb: 'Workspace', title: 'Visits'             },
  '/reviews':    { crumb: 'Workspace', title: 'Reviews'            },
  '/boost':      { crumb: 'Growth',    title: 'Boost & promote'    },
  '/analytics':  { crumb: 'Growth',    title: 'Analytics'          },
  '/profile':         { crumb: 'Account',   title: 'Profile & settings' },
  '/notifications':       { crumb: 'Account',   title: 'Notifications'    },
  '/listings/new':        { crumb: 'Workspace · Listings', title: 'List a property',    back: '/listings' },
};

export default function Header({ onMenu, avatarUrl }: { onMenu?: () => void; avatarUrl?: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [unreadBell, setUnreadBell] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch('/api/notifications/unread', { cache: 'no-store' })
        .then(r => r.ok ? r.json() : { messages: 0, bell: 0 })
        .then(d => {
          if (!cancelled) {
            setUnread(Number(d.messages ?? d.count) || 0);
            setUnreadBell(Number(d.bell) || 0);
          }
        })
        .catch(() => {});
    };
    load();
    // No SSE on this header — poll, but at a calmer cadence than before.
    const t = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(t); };
  }, [pathname]);

  const BASE = '/dashboard';
  const sub = pathname.startsWith(BASE) ? (pathname.slice(BASE.length) || '/') : pathname;
  const isListingDetail = sub.startsWith('/listings/') && sub !== '/listings' && !sub.endsWith('/status');
  const isListingStatus = sub.startsWith('/listings/') && sub.endsWith('/status');
  const listingIdFromSub = sub.startsWith('/listings/') ? sub.split('/')[2] : '';
  const meta = isListingStatus
    ? { crumb: 'Workspace · Listings', title: 'Listing status', back: `/listings/${listingIdFromSub}` }
    : isListingDetail
    ? { crumb: 'Workspace · Listings', title: 'Listing performance', back: '/listings' }
    : ROUTE_META[sub] ?? { crumb: '', title: '' };

  return (
    <header
      className="px-4 lg:px-[34px]"
      style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #ECEEF1',
        height: 66,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
        <button
          onClick={onMenu}
          aria-label="Open menu"
          className="bv-press flex items-center justify-center lg:hidden"
          style={{
            width: 38, height: 38, borderRadius: 11, flexShrink: 0,
            border: '1px solid #ECEEF1', background: '#fff',
            cursor: 'pointer',
          }}
        >
          <Menu size={18} color="#44506A" strokeWidth={2} />
        </button>
        {meta.back && (
          <button
            onClick={() => router.push(BASE + meta.back!)}
            className="bv-press bv-fill"
            style={{
              '--fill': '#EEF2F7',
              display: 'flex', alignItems: 'center', gap: 7,
              height: 36, padding: '0 13px', borderRadius: 10,
              border: '1px solid #ECEEF1', background: '#fff',
              cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 13, fontWeight: 700, color: '#44506A',
            } as React.CSSProperties}
          >
            <ChevronLeft size={15} color="#44506A" strokeWidth={2} />
            Back
          </button>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#93A0B2' }}>{meta.crumb}</div>
          <h1 style={{ fontWeight: 800, letterSpacing: -0.4, color: '#15243B', margin: '1px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} className="text-[17px] lg:text-[21px]">
            {meta.title}
          </h1>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Mode toggle pill — Owner / Renter */}
        <div
          className="hidden lg:flex"
          style={{
            alignItems: 'center',
            background: '#F0F2F6', borderRadius: 999,
            padding: 3, gap: 2, border: '1px solid #ECEEF1',
          }}
        >
          <a
            href="/"
            style={{
              height: 32, padding: '0 14px', borderRadius: 999,
              border: 'none', background: 'transparent',
              color: '#8893A4', fontSize: 13, fontWeight: 600,
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center', cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Renter
          </a>
          <div style={{
            height: 32, padding: '0 14px', borderRadius: 999,
            background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
            color: '#C9863A', fontSize: 13, fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#C9863A', display: 'inline-block' }} />
            Owner
          </div>
        </div>

        {/* Leads notification */}
        <Link href="/dashboard/leads" style={{ textDecoration: 'none' }}>
          <button
            className="bv-press bv-fill"
            style={{
              '--fill': '#EEF2F7',
              position: 'relative', width: 40, height: 40, borderRadius: 11,
              border: '1px solid #ECEEF1', background: '#fff',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            } as React.CSSProperties}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M6.09436 11.2288C6.03221 10.8282 5.99996 10.4179 5.99996 10C5.99996 5.58172 9.60525 2 14.0526 2C18.4999 2 22.1052 5.58172 22.1052 10C22.1052 10.9981 21.9213 11.9535 21.5852 12.8345C21.5154 13.0175 21.4804 13.109 21.4646 13.1804C21.4489 13.2512 21.4428 13.301 21.4411 13.3735C21.4394 13.4466 21.4493 13.5272 21.4692 13.6883L21.8717 16.9585C21.9153 17.3125 21.9371 17.4895 21.8782 17.6182C21.8266 17.731 21.735 17.8205 21.6211 17.8695C21.4911 17.9254 21.3146 17.8995 20.9617 17.8478L17.7765 17.3809C17.6101 17.3565 17.527 17.3443 17.4512 17.3448C17.3763 17.3452 17.3245 17.3507 17.2511 17.3661C17.177 17.3817 17.0823 17.4172 16.893 17.4881C16.0097 17.819 15.0524 18 14.0526 18C13.6344 18 13.2237 17.9683 12.8227 17.9073M7.63158 22C10.5965 22 13 19.5376 13 16.5C13 13.4624 10.5965 11 7.63158 11C4.66668 11 2.26316 13.4624 2.26316 16.5C2.26316 17.1106 2.36028 17.6979 2.53955 18.2467C2.61533 18.4787 2.65322 18.5947 2.66566 18.6739C2.67864 18.7567 2.68091 18.8031 2.67608 18.8867C2.67145 18.9668 2.65141 19.0573 2.61134 19.2383L2 22L4.9948 21.591C5.15827 21.5687 5.24 21.5575 5.31137 21.558C5.38652 21.5585 5.42641 21.5626 5.50011 21.5773C5.5701 21.5912 5.67416 21.6279 5.88227 21.7014C6.43059 21.8949 7.01911 22 7.63158 22Z" stroke="#44506A" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
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

        {/* Bell — system notifications (visits, reviews, inquiries) */}
        <Link href="/dashboard/notifications" style={{ textDecoration: 'none' }}>
          <button
            className="bv-press bv-fill"
            style={{
              '--fill': '#EEF2F7',
              position: 'relative', width: 40, height: 40, borderRadius: 11,
              border: '1px solid #ECEEF1', background: '#fff',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            } as React.CSSProperties}
          >
            <svg viewBox="0 0 16 16" fill="none" width="17" height="17" xmlns="http://www.w3.org/2000/svg">
              <path d="M3.333 12h9.334V7.354C12.667 4.765 10.577 2.667 8 2.667c-2.577 0-4.667 2.099-4.667 4.687V12Zm4.667-10.667c3.314 0 6 2.696 6 6.021V13.333H2V7.354C2 4.029 4.686 1.333 8 1.333ZM6.333 14h3.334a1.667 1.667 0 1 1-3.334 0Z" fill="#44506A"/>
            </svg>
            {unreadBell > 0 && (
              <span style={{
                position: 'absolute', top: 4, right: 4,
                minWidth: 16, height: 16, padding: '0 4px', borderRadius: 999,
                background: '#C0392B', border: '2px solid #F4F6F9',
                color: '#fff', fontSize: 10, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1,
              }}>
                {unreadBell > 99 ? '99+' : unreadBell}
              </span>
            )}
          </button>
        </Link>

        {/* Boost */}
        <Link href="/dashboard/boost" className="hidden lg:block" style={{ textDecoration: 'none' }}>
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

        <div className="hidden lg:block" style={{ width: 1, height: 26, background: '#ECEEF1' }} />

        {/* Profile avatar */}
        <Link href="/dashboard/profile" style={{ textDecoration: 'none' }}>
          <div
            className="bv-press"
            style={{
              width: 38, height: 38, borderRadius: 11,
              backgroundColor: '#2C557F',
              backgroundImage: avatarUrl ? `url('${avatarUrl}')` : 'linear-gradient(140deg, #3C6E9E, #2C557F)',
              backgroundSize: 'cover', backgroundPosition: 'center',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 14, cursor: 'pointer',
            }}
          >
            {!avatarUrl && 'R'}
          </div>
        </Link>

        {/* Logout */}
        <button
          onClick={async () => {
            await fetch('/api/auth/signout', { method: 'POST' });
            router.push('/');
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
