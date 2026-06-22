'use client';

import { forwardRef } from 'react';
import Link from 'next/link';
import type { Listing } from '@/types';
import { fmtPrice } from '@/data/listings';
import HeartIcon from '@/components/HeartIcon';

const ACCENT = '#1E3A5C';

interface Props {
  listing: Listing;
  saved: boolean;
  onSave: (e: React.MouseEvent) => void;
  /** compact = search-results variant (16/11 ratio, tighter type) */
  compact?: boolean;
  /** highlighted via map pin selection or hover (synced with the map) */
  highlighted?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: (e: React.MouseEvent) => void;
}

const ListingCard = forwardRef<HTMLAnchorElement, Props>(function ListingCard(
  { listing: c, saved, onSave, compact = false, highlighted = false, onMouseEnter, onMouseLeave, onClick },
  ref,
) {
  const priceLabel = fmtPrice(c);
  const sizeLabel = `${c.size} sqft`;

  const daysSince = c.createdAt ? Math.floor((Date.now() - new Date(c.createdAt).getTime()) / 86400000) : null;
  const isNew = daysSince !== null && daysSince <= 7;
  const availLabel = c.availableFrom && c.availableFrom !== 'immediate'
    ? `Available ${new Date(c.availableFrom).toLocaleDateString('en', { day: 'numeric', month: 'short' })}`
    : 'Available now';

  // Category-aware specs — hostels show gender, offices show size, not beds/baths.
  const specs: string[] =
    c.cat === 'student'
      ? [(c.pref === 'Boys' || c.pref === 'Girls') ? `${c.pref} hostel` : 'Student hostel', ...(c.size > 0 ? [sizeLabel] : [])]
      : c.cat === 'office'
        ? ['Office space', ...(c.size > 0 ? [sizeLabel] : [])]
        : [
            `${c.beds} ${c.beds > 1 ? 'Beds' : 'Bed'}`,
            `${c.baths} ${c.baths > 1 ? 'Baths' : 'Bath'}`,
            ...(c.size > 0 ? [sizeLabel] : []),
          ];

  const renderSpecs = () =>
    specs.flatMap((s, i) =>
      i === 0
        ? [<span key={s}>{s}</span>]
        : [<span key={`d${i}`} style={{ color: '#CCD3DB' }}>·</span>, <span key={s}>{s}</span>],
    );

  return (
    <Link
      ref={ref}
      href={`/listings/${c.id}`}
      className="prop-card"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      style={{ background: '#fff', border: highlighted ? `2px solid ${ACCENT}` : '1px solid #E7EAEE', borderRadius: 18, overflow: 'hidden', cursor: 'pointer', boxShadow: highlighted ? '0 18px 36px -20px rgba(21,36,59,0.55)' : compact ? '0 14px 30px -26px rgba(21,36,59,0.4)' : '0 14px 30px -24px rgba(21,36,59,0.4)', transition: 'transform .18s ease, box-shadow .18s ease, border-color .18s ease', display: 'block', textDecoration: 'none', scrollMarginTop: 100 }}
    >
      {/* Image */}
      <div style={{ position: 'relative', aspectRatio: compact ? '16/11' : '4/3', background: '#DDD3C5' }}>
        <div style={{ width: '100%', height: '100%', backgroundImage: `url('${c.coverUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#DDD3C5' }} />
        <button
          onClick={onSave}
          style={{ position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.92)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <HeartIcon saved={saved} size={17} />
        </button>
        {isNew && (
          <div style={{ position: 'absolute', top: 12, left: 12, background: '#2E7D55', color: '#fff', borderRadius: 999, padding: '5px 11px', fontSize: 11.5, fontWeight: 700 }}>New</div>
        )}
        {c.verified && (
          <div style={{ position: 'absolute', bottom: 12, left: 12, display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(21,36,59,0.86)', color: '#fff', borderRadius: 999, padding: '5px 11px', fontSize: 11.5, fontWeight: 600 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="#8FD0AC" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Verified
          </div>
        )}
      </div>

      {/* Body */}
      {compact ? (
        <div style={{ padding: '15px 16px 17px' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#15243B', marginBottom: 5, lineHeight: 1.25 }}>{c.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: '#7A8090', marginBottom: 12 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M12 21s7-5.6 7-11a7 7 0 10-14 0c0 5.4 7 11 7 11z" stroke="#A8AEB9" strokeWidth="1.8" />
            </svg>
            {c.area}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, paddingTop: 12, borderTop: '1px solid #EDF0F4', fontSize: 12.5, color: '#5A6172', fontWeight: 500 }}>
            {renderSpecs()}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: availLabel === 'Available now' ? '#2E7D55' : '#8A6D1F', marginTop: 9 }}>{availLabel}</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, color: '#15243B', marginTop: 10 }}>{priceLabel}</div>
        </div>
      ) : (
        <div style={{ padding: '16px 17px 18px' }}>
          <div style={{ fontSize: 16.5, fontWeight: 700, color: '#15243B', lineHeight: 1.25, marginBottom: 5 }}>{c.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#7A8090', marginBottom: 13 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M12 21s7-5.6 7-11a7 7 0 10-14 0c0 5.4 7 11 7 11z" stroke="#A8AEB9" strokeWidth="1.8" />
              <circle cx="12" cy="10" r="2.4" stroke="#A8AEB9" strokeWidth="1.8" />
            </svg>
            {c.area}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, paddingTop: 13, borderTop: '1px solid #EDF0F4', fontSize: 13, color: '#5A6172', fontWeight: 500 }}>
            {renderSpecs()}
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: availLabel === 'Available now' ? '#2E7D55' : '#8A6D1F', marginTop: 10 }}>{availLabel}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 12 }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, color: '#15243B' }}>{priceLabel}</div>
            <div style={{ fontSize: 12.5, color: '#8B93A1', fontWeight: 500 }}>{c.furnishing}</div>
          </div>
        </div>
      )}
    </Link>
  );
});

export default ListingCard;
