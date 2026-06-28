'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDwellStore } from '@/lib/store';
import ListingCard from '@/components/ListingCard';
import Footer from '@/components/Footer';
import type { Intent, Listing } from '@/types';

const ACCENT = '#1E3A5C';
const CITY = 'Dhaka';

const INTENTS: { id: Intent; label: string }[] = [
  { id: 'rent',    label: 'Rent'    },
  { id: 'buy',     label: 'Buy'     },
  { id: 'office',  label: 'Office'  },
  { id: 'sublet',  label: 'Sublet'  },
  { id: 'room',    label: 'Room'    },
  { id: 'student', label: 'Student' },
];

const INTENT_PHRASE: Record<Intent, string> = {
  rent: 'for rent', buy: 'for sale', office: 'for rent', sublet: 'to sublet', room: 'available', student: 'available',
};

const BED_OPTIONS = [
  { value: 'any', label: 'Any bedrooms' },
  { value: '1',   label: '1 Bedroom'   },
  { value: '2',   label: '2 Bedrooms'  },
  { value: '3',   label: '3 Bedrooms'  },
  { value: '4',   label: '4 Bedrooms'  },
  { value: '5',   label: '5+ Bedrooms' },
];

const PROP_TYPE_OPTIONS = [
  { value: 'any',    label: 'Any type',       icon: 'any'    },
  { value: 'flat',   label: 'Flat / Apartment', icon: 'flat' },
  { value: 'duplex', label: 'Duplex',          icon: 'duplex' },
  { value: 'office', label: 'Office / Commercial', icon: 'office' },
  { value: 'room',   label: 'Single Room',     icon: 'room'   },
  { value: 'sublet', label: 'Sublet',          icon: 'sublet' },
];

function getMonthOptions() {
  const now = new Date();
  const opts: { value: string; label: string }[] = [
    { value: 'any',       label: 'Anytime'   },
    { value: 'immediate', label: 'Immediate' },
  ];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en', { month: 'short', year: 'numeric' });
    opts.push({ value, label });
  }
  return opts;
}
const MOVE_IN_OPTIONS = getMonthOptions();

// ── Icons ────────────────────────────────────────────────────────────────────
function BedIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <rect x="2" y="13" width="20" height="7" rx="2" stroke={ACCENT} strokeWidth="1.8" />
      <path d="M2 13V8a2 2 0 012-2h4a2 2 0 012 2v5" stroke={ACCENT} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M10 13V9a2 2 0 012-2h8a2 2 0 012 2v4" stroke={ACCENT} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M2 18v2M22 18v2" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PropTypeIcon({ type, size = 16 }: { type: string; size?: number }) {
  const s = { flexShrink: 0 as const };
  if (type === 'flat') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={s}>
      <rect x="3" y="7" width="18" height="14" rx="2" stroke={ACCENT} strokeWidth="1.8" />
      <path d="M7 7V5a2 2 0 012-2h6a2 2 0 012 2v2" stroke={ACCENT} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 12h2M13 12h2M9 16h2M13 16h2" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
  if (type === 'duplex') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={s}>
      <path d="M3 21V10l9-7 9 7v11" stroke={ACCENT} strokeWidth="1.8" strokeLinejoin="round" />
      <rect x="9" y="14" width="6" height="7" rx="1" stroke={ACCENT} strokeWidth="1.8" />
      <path d="M9 10h6" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
  if (type === 'office') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={s}>
      <rect x="2" y="3" width="20" height="18" rx="2" stroke={ACCENT} strokeWidth="1.8" />
      <path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
  if (type === 'room') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={s}>
      <rect x="2" y="7" width="20" height="13" rx="2" stroke={ACCENT} strokeWidth="1.8" />
      <path d="M2 12h20M7 12V9a3 3 0 016 0v3" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
  if (type === 'sublet') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={s}>
      <circle cx="8" cy="11" r="3" stroke={ACCENT} strokeWidth="1.8" />
      <path d="M11 11h5l2 2-2 2h-5" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 14v5" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
  // any
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={s}>
      <path d="M3 21V10l9-7 9 7v11H3z" stroke={ACCENT} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 21v-6h6v6" stroke={ACCENT} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <rect x="3" y="5" width="18" height="16" rx="2" stroke={ACCENT} strokeWidth="1.8" />
      <path d="M3 10h18M8 3v4M16 3v4" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// ── Reusable dropdown ────────────────────────────────────────────────────────
function DropdownField<T extends string>({
  label, displayValue, isOpen, onToggle, dividerLeft = true, children,
}: {
  label: string; displayValue: string; isOpen: boolean;
  onToggle: () => void; dividerLeft?: boolean; children: React.ReactNode;
}) {
  return (
    <div style={{ borderLeft: dividerLeft ? '1px solid #EDE5D7' : 'none', position: 'relative' }}>
      <button
        onClick={onToggle}
        style={{ width: '100%', height: '100%', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
      >
        <div style={{ fontSize: 11.5, fontWeight: 700, color: '#8B93A1', textTransform: 'uppercase' as const, letterSpacing: '0.6px', marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 15, color: '#15243B', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{displayValue}</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 'auto', flexShrink: 0, transition: 'transform .2s', transform: isOpen ? 'rotate(180deg)' : 'none', opacity: 0.5 }}>
            <path d="M6 9l6 6 6-6" stroke="#15243B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>
      {isOpen && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 10px)', left: 0, minWidth: 220,
          background: '#fff', border: '1px solid #E7EAEE', borderRadius: 18,
          boxShadow: '0 20px 50px -16px rgba(21,36,59,0.28)',
          overflow: 'hidden', zIndex: 100,
          animation: 'dropIn .2s cubic-bezier(.34,1.56,.64,1) both',
        }}>
          <div style={{ maxHeight: 300, overflowY: 'auto' as const }}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

function DropdownOption({ selected, onClick, icon, label }: {
  selected: boolean; onClick: () => void; icon: React.ReactNode; label: string;
}) {
  return (
    <button
      className="beds-option"
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', background: selected ? '#EEF3F8' : '#fff',
        border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' as const,
        transition: 'background .15s',
      }}
    >
      <div style={{ width: 34, height: 34, borderRadius: 10, background: selected ? '#D8E6F2' : '#F4F6F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <span style={{ fontSize: 14, fontWeight: selected ? 700 : 500, color: selected ? ACCENT : '#15243B' }}>{label}</span>
      {selected && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 'auto' }}>
          <path d="M5 13l4 4L19 7" stroke={ACCENT} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const [intent, setIntent] = useState<Intent>('rent');
  const [searched, setSearched] = useState(false);

  const [beds,         setBeds]         = useState('any');
  const [budget,       setBudget]       = useState('60,000');
  const [moveIn,       setMoveIn]       = useState('any');
  const [propType,     setPropType]     = useState('any');

  const [bedsOpen,     setBedsOpen]     = useState(false);
  const [moveInOpen,   setMoveInOpen]   = useState(false);
  const [propTypeOpen, setPropTypeOpen] = useState(false);

  const bedsRef     = useRef<HTMLDivElement>(null);
  const moveInRef   = useRef<HTMLDivElement>(null);
  const propTypeRef = useRef<HTMLDivElement>(null);

  const saved      = useDwellStore(s => s.saved);
  const toggleSave = useDwellStore(s => s.toggleSave);

  const [featured, setFeatured] = useState<Listing[]>([]);
  const [results,  setResults]  = useState<Listing[]>([]);
  const [stats, setStats] = useState<{ verifiedListings: number; blocks: number; avgRating: number } | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/listings?cat=rent&limit=6')
      .then(r => r.json())
      .then(({ listings }: { listings: Listing[] }) => setFeatured(listings))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({ cat: intent });
    if (beds !== 'any') params.set('beds', beds);
    const maxPrice = budget.replace(/\D/g, '');
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (moveIn !== 'any') params.set('moveIn', moveIn);
    if (propType !== 'any') params.set('propType', propType);
    fetch(`/api/listings?${params}`)
      .then(r => r.json())
      .then(({ listings }: { listings: Listing[] }) => setResults(listings))
      .catch(() => {});
  }, [intent, beds, budget, moveIn, propType]);

  // outside-click for all three dropdowns
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bedsOpen     && bedsRef.current     && !bedsRef.current.contains(e.target as Node))     setBedsOpen(false);
      if (moveInOpen   && moveInRef.current   && !moveInRef.current.contains(e.target as Node))   setMoveInOpen(false);
      if (propTypeOpen && propTypeRef.current && !propTypeRef.current.contains(e.target as Node)) setPropTypeOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [bedsOpen, moveInOpen, propTypeOpen]);

  const handleSearch = () => setSearched(true);
  const clearSearch  = () => setSearched(false);

  const heroStyle: React.CSSProperties = {
    overflow: 'hidden',
    transition: 'max-height .65s cubic-bezier(.4,0,.2,1), opacity .4s ease, transform .55s cubic-bezier(.4,0,.2,1)',
    maxHeight: searched ? '0px' : '1000px',
    opacity:   searched ? 0 : 1,
    transform: searched ? 'translateY(-20px)' : 'none',
    pointerEvents: searched ? 'none' : 'auto',
  };

  const bedsLabel     = BED_OPTIONS.find(o => o.value === beds)?.label ?? 'Any bedrooms';
  const moveInLabel   = MOVE_IN_OPTIONS.find(o => o.value === moveIn)?.label ?? 'Anytime';
  const propTypeLabel = PROP_TYPE_OPTIONS.find(o => o.value === propType)?.label ?? 'Any type';

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        .intent-pill { transition: transform .18s ease, box-shadow .18s ease, background .15s ease, color .15s ease, border-color .15s ease !important; }
        .intent-pill:hover { transform: translateY(-2px) scale(1.04); box-shadow: 0 6px 18px -6px rgba(30,58,92,0.22); }
        .intent-pill:active { transform: translateY(0) scale(0.97); box-shadow: none; }
        .beds-option:hover { background: #EEF3F8 !important; }
        .search-btn { transition: box-shadow .2s, transform .2s !important; }
        .search-btn:hover { box-shadow: 0 12px 28px -8px rgba(30,58,92,0.7) !important; transform: translateY(-1px); }
        .search-btn:active { transform: translateY(0); }
        .search-input-field:focus { outline: none; background: #F7F9FC; }
        @keyframes bvfade { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        @keyframes dropIn { from { opacity: 0; transform: translateY(-8px) scale(.97); } to { opacity: 1; transform: none; } }
      `}</style>

      <main>
        {/* ===== HERO + SEARCH — sticky when searched ===== */}
        <div style={{
          position: searched ? 'sticky' : 'relative',
          top: searched ? 72 : 'auto',
          zIndex: searched ? 39 : 'auto',
          background: '#fff',
          borderBottom: searched ? '1px solid #E7EAEE' : 'none',
          boxShadow: searched ? '0 4px 20px -8px rgba(21,36,59,0.18)' : 'none',
        }}>
          <section style={{
            maxWidth: 1240, margin: '0 auto',
            padding: searched ? '12px clamp(16px,4vw,40px) 16px' : 'clamp(24px,5vw,64px) clamp(16px,4vw,40px) 32px',
            transition: 'padding .5s cubic-bezier(.4,0,.2,1)',
          }}>

            {/* Hero */}
            <div style={heroStyle}>
              <div className="g-hero">
                <div>
                  <div className="mb-4 sm:mb-[26px]" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #E7EAEE', borderRadius: 999, padding: '7px 14px', fontSize: 12.5, fontWeight: 600, color: '#6A7180' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4F8A6B' }} />
                    Now live in Aftab Nagar, {CITY}
                  </div>
                  <h1 className="font-sans font-extrabold leading-[1.06] tracking-[-0.5px] text-accent-dark m-0 mb-4 sm:mb-[22px] text-[clamp(28px,7.5vw,64px)] sm:leading-[1.04]">
                    A calmer way to find your next{' '}
                    <span style={{ fontStyle: 'italic', color: ACCENT }}>home</span>
                    {' '}in {CITY}.
                  </h1>
                  <p className="hidden sm:block text-[15.5px] sm:text-[17.5px]" style={{ lineHeight: 1.6, color: '#5A6172', margin: '0 0 34px', maxWidth: 460 }}>
                    Verified flats, offices and rooms across Aftab Nagar. Browse honest listings, chat with owners, and book a visit — no brokers, no surprises.
                  </p>
                  <div className="flex items-center gap-5 sm:gap-[30px]">
                    {[
                      [stats ? `${stats.verifiedListings}` : '—', 'Verified listings'],
                      [stats ? `${stats.blocks}` : '—', 'Aftab Nagar blocks'],
                      [stats ? `${stats.avgRating.toFixed(1)}★` : '—', 'Avg owner rating'],
                    ].map(([n, t], i) => (
                      <div key={t} className="flex items-center gap-5 sm:gap-[30px]">
                        {i > 0 && <div className="hidden sm:block" style={{ width: 1, height: 34, background: '#DBE0E6' }} />}
                        <div>
                          <div className="text-[22px] sm:text-[30px]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#15243B' }}>{n}</div>
                          <div style={{ fontSize: 12.5, color: '#7A8090', fontWeight: 500 }}>{t}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="hero-img-col">
                  <div style={{ borderRadius: 24, overflow: 'hidden', boxShadow: '0 30px 60px -24px rgba(21,36,59,0.4)', aspectRatio: '4/4.4', background: '#DDD3C5' }}>
                    <img
                      src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=75"
                      alt="home interior"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                  <div style={{ position: 'absolute', left: -26, bottom: 40, background: '#fff', borderRadius: 16, padding: '14px 16px', boxShadow: '0 18px 40px -16px rgba(21,36,59,0.35)', display: 'flex', alignItems: 'center', gap: 12, width: 230 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 11, background: '#EAF1ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M5 13l4 4L19 7" stroke="#4F8A6B" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#15243B' }}>Verified by Dwell</div>
                      <div style={{ fontSize: 12, color: '#8A8F9C' }}>Every owner &amp; document checked</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ===== SEARCH BAR ===== */}
            <div style={{
              marginTop: searched ? 0 : 24,
              transition: 'margin-top .5s cubic-bezier(.4,0,.2,1)',
              background: '#fff', border: '1px solid #E7EAEE', borderRadius: 22,
              padding: 14, boxShadow: '0 20px 44px -28px rgba(21,36,59,0.35)',
            }}>
              {/* Intent tabs */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                {INTENTS.map(it => {
                  const active = intent === it.id;
                  return (
                    <button
                      key={it.id}
                      className="intent-pill"
                      onClick={() => { setIntent(it.id); setSearched(true); }}
                      style={{
                        border: `1px solid ${active ? ACCENT : '#E7EAEE'}`,
                        background: active ? ACCENT : '#F9FAFC',
                        color: active ? '#fff' : '#6A7180',
                        borderRadius: 999, padding: '8px 18px', fontSize: 13.5,
                        fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      {it.label}
                    </button>
                  );
                })}
              </div>

              {/* Inputs row — 6 columns */}
              <div className="g-search-bar">

                {/* Location */}
                <div
                  className="search-bar-location"
                  onClick={() => setSearched(true)}
                  style={{ padding: '10px 16px', cursor: 'text' }}
                >
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#8B93A1', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 3 }}>Location</div>
                  <div style={{ fontSize: 15, color: '#15243B', fontWeight: 500 }}>Aftab Nagar, {CITY}</div>
                </div>

                {/* Bedrooms */}
                <div ref={bedsRef}>
                  <DropdownField
                    label="Bedrooms"
                    displayValue={bedsLabel}
                    isOpen={bedsOpen}
                    onToggle={() => { setBedsOpen(o => !o); setSearched(true); }}
                  >
                    {BED_OPTIONS.map(opt => (
                      <DropdownOption
                        key={opt.value}
                        selected={beds === opt.value}
                        onClick={() => { setBeds(opt.value); setBedsOpen(false); }}
                        icon={<BedIcon size={16} />}
                        label={opt.label}
                      />
                    ))}
                  </DropdownField>
                </div>

                {/* Available from */}
                <div ref={moveInRef}>
                  <DropdownField
                    label="Available from"
                    displayValue={moveInLabel}
                    isOpen={moveInOpen}
                    onToggle={() => { setMoveInOpen(o => !o); setSearched(true); }}
                  >
                    {MOVE_IN_OPTIONS.map(opt => (
                      <DropdownOption
                        key={opt.value}
                        selected={moveIn === opt.value}
                        onClick={() => { setMoveIn(opt.value); setMoveInOpen(false); }}
                        icon={<CalendarIcon size={16} />}
                        label={opt.label}
                      />
                    ))}
                  </DropdownField>
                </div>

                {/* Property type */}
                <div ref={propTypeRef}>
                  <DropdownField
                    label="Property type"
                    displayValue={propTypeLabel}
                    isOpen={propTypeOpen}
                    onToggle={() => { setPropTypeOpen(o => !o); setSearched(true); }}
                  >
                    {PROP_TYPE_OPTIONS.map(opt => (
                      <DropdownOption
                        key={opt.value}
                        selected={propType === opt.value}
                        onClick={() => { setPropType(opt.value); setPropTypeOpen(false); }}
                        icon={<PropTypeIcon type={opt.icon} size={16} />}
                        label={opt.label}
                      />
                    ))}
                  </DropdownField>
                </div>

                {/* Max Budget */}
                <div style={{ padding: '10px 16px', borderLeft: '1px solid #EDE5D7' }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#8B93A1', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 3 }}>Max budget</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 15, color: '#15243B', fontWeight: 500, userSelect: 'none' }}>৳</span>
                    <input
                      className="search-input-field"
                      type="text"
                      inputMode="numeric"
                      value={budget}
                      onFocus={() => setSearched(true)}
                      onChange={e => setBudget(e.target.value.replace(/[^\d,]/g, ''))}
                      placeholder="Any"
                      style={{ fontSize: 15, color: '#15243B', fontWeight: 500, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', width: '100%', minWidth: 0 }}
                    />
                  </div>
                </div>

                {/* Search button */}
                <button
                  className="search-btn search-bar-btn"
                  onClick={handleSearch}
                  style={{ background: ACCENT, color: '#fff', border: 'none', borderRadius: 50, padding: '0 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, fontFamily: 'inherit', boxShadow: '0 8px 18px -6px rgba(30,58,92,0.55)' }}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="7" stroke="#fff" strokeWidth="2.2" />
                    <path d="M20 20l-3.2-3.2" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                  Search
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* ===== SEARCH RESULTS ===== */}
        {searched && (
          <section style={{ maxWidth: 1240, margin: '0 auto', padding: '26px clamp(16px,4vw,40px) 0', animation: 'bvfade .55s cubic-bezier(.4,0,.2,1) .12s both' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 400, fontSize: 30, margin: '0 0 4px', color: '#15243B' }}>
                  {results.length} homes {INTENT_PHRASE[intent]}
                </h2>
                <div style={{ fontSize: 14, color: '#7A8090' }}>Aftab Nagar, {CITY} · sorted by relevance</div>
              </div>
              <button
                onClick={clearSearch}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#fff', border: '1px solid #D3D9E0', borderRadius: 999, padding: '9px 17px', fontSize: 13.5, fontWeight: 600, color: '#41495A', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M18 6L6 18" stroke="#6A7180" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Clear search
              </button>
            </div>
            <div className="g3">
              {results.slice(0, 6).map(c => (
                <ListingCard
                  key={c.id}
                  listing={c}
                  saved={!!saved[c.id]}
                  onSave={e => { e.preventDefault(); toggleSave(c.id); }}
                />
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 34, paddingBottom: 60 }}>
              <Link
                href={`/search?intent=${intent}`}
                style={{ background: 'transparent', border: '1px solid #CCD3DB', borderRadius: 999, padding: '12px 26px', fontSize: 14, fontWeight: 600, color: '#15243B', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-block', textDecoration: 'none' }}
              >
                Open full results with filters &amp; map
              </Link>
            </div>
          </section>
        )}

        {/* ===== FEATURED + HOW IT WORKS ===== */}
        {!searched && (
          <>
            <section className="!pt-6 sm:!pt-10" style={{ maxWidth: 1240, margin: '0 auto', padding: '40px clamp(16px,4vw,40px) 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 24 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Handpicked this week</div>
                  <h2 className="font-sans font-normal m-0 text-accent-dark text-[clamp(24px,6vw,38px)]">Featured homes for rent</h2>
                </div>
                <Link
                  href="/search?intent=rent"
                  className="featured-cta"
                  style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, whiteSpace: 'nowrap', background: '#fff', border: `1.5px solid ${ACCENT}`, borderRadius: 999, padding: '11px 20px', fontSize: 14, fontWeight: 700, color: ACCENT, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', transition: 'background .18s ease, color .18s ease' }}
                >
                  View all
                  <span className="hidden sm:inline">&nbsp;listings</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>
              <div className="g3">
                {featured.map(c => (
                  <ListingCard key={c.id} listing={c} saved={!!saved[c.id]} onSave={e => { e.preventDefault(); toggleSave(c.id); }} />
                ))}
              </div>
            </section>

            <section style={{ maxWidth: 1240, margin: '0 auto', padding: '56px clamp(16px,4vw,40px)' }}>
              <div className="relative overflow-hidden rounded-[28px] bg-accent-dark p-7 text-white sm:p-[52px]">
                <div style={{ position: 'absolute', right: -40, top: -40, width: 280, height: 280, borderRadius: '50%', background: 'rgba(30,58,92,0.16)' }} />
                <div style={{ position: 'relative' }}>
                  <h2 className="font-sans font-normal m-0 mb-2 text-[clamp(26px,5.5vw,36px)]">Renting, the way it should be</h2>
                  <p style={{ fontSize: 16, color: '#AEB6C6', margin: '0 0 38px', maxWidth: 520 }}>
                    Three calm steps from searching to your front door — with verification and on-platform chat at every stage.
                  </p>
                  <div className="g3" style={{ gap: 28 }}>
                    {[
                      { n: '1', title: 'Browse verified listings', body: 'Real photos, honest prices and owner-checked documents. Filter by block, budget and amenities.' },
                      { n: '2', title: 'Chat & book a visit',      body: 'Message owners on-platform and propose a visit time. They accept or suggest a new slot — no phone tag.' },
                      { n: '3', title: 'Move in with confidence',  body: 'See the place, agree the terms, and leave a review. Two-way ratings keep the whole community honest.' },
                    ].map(step => (
                      <div key={step.n}>
                        <div style={{ width: 46, height: 46, borderRadius: 13, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, color: ACCENT }}>{step.n}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 7 }}>{step.title}</div>
                        <div style={{ fontSize: 14.5, color: '#AEB6C6', lineHeight: 1.6 }}>{step.body}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
