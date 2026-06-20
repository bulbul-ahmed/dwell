'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import type { Listing } from '@/types';
import { useDwellStore } from '@/lib/store';
import ListingCard from '@/components/ListingCard';
import SearchMap, { type MapBounds } from '@/components/SearchMap';
import QuickView from '@/components/QuickView';
import { fmtPrice } from '@/data/listings';
import { toLatLng } from '@/lib/mapUtils';
import type { Intent, BedFilter, SortOption } from '@/types';

const CITY = 'Dhaka';

const INTENT_LABEL: Record<Intent, string> = {
  rent: 'Homes for rent',
  buy: 'Homes for sale',
  office: 'Office spaces',
  sublet: 'Sublets',
  room: 'Rooms',
  student: 'Student housing',
};

const INTENTS: { id: Intent; label: string }[] = [
  { id: 'rent',    label: 'Rent'    },
  { id: 'buy',     label: 'Buy'     },
  { id: 'office',  label: 'Office'  },
  { id: 'sublet',  label: 'Sublet'  },
  { id: 'room',    label: 'Room'    },
  { id: 'student', label: 'Student' },
];

const BED_OPTS: { label: string; v: BedFilter }[] = [
  { label: 'Any', v: 'any' },
  { label: '1', v: '1' },
  { label: '2', v: '2' },
  { label: '3', v: '3' },
  { label: '4+', v: '4' },
];

const SORT_OPTS: { v: SortOption; t: string }[] = [
  { v: 'relevance', t: 'Most relevant' },
  { v: 'low', t: 'Price: Low to High' },
  { v: 'high', t: 'Price: High to Low' },
  { v: 'new', t: 'Newest first' },
];

const FURNISHING_OPTS = ['Unfurnished', 'Semi-furnished', 'Furnished'] as const;
const AMENITY_OPTS = ['Generator backup', 'Parking', 'Lift', 'Gas line'] as const;

const FIELD_LABEL = 'text-[12.5px] font-bold uppercase tracking-[0.6px] text-[#8B93A1] mb-[11px]';

export default function SearchClient() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const rawIntent = params.get('intent') as Intent | null;
  const rawSel = params.get('sel');

  const [intent, setIntent] = useState<Intent>(rawIntent && ['rent','buy','office','sublet','room','student'].includes(rawIntent) ? rawIntent : 'rent');
  const [beds, setBeds] = useState<BedFilter>('any');
  const [sort, setSort] = useState<SortOption>('relevance');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [furnishing, setFurnishing] = useState<Set<string>>(new Set());

  // mobile UI state
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');

  // map ↔ list selection sync
  const [activeId, setActiveId] = useState<number | null>(rawSel ? Number(rawSel) : null);  // click-selected
  const [hoverId, setHoverId] = useState<number | null>(null);    // transient hover
  const [quickViewId, setQuickViewId] = useState<number | null>(null); // desktop slide-over (C)
  const cardRefs = useRef<Record<number, HTMLAnchorElement | null>>({});

  // viewport: drives desktop popover/slide-over vs mobile bottom-sheet
  const [isWide, setIsWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1280px)');
    const apply = () => setIsWide(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // "Search this area" (F)
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [areaBounds, setAreaBounds] = useState<MapBounds | null>(null); // applied filter
  const [areaMoved, setAreaMoved] = useState(false);                    // map panned since last apply

  // selected listing drives the click-through behaviour
  const openListing = (id: number) => {
    setActiveId(id);
    if (isWide) setQuickViewId(id);
  };

  const saved = useDwellStore(s => s.saved);
  const toggleSave = useDwellStore(s => s.toggleSave);

  const [allListings, setAllListings] = useState<Listing[]>([]);

  // re-sync if URL param changes (e.g. nav click)
  useEffect(() => {
    if (rawIntent && ['rent','buy','office','sublet','room','student'].includes(rawIntent)) {
      setIntent(rawIntent as Intent);
    }
  }, [rawIntent]);

  // fetch from API when core filters change
  useEffect(() => {
    const params = new URLSearchParams({ cat: intent, sort });
    if (beds !== 'any') params.set('beds', beds);
    if (verifiedOnly) params.set('verified', 'true');
    fetch(`/api/listings?${params}`)
      .then(r => r.json())
      .then(({ listings }: { listings: Listing[] }) => setAllListings(listings))
      .catch(() => {});
  }, [intent, beds, sort, verifiedOnly]);

  // lock body scroll while the mobile filter drawer is open
  useEffect(() => {
    document.body.style.overflow = filtersOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [filtersOpen]);

  // scroll the click-selected card into view (map pin → list)
  useEffect(() => {
    if (activeId == null) return;
    cardRefs.current[activeId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activeId]);

  // persist selection in the URL so the back button restores it (D)
  useEffect(() => {
    const next = new URLSearchParams(Array.from(params.entries()));
    if (activeId != null) next.set('sel', String(activeId));
    else next.delete('sel');
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // react to back/forward changing ?sel=
  useEffect(() => {
    setActiveId(rawSel ? Number(rawSel) : null);
  }, [rawSel]);

  // furnishing filter is client-side (not in API)
  const furnishingFiltered = furnishing.size > 0
    ? allListings.filter(l => furnishing.has(l.furnishing))
    : allListings;

  // "Search this area" — constrain results to the applied map bounds (F)
  const inBounds = (l: Listing, b: MapBounds) => {
    const p = toLatLng(l.mapX, l.mapY);
    return !!p && p.lat <= b.north && p.lat >= b.south && p.lng <= b.east && p.lng >= b.west;
  };
  const filtered = areaBounds
    ? furnishingFiltered.filter(l => inBounds(l, areaBounds))
    : furnishingFiltered;

  // detect whether the map has been panned away from the applied area
  useEffect(() => {
    if (!mapBounds) return;
    if (!areaBounds) { setAreaMoved(true); return; }
    const eps = 1e-4;
    const moved = (['north', 'south', 'east', 'west'] as const)
      .some(k => Math.abs(mapBounds[k] - areaBounds[k]) > eps);
    setAreaMoved(moved);
  }, [mapBounds, areaBounds]);

  const applyArea = () => { if (mapBounds) { setAreaBounds(mapBounds); setAreaMoved(false); } };
  const clearArea = () => { setAreaBounds(null); setAreaMoved(true); };

  // clear a stale selection if it's no longer in the result set
  // (only once listings have loaded, so a deep-linked ?sel= survives the initial fetch)
  useEffect(() => {
    if (allListings.length === 0) return;
    if (activeId != null && !filtered.some(l => l.id === activeId)) setActiveId(null);
    if (quickViewId != null && !filtered.some(l => l.id === quickViewId)) setQuickViewId(null);
  }, [filtered, activeId, quickViewId, allListings.length]);

  const quickViewListing = quickViewId != null ? filtered.find(l => l.id === quickViewId) ?? null : null;
  const activeListing = activeId != null ? filtered.find(l => l.id === activeId) ?? null : null;

  const toggleFurnishing = (f: string) => {
    setFurnishing(prev => {
      const next = new Set(prev);
      next.has(f) ? next.delete(f) : next.add(f);
      return next;
    });
  };

  const activeFilterCount =
    (beds !== 'any' ? 1 : 0) + (verifiedOnly ? 1 : 0) + furnishing.size;

  // ── Shared filter body (desktop rail + mobile drawer) ──────────────────────
  const FilterBody = (
    <>
      {/* Looking to */}
      <div className="mb-[22px]">
        <div className={FIELD_LABEL}>Looking to</div>
        <div className="flex flex-wrap gap-[7px]">
          {INTENTS.map(it => {
            const active = intent === it.id;
            return (
              <button
                key={it.id}
                onClick={() => setIntent(it.id)}
                className={`rounded-full px-[14px] py-[7px] text-[13px] font-semibold border transition-colors ${
                  active
                    ? 'border-accent bg-[#EEF3F8] text-accent'
                    : 'border-border bg-[#F9FAFC] text-[#6A7180]'
                }`}
              >
                {it.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bedrooms */}
      <div className="mb-[22px]">
        <div className={FIELD_LABEL}>Bedrooms</div>
        <div className="flex gap-[7px]">
          {BED_OPTS.map(b => {
            const active = beds === b.v;
            return (
              <button
                key={b.v}
                onClick={() => setBeds(b.v)}
                className={`flex-1 rounded-[10px] py-[9px] text-[13px] font-semibold border transition-colors ${
                  active
                    ? 'border-accent bg-[#EEF3F8] text-accent'
                    : 'border-[#DBE0E6] bg-white text-accent-dark'
                }`}
              >
                {b.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Budget */}
      <div className="mb-[22px]">
        <div className={FIELD_LABEL}>Monthly budget</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-[10px] border border-[#DBE0E6] px-[11px] py-[9px] text-[13px] text-[#5A6172]">৳ Min</div>
          <span className="text-[#C5CCD5]">–</span>
          <div className="flex-1 rounded-[10px] border border-[#DBE0E6] px-[11px] py-[9px] text-[13px] text-[#5A6172]">৳ Max</div>
        </div>
      </div>

      {/* Furnishing */}
      <div className="mb-[22px]">
        <div className={FIELD_LABEL}>Furnishing</div>
        {FURNISHING_OPTS.map((f, i) => {
          const checked = furnishing.has(f);
          return (
            <label
              key={f}
              onClick={() => toggleFurnishing(f)}
              className={`flex items-center gap-[9px] text-[13.5px] text-[#41495A] cursor-pointer ${i < 2 ? 'mb-2' : ''}`}
            >
              <span className={`w-4 h-4 rounded-[5px] border-[1.6px] inline-flex items-center justify-center shrink-0 ${checked ? 'border-accent bg-accent' : 'border-[#C5CCD5] bg-white'}`}>
                {checked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </span>
              {f}
            </label>
          );
        })}
      </div>

      {/* Amenities */}
      <div className="mb-[22px]">
        <div className={FIELD_LABEL}>Amenities</div>
        {AMENITY_OPTS.map((a, i) => (
          <label key={a} className={`flex items-center gap-[9px] text-[13.5px] text-[#41495A] cursor-pointer ${i < 3 ? 'mb-2' : ''}`}>
            <span className="w-4 h-4 rounded-[5px] border-[1.6px] border-[#C5CCD5] inline-block shrink-0" />
            {a}
          </label>
        ))}
      </div>

      {/* Verified toggle */}
      <div
        onClick={() => setVerifiedOnly(v => !v)}
        className="flex items-center justify-between pt-[18px] border-t border-[#EDF0F4] cursor-pointer"
      >
        <span className="text-[13.5px] font-semibold text-accent-dark">Verified only</span>
        <span className={`relative inline-block w-10 h-[23px] rounded-full shrink-0 transition-colors ${verifiedOnly ? 'bg-accent' : 'bg-[#D1D9E0]'}`}>
          <span className={`absolute top-[2.5px] w-[18px] h-[18px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-[left] ${verifiedOnly ? 'left-[19px]' : 'left-[2.5px]'}`} />
        </span>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-white font-sans">
      <main className="mx-auto max-w-[1320px] px-4 pb-24 pt-[22px] sm:px-7 lg:px-10 lg:pb-14">

        {/* ===== TOP BAR ===== */}
        <div className="mb-[22px] flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="m-0 mb-1 font-sans text-[22px] font-normal text-accent-dark sm:text-[30px]">
              {INTENT_LABEL[intent]} in Aftab Nagar
            </h1>
            <div className="text-sm text-[#7A8090]">{filtered.length} homes · {CITY}</div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <span className="hidden text-sm font-medium text-[#41495A] sm:inline">Sort</span>
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortOption)}
              className="cursor-pointer rounded-xl border border-[#D3D9E0] bg-white px-[14px] py-[9px] font-sans text-sm font-semibold text-accent-dark"
            >
              {SORT_OPTS.map(o => <option key={o.v} value={o.v}>{o.t}</option>)}
            </select>
          </div>
        </div>

        {/* ===== RESPONSIVE LAYOUT =====
            mobile: single column (list OR map via toggle)
            lg:     filter rail + results
            xl:     filter rail + results + map  */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[248px_1fr] xl:grid-cols-[248px_1fr_0.82fr]">

          {/* ===== FILTER RAIL (desktop) ===== */}
          <aside className="sticky top-[88px] hidden rounded-[18px] border border-border bg-white p-[22px] lg:block">
            <div className="mb-[18px] text-[15px] font-bold text-accent-dark">Filters</div>
            {FilterBody}
          </aside>

          {/* ===== RESULTS GRID ===== */}
          <div className={`${mobileView === 'map' ? 'hidden' : 'grid'} grid-cols-1 content-start gap-[18px] sm:grid-cols-2 lg:grid xl:grid-cols-2`}>
            {filtered.length === 0 ? (
              <div className="col-span-full rounded-[18px] border border-dashed border-[#D3D9E0] px-6 py-12 text-center text-sm text-[#8B93A1]">
                No listings match your filters.
              </div>
            ) : (
              filtered.map(c => (
                <ListingCard
                  key={c.id}
                  ref={el => { cardRefs.current[c.id] = el; }}
                  listing={c}
                  saved={!!saved[c.id]}
                  onSave={e => { e.preventDefault(); toggleSave(c.id); }}
                  compact
                  highlighted={activeId === c.id || hoverId === c.id}
                  onMouseEnter={() => setHoverId(c.id)}
                  onMouseLeave={() => setHoverId(null)}
                  onClick={e => {
                    // desktop: open slide-over + fly map; mobile: let the Link navigate
                    if (isWide) { e.preventDefault(); openListing(c.id); }
                    else setActiveId(c.id);
                  }}
                />
              ))
            )}
          </div>

          {/* ===== MAP =====
              mobile: full-height when "map" view is picked
              xl:     sticky side panel  */}
          <div className={`${mobileView === 'map' ? 'block' : 'hidden'} relative h-[calc(100vh-180px)] min-h-[420px] overflow-hidden rounded-[18px] border border-[#DDE2E8] xl:sticky xl:top-[88px] xl:block xl:h-[calc(100vh-110px)] xl:min-h-[520px]`}>
            <SearchMap
              listings={filtered}
              activeId={activeId}
              hoverId={hoverId}
              onActivate={setActiveId}
              onHover={setHoverId}
              enablePopover={isWide}
              onBoundsChange={setMapBounds}
            />

            {/* Search-this-area / clear-area controls (F) */}
            <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center gap-2">
              {areaMoved && (
                <button
                  onClick={applyArea}
                  className="pointer-events-auto flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-[13px] font-bold text-white shadow-[0_8px_20px_-6px_rgba(21,36,59,0.6)]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                  Search this area
                </button>
              )}
              {areaBounds && !areaMoved && (
                <button
                  onClick={clearArea}
                  className="pointer-events-auto flex items-center gap-2 rounded-full border border-[#D3D9E0] bg-white px-4 py-2 text-[13px] font-semibold text-accent-dark shadow-[0_8px_20px_-8px_rgba(21,36,59,0.4)]"
                >
                  Clear area filter
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ===== MOBILE BOTTOM TOOLBAR (filters + list/map) ===== */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-border bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <button
          onClick={() => setFiltersOpen(true)}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[#D3D9E0] bg-white py-3 text-sm font-semibold text-accent-dark"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-xs font-bold text-white">{activeFilterCount}</span>
          )}
        </button>
        <div className="flex rounded-full border border-[#D3D9E0] bg-white p-1">
          {(['list', 'map'] as const).map(v => (
            <button
              key={v}
              onClick={() => setMobileView(v)}
              className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition-colors ${mobileView === v ? 'bg-accent text-white' : 'text-[#6A7180]'}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* ===== MOBILE FILTER DRAWER ===== */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-[22px] bg-white p-5 pb-8 shadow-[0_-12px_40px_-12px_rgba(21,36,59,0.3)] animate-bvpop">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-base font-bold text-accent-dark">Filters</div>
              <button onClick={() => setFiltersOpen(false)} aria-label="Close filters" className="grid h-9 w-9 place-items-center rounded-full border border-[#D3D9E0] text-[#6A7180]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
            </div>
            {FilterBody}
            <button
              onClick={() => setFiltersOpen(false)}
              className="mt-2 w-full rounded-full bg-accent py-3.5 text-sm font-bold text-white"
            >
              Show {filtered.length} homes
            </button>
          </div>
        </div>
      )}

      {/* ===== DESKTOP SLIDE-OVER QUICK VIEW (C) ===== */}
      {quickViewListing && (
        <QuickView
          listing={quickViewListing}
          saved={!!saved[quickViewListing.id]}
          onSave={() => toggleSave(quickViewListing.id)}
          onClose={() => setQuickViewId(null)}
        />
      )}

      {/* ===== MOBILE BOTTOM-SHEET PREVIEW (B) ===== */}
      {!isWide && activeListing && (() => {
        const idx = filtered.findIndex(l => l.id === activeListing.id);
        const go = (d: number) => {
          const n = filtered[(idx + d + filtered.length) % filtered.length];
          if (n) setActiveId(n.id);
        };
        return (
          <div className="fixed inset-x-0 bottom-[76px] z-40 px-3 lg:hidden">
            <div
              className="relative mx-auto max-w-[460px] overflow-hidden rounded-[18px] bg-white shadow-[0_18px_50px_-12px_rgba(21,36,59,0.5)] animate-bvpop"
              onTouchStart={e => { (e.currentTarget as HTMLDivElement).dataset.x = String(e.touches[0].clientX); }}
              onTouchEnd={e => {
                const sx = Number((e.currentTarget as HTMLDivElement).dataset.x || 0);
                const dx = e.changedTouches[0].clientX - sx;
                if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
              }}
            >
              <a href={`/listings/${activeListing.id}`} className="flex no-underline">
                <div
                  className="h-[104px] w-[124px] shrink-0 bg-cover bg-center"
                  style={{ backgroundImage: `url('${activeListing.coverUrl}')`, backgroundColor: '#DDD3C5' }}
                />
                <div className="min-w-0 flex-1 p-3">
                  <div className="truncate text-[14.5px] font-bold text-accent-dark">{activeListing.title}</div>
                  <div className="mb-1.5 truncate text-[12px] text-[#7A8090]">{activeListing.area}</div>
                  <div className="mb-1.5 flex items-center gap-2 text-[12px] font-medium text-[#5A6172]">
                    <span>{activeListing.beds} {activeListing.beds > 1 ? 'Beds' : 'Bed'}</span><span className="text-[#CCD3DB]">·</span>
                    <span>{activeListing.baths} {activeListing.baths > 1 ? 'Baths' : 'Bath'}</span><span className="text-[#CCD3DB]">·</span>
                    <span>{activeListing.size} sqft</span>
                  </div>
                  <div className="text-[17px] font-bold text-accent-dark" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{fmtPrice(activeListing)}</div>
                </div>
              </a>
              <button
                onClick={() => setActiveId(null)}
                aria-label="Close preview"
                className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/92 shadow"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="#41495A" strokeWidth="2.4" strokeLinecap="round" /></svg>
              </button>
              {filtered.length > 1 && (
                <>
                  <button onClick={() => go(-1)} aria-label="Previous" className="absolute left-1.5 top-[44px] grid h-8 w-8 place-items-center rounded-full bg-white/92 shadow">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="#15243B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                  <button onClick={() => go(1)} aria-label="Next" className="absolute right-1.5 top-[44px] grid h-8 w-8 place-items-center rounded-full bg-white/92 shadow" style={{ right: 6 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="#15243B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
