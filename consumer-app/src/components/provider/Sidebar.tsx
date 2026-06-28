'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGrid, Building2, Inbox, Calendar, Star,
  Zap, BarChart2, Settings, Home, X, DollarSign, CalendarDays, Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ACCENT = '#1E3A5C';
const AMBER  = '#C9863A';

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
      { id: '/',            label: 'Dashboard',          Icon: LayoutGrid  },
      { id: '/listings',    label: 'My Listings',        Icon: Building2   },
      { id: '/leads',       label: 'Leads & Inquiries',  Icon: Inbox       },
      { id: '/visits',        label: 'Visits',             Icon: Calendar    },
      { id: '/applications', label: 'Applications',      Icon: Users       },
      { id: '/calendar',     label: 'Availability',      Icon: CalendarDays },
      { id: '/reviews',     label: 'Reviews',            Icon: Star        },
    ],
  },
  {
    label: 'Revenue',
    items: [
      { id: '/revenue',   label: 'Revenue & Payouts', Icon: DollarSign },
      { id: '/boost',     label: 'Boost & Promote',   Icon: Zap        },
      { id: '/analytics', label: 'Analytics',         Icon: BarChart2  },
    ],
  },
  {
    label: 'Account',
    items: [
      { id: '/profile',       label: 'Profile & Settings', Icon: Settings },
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

export default function Sidebar({ ownerName = 'Owner', ownerType = 'Individual', avatarUrl, open = false, onClose }: SidebarProps) {
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
      className={`fixed inset-y-0 left-0 z-50 flex h-screen w-[260px] flex-col overflow-hidden transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:flex-[0_0_260px] lg:translate-x-0 ${open ? 'translate-x-0 shadow-xl' : '-translate-x-full'}`}
      style={{ background: '#fff', borderRight: '1px solid #E7EAEE' }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 18px 16px' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', flex: 1 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: ACCENT,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(30,58,92,0.3)', flexShrink: 0,
          }}>
            <Home size={16} color="#fff" strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#15243B', lineHeight: 1 }}>Dwell</div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: AMBER, marginTop: 2, textTransform: 'uppercase' }}>
              Owner Mode
            </div>
          </div>
        </Link>

        {/* Amber "Owner" mode chip */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 9px', borderRadius: 999,
          background: '#FEF3E2', border: '1px solid #F5D99A',
          fontSize: 10.5, fontWeight: 800, color: AMBER, letterSpacing: 0.3,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: AMBER, display: 'inline-block' }} />
          Owner
        </div>

        <button
          onClick={onClose}
          aria-label="Close menu"
          className="bv-press flex items-center justify-center lg:hidden"
          style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            border: '1px solid #E7EAEE', background: '#F7F8FA',
            cursor: 'pointer',
          }}
        >
          <X size={15} color="#8893A4" strokeWidth={2} />
        </button>
      </div>

      {/* List a property CTA */}
      <div style={{ padding: '0 14px 10px' }}>
        <button
          onClick={() => { onClose?.(); router.push('/dashboard/listings/new'); }}
          className="bv-press"
          style={{
            width: '100%', height: 42, borderRadius: 11, border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: '#fff',
            background: ACCENT,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            boxShadow: '0 6px 18px -6px rgba(30,58,92,0.45)',
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> List a property
        </button>
      </div>

      <div style={{ height: 1, background: '#F0F2F5', margin: '0 14px 4px' }} />

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 10px 16px' }}>
        {NAV_GROUPS.map(group => (
          <div key={group.label} style={{ marginTop: 14 }}>
            <div style={{
              fontSize: 10, fontWeight: 800, letterSpacing: 1.1,
              color: '#B0BBC8', textTransform: 'uppercase', padding: '0 10px 7px',
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
                      display: 'flex', alignItems: 'center', gap: 11,
                      padding: '9px 10px', marginBottom: 2, borderRadius: 10,
                      cursor: 'pointer',
                      color: active ? ACCENT : '#41495A',
                      background: active ? '#EEF3FB' : 'transparent',
                      fontSize: 13.5, fontWeight: active ? 700 : 500,
                      position: 'relative',
                    }}
                  >
                    <span style={{
                      position: 'absolute', left: 0, top: '50%',
                      transform: 'translateY(-50%)',
                      width: 3, height: active ? 18 : 0,
                      borderRadius: '0 3px 3px 0', background: ACCENT,
                      transition: 'height .28s cubic-bezier(.22,1,.36,1)',
                    }} />
                    <span style={{ display: 'flex' }}>
                      <Icon size={17} color={active ? ACCENT : '#8893A4'} strokeWidth={active ? 2.1 : 1.8} />
                    </span>
                    <span style={{ flex: 1 }}>{label}</span>
                    {badgeCount && badgeCount > 0 && (
                      <span style={{
                        minWidth: 19, height: 19, padding: '0 5px', borderRadius: 999,
                        background: id === '/leads' ? '#2E7D55' : AMBER,
                        color: '#fff', fontSize: 10.5, fontWeight: 800,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
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

      {/* Switch to renter mode */}
      <div style={{ padding: '10px 14px 12px', borderTop: '1px solid #F0F2F5' }}>
        <Link
          href="/"
          onClick={onClose}
          style={{
            display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px',
            borderRadius: 11, border: '1px solid #E7EAEE', background: '#F7F8FA',
            textDecoration: 'none', marginBottom: 10,
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M15 12H2M2 12L5.5 8.5M2 12L5.5 15.5" stroke="#8893A4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#41495A' }}>Switch to Renter</span>
        </Link>

        <Link href="/dashboard/profile" onClick={onClose} style={{ textDecoration: 'none' }}>
          <div
            className="bv-fill bv-press"
            style={{
              '--fill': '#F4F6F9',
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 10px', borderRadius: 11, cursor: 'pointer',
            } as React.CSSProperties}
          >
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              backgroundColor: avatarUrl ? '#E7EAEE' : ACCENT,
              backgroundImage: avatarUrl ? `url('${avatarUrl}')` : undefined,
              backgroundSize: 'cover', backgroundPosition: 'center',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 13, flexShrink: 0,
            }}>
              {!avatarUrl && ownerName.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: 700, color: '#15243B',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {ownerName}
              </div>
              <div style={{ fontSize: 11, color: '#8893A4' }}>{ownerType} · Owner</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M8 9l4-4 4 4M8 15l4 4 4-4" stroke="#B0BBC8" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </Link>
      </div>
    </aside>
  );
}
