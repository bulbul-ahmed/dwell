'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Shield, Flag, Building2, Users,
  BarChart2, SlidersHorizontal, List, Settings, Home, LogOut, MapPin, BadgeCheck,
} from 'lucide-react';

import type { LucideProps } from 'lucide-react';
type NavItem = { id: string; label: string; Icon: React.ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>>; badge?: string };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ id: '/', label: 'Dashboard', Icon: LayoutDashboard }],
  },
  {
    label: 'Trust & Safety',
    items: [
      { id: '/moderation', label: 'Moderation', Icon: Shield, badge: 'mod' },
      { id: '/verification', label: 'Verification', Icon: BadgeCheck, badge: 'kyc' },
      { id: '/reports', label: 'Reports', Icon: Flag, badge: 'rep' },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { id: '/listings', label: 'Listings', Icon: Building2 },
      { id: '/users', label: 'Users', Icon: Users },
    ],
  },
  {
    label: 'Insights',
    items: [{ id: '/analytics', label: 'Analytics', Icon: BarChart2 }],
  },
  {
    label: 'System',
    items: [
      { id: '/zones', label: 'Zone Manager', Icon: MapPin },
      { id: '/config', label: 'Areas & Config', Icon: SlidersHorizontal },
      { id: '/audit', label: 'Audit Log', Icon: List },
      { id: '/settings', label: 'Settings', Icon: Settings },
    ],
  },
];

interface Props {
  adminName: string;
  adminRole: string;
  pendingMod?: number;
  pendingRep?: number;
  pendingKyc?: number;
}

export default function Sidebar({ adminName, adminRole, pendingMod = 0, pendingRep = 0, pendingKyc = 0 }: Props) {
  const pathname = usePathname();

  function isActive(id: string) {
    if (id === '/') return pathname === '/';
    return pathname.startsWith(id);
  }

  const badgeCounts: Record<string, number> = { mod: pendingMod, rep: pendingRep, kyc: pendingKyc };
  const initials = adminName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <aside
      style={{
        position: 'sticky', top: 0, alignSelf: 'flex-start', height: '100vh',
        width: 264, flex: '0 0 264px',
        background: 'linear-gradient(176deg, #16273F 0%, #122035 58%, #0E1A2C 100%)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}
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
            Admin Console
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 14px 18px' }}>
        {NAV_GROUPS.map(group => (
          <div key={group.label} style={{ marginTop: 18 }}>
            <div style={{
              fontSize: 10, fontWeight: 800, letterSpacing: 1.3,
              color: '#56708F', textTransform: 'uppercase', padding: '0 12px 9px',
            }}>
              {group.label}
            </div>
            {group.items.map(({ id, label, Icon, badge: badgeKey }) => {
              const active = isActive(id);
              const count = badgeKey ? badgeCounts[badgeKey] : 0;
              return (
                <Link key={id} href={id} style={{ textDecoration: 'none' }}>
                  <div
                    className="bv-nav"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', marginBottom: 3, borderRadius: 11,
                      cursor: 'pointer',
                      color: active ? '#fff' : '#A9B9CD',
                      background: active ? 'rgba(110,160,224,0.14)' : 'transparent',
                      fontSize: 13.5,
                      fontWeight: active ? 700 : 600,
                      position: 'relative',
                    }}
                  >
                    {/* active bar */}
                    <span style={{
                      position: 'absolute', left: 0, top: '50%',
                      transform: 'translateY(-50%)',
                      width: 3, height: active ? 20 : 0,
                      borderRadius: '0 3px 3px 0',
                      background: '#6EA0E0',
                      transition: 'height .3s cubic-bezier(.22,1,.36,1)',
                    }} />
                    <Icon
                      size={18}
                      color={active ? '#DCE8F7' : '#8AA0BC'}
                      strokeWidth={1.9}
                      style={{ position: 'relative', transition: 'transform .42s cubic-bezier(.22,1,.36,1)' }}
                    />
                    <span style={{ flex: 1, position: 'relative' }}>{label}</span>
                    {count > 0 && (
                      <span style={{
                        minWidth: 20, height: 20, padding: '0 6px',
                        borderRadius: 999,
                        background: active ? '#6EA0E0' : 'rgba(180,64,43,0.92)',
                        color: '#fff',
                        fontSize: 11, fontWeight: 800,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {count}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '10px 14px 14px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <Link href="http://localhost:3001" target="_blank" style={{ textDecoration: 'none' }}>
          <div
            className="bv-nav"
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 11px', marginBottom: 6, borderRadius: 11,
              cursor: 'pointer', color: '#A9B9CD', fontSize: 12.5, fontWeight: 600,
            }}
          >
            <Home size={16} color="#8AA0BC" strokeWidth={1.9} style={{ position: 'relative' }} />
            <span style={{ flex: 1, position: 'relative' }}>View marketplace</span>
            <span style={{ color: '#6E89AD', position: 'relative' }}>↗</span>
          </div>
        </Link>

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
            background: 'linear-gradient(140deg, #C9A24B, #A67C2E)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 14, flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 700, color: '#fff',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{adminName}</div>
            <div style={{
              fontSize: 11, color: '#7F97B6',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{adminRole}</div>
          </div>
          <LogOut size={15} color="#7F97B6" />
        </div>
      </div>
    </aside>
  );
}
