'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { badge } from '@/lib/provider/badge';
import { bdGroup } from '@/lib/provider/formatters';
import { useToastStore } from '@/lib/provider/toast-store';

export interface ListingRow {
  id: number;
  title: string;
  area: string;
  price: number;
  cat: string;
  beds: number;
  baths: number;
  size: number;
  cover: string;
  verified: boolean;
  threadCount: number;
  bookingCount: number;
  saveCount: number;
}

const MENU_ITEM: React.CSSProperties = {
  width: '100%', textAlign: 'left', padding: '9px 11px', borderRadius: 8,
  border: 'none', background: 'transparent', cursor: 'pointer',
  fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: '#3C4A63',
};

type Filter = 'all' | 'Active' | 'Pending';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',     label: 'All'     },
  { key: 'Active',  label: 'Active'  },
  { key: 'Pending', label: 'Pending' },
];

export default function ListingsClient({ listings }: { listings: ListingRow[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [menuId, setMenuId] = useState<number | null>(null);
  const notify = useToastStore(s => s.notify);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the action menu on outside click / Escape.
  useEffect(() => {
    if (menuId === null) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuId(null);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuId(null); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [menuId]);

  const copyShare = (id: number) => {
    navigator.clipboard.writeText(`${window.location.origin}/listings/${id}`).then(
      () => notify('Link copied', 'Public listing URL copied to clipboard.', 'success'),
      () => notify('Copy failed', 'Could not copy to clipboard.', 'info'),
    );
    setMenuId(null);
  };

  const rows = filter === 'all'
    ? listings
    : listings.filter(l => (l.verified ? 'Active' : 'Pending') === filter);

  return (
    <div className="animate-bvfade">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, background: '#fff', border: '1px solid #ECEEF1', borderRadius: 12, padding: 5 }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="bv-press"
              style={{
                whiteSpace: 'nowrap', padding: '7px 14px', borderRadius: 9,
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 12.5, fontWeight: 700,
                color: filter === f.key ? '#fff' : '#5A6172',
                background: filter === f.key ? '#1E3A5C' : 'transparent',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => router.push('/dashboard/listings/new')}
          className="bv-press"
          style={{
            height: 42, padding: '0 18px', borderRadius: 12, border: 'none',
            cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
            color: '#fff', background: '#1E3A5C', boxShadow: '0 10px 22px -10px rgba(30,58,92,.55)',
          }}
        >
          + New listing
        </button>
      </div>

      {rows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#8893A4', fontSize: 14 }}>No listings match this filter</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: 18 }}>
          {rows.map(l => {
            const statusLabel = l.verified ? 'Active' : 'Pending';
            const b = badge(statusLabel);
            const priceLabel = l.price > 100000
              ? `৳${bdGroup(l.price)}`
              : `৳${bdGroup(l.price)}/mo`;
            return (
              <div key={l.id} className="bv-lift" style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 17, overflow: 'hidden', boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
                <Link href={`/dashboard/listings/${l.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ height: 150, backgroundImage: `url('${l.cover}')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#DDD3C5', position: 'relative', cursor: 'pointer' }}>
                    <span style={{ position: 'absolute', top: 11, left: 11, fontSize: 11, fontWeight: 800, color: b.fg, background: b.bg, padding: '4px 10px', borderRadius: 999 }}>
                      {statusLabel}
                    </span>
                  </div>
                </Link>
                <div style={{ padding: 15 }}>
                  <Link href={`/dashboard/listings/${l.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: '#15243B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}>
                      {l.title}
                    </div>
                  </Link>
                  <div style={{ fontSize: 12.5, color: '#8893A4', marginTop: 3 }}>{l.area} · {priceLabel}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, margin: '14px 0', padding: '12px 0', borderTop: '1px solid #F2F4F7', borderBottom: '1px solid #F2F4F7' }}>
                    <div><div style={{ fontSize: 16, fontWeight: 800, color: '#15243B' }}>{l.saveCount}</div><div style={{ fontSize: 11, color: '#9AA6B6' }}>Saves</div></div>
                    <div><div style={{ fontSize: 16, fontWeight: 800, color: '#15243B' }}>{l.threadCount}</div><div style={{ fontSize: 11, color: '#9AA6B6' }}>Leads</div></div>
                    <div><div style={{ fontSize: 16, fontWeight: 800, color: '#15243B' }}>{l.bookingCount}</div><div style={{ fontSize: 11, color: '#9AA6B6' }}>Visits</div></div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link href={`/dashboard/listings/${l.id}`} style={{ flex: 1, textDecoration: 'none' }}>
                      <button className="bv-press bv-fill" style={{ '--fill': '#EEF2F7', width: '100%', height: 38, borderRadius: 10, border: '1px solid #ECEEF1', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, color: '#1E3A5C' } as React.CSSProperties}>
                        Stats
                      </button>
                    </Link>
                    <Link href={`/dashboard/boost?listing=${l.id}`} style={{ textDecoration: 'none' }}>
                      <button className="bv-press bv-fill" style={{ '--fill': '#F6EFD9', height: 38, padding: '0 13px', borderRadius: 10, border: '1px solid #EBDCB4', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, color: '#9A7B1F' } as React.CSSProperties}>
                        ★ Boost
                      </button>
                    </Link>
                    <div style={{ position: 'relative' }} ref={menuId === l.id ? menuRef : undefined}>
                      <button
                        onClick={() => setMenuId(menuId === l.id ? null : l.id)}
                        aria-haspopup="menu"
                        aria-expanded={menuId === l.id}
                        aria-label="More actions"
                        className="bv-press bv-fill"
                        style={{ '--fill': '#EEF0F3', width: 38, height: 38, borderRadius: 10, border: `1px solid ${menuId === l.id ? '#B9CFE2' : '#ECEEF1'}`, background: menuId === l.id ? '#F4F8FC' : '#fff', cursor: 'pointer', color: '#8893A4', fontSize: 17, lineHeight: 1 } as React.CSSProperties}
                      >
                        ⋯
                      </button>
                      {menuId === l.id && (
                        <div role="menu" style={{ position: 'absolute', right: 0, bottom: 'calc(100% + 6px)', width: 184, background: '#fff', border: '1px solid #ECEEF1', borderRadius: 12, boxShadow: '0 16px 40px -12px rgba(20,40,70,.28)', padding: 6, zIndex: 30 }}>
                          <button role="menuitem" onClick={() => { setMenuId(null); router.push(`/dashboard/listings/new?edit=${l.id}`); }} className="bv-press" style={MENU_ITEM}>Edit listing</button>
                          <button role="menuitem" onClick={() => { setMenuId(null); router.push(`/dashboard/listings/${l.id}/status`); }} className="bv-press" style={MENU_ITEM}>Pause / mark rented</button>
                          <a role="menuitem" href={`/listings/${l.id}`} target="_blank" rel="noopener noreferrer" onClick={() => setMenuId(null)} style={{ ...MENU_ITEM, display: 'block', textDecoration: 'none' }}>View public page ↗</a>
                          <button role="menuitem" onClick={() => copyShare(l.id)} className="bv-press" style={MENU_ITEM}>Copy share link</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
