'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Listing } from '@/types';
import { fmtPrice } from '@/data/listings';
import { fmtAvail } from '@/lib/listing';
import HeartIcon from '@/components/HeartIcon';

const ACCENT = '#1E3A5C';

const FACT_ICON_SRC: Record<string, string> = {
  Beds: '/icons/bed.svg', Bedrooms: '/icons/bed.svg',
  Baths: '/icons/bath.svg', Bathrooms: '/icons/bath.svg',
  Size: '/icons/area-sqft.svg',
};
function FactIcon({ label }: { label: string }) {
  const src = FACT_ICON_SRC[label];
  if (src) return <img src={src} alt="" width={13} height={13} style={{ flexShrink: 0, opacity: 0.6 }} />;
  const p = { width: 13, height: 13, viewBox: '0 0 24 24', fill: 'none' as const, style: { flexShrink: 0 } };
  if (label === 'Floor') return (
    <svg {...p}><path d="M4 8l8-4 8 4-8 4-8-4zM4 12l8 4 8-4M4 16l8 4 8-4" stroke="#9AA2AF" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
  );
  if (label === 'Move-in') return (
    <svg {...p}><rect x="3.5" y="5" width="17" height="16" rx="2" stroke="#9AA2AF" strokeWidth="1.7" /><path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" stroke="#9AA2AF" strokeWidth="1.7" strokeLinecap="round" /></svg>
  );
  // Furnished — sofa
  return (
    <svg {...p}><path d="M4 11V9a2 2 0 012-2h12a2 2 0 012 2v2M3 11a2 2 0 012 2v3h14v-3a2 2 0 012-2 2 2 0 00-2-2v0a2 2 0 00-2 2v1H7v-1a2 2 0 00-2-2 2 2 0 00-2 2zM5 16v2M19 16v2" stroke="#9AA2AF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
  );
}

interface Props {
  listing: Listing;
  saved: boolean;
  onSave: () => void;
  onClose: () => void;
}

/** Desktop slide-over quick-look panel. Summary + CTA to full page. */
export default function QuickView({ listing: c, saved, onSave, onClose }: Props) {
  const [amenExpanded, setAmenExpanded] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const totalPhotos = (c.shotUrls?.length ?? 0) + 1;

  const avail = fmtAvail(c.availableFrom);

  const facts = [
    { k: 'Beds',      v: String(c.beds) },
    { k: 'Baths',     v: String(c.baths) },
    { k: 'Size',      v: `${c.size} sqft` },
    { k: 'Floor',     v: c.floor },
    { k: 'Furnished', v: c.furnishing === 'Unfurnished' ? 'No' : c.furnishing === 'Furnished' ? 'Yes' : 'Semi' },
  ].filter(f => f.v && f.v !== 'undefined');

  const AMEN_LIMIT = 5;
  const visibleAmen = amenExpanded ? c.amen : c.amen.slice(0, AMEN_LIMIT);
  const hiddenCount = c.amen.length - AMEN_LIMIT;

  return (
    <div className="fixed inset-0 z-[60] hidden xl:block" role="dialog" aria-modal="true" aria-label={c.title}>
      <div className="absolute inset-0 bg-black/35 animate-[fadein_.2s_ease]" onClick={onClose} />
      <aside
        className="absolute right-0 top-0 h-full w-[440px] max-w-[92vw] overflow-y-auto bg-white shadow-[-18px_0_50px_-20px_rgba(21,36,59,0.45)]"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", animation: 'slideInRight .26s cubic-bezier(.22,1,.36,1)' }}
      >
        {/* Hero */}
        <div style={{ position: 'relative', aspectRatio: '16/10', background: '#DDD3C5' }}>
          <div style={{ width: '100%', height: '100%', backgroundImage: `url('${c.coverUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />

          {/* Top controls */}
          <button
            onClick={onSave}
            aria-label={saved ? 'Remove from saved' : 'Save listing'}
            style={{ position: 'absolute', top: 12, right: 54, width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.92)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <HeartIcon saved={saved} size={16} />
          </button>
          <button
            onClick={onClose}
            aria-label="Close panel"
            style={{ position: 'absolute', top: 12, right: 12, width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.92)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="#41495A" strokeWidth="2.4" strokeLinecap="round" /></svg>
          </button>

          {/* Photo count */}
          {totalPhotos > 1 && (
            <div style={{ position: 'absolute', bottom: 12, right: 12, display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(21,36,59,0.75)', color: '#fff', borderRadius: 8, padding: '4px 9px', fontSize: 11.5, fontWeight: 600, backdropFilter: 'blur(4px)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="#fff" strokeWidth="1.8"/><circle cx="8.5" cy="10.5" r="1.5" fill="#fff"/><path d="M21 15l-5-5L5 19" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/></svg>
              {totalPhotos} photos
            </div>
          )}

          {/* Verified badge */}
          {c.verified && (
            <div style={{ position: 'absolute', bottom: 12, left: 12, display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(21,36,59,0.86)', color: '#fff', borderRadius: 999, padding: '5px 11px', fontSize: 11.5, fontWeight: 600 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#8FD0AC" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Verified listing
            </div>
          )}
        </div>

        <div style={{ padding: '18px 22px 28px' }}>
          {/* Title + type */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#15243B', lineHeight: 1.25, flex: 1 }}>{c.title}</div>
            {c.propertyType && (
              <span style={{ fontSize: 11, fontWeight: 700, color: '#5A6172', background: '#EEF1F5', borderRadius: 6, padding: '3px 8px', whiteSpace: 'nowrap', marginTop: 3 }}>{c.propertyType}</span>
            )}
          </div>

          {/* Location */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#7A8090', marginBottom: 12 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-5.6 7-11a7 7 0 10-14 0c0 5.4 7 11 7 11z" stroke="#A8AEB9" strokeWidth="1.8" /></svg>
            {c.area}
          </div>

          {/* Price + availability */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: '#15243B', lineHeight: 1 }}>{fmtPrice(c)}</span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: avail.color, background: avail.bg, borderRadius: 6, padding: '4px 9px' }}>
              {avail.label}
            </span>
          </div>

          {/* Facts grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, padding: '12px 14px', background: '#F7F9FB', borderRadius: 14, marginBottom: 16 }}>
            {facts.map((f, i) => (
              <div key={f.k} style={{ borderLeft: i ? '1px solid #E4E9EF' : 'none', paddingLeft: i ? 10 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: '#8B93A1', fontWeight: 600, marginBottom: 3 }}><FactIcon label={f.k} />{f.k}</div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#15243B' }}>{f.v}</div>
              </div>
            ))}
          </div>

          {/* Amenities — capped at 5 with expand */}
          {c.amen.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#8B93A1', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Amenities</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {visibleAmen.map(a => (
                  <span key={a} style={{ fontSize: 12, color: '#41495A', background: '#EEF1F5', borderRadius: 999, padding: '5px 11px' }}>{a}</span>
                ))}
                {!amenExpanded && hiddenCount > 0 && (
                  <button
                    onClick={() => setAmenExpanded(true)}
                    style={{ fontSize: 12, color: ACCENT, background: 'rgba(30,58,92,0.07)', borderRadius: 999, padding: '5px 11px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}
                  >
                    +{hiddenCount} more
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Description — 3 lines, no read-more needed (CTA below covers it) */}
          {c.desc && (
            <p style={{ fontSize: 13.5, lineHeight: 1.65, color: '#51596A', margin: '0 0 20px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.desc}</p>
          )}

          {/* Single primary CTA */}
          <Link
            href={`/listings/${c.id}`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textAlign: 'center', width: '100%', background: ACCENT, color: '#fff', borderRadius: 13, padding: '14px 0', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 10px 22px -8px rgba(30,58,92,0.6)' }}
          >
            View full details
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
        </div>
      </aside>
    </div>
  );
}
