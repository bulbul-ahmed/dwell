'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

const ACCENT = '#1E3A5C';

interface MinListing {
  title: string;
  area: string;
  price: number;
  cover: string | null;
  cat: string;
}

const CAT_LABEL: Record<string, string> = {
  rent: 'For Rent',
  buy: 'For Sale',
  office: 'Office',
  sublet: 'Sublet',
  room: 'Room',
  student: 'Student Housing',
};

function SuccessContent() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get('id');
  const [listing, setListing] = useState<MinListing | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/listings/${id}`)
      .then(r => r.json())
      .then(({ listing: l }) => {
        if (l) setListing({ title: l.title, area: l.area, price: l.price, cover: l.coverUrl ?? l.cover, cat: l.cat });
      })
      .catch(() => {});
  }, [id]);

  const steps = [
    { label: 'Listing submitted', sub: 'Just now', color: '#22C55E', done: true },
    { label: 'Dwell team reviews', sub: 'Within 24 hours', color: '#F59E0B', done: false },
    { label: 'Goes live on Dwell', sub: 'After approval', color: '#CBD5E1', done: false },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F7F9FC', fontFamily: "'Plus Jakarta Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: 560 }}>

        {/* Checkmark */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 36 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0F172A', margin: '0 0 8px', textAlign: 'center' }}>
            Listing submitted!
          </h1>
          <p style={{ fontSize: 15, color: '#64748B', margin: 0, textAlign: 'center', lineHeight: 1.6 }}>
            Your property is now in our review queue.<br />
            We&apos;ll notify you when it goes live.
          </p>
        </div>

        {/* Listing preview card */}
        {listing && (
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: 16, display: 'flex', gap: 14, marginBottom: 24 }}>
            <div style={{ width: 80, height: 80, borderRadius: 10, background: '#E7EEF5', flexShrink: 0, overflow: 'hidden' }}>
              {listing.cover ? (
                <img src={listing.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🏠</div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                {CAT_LABEL[listing.cat] ?? listing.cat}
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {listing.title}
              </div>
              <div style={{ fontSize: 13, color: '#64748B', marginBottom: 6 }}>{listing.area}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: ACCENT }}>
                ৳{listing.price.toLocaleString()}<span style={{ fontSize: 12, fontWeight: 400, color: '#94A3B8' }}>/mo</span>
              </div>
            </div>
            <div style={{ flexShrink: 0, alignSelf: 'center' }}>
              <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 999 }}>
                ⏳ Pending
              </span>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '20px 24px', marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 20 }}>
            What happens next
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {steps.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, position: 'relative' }}>
                {/* Line */}
                {i < steps.length - 1 && (
                  <div style={{ position: 'absolute', left: 10, top: 22, width: 2, height: 'calc(100% + 4px)', background: i === 0 ? '#BBF7D0' : '#E2E8F0', zIndex: 0 }} />
                )}
                {/* Dot */}
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: s.color, flexShrink: 0, zIndex: 1, marginTop: 1 }} />
                {/* Text */}
                <div style={{ paddingBottom: i < steps.length - 1 ? 24 : 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: s.done ? '#0F172A' : '#475569' }}>{s.label}</div>
                  <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 2 }}>{s.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notification note */}
        <div style={{ background: '#EEF3F8', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
            We&apos;ll send you a notification once our team approves your listing.
          </span>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => router.push('/account')}
            style={{ flex: 1, background: ACCENT, color: '#fff', border: 'none', borderRadius: 12, padding: '14px 0', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            View My Properties
          </button>
          <button
            onClick={() => router.push('/list')}
            style={{ flex: 1, background: '#fff', color: ACCENT, border: `1.5px solid ${ACCENT}`, borderRadius: 12, padding: '14px 0', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            List Another
          </button>
        </div>

      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
