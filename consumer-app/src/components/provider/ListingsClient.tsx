'use client';

import { useState } from 'react';
import Link from 'next/link';
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

type Filter = 'all' | 'Active' | 'Pending';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',     label: 'All'     },
  { key: 'Active',  label: 'Active'  },
  { key: 'Pending', label: 'Pending' },
];

export default function ListingsClient({ listings }: { listings: ListingRow[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const notify = useToastStore(s => s.notify);

  const rows = filter === 'all'
    ? listings
    : listings.filter(l => (l.verified ? 'Active' : 'Pending') === filter);

  return (
    <div className="animate-bvfade">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, background: '#fff', border: '1px solid #E6E9EE', borderRadius: 12, padding: 5 }}>
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
          onClick={() => notify('Opening listing wizard', 'The 5-step listing flow lives in the main app.', 'info')}
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
                      <button className="bv-press bv-fill" style={{ '--fill': '#EEF2F7', width: '100%', height: 38, borderRadius: 10, border: '1px solid #E2E7EE', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, color: '#1E3A5C' } as React.CSSProperties}>
                        Stats
                      </button>
                    </Link>
                    <Link href={`/dashboard/boost?listing=${l.id}`} style={{ textDecoration: 'none' }}>
                      <button className="bv-press bv-fill" style={{ '--fill': '#F6EFD9', height: 38, padding: '0 13px', borderRadius: 10, border: '1px solid #EBDCB4', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, color: '#9A7B1F' } as React.CSSProperties}>
                        ★ Boost
                      </button>
                    </Link>
                    <button onClick={() => notify('Quick actions', 'Edit, pause, or mark rented.', 'info')} className="bv-press bv-fill" style={{ '--fill': '#EEF0F3', width: 38, height: 38, borderRadius: 10, border: '1px solid #E2E7EE', background: '#fff', cursor: 'pointer', color: '#8893A4' } as React.CSSProperties}>
                      ⋯
                    </button>
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
