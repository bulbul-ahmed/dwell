'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGrid, Building2, Inbox, Calendar, Star,
  Zap, BarChart2, Settings, Home, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  Icon: LucideIcon;
  badge?: number;
}
interface NavGroup { label: string; items: NavItem[] }

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { id: '/',         label: 'Overview',            Icon: LayoutGrid },
      { id: '/listings', label: 'My Listings',          Icon: Building2  },
      { id: '/leads',    label: 'Leads',                Icon: Inbox,     badge: 3 },
      { id: '/visits',   label: 'Visits',               Icon: Calendar,  badge: 2 },
      { id: '/reviews',  label: 'Reviews',              Icon: Star       },
    ],
  },
  {
    label: 'Growth',
    items: [
      { id: '/boost',     label: 'Boost & Promote', Icon: Zap      },
      { id: '/analytics', label: 'Analytics',       Icon: BarChart2 },
    ],
  },
  {
    label: 'Account',
    items: [
      { id: '/profile', label: 'Profile & Settings', Icon: Settings },
    ],
  },
];

interface SidebarProps {
  ownerName?: string;
  ownerType?: string;
  avatarUrl?: string | null;
  open?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ ownerName = 'Rahima Properties', ownerType = 'Agency', avatarUrl, open = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const BASE = '/dashboard';
  const hrefFor = (id: string) => id === '/' ? BASE : BASE + id;

  function isActive(id: string) {
    if (id === '/') return pathname === BASE;
    return pathname.startsWith(BASE + id);
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex h-screen w-[264px] flex-col overflow-hidden transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:flex-[0_0_264px] lg:translate-x-0 ${open ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}
      style={{ background: 'linear-gradient(176deg, #16273F 0%, #122035 58%, #0E1A2C 100%)' }}
    >
      {/* glow orb */}
      <div style={{
        position: 'absolute', top: -90, right: -70, width: 240, height: 240,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(86,131,196,0.22), transparent 68%)',
        pointerEvents: 'none',
      }} />

      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '22px 22px 18px' }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11,
          background: 'linear-gradient(140deg, #2C557F, #1E3A5C)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 20px -6px rgba(44,85,127,0.7)', flexShrink: 0,
        }}>
          <Home size={18} color="#fff" strokeWidth={2.1} />
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: 0.2, lineHeight: 1 }}>Dwell</div>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1.4, color: '#6E89AD', marginTop: 3, textTransform: 'uppercase' }}>
            Provider Studio
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="bv-press ml-auto flex items-center justify-center lg:hidden"
          style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)',
            cursor: 'pointer',
          }}
        >
          <X size={17} color="#A9B9CD" strokeWidth={2} />
        </button>
      </div>

      {/* List a property CTA */}
      <div style={{ padding: '4px 14px 8px' }}>
        <button
          onClick={() => { onClose?.(); router.push('/dashboard/listings/new'); }}
          className="bv-press"
          style={{
            width: '100%', height: 44, borderRadius: 12, border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700, color: '#fff',
            background: 'linear-gradient(135deg, #2E7D55, #246046)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 10px 22px -8px rgba(46,125,85,.6)',
          }}
        >
          <span style={{ fontSize: 17, lineHeight: 1 }}>+</span> List a property
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 14px 18px' }}>
        {NAV_GROUPS.map(group => (
          <div key={group.label} style={{ marginTop: 16 }}>
            <div style={{
              fontSize: 10, fontWeight: 800, letterSpacing: 1.3,
              color: '#56708F', textTransform: 'uppercase', padding: '0 12px 9px',
            }}>
              {group.label}
            </div>
            {group.items.map(({ id, label, Icon, badge: badgeCount }) => {
              const active = isActive(id);
              return (
                <Link key={id} href={hrefFor(id)} onClick={onClose} style={{ textDecoration: 'none' }}>
                  <div
                    className="bv-nav"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', marginBottom: 3, borderRadius: 11,
                      cursor: 'pointer',
                      color: active ? '#fff' : '#A9B9CD',
                      background: active ? 'rgba(110,160,224,0.14)' : 'transparent',
                      fontSize: 13.5, fontWeight: active ? 700 : 600,
                      position: 'relative',
                    }}
                  >
                    <span style={{
                      position: 'absolute', left: 0, top: '50%',
                      transform: 'translateY(-50%)',
                      width: 3, height: active ? 20 : 0,
                      borderRadius: '0 3px 3px 0', background: '#6EA0E0',
                      transition: 'height .3s cubic-bezier(.22,1,.36,1)',
                    }} />
                    <span className="bv-navico" style={{ display: 'flex', position: 'relative' }}>
                      <Icon size={18} color={active ? '#DCE8F7' : '#8AA0BC'} strokeWidth={1.9} />
                    </span>
                    <span style={{ flex: 1, position: 'relative' }}>{label}</span>
                    {badgeCount && badgeCount > 0 && (
                      <span style={{
                        minWidth: 20, height: 20, padding: '0 6px', borderRadius: 999,
                        background: id === '/leads' ? '#2E7D55' : '#C9A24B',
                        color: '#fff', fontSize: 11, fontWeight: 800,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative',
                      }}>
                        {badgeCount}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User profile */}
      <div style={{ padding: '14px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <Link href="/dashboard/profile" onClick={onClose} style={{ textDecoration: 'none' }}>
          <div
            className="bv-fill bv-press"
            style={{
              '--fill': 'rgba(255,255,255,.06)',
              display: 'flex', alignItems: 'center', gap: 11,
              padding: '9px 10px', borderRadius: 12, cursor: 'pointer',
            } as React.CSSProperties}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              backgroundColor: '#2C557F',
              backgroundImage: avatarUrl ? `url('${avatarUrl}')` : 'linear-gradient(140deg, #3C6E9E, #2C557F)',
              backgroundSize: 'cover', backgroundPosition: 'center',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 14, flexShrink: 0,
            }}>
              {!avatarUrl && ownerName.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: 700, color: '#fff',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                {ownerName} <span style={{ color: '#6EE0A4', fontSize: 12 }}>✓</span>
              </div>
              <div style={{ fontSize: 11, color: '#7F97B6' }}>{ownerType} · Verified</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M8 9l4-4 4 4M8 15l4 4 4-4" stroke="#7F97B6" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </Link>
      </div>
    </aside>
  );
}
