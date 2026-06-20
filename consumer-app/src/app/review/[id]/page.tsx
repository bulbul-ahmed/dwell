'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Listing } from '@/types';

const ACCENT = '#1E3A5C';

const RATING_LABELS = ['Tap a star to rate', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];
const SUB_DEFS = [
  ['accuracy', 'Listing accuracy'],
  ['communication', 'Owner communication'],
  ['condition', 'Property condition'],
  ['value', 'Value for money'],
] as const;

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);

  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then(r => r.json())
      .then(({ listing: l }: { listing: Listing }) => setListing(l))
      .catch(() => {});
  }, [id]);

  const [rating, setRating] = useState(0);
  const [subs, setSubs] = useState<Record<string, number>>({});
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submitOk = rating > 0;

  const handleSubmit = () => {
    if (!submitOk) return;
    fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId: Number(id), rating, subRatings: subs, comment: text }),
    }).catch(() => {});
    setSubmitted(true);
    window.scrollTo({ top: 0 });
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#FFFFFF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <main className="pg-xs" style={{ animation: 'bvfade .4s ease both' }}>
          <div style={{ background: '#fff', border: '1px solid #E7EAEE', borderRadius: 20, padding: '56px 32px', textAlign: 'center', animation: 'bvpop .4s ease both', boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
            <div style={{ width: 84, height: 84, borderRadius: 26, background: '#EAF1ED', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px' }}>
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#2E7D55" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#15243B', margin: '0 0 8px' }}>Thanks for your review!</h2>
            <p style={{ fontSize: 14.5, color: '#6A7180', margin: '0 auto 26px', maxWidth: 380, lineHeight: 1.6 }}>Your feedback is now public and helps the next renter choose with confidence.</p>
            <Link href="/saved" style={{ height: 46, padding: '0 26px', borderRadius: 13, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14.5, fontWeight: 700, color: '#fff', background: '#15243B', textDecoration: 'none', display: 'inline-block', lineHeight: '46px' }}>
              Back to activity
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <main className="pg-xs" style={{ animation: 'bvfade .4s ease both' }}>
        <Link href="/saved" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 600, color: '#6A7180', cursor: 'pointer', marginBottom: 18, textDecoration: 'none' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="#6A7180" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to activity
        </Link>

        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 28, margin: '0 0 6px', color: '#15243B', letterSpacing: '-0.5px' }}>Review your visit</h1>
        <p style={{ fontSize: 14.5, color: '#6A7180', margin: '0 0 24px' }}>Honest reviews keep Aftab Nagar trustworthy for everyone.</p>

        {/* Listing snapshot */}
        <div style={{ background: '#fff', border: '1px solid #E7EAEE', borderRadius: 18, padding: 16, display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
          <div style={{ width: 60, height: 60, borderRadius: 13, backgroundImage: listing ? `url('${listing.coverUrl}')` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#DDD3C5', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#15243B' }}>{listing?.title ?? '…'}</div>
            <div style={{ fontSize: 13, color: '#8893A4', marginTop: 2 }}>Visited Sat, Jun 14 · {listing?.owner.name ?? '…'}</div>
          </div>
        </div>

        {/* Review form */}
        <div style={{ background: '#fff', border: '1px solid #E7EAEE', borderRadius: 18, padding: 24, boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
          {/* Overall rating */}
          <div style={{ textAlign: 'center', paddingBottom: 22, borderBottom: '1px solid #F2F4F7' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#4A5161', marginBottom: 12 }}>Overall rating</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <span
                  key={i}
                  onClick={() => setRating(i)}
                  style={{ fontSize: 38, cursor: 'pointer', color: i <= rating ? '#C9A24B' : '#E0E5EC', transition: 'color .2s', lineHeight: 1 }}
                >★</span>
              ))}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#8893A4', marginTop: 10 }}>{RATING_LABELS[rating]}</div>
          </div>

          {/* Sub-ratings */}
          <div style={{ padding: '20px 0', borderBottom: '1px solid #F2F4F7' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#4A5161', marginBottom: 14 }}>Rate the details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {SUB_DEFS.map(([key, label]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: '#44506A' }}>{label}</span>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <span
                        key={i}
                        onClick={() => setSubs(s => ({ ...s, [key]: i }))}
                        style={{ fontSize: 19, cursor: 'pointer', color: i <= (subs[key] ?? 0) ? '#C9A24B' : '#E0E5EC', transition: 'color .2s' }}
                      >★</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Text + photos */}
          <div style={{ paddingTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#4A5161', marginBottom: 10 }}>Tell others about your experience</div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Was the listing accurate? How was the owner to deal with?"
              style={{ width: '100%', minHeight: 110, border: '1px solid #E1E6EC', borderRadius: 13, padding: '13px 15px', fontFamily: 'inherit', fontSize: 14, color: '#15243B', resize: 'vertical', outline: 'none', lineHeight: 1.6, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <div style={{ width: 72, height: 72, borderRadius: 13, border: '1.5px dashed #CBD3DD', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#9AA6B6', gap: 3 }}>
                <span style={{ fontSize: 20 }}>+</span>
                <span style={{ fontSize: 10, fontWeight: 700 }}>Photo</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!submitOk}
            style={{ width: '100%', height: 50, borderRadius: 14, border: 'none', cursor: submitOk ? 'pointer' : 'default', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, color: '#fff', background: submitOk ? ACCENT : '#B9C4D2', marginTop: 22, boxShadow: submitOk ? '0 12px 26px -10px rgba(30,58,92,.5)' : 'none', transition: 'background .25s' }}
          >
            Post review
          </button>
        </div>
      </main>
    </div>
  );
}
