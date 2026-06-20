'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import type { Listing } from '@/types';
import { fmtPrice } from '@/data/listings';
import HeartIcon from '@/components/HeartIcon';

const ACCENT = '#1E3A5C';

interface Props {
  listing: Listing;
  saved: boolean;
  onSave: () => void;
  onClose: () => void;
}

/** Desktop slide-over quick-look panel (feature C). Summary + CTA to full page. */
export default function QuickView({ listing: c, saved, onSave, onClose }: Props) {
  // close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const facts = [
    { k: 'Beds', v: c.beds },
    { k: 'Baths', v: c.baths },
    { k: 'Size', v: `${c.size} sqft` },
    { k: 'Floor', v: c.floor },
  ];

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
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ position: 'absolute', top: 14, right: 14, width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.92)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="#41495A" strokeWidth="2.4" strokeLinecap="round" /></svg>
          </button>
          <button
            onClick={onSave}
            aria-label={saved ? 'Unsave' : 'Save'}
            style={{ position: 'absolute', top: 14, right: 60, width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.92)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <HeartIcon saved={saved} size={17} />
          </button>
          {c.verified && (
            <div style={{ position: 'absolute', bottom: 14, left: 14, display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(21,36,59,0.86)', color: '#fff', borderRadius: 999, padding: '5px 11px', fontSize: 11.5, fontWeight: 600 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#8FD0AC" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Verified
            </div>
          )}
        </div>

        <div style={{ padding: '20px 22px 28px' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#15243B', lineHeight: 1.25, marginBottom: 4 }}>{c.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#7A8090', marginBottom: 14 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-5.6 7-11a7 7 0 10-14 0c0 5.4 7 11 7 11z" stroke="#A8AEB9" strokeWidth="1.8" /></svg>
            {c.area}
          </div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 28, color: '#15243B', marginBottom: 18 }}>{fmtPrice(c)}</div>

          {/* Facts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, padding: 16, background: '#F7F9FB', borderRadius: 14, marginBottom: 18 }}>
            {facts.map((f, i) => (
              <div key={f.k} style={{ borderLeft: i ? '1px solid #E4E9EF' : 'none', paddingLeft: i ? 12 : 0 }}>
                <div style={{ fontSize: 11, color: '#8B93A1', fontWeight: 600, marginBottom: 3 }}>{f.k}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#15243B' }}>{f.v}</div>
              </div>
            ))}
          </div>

          {/* Amenities */}
          {c.amen.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#8B93A1', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Amenities</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {c.amen.map(a => (
                  <span key={a} style={{ fontSize: 12.5, color: '#41495A', background: '#EEF1F5', borderRadius: 999, padding: '6px 12px' }}>{a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Description preview */}
          {c.desc && (
            <p style={{ fontSize: 14, lineHeight: 1.65, color: '#51596A', margin: '0 0 22px', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.desc}</p>
          )}

          {/* CTAs */}
          <Link
            href={`/listings/${c.id}`}
            style={{ display: 'block', textAlign: 'center', width: '100%', background: ACCENT, color: '#fff', borderRadius: 13, padding: '14px 0', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 10px 22px -8px rgba(30,58,92,0.6)', marginBottom: 10 }}
          >
            View full details
          </Link>
          <Link
            href={`/listings/${c.id}`}
            style={{ display: 'block', textAlign: 'center', width: '100%', background: '#fff', color: '#15243B', border: '1px solid #D3D9E0', borderRadius: 13, padding: '12px 0', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
          >
            Request a visit
          </Link>
        </div>
      </aside>
    </div>
  );
}
