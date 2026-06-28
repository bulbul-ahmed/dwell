'use client';

import { forwardRef, useState, useCallback } from 'react';
import Link from 'next/link';
import type { Listing } from '@/types';
import { fmtPrice } from '@/data/listings';
import { isNew as isNewListing, fmtAvail } from '@/lib/listing';
import HeartIcon from '@/components/HeartIcon';

const ACCENT = '#1E3A5C';

const SPEC_ICON = '#9AA2AF';
const SPEC_ICON_SRC: Partial<Record<string, string>> = {
  bed: '/icons/bed.svg',
  bath: '/icons/bath.svg',
  area: '/icons/area-sqft.svg',
};
function SpecIcon({ type, size = 15 }: { type: 'bed' | 'bath' | 'area' | 'person' | 'office'; size?: number }) {
  const src = SPEC_ICON_SRC[type];
  if (src) return <img src={src} alt="" width={size} height={size} style={{ flexShrink: 0, opacity: 0.72 }} />;
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none' as const, style: { flexShrink: 0 } };
  if (type === 'person') return (
    <svg {...p}>
      <circle cx="12" cy="8" r="3.4" stroke={SPEC_ICON} strokeWidth="1.7" />
      <path d="M5.5 20a6.5 6.5 0 0113 0" stroke={SPEC_ICON} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
  // office
  return (
    <svg {...p}>
      <rect x="4" y="3.5" width="16" height="17" rx="1.5" stroke={SPEC_ICON} strokeWidth="1.7" />
      <path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2" stroke={SPEC_ICON} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

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
  const [popping, setPopping] = useState(false);

  const handleSave = useCallback((e: React.MouseEvent) => {
    setPopping(true);
    setTimeout(() => setPopping(false), 420);
    onSave(e);
  }, [onSave]);

  const priceLabel = fmtPrice(c);
  const sizeLabel = `${c.size} sqft`;

  const isNew = isNewListing(c.createdAt);
  const avail = fmtAvail(c.availableFrom);
  const availLabel = avail.label;

  // Category-aware specs — hostels show gender, offices show size, not beds/baths.
  const sizeSpec = { icon: 'area' as const, label: sizeLabel };
  const specs: { icon: 'bed' | 'bath' | 'area' | 'person' | 'office'; label: string }[] =
    c.cat === 'student'
      ? [{ icon: 'person', label: (c.pref === 'Boys' || c.pref === 'Girls') ? `${c.pref} hostel` : 'Student hostel' }, ...(c.size > 0 ? [sizeSpec] : [])]
      : c.cat === 'office'
        ? [{ icon: 'office', label: 'Office space' }, ...(c.size > 0 ? [sizeSpec] : [])]
        : [
            { icon: 'bed', label: `${c.beds} ${c.beds > 1 ? 'Beds' : 'Bed'}` },
            { icon: 'bath', label: `${c.baths} ${c.baths > 1 ? 'Baths' : 'Bath'}` },
            ...(c.size > 0 ? [sizeSpec] : []),
          ];

  const renderSpecs = () =>
    specs.flatMap((s, i) =>
      [
        ...(i > 0 ? [<span key={`d${i}`} style={{ color: '#D6DBE2' }}>·</span>] : []),
        <span key={s.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
          <SpecIcon type={s.icon} /> {s.label}
        </span>,
      ],
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
          onClick={handleSave}
          style={{
            position: 'absolute', top: 12, right: 12, width: 36, height: 36,
            borderRadius: '50%', border: 'none',
            background: saved ? 'rgba(30,58,92,0.12)' : 'rgba(255,255,255,0.92)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: popping ? 'scale(1.32)' : 'scale(1)',
            transition: 'transform 0.22s cubic-bezier(.34,1.56,.64,1), background 0.18s',
          }}
          aria-label={saved ? 'Unsave listing' : 'Save listing'}
        >
          <HeartIcon saved={saved} size={17} />
          {popping && saved && (
            <span style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'rgba(30,58,92,0.18)',
              animation: 'heartRipple 0.4s ease-out forwards',
            }} />
          )}
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
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, rowGap: 6, paddingTop: 12, borderTop: '1px solid #EDF0F4', fontSize: 12.5, color: '#5A6172', fontWeight: 500 }}>
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
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 11, rowGap: 6, paddingTop: 13, borderTop: '1px solid #EDF0F4', fontSize: 13, color: '#5A6172', fontWeight: 500 }}>
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
