'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Footer from '@/components/Footer';
import ListingCard from '@/components/ListingCard';
import { useDwellStore } from '@/lib/store';
import type { Listing } from '@/types';

const ACCENT = '#1E3A5C';

interface OwnerData { name: string; type: string; rating: number; responseTime: string | null; }
interface OwnerReview { id: number; rating: number; comment: string | null; createdAt: string; userName: string; }

const AVATARS = [
  { bg: 'linear-gradient(135deg,#E8C9A0,#C99B6E)', fg: '#5A3E22' },
  { bg: 'linear-gradient(135deg,#B3C8E8,#7EA8CC)', fg: '#2A4C72' },
  { bg: 'linear-gradient(135deg,#C7E0C9,#8FBF96)', fg: '#2E5A38' },
];

function reviewWhen(iso: string, rating: number) {
  const d = new Date(iso);
  const month = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  return `${month} · ${'★'.repeat(rating)}${'☆'.repeat(Math.max(0, 5 - rating))}`;
}

export default function ProviderPage() {
  const { id } = useParams<{ id: string }>();
  const [owner, setOwner] = useState<OwnerData | null>(null);
  const [providerListings, setProviderListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<OwnerReview[]>([]);

  const saved = useDwellStore(s => s.saved);
  const toggleSave = useDwellStore(s => s.toggleSave);

  const isAgency = owner?.type === 'Agency';
  const noun = isAgency ? 'agency' : 'owner';
  const rt = owner?.responseTime;
  const isNewProvider = !rt || rt.toLowerCase() === 'new';
  const listingCount = providerListings.length;

  useEffect(() => {
    fetch(`/api/owners/${id}`)
      .then(r => r.json())
      .then(({ owner: o, listings: ls, reviews: rv }: { owner: OwnerData; listings: Listing[]; reviews: OwnerReview[] }) => {
        setOwner(o);
        setProviderListings(ls.slice(0, 3));
        setReviews(rv ?? []);
      })
      .catch(() => {});
  }, [id]);

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <main className="pg-prov" style={{ animation: 'bvfade .4s ease both' }}>
        <Link href="/search" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 600, color: '#6A7180', cursor: 'pointer', marginBottom: 18, textDecoration: 'none' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="#6A7180" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </Link>

        {/* Hero card */}
        <div style={{ background: '#fff', border: '1px solid #E7EAEE', borderRadius: 22, overflow: 'hidden', boxShadow: '0 1px 2px rgba(20,40,70,.03)', marginBottom: 22 }}>
          <div style={{ height: 88, background: 'linear-gradient(120deg, #16273F, #2C557F)', position: 'relative' }} />
          <div style={{ padding: '0 28px 26px', display: 'flex', alignItems: 'flex-end', gap: 22, flexWrap: 'wrap' }}>
            <div style={{ width: 92, height: 92, borderRadius: 24, background: 'linear-gradient(140deg, #3C6E9E, #2C557F)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 34, marginTop: -46, border: '5px solid #fff', boxShadow: '0 10px 24px -10px rgba(20,40,70,.4)' }}>{(owner?.name ?? 'R').charAt(0).toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 220, paddingTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: '#15243B', margin: 0, letterSpacing: '-0.4px' }}>{owner?.name ?? '…'}</h1>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 800, color: '#2E7D55', background: '#EAF1ED', padding: '5px 12px', borderRadius: 999 }}>✓ Verified {noun}</span>
              </div>
              <div style={{ display: 'flex', gap: 18, marginTop: 10, fontSize: 13.5, color: '#6A7180', flexWrap: 'wrap', alignItems: 'center' }}>
                <span aria-label={`Rated ${owner?.rating?.toFixed(1) ?? '—'} out of 5`}>★ {owner?.rating?.toFixed(1) ?? '—'}{reviews.length > 0 && ` (${reviews.length} review${reviews.length === 1 ? '' : 's'})`}</span>
                <span style={{ color: '#CCD3DB' }}>·</span>
                <span>{listingCount} listing{listingCount === 1 ? '' : 's'}</span>
                <span style={{ color: '#CCD3DB' }}>·</span>
                {isNewProvider
                  ? <span style={{ color: '#2E7D55', fontWeight: 600 }}>New on Dwell</span>
                  : <span>Responds in {rt}</span>}
                <span style={{ color: '#CCD3DB' }}>·</span>
                <span>Aftab Nagar</span>
              </div>
            </div>
            <Link
              href={listingCount > 0 ? `/listings/${providerListings[0].id}?chat=1` : '/messages'}
              style={{ height: 46, padding: '0 22px', borderRadius: 13, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14.5, fontWeight: 700, color: '#fff', background: '#15243B', boxShadow: '0 10px 22px -10px rgba(21,36,59,.5)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
            >
              Message {noun}
            </Link>
          </div>
        </div>

        {/* Active listings */}
        <h3 style={{ fontSize: 19, fontWeight: 800, color: '#15243B', margin: '0 0 16px' }}>Active listings ({listingCount})</h3>
        {listingCount > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 340px))', gap: 22, marginBottom: 40 }}>
            {providerListings.map(c => (
              <ListingCard
                key={c.id}
                listing={c}
                saved={!!saved[c.id]}
                onSave={e => { e.preventDefault(); toggleSave(c.id); }}
                compact
              />
            ))}
          </div>
        ) : (
          <div style={{ border: '1px dashed #D3D9E0', borderRadius: 16, padding: 32, textAlign: 'center', background: '#fff', color: '#8B93A1', fontSize: 14, marginBottom: 40 }}>
            No active listings right now.
          </div>
        )}

        {/* Reviews */}
        <h3 style={{ fontSize: 19, fontWeight: 800, color: '#15243B', margin: '0 0 16px' }}>What tenants say</h3>
        {reviews.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {reviews.map((r, i) => {
              const av = AVATARS[i % AVATARS.length];
              return (
                <div key={r.id} style={{ background: '#fff', border: '1px solid #E7EAEE', borderRadius: 16, padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 11 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 11, background: av.bg, color: av.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>{r.userName.charAt(0).toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#15243B' }}>{r.userName}</div>
                      <div style={{ fontSize: 12, color: '#9AA6B6' }}>{reviewWhen(r.createdAt, r.rating)}</div>
                    </div>
                  </div>
                  <p style={{ fontSize: 13.5, lineHeight: 1.6, color: '#44506A', margin: 0 }}>{r.comment ? `"${r.comment}"` : 'No written comment.'}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ border: '1px dashed #D3D9E0', borderRadius: 16, padding: 32, textAlign: 'center', background: '#fff', color: '#8B93A1', fontSize: 14 }}>
            No reviews yet for this {noun}&apos;s listings.
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
