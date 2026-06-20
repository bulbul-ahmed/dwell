'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';

const ACCENT = '#1E3A5C';

interface Booking {
  id: number;
  listingId: number;
  listingTitle: string;
  listingCover: string;
  listingArea: string;
  slot: string;
  visitDate: string | null;
  visitTime: string | null;
  note: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
}

const STATUS_STYLE: Record<Booking['status'], { fg: string; bg: string; label: string }> = {
  pending:   { fg: '#8B6F3E', bg: '#F4F1EB', label: 'Pending'   },
  confirmed: { fg: '#2E7D55', bg: '#EAF1ED', label: 'Confirmed' },
  cancelled: { fg: '#C0392B', bg: '#FFF0EE', label: 'Cancelled' },
  completed: { fg: '#5A6172', bg: '#EEF0F3', label: 'Completed' },
};

function StatusBadge({ status }: { status: Booking['status'] }) {
  const s = STATUS_STYLE[status];
  return (
    <span style={{
      fontSize: 11.5, fontWeight: 700, color: s.fg, background: s.bg,
      padding: '4px 11px', borderRadius: 999, whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  );
}

export default function VisitsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [cancelling, setCancelling] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/bookings')
      .then(r => r.json())
      .then(({ bookings: rows }: { bookings: Booking[] }) => setBookings(rows))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cancel = async (id: number) => {
    setCancelling(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
      }
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`@keyframes vfade { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }`}</style>
      <main className="pg-sm" style={{ animation: 'vfade .4s ease both' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontWeight: 400, fontSize: 34, margin: '0 0 4px', color: '#15243B' }}>Visit Requests</h1>
            <p style={{ fontSize: 13.5, color: '#8893A4', margin: 0 }}>Track and manage your scheduled property visits</p>
          </div>
          <Link
            href="/search"
            style={{ height: 42, padding: '0 20px', borderRadius: 12, background: ACCENT, color: '#fff', fontSize: 13.5, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="#fff" strokeWidth="2" />
              <path d="M20 20l-3.2-3.2" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Browse listings
          </Link>
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ border: '1px solid #E7EAEE', borderRadius: 20, padding: 20, display: 'flex', gap: 18, alignItems: 'center' }}>
                <div style={{ width: 80, height: 80, borderRadius: 14, background: '#E7EAEE', flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ height: 14, background: '#E7EAEE', borderRadius: 6, width: '40%' }} />
                  <div style={{ height: 12, background: '#F0F2F5', borderRadius: 6, width: '60%' }} />
                  <div style={{ height: 12, background: '#F0F2F5', borderRadius: 6, width: '30%' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && bookings.length === 0 && (
          <div style={{ padding: '72px 24px', textAlign: 'center', border: '1px dashed #D3D9E0', borderRadius: 20 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🏠</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#15243B', margin: '0 0 8px' }}>No visit requests yet</h2>
            <p style={{ fontSize: 14, color: '#8893A4', margin: '0 0 22px' }}>Find a property you love and request a visit from the listing page.</p>
            <Link
              href="/search"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 24px', borderRadius: 12, background: ACCENT, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}
            >
              Browse listings
            </Link>
          </div>
        )}

        {/* Booking cards */}
        {!loading && bookings.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Count summary */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
              {(['pending', 'confirmed', 'completed', 'cancelled'] as Booking['status'][]).map(s => {
                const count = bookings.filter(b => b.status === s).length;
                if (count === 0) return null;
                const st = STATUS_STYLE[s];
                return (
                  <span key={s} style={{ fontSize: 12, fontWeight: 700, color: st.fg, background: st.bg, padding: '5px 12px', borderRadius: 999 }}>
                    {count} {st.label}
                  </span>
                );
              })}
            </div>

            {bookings.map(b => (
              <div
                key={b.id}
                style={{
                  background: '#fff',
                  border: '1px solid #E7EAEE',
                  borderRadius: 20,
                  padding: '18px 20px',
                  display: 'flex',
                  gap: 18,
                  alignItems: 'flex-start',
                  boxShadow: '0 1px 3px rgba(21,36,59,.04)',
                  opacity: b.status === 'cancelled' ? 0.65 : 1,
                  transition: 'opacity .2s',
                }}
              >
                {/* Thumbnail */}
                <Link href={`/listings/${b.listingId}`} style={{ flexShrink: 0, display: 'block', width: 88, height: 88, borderRadius: 14, overflow: 'hidden', background: '#DDD3C5' }}>
                  <div style={{ width: '100%', height: '100%', backgroundImage: `url('${b.listingCover}')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                </Link>

                {/* Main content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0 }}>
                      <Link
                        href={`/listings/${b.listingId}`}
                        style={{ fontSize: 15.5, fontWeight: 800, color: '#15243B', textDecoration: 'none', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      >
                        {b.listingTitle}
                      </Link>
                      <div style={{ fontSize: 13, color: '#8893A4', marginTop: 3 }}>
                        📍 {b.listingArea}
                      </div>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>

                  {/* Visit slot row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '10px 14px', background: '#F7F9FC', border: '1px solid #EDF1F6', borderRadius: 12 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                      <rect x="3" y="4" width="18" height="18" rx="3" stroke="#6A7899" strokeWidth="1.8" />
                      <path d="M16 2v4M8 2v4M3 10h18" stroke="#6A7899" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: '#15243B' }}>{b.slot}</span>
                  </div>

                  {/* Note */}
                  {b.note && (
                    <div style={{ marginTop: 10, fontSize: 13, color: '#6A7180', padding: '8px 14px', background: '#FAFBFC', borderRadius: 10, borderLeft: '3px solid #D0D7E0' }}>
                      "{b.note}"
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                    <Link
                      href={`/listings/${b.listingId}`}
                      style={{ height: 36, padding: '0 16px', borderRadius: 10, border: '1px solid #E7EAEE', background: '#F7F9FC', color: '#41495A', fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                    >
                      View listing
                    </Link>

                    <Link
                      href={`/messages`}
                      style={{ height: 36, padding: '0 16px', borderRadius: 10, border: '1px solid #E7EAEE', background: '#F7F9FC', color: '#41495A', fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="#41495A" strokeWidth="1.8" strokeLinejoin="round" />
                      </svg>
                      Message owner
                    </Link>

                    {b.status === 'completed' && (
                      <Link
                        href={`/review/${b.listingId}`}
                        style={{ height: 36, padding: '0 16px', borderRadius: 10, border: 'none', background: '#EAF1ED', color: '#2E7D55', fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        ★ Write a review
                      </Link>
                    )}

                    {b.status === 'pending' && (
                      <button
                        onClick={() => cancel(b.id)}
                        disabled={cancelling === b.id}
                        style={{ height: 36, padding: '0 16px', borderRadius: 10, border: '1px solid #F2D0CC', background: '#FFF8F7', color: '#C0392B', fontSize: 13, fontWeight: 700, cursor: cancelling === b.id ? 'default' : 'pointer', fontFamily: 'inherit', opacity: cancelling === b.id ? 0.6 : 1 }}
                      >
                        {cancelling === b.id ? 'Cancelling…' : 'Cancel visit'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
