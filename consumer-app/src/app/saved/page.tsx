'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fmtPrice } from '@/data/listings';
import { useDwellStore } from '@/lib/store';
import Footer from '@/components/Footer';
import HeartIcon from '@/components/HeartIcon';
import type { Listing } from '@/types';

const ACCENT = '#1E3A5C';

interface Booking {
  id: number; listingId: number; slot: string; visitDate: string | null;
  visitTime: string | null; status: string;
  listingTitle: string; listingCover: string; listingArea: string;
}

const STATUS_META: Record<string, { label: string; fg: string; bg: string }> = {
  pending:   { label: 'Pending',   fg: '#2A5C8A', bg: '#E6EFF7' },
  confirmed: { label: 'Confirmed', fg: '#3C7A58', bg: '#EAF1ED' },
  cancelled: { label: 'Cancelled', fg: '#A14A4A', bg: '#F7EAEA' },
  completed: { label: 'Completed', fg: '#5A6172', bg: '#EEF0F3' },
};

function visitDateParts(iso: string | null) {
  if (!iso) return { day: '—', dateNum: '—' };
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { day: '—', dateNum: '—' };
  return { day: d.toLocaleString('en-US', { weekday: 'short' }).toUpperCase(), dateNum: String(d.getDate()) };
}

export default function SavedPage() {
  const saved = useDwellStore(s => s.saved);
  const toggleSave = useDwellStore(s => s.toggleSave);
  const loadSaves = useDwellStore(s => s.loadSaves);

  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [visits, setVisits] = useState<Booking[]>([]);

  useEffect(() => {
    loadSaves();
    fetch('/api/listings')
      .then(r => r.json())
      .then(({ listings }: { listings: Listing[] }) => setAllListings(listings))
      .catch(() => {});
    fetch('/api/bookings')
      .then(r => r.ok ? r.json() : { bookings: [] })
      .then(({ bookings }: { bookings: Booking[] }) => setVisits(bookings ?? []))
      .catch(() => {});
  }, [loadSaves]);

  const savedListings = allListings.filter(l => !!saved[l.id]);
  const hasSaved = savedListings.length > 0;

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <main className="pg">
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 400, fontSize: 36, margin: '0 0 6px', color: '#15243B' }}>Your activity</h1>
        <p style={{ fontSize: 15, color: '#6A7180', margin: '0 0 30px' }}>Homes you've saved and visits you've lined up across Aftab Nagar.</p>

        {/* Saved homes header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: '#FFF', border: '1px solid #E7EAEE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ACCENT, fontSize: 16 }}>♥</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#15243B' }}>Saved homes</h2>
          <span style={{ fontSize: 13, color: '#8B93A1', fontWeight: 600 }}>· {savedListings.length}</span>
        </div>

        {hasSaved ? (
          <div className="g3-22" style={{ marginBottom: 50 }}>
            {savedListings.map(l => (
              <Link key={l.id} href={`/listings/${l.id}`} style={{ background: '#fff', border: '1px solid #E7EAEE', borderRadius: 18, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 14px 30px -26px rgba(21,36,59,0.4)', textDecoration: 'none', display: 'block' }}>
                <div style={{ position: 'relative', aspectRatio: '16/11', background: '#DDD3C5' }}>
                  <div style={{ width: '100%', height: '100%', backgroundImage: `url('${l.coverUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                  <button
                    onClick={e => { e.preventDefault(); toggleSave(l.id); }}
                    style={{ position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.92)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <HeartIcon saved={true} size={17} />
                  </button>
                </div>
                <div style={{ padding: '15px 16px 17px' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#15243B', marginBottom: 4 }}>{l.title}</div>
                  <div style={{ fontSize: 12.5, color: '#7A8090', marginBottom: 12 }}>{l.area}</div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, color: '#15243B' }}>{fmtPrice(l)}</div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div style={{ border: '1px dashed #D3D9E0', borderRadius: 18, padding: 48, textAlign: 'center', marginBottom: 50, background: '#fff' }}>
            <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'center' }}><HeartIcon saved={false} size={30} /></div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#15243B', marginBottom: 6 }}>No saved homes yet</div>
            <p style={{ fontSize: 14, color: '#8B93A1', margin: '0 0 18px' }}>Tap the heart on any listing to keep it here.</p>
            <Link href="/search?intent=rent" style={{ background: ACCENT, color: '#fff', border: 'none', borderRadius: 12, padding: '11px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', display: 'inline-block' }}>
              Browse listings
            </Link>
          </div>
        )}

        {/* Upcoming visits */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: '#FFF', border: '1px solid #E7EAEE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="3.5" y="5" width="17" height="15" rx="2.5" stroke={ACCENT} strokeWidth="1.8" />
              <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#15243B' }}>Upcoming visits</h2>
        </div>
        {visits.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {visits.map(v => {
              const { day, dateNum } = visitDateParts(v.visitDate);
              const meta = STATUS_META[v.status] ?? STATUS_META.pending;
              const showReview = v.status === 'completed';
              return (
                <Link key={v.id} href={`/listings/${v.listingId}`} style={{ display: 'flex', alignItems: 'center', gap: 18, background: '#fff', border: '1px solid #E7EAEE', borderRadius: 16, padding: '16px 18px', cursor: 'pointer', textDecoration: 'none' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 12, background: ACCENT, color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1, flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 700 }}>{day}</span>
                    <span style={{ fontSize: 20, fontWeight: 800 }}>{dateNum}</span>
                  </div>
                  <div style={{ width: 64, height: 56, borderRadius: 11, overflow: 'hidden', background: '#DDD3C5', flexShrink: 0 }}>
                    <div style={{ width: '100%', height: '100%', backgroundImage: `url('${v.listingCover}')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15.5, fontWeight: 700, color: '#15243B', marginBottom: 3 }}>{v.listingTitle}</div>
                    <div style={{ fontSize: 13, color: '#7A8090' }}>{v.slot} · {v.listingArea}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 9, flexShrink: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: meta.fg, background: meta.bg, borderRadius: 999, padding: '6px 13px', whiteSpace: 'nowrap' }}>{meta.label}</span>
                    {showReview && (
                      <button
                        onClick={e => { e.preventDefault(); window.location.href = `/review/${v.listingId}`; }}
                        style={{ height: 34, padding: '0 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, color: '#15243B', background: '#EDF0F4', whiteSpace: 'nowrap' }}
                      >
                        Write a review
                      </button>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div style={{ border: '1px dashed #D3D9E0', borderRadius: 16, padding: 32, textAlign: 'center', background: '#fff', color: '#8B93A1', fontSize: 14 }}>
            No visits booked yet.
          </div>
        )}

        {/* Saved searches + reviews */}
        <div className="g2" style={{ marginTop: 44 }}>
          <div className="prop-card" style={{ background: '#fff', border: '1px solid #E7EAEE', borderRadius: 18, padding: 22, cursor: 'pointer', boxShadow: '0 1px 2px rgba(20,40,70,.03)', transition: 'transform .3s, box-shadow .3s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EEF3F8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M6 9a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6z" stroke={ACCENT} strokeWidth="1.8" strokeLinejoin="round" />
                  <path d="M10 20a2 2 0 004 0" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15.5, fontWeight: 700, color: '#15243B' }}>Saved searches &amp; alerts</div>
                <div style={{ fontSize: 13, color: '#8B93A1', marginTop: 2 }}>3 active · 4 new matches</div>
              </div>
              <span style={{ color: '#AEB8C6' }}>→</span>
            </div>
          </div>
          <Link href="/review/5" className="prop-card" style={{ background: '#fff', border: '1px solid #E7EAEE', borderRadius: 18, padding: 22, cursor: 'pointer', boxShadow: '0 1px 2px rgba(20,40,70,.03)', transition: 'transform .3s, box-shadow .3s', textDecoration: 'none', display: 'block' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F6EFD9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19 }}>⭐</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15.5, fontWeight: 700, color: '#15243B' }}>Review your last visit</div>
                <div style={{ fontSize: 13, color: '#8B93A1', marginTop: 2 }}>Garden-Facing 2-Bed · Jun 14</div>
              </div>
              <span style={{ color: '#AEB8C6' }}>→</span>
            </div>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
