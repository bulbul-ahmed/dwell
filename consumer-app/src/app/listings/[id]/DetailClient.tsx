'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { fmtPrice, bdGroup } from '@/data/listings';
import { useDwellStore } from '@/lib/store';
import ListingCard from '@/components/ListingCard';
import Footer from '@/components/Footer';
import HeartIcon from '@/components/HeartIcon';
import DetailMap from '@/components/DetailMap';
import ChatDrawer from '@/components/ChatDrawer';

const ACCENT = '#1E3A5C';

// Small muted icons for the facts band (Bedrooms / Bathrooms / Size / Floor / Move-in).
const FACT_ICON_SRC: Record<string, string> = {
  Bedrooms: '/icons/bed.svg', Bathrooms: '/icons/bath.svg', Size: '/icons/area-sqft.svg',
};
function FactIcon({ label }: { label: string }) {
  const src = FACT_ICON_SRC[label];
  if (src) return <img src={src} alt="" width={14} height={14} style={{ flexShrink: 0, opacity: 0.6 }} />;
  const p = { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none' as const, style: { flexShrink: 0 } };
  if (label === 'Floor') return (
    <svg {...p}><path d="M4 8l8-4 8 4-8 4-8-4zM4 12l8 4 8-4M4 16l8 4 8-4" stroke="#9AA2AF" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
  );
  // Move-in — calendar
  return (
    <svg {...p}><rect x="3.5" y="5" width="17" height="16" rx="2" stroke="#9AA2AF" strokeWidth="1.7" /><path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" stroke="#9AA2AF" strokeWidth="1.7" strokeLinecap="round" /></svg>
  );
}

// Fallback icons for legacy labels not yet in the admin-managed amenities table.
const AMEN_ICONS_FALLBACK: Record<string, string> = {
  'lift': '🛗', '2 lifts': '🛗', 'generator backup': '⚡', 'parking': '🅿️', '2 parking': '🅿️', '3 parking': '🅿️',
  'gas line': '🔥', 'security': '🔒', 'cctv': '📷', 'wifi included': '📶', 'wifi': '📶',
  'rooftop access': '🌇', 'rooftop garden': '🌿', 'private rooftop': '🌿', 'gym': '💪', 'pool': '🏊',
  'water reserve': '💧', 'loan eligible': '🏦', 'meals included': '🍽️', 'meals optional': '🍽️',
  'study desk': '📚', 'furnished': '🛋️', 'ac': '❄️', 'attached bath': '🚿', 'shared kitchen': '🍳',
  'single room': '🛏️',
};

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_ABBR = ['S','M','T','W','T','F','S'];
const DAY_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const TIME_SLOTS = [
  '9:00 AM – 11:00 AM',
  '11:00 AM – 1:00 PM',
  '2:00 PM – 4:00 PM',
  '4:00 PM – 6:00 PM',
];

const REPORT_REASONS = [
  'Fake or fraudulent',
  'Wrong or misleading info',
  'Already rented or sold',
  'Duplicate listing',
  'Offensive content',
  'Spam',
  'Other',
];

export default function DetailClient() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const saved = useDwellStore(s => s.saved);
  const toggleSave = useDwellStore(s => s.toggleSave);

  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [listing, setListing] = useState<import('@/types').Listing | null>(null);
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
  const [similar, setSimilar] = useState<import('@/types').Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const [amenIcons, setAmenIcons] = useState<Record<string, string>>({});

  const [gallery, setGallery] = useState(0);
  const mediaCountRef = useRef(0);
  const [photoTab, setPhotoTab] = useState('All');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // Share / Report / Views
  const [viewCount, setViewCount] = useState<number | null>(null);
  const viewedRef = useRef<string | null>(null);
  const [shareMsg, setShareMsg] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<string | null>(null);
  const [reportDetails, setReportDetails] = useState('');
  const [reportBusy, setReportBusy] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [payTooltip, setPayTooltip] = useState<string | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [pickedDate, setPickedDate] = useState<Date | null>(null);
  const [pickedTime, setPickedTime] = useState<string | null>(null);
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [note, setNote] = useState('');

  useEffect(() => {
    fetch('/api/users/me', { method: 'GET' })
      .then(async r => {
        if (r.status === 401) { setIsLoggedIn(false); setCurrentUserId(null); return; }
        const d = await r.json();
        setIsLoggedIn(true);
        setCurrentUserId(d?.user?.id ?? null);
      })
      .catch(() => { setIsLoggedIn(false); setCurrentUserId(null); });
  }, []);

  useEffect(() => {
    fetch('/api/amenities')
      .then(r => r.json())
      .then((rows: { label: string; icon: string }[]) => {
        const map: Record<string, string> = {};
        for (const r of rows) if (r.icon) map[r.label.toLowerCase()] = r.icon;
        setAmenIcons(map);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Navigating between listings (e.g. "Similar homes") keeps this same dynamic
    // route mounted, so reset scroll to the top of the new listing.
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, left: 0 });
    setLoading(true);
    fetch(`/api/listings/${id}`)
      .then(r => r.json())
      .then(({ listing: l, edit }: { listing: import('@/types').Listing; edit?: { mapLat: number | null; mapLng: number | null } }) => {
        setListing(l);
        setCoords({ lat: edit?.mapLat ?? null, lng: edit?.mapLng ?? null });
        setGallery(0);
        return fetch(`/api/listings?cat=${l.cat}&limit=10`);
      })
      .then(r => r.json())
      .then(({ listings: ls }: { listings: import('@/types').Listing[] }) => {
        setSimilar(ls.filter(l => l.id !== Number(id)).slice(0, 9));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  // Count a view once per listing load
  useEffect(() => {
    if (!id || viewedRef.current === id) return;
    viewedRef.current = id;
    fetch(`/api/listings/${id}/view`, { method: 'POST' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d?.views != null) setViewCount(d.views); })
      .catch(() => {});
  }, [id]);

  // Lightbox keyboard navigation (arrow keys + Escape)
  useEffect(() => {
    if (!lightboxOpen) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setGallery(g => Math.min(g + 1, mediaCountRef.current - 1));
      if (e.key === 'ArrowLeft')  setGallery(g => Math.max(g - 1, 0));
      if (e.key === 'Escape')     setLightboxOpen(false);
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [lightboxOpen]);

  // Deep-link from the provider page: /listings/<id>?chat=1 opens the message drawer
  useEffect(() => {
    if (!listing) return;
    if (new URLSearchParams(window.location.search).get('chat') !== '1') return;
    if (isLoggedIn === false) { router.push(`/auth?next=/listings/${id}`); return; }
    if (isLoggedIn) setChatOpen(true);
  }, [listing, isLoggedIn, id, router]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B93A1', fontSize: 14 }}>
        Loading…
      </div>
    );
  }

  if (!listing) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B93A1', fontSize: 14 }}>
        Listing not found.
      </div>
    );
  }

  const sel = listing;
  const isSaved = !!saved[sel.id];
  const priceLabel = fmtPrice(sel);
  const isOwnListing = currentUserId !== null && sel.ownerUserId === currentUserId;
  const providerUrl = `/dashboard/listings/${sel.id}`;

  // Category tab logic — only shown when ≥2 distinct labeled categories exist
  const shotCats = sel.shotCats ?? [];
  const uniqueCats = [...new Set(shotCats.filter(c => c && c !== ''))];
  const showTabs = uniqueCats.length >= 2;
  const allTabs = showTabs ? ['All', ...uniqueCats] : [];

  const filteredShots = !showTabs || photoTab === 'All'
    ? sel.shotUrls.map((url, i) => ({ url, origIdx: i }))
    : sel.shotUrls
        .map((url, i) => ({ url, origIdx: i }))
        .filter((_, i) => (shotCats[i] ?? '') === photoTab);

  // Combined gallery media: photos first, then videos.
  const videoUrls = sel.videos ?? [];
  const mediaItems: { type: 'photo' | 'video'; url: string }[] = [
    ...filteredShots.map(s => ({ type: 'photo' as const, url: s.url })),
    ...videoUrls.map(u => ({ type: 'video' as const, url: u })),
  ];
  const clampedGallery = Math.min(gallery, Math.max(0, mediaItems.length - 1));
  const heroItem = mediaItems[clampedGallery] ?? { type: 'photo' as const, url: sel.coverUrl };
  const detailMedia = mediaItems.map((m, i) => ({ ...m, ring: clampedGallery === i ? ACCENT : 'transparent', idx: i }));
  const photoCount = filteredShots.length;
  const views = viewCount ?? sel.views ?? 0;
  mediaCountRef.current = mediaItems.length;

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: sel.title, text: `${sel.title} — ${sel.area}`, url });
        return;
      }
    } catch { return; } // user dismissed the native sheet
    try {
      await navigator.clipboard.writeText(url);
      setShareMsg('Link copied');
    } catch {
      setShareMsg('Copy failed');
    }
    setTimeout(() => setShareMsg(''), 2000);
  };

  const openReport = () => {
    if (!isLoggedIn) { router.push(`/auth?next=/listings/${id}`); return; }
    setReportReason(null);
    setReportDetails('');
    setReportSent(false);
    setReportOpen(true);
  };

  const submitReport = () => {
    if (!reportReason || reportBusy) return;
    setReportBusy(true);
    fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId: sel.id, reason: reportReason, details: reportDetails }),
    })
      .then(r => { setReportBusy(false); if (r.ok) setReportSent(true); })
      .catch(() => setReportBusy(false));
  };

  const costRows = sel.sale
    ? [{ k: 'Sale price', v: priceLabel }]
    : [
        { k: 'Monthly rent', v: priceLabel },
        { k: 'Service charge', v: `৳${bdGroup(sel.service)}/mo` },
        { k: 'Advance', v: `${sel.adv} months` },
        { k: 'Total move-in', v: `৳${bdGroup(sel.price * sel.adv + sel.service)}` },
      ];

  const openBooking = () => {
    if (!isLoggedIn) { router.push(`/auth?next=/listings/${id}`); return; }
    const n = new Date();
    setBookingOpen(true);
    setBookingStep(1);
    setPickedDate(null);
    setPickedTime(null);
    setCalYear(n.getFullYear());
    setCalMonth(n.getMonth());
    setNote('');
  };
  const closeBooking = () => setBookingOpen(false);

  const bookingPrimaryLabel = bookingStep === 1 ? 'Next' : bookingStep === 2 ? 'Send request' : 'Done';
  const bookingPrimaryDisabled = bookingStep === 1 && (!pickedDate || !pickedTime);

  const handleBookingPrimary = () => {
    if (bookingStep === 1 && (!pickedDate || !pickedTime)) return;
    if (bookingStep === 2) {
      // persist booking before advancing to confirmation
      fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: sel.id,
          slot: slotLabel,
          visitDate: pickedDate
            ? `${pickedDate.getFullYear()}-${String(pickedDate.getMonth() + 1).padStart(2, '0')}-${String(pickedDate.getDate()).padStart(2, '0')}`
            : undefined,
          visitTime: pickedTime ?? undefined,
          note,
        }),
      }).catch(() => {});
      setBookingStep(3);
    } else if (bookingStep < 3) {
      setBookingStep(s => s + 1);
    } else {
      closeBooking();
    }
  };

  const slotLabel = pickedDate && pickedTime
    ? `${DAY_SHORT[pickedDate.getDay()]}, ${MONTH_NAMES[pickedDate.getMonth()]} ${pickedDate.getDate()} · ${pickedTime}`
    : '';
  const slotDay = pickedDate ? DAY_SHORT[pickedDate.getDay()].toUpperCase() : '';
  const slotDateNum = pickedDate ? String(pickedDate.getDate()) : '';

  const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
  const calDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const calFirstDay = new Date(calYear, calMonth, 1).getDay();
  const calCells = Array.from(
    { length: Math.ceil((calFirstDay + calDaysInMonth) / 7) * 7 },
    (_, i) => { const n = i - calFirstDay + 1; return n >= 1 && n <= calDaysInMonth ? n : null; }
  );
  const prevCalMonth = () => { if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); } else setCalMonth(m => m - 1); };
  const nextCalMonth = () => { if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); } else setCalMonth(m => m + 1); };

  const steps = [
    { n: '1', t: 'Pick a date' },
    { n: '2', t: 'Add a note' },
    { n: '3', t: 'Confirmed' },
  ].map((s, i) => {
    const done    = bookingStep > i + 1;
    const current = bookingStep === i + 1;
    return {
      ...s,
      done, current,
      circleBg: done ? '#2E7D55' : current ? ACCENT : '#F0F2F5',
      circleFg: done || current ? '#fff' : '#8B93A1',
    };
  });

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <main className="pg-det">

        {/* Back */}
        <Link href="/search" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 600, color: '#6A7180', cursor: 'pointer', marginBottom: 18, textDecoration: 'none' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="#6A7180" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to results
        </Link>

        {/* ===== 2-COL BODY (gallery now lives in the left column, beside the sticky card) ===== */}
        <div className="g-detail">

          {/* LEFT */}
          <div>

            {/* ===== GALLERY — hero left + 2×2 grid right ===== */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: mediaItems.length > 1 ? '3fr 2fr' : '1fr',
                gap: 6,
                borderRadius: 18,
                overflow: 'hidden',
                height: 360,
                marginBottom: 20,
                background: '#DDD3C5',
              }}
            >
              {/* Hero (left) */}
              <div
                style={{ position: 'relative', height: '100%', cursor: heroItem.type === 'video' ? 'default' : 'zoom-in', overflow: 'hidden' }}
                onClick={() => { if (heroItem.type === 'photo') { setGallery(0); setLightboxOpen(true); } }}
              >
                {heroItem.type === 'video' ? (
                  <video
                    key={heroItem.url}
                    src={heroItem.url}
                    controls
                    playsInline
                    onClick={e => e.stopPropagation()}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', backgroundImage: `url('${mediaItems[0]?.url ?? sel.coverUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                )}
              </div>

              {/* Right 2×2 grid */}
              {mediaItems.length > 1 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 6 }}>
                  {[1, 2, 3, 4].map(idx => {
                    const m = mediaItems[idx];
                    const isLast = idx === 4 || idx === mediaItems.length - 1 + (mediaItems.length < 5 ? 4 - mediaItems.length + 1 : 0);
                    const showOverlay = idx === 4 && mediaItems.length > 5;
                    if (!m) {
                      return <div key={idx} style={{ background: '#C8CAD0' }} />;
                    }
                    return (
                      <div
                        key={idx}
                        onClick={() => { setGallery(idx); setLightboxOpen(true); }}
                        style={{ position: 'relative', overflow: 'hidden', cursor: 'zoom-in' }}
                      >
                        {m.type === 'video' ? (
                          <>
                            <video src={m.url} muted preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.28)', color: '#fff', fontSize: 22 }}>▶</span>
                          </>
                        ) : (
                          <div style={{ width: '100%', height: '100%', backgroundImage: `url('${m.url}')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                        )}
                        {showOverlay && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(12,20,33,0.58)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 5 }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="#fff" strokeWidth="1.8"/><circle cx="8.5" cy="8.5" r="1.6" fill="#fff"/><path d="M21 15l-5-5L5 21" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#fff' }}>+{mediaItems.length - 4} more</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Category tabs — under the gallery, with the photo controls */}
            {showTabs && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                {allTabs.map(tab => {
                  const active = photoTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => { setPhotoTab(tab); setGallery(0); }}
                      style={{ padding: '6px 16px', borderRadius: 999, border: `1.5px solid ${active ? ACCENT : '#D3D9E0'}`, background: active ? ACCENT : '#fff', color: active ? '#fff' : '#51596A', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>
            )}

            {/* "View all N photos" link below grid */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
              {photoCount > 1 && (
                <button
                  onClick={() => { setGallery(0); setLightboxOpen(true); }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid #D3D9E0', borderRadius: 10, padding: '7px 14px', fontSize: 13, fontWeight: 700, color: '#41495A', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="#41495A" strokeWidth="1.8"/><circle cx="8.5" cy="8.5" r="1.6" fill="#41495A"/><path d="M21 15l-5-5L5 21" stroke="#41495A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  View all {photoCount} photos
                </button>
              )}
              {(sel.videos?.length ?? 0) > 0 && (
                <button
                  onClick={() => { setGallery(filteredShots.length); setLightboxOpen(true); }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F0EEF8', border: 'none', borderRadius: 10, padding: '7px 14px', fontSize: 13, fontWeight: 700, color: '#4A3880', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 3l14 9-14 9V3z" fill="#4A3880"/></svg>
                  Virtual tour · {sel.videos!.length} video{sel.videos!.length > 1 ? 's' : ''}
                </button>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              {sel.verified && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#EAF1ED', color: '#3C7A58', borderRadius: 999, padding: '5px 11px', fontSize: 12, fontWeight: 700 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="#3C7A58" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Verified listing
                </span>
              )}
              <span style={{ fontSize: 12.5, color: '#8B93A1', fontWeight: 600 }}>{sel.furnishing}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <h1 className="font-sans font-normal leading-[1.12] m-0 text-accent-dark text-[clamp(26px,6.5vw,36px)]">{sel.title}</h1>
              {sel.createdAt && (() => {
                const d = Math.floor((Date.now() - new Date(sel.createdAt).getTime()) / 86400000);
                if (d > 30) return null;
                const label = d <= 0 ? 'Listed today' : d === 1 ? 'Listed yesterday' : `Listed ${d} days ago`;
                return (
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: d <= 7 ? '#1E6B3A' : '#7A5A12', background: d <= 7 ? '#E8F5EE' : '#FEF3CD', borderRadius: 6, padding: '3px 9px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {d <= 7 ? '✦ New · ' : ''}{label}
                  </span>
                );
              })()}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14.5, color: '#6A7180', marginBottom: 24 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M12 21s7-5.6 7-11a7 7 0 10-14 0c0 5.4 7 11 7 11z" stroke="#A8AEB9" strokeWidth="1.8" />
                <circle cx="12" cy="10" r="2.4" stroke="#A8AEB9" strokeWidth="1.8" />
              </svg>
              {sel.area}
              {views >= 50 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginLeft: 4, color: '#8B93A1' }}>
                  <span style={{ color: '#D3D9E0' }}>·</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" stroke="#A8AEB9" strokeWidth="1.8" />
                    <circle cx="12" cy="12" r="3" stroke="#A8AEB9" strokeWidth="1.8" />
                  </svg>
                  {views.toLocaleString()} views
                </span>
              )}
              {(sel.savesCount ?? 0) > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginLeft: views >= 50 ? 0 : 4, color: '#8B93A1' }}>
                  <span style={{ color: '#D3D9E0' }}>·</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 21C12 21 3 14 3 8a5 5 0 0110 0 5 5 0 0110 0c0 6-9 13-11 13z" fill="#F0B8C0" stroke="#C5303A" strokeWidth="1.6"/></svg>
                  {sel.savesCount} {sel.savesCount === 1 ? 'person saved' : 'people saved this'}
                </span>
              )}
            </div>

            {/* Facts band */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-5" style={{ padding: 20, background: '#fff', border: '1px solid #E7EAEE', borderRadius: 16, marginBottom: 30 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#8B93A1', fontWeight: 600, marginBottom: 4 }}><FactIcon label="Bedrooms" />Bedrooms</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#15243B' }}>{sel.beds}</div>
              </div>
              <div style={{ borderLeft: '1px solid #EDF0F4', paddingLeft: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#8B93A1', fontWeight: 600, marginBottom: 4 }}><FactIcon label="Bathrooms" />Bathrooms</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#15243B' }}>{sel.baths}</div>
              </div>
              <div style={{ borderLeft: '1px solid #EDF0F4', paddingLeft: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#8B93A1', fontWeight: 600, marginBottom: 4 }}><FactIcon label="Size" />Size</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#15243B' }}>{sel.size} sqft</div>
              </div>
              <div style={{ borderLeft: '1px solid #EDF0F4', paddingLeft: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#8B93A1', fontWeight: 600, marginBottom: 4 }}><FactIcon label="Floor" />Floor</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#15243B' }}>{sel.floor}</div>
              </div>
              <div style={{ borderLeft: '1px solid #EDF0F4', paddingLeft: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#8B93A1', fontWeight: 600, marginBottom: 4 }}><FactIcon label="Move-in" />Move-in</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: (() => { const d = sel.availableFrom ? new Date(sel.availableFrom) : null; const past = !d || isNaN(d.getTime()) || d <= new Date(); return past ? '#1E6B3A' : '#7A5A12'; })() }}>
                  {(() => {
                    const d = sel.availableFrom ? new Date(sel.availableFrom) : null;
                    if (!d || isNaN(d.getTime())) return 'Now';
                    const today = new Date(); today.setHours(0, 0, 0, 0);
                    if (d <= today) return 'Now';
                    return d.toLocaleDateString('en', { day: 'numeric', month: 'short' });
                  })()}
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: 19, fontWeight: 700, margin: '0 0 12px', color: '#15243B' }}>About this home</h3>
            <p style={{ fontSize: 15.5, lineHeight: 1.7, color: '#51596A', margin: '0 0 32px' }}>{sel.desc}</p>

            {!!(sel.meta?.floorPlan) && (() => {
              const fp = sel.meta!.floorPlan as string;
              return (
                <div style={{ marginBottom: 32 }}>
                  <h3 style={{ fontSize: 19, fontWeight: 700, margin: '0 0 14px', color: '#15243B' }}>Floor plan</h3>
                  <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #E7EAEE', background: '#F8FAFC', textAlign: 'center', padding: 12 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={fp}
                      alt="Floor plan"
                      style={{ maxWidth: '100%', maxHeight: 420, objectFit: 'contain', display: 'block', margin: '0 auto', borderRadius: 8 }}
                    />
                  </div>
                  <a
                    href={fp}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 10, fontSize: 13, fontWeight: 600, color: ACCENT, textDecoration: 'none' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    View larger
                  </a>
                </div>
              );
            })()}

            <h3 style={{ fontSize: 19, fontWeight: 700, margin: '0 0 16px', color: '#15243B' }}>Amenities</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px 24px', marginBottom: 34 }}>
              {sel.amen.map(a => {
                const icon = amenIcons[a.toLowerCase()] ?? AMEN_ICONS_FALLBACK[a.toLowerCase()] ?? '✓';
                return (
                  <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 11, fontSize: 14.5, color: '#41495A' }}>
                    <span style={{ width: 32, height: 32, borderRadius: 9, background: '#EEF1F5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {/^(data:|https?:|\/)/.test(icon)
                        ? <img src={icon} alt="" style={{ width: '68%', height: '68%', objectFit: 'contain' }} />
                        : icon}
                    </span>
                    {a}
                  </div>
                );
              })}
            </div>

            <h3 style={{ fontSize: 19, fontWeight: 700, margin: '0 0 16px', color: '#15243B' }}>Location</h3>
            <DetailMap mapX={sel.mapX} mapY={sel.mapY} lat={coords.lat} lng={coords.lng} />
          </div>

          {/* RIGHT — Booking card + Owner */}
          <aside className="detail-sticky-aside">
            {/* Booking card */}
            <div style={{ background: '#fff', border: '1px solid #E7EAEE', borderRadius: 20, padding: 24, boxShadow: '0 1px 2px rgba(21,36,59,0.06), 0 12px 28px rgba(21,36,59,0.10), 0 28px 60px rgba(21,36,59,0.10)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 32, color: '#15243B', lineHeight: 1 }}>{priceLabel}</span>
                {sel.priceContext && (() => {
                  const { label, pctDiff } = sel.priceContext;
                  const isBelow = pctDiff <= -10, isAbove = pctDiff >= 10;
                  const color = isBelow ? '#1E6B3A' : isAbove ? '#9A2E35' : '#7A5A12';
                  const bg = isBelow ? '#E8F5EE' : isAbove ? '#FEF0F0' : '#FEF3CD';
                  const icon = isBelow ? '↓' : isAbove ? '↑' : '≈';
                  return (
                    <span style={{ fontSize: 11.5, fontWeight: 700, color, background: bg, borderRadius: 6, padding: '4px 9px' }}>
                      {icon} {label} {Math.abs(pctDiff) >= 5 ? `(${Math.abs(pctDiff)}%)` : ''}
                    </span>
                  );
                })()}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#8B93A1' }}>{sel.furnishing}</span>
                {(() => {
                  const d = sel.availableFrom ? new Date(sel.availableFrom) : null;
                  const today = new Date(); today.setHours(0, 0, 0, 0);
                  const past = !d || isNaN(d.getTime()) || d <= today;
                  const label = past ? 'Available now' : `Available ${d!.toLocaleDateString('en', { day: 'numeric', month: 'short' })}`;
                  return (
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: past ? '#1E6B3A' : '#7A5A12', background: past ? '#E8F5EE' : '#FEF3CD', borderRadius: 6, padding: '3px 8px' }}>
                      {label}
                    </span>
                  );
                })()}
              </div>
              <div style={{ background: '#F4F6F9', borderRadius: 13, padding: '15px 16px', marginBottom: 18, position: 'relative' }}>
                {costRows.map(r => {
                  const tooltipKey = r.k === 'Advance' ? 'advance' : r.k === 'Total move-in' ? 'movein' : null;
                  const tooltipText = tooltipKey === 'advance'
                    ? `Security deposit held by landlord. Returned at end of tenancy, minus any damages. Typically ${sel.adv} months' rent in Dhaka.`
                    : tooltipKey === 'movein'
                    ? `First month's rent + service charge + full advance deposit. This is your total upfront payment to move in.`
                    : null;
                  return (
                    <div key={r.k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', fontSize: 13.5 }}>
                      <span style={{ color: '#6A7180', display: 'flex', alignItems: 'center', gap: 5 }}>
                        {r.k}
                        {tooltipText && (
                          <span style={{ position: 'relative', display: 'inline-flex' }}>
                            <button
                              onClick={() => setPayTooltip(payTooltip === tooltipKey ? null : tooltipKey)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#A8AEB9', display: 'flex', lineHeight: 1 }}
                              aria-label={`More info about ${r.k}`}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9.5" stroke="#A8AEB9" strokeWidth="1.7"/><path d="M12 8v1M12 11v5" stroke="#A8AEB9" strokeWidth="1.7" strokeLinecap="round"/></svg>
                            </button>
                            {payTooltip === tooltipKey && (
                              <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 8, width: 220, background: '#15243B', color: '#fff', fontSize: 12, lineHeight: 1.55, borderRadius: 10, padding: '10px 13px', zIndex: 20, pointerEvents: 'none', boxShadow: '0 8px 24px rgba(21,36,59,0.35)' }}>
                                {tooltipText}
                                <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #15243B' }} />
                              </div>
                            )}
                          </span>
                        )}
                      </span>
                      <span style={{ color: '#15243B', fontWeight: 700 }}>{r.v}</span>
                    </div>
                  );
                })}
              </div>

              {isOwnListing ? (
                <div style={{ background: '#F4F8FB', border: '1px solid #D6E2EE', borderRadius: 14, padding: 16, marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 18 }}>👤</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#15243B' }}>You own this listing</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: '#5A6172', marginBottom: 12 }}>
                    This is how renters see your listing. Manage it from your dashboard.
                  </div>
                  <a
                    href={providerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'block', textAlign: 'center', width: '100%', background: ACCENT, color: '#fff', borderRadius: 12, padding: '13px 0', fontSize: 14, fontWeight: 700, textDecoration: 'none', marginBottom: 8 }}
                  >
                    Edit listing
                  </a>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a
                      href={'/dashboard/leads'}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ flex: 1, textAlign: 'center', background: '#fff', color: '#15243B', border: '1px solid #D3D9E0', borderRadius: 12, padding: '11px 0', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
                    >
                      View leads
                    </a>
                    <a
                      href={'/dashboard/analytics'}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ flex: 1, textAlign: 'center', background: '#fff', color: '#15243B', border: '1px solid #D3D9E0', borderRadius: 12, padding: '11px 0', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
                    >
                      Analytics
                    </a>
                  </div>
                  <button onClick={handleShare} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: '#6A7180', padding: 0, marginTop: 12 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <circle cx="18" cy="5" r="2.6" stroke="#6A7180" strokeWidth="1.8" />
                      <circle cx="6" cy="12" r="2.6" stroke="#6A7180" strokeWidth="1.8" />
                      <circle cx="18" cy="19" r="2.6" stroke="#6A7180" strokeWidth="1.8" />
                      <path d="M8.3 10.8l7.4-4.3M8.3 13.2l7.4 4.3" stroke="#6A7180" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    {shareMsg || 'Share listing'}
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={openBooking}
                    style={{ width: '100%', background: ACCENT, color: '#fff', border: 'none', borderRadius: 14, padding: 15, fontSize: 15.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 10px 22px -8px rgba(30,58,92,0.6)', marginBottom: 10 }}
                  >
                    Request a visit
                  </button>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="detail-cta-btn" onClick={() => { if (isLoggedIn) { setChatOpen(true); } else { router.push(`/auth?next=/listings/${id}`); } }} style={{ flex: 1, background: '#fff', color: '#15243B', border: '1px solid #D3D9E0', borderRadius: 14, padding: 13, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14 19C17.7712 19 19.6569 19 20.8284 17.8284C22 16.6569 22 14.7712 22 11C22 7.22876 22 5.34315 20.8284 4.17157C19.6569 3 17.7712 3 14 3H10C6.22876 3 4.34315 3 3.17157 4.17157C2 5.34315 2 7.22876 2 11C2 14.7712 2 16.6569 3.17157 17.8284C3.82475 18.4816 4.69989 18.7706 6 18.8985" stroke="#15243B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14 19C12.7635 19 11.4022 19.4992 10.1586 20.145C8.16119 21.1821 7.16249 21.7007 6.67035 21.3703C6.1782 21.0398 6.27135 20.0151 6.45766 17.9657L6.5 17.5" stroke="#15243B" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      Chat
                    </button>
                    <button
                      className="detail-cta-btn"
                      onClick={e => { e.stopPropagation(); toggleSave(sel.id); }}
                      style={{ flex: 1, background: '#fff', color: '#15243B', border: '1px solid #D3D9E0', borderRadius: 14, padding: 13, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
                    >
                      <HeartIcon saved={isSaved} size={16} />Save
                    </button>
                  </div>

                  {/* Share + Report */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, marginTop: 14 }}>
                    <button onClick={handleShare} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: '#6A7180', padding: 0 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <circle cx="18" cy="5" r="2.6" stroke="#6A7180" strokeWidth="1.8" />
                        <circle cx="6" cy="12" r="2.6" stroke="#6A7180" strokeWidth="1.8" />
                        <circle cx="18" cy="19" r="2.6" stroke="#6A7180" strokeWidth="1.8" />
                        <path d="M8.3 10.8l7.4-4.3M8.3 13.2l7.4 4.3" stroke="#6A7180" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                      {shareMsg || 'Share'}
                    </button>
                    <span style={{ width: 1, height: 14, background: '#E1E5EA' }} />
                    <button onClick={openReport} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: '#6A7180', padding: 0 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <path d="M5 21V4.5a.5.5 0 01.5-.5H17l-2 4 2 4H5.5" stroke="#6A7180" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Report
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Owner card */}
            <Link
              href={`/providers/${sel.ownerId ?? 1}`}
              className="acct-link"
              style={{ background: '#fff', border: '1px solid #E7EAEE', borderRadius: 20, padding: 20, marginTop: 16, cursor: 'pointer', transition: 'background .25s, border-color .25s', display: 'block', textDecoration: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                {sel.owner.avatarUrl ? (
                  <img src={sel.owner.avatarUrl} alt={sel.owner.name} style={{ width: 48, height: 48, borderRadius: 13, objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: 13, background: '#15243B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, flexShrink: 0 }}>
                    {sel.owner.name.charAt(0)}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#15243B' }}>{sel.owner.name}</div>
                  <div style={{ fontSize: 12.5, color: '#8A8F9C' }}>
                    {sel.owner.type}
                    {(sel.owner.listingCount ?? 0) > 0 && <span> · {sel.owner.listingCount} listing{sel.owner.listingCount === 1 ? '' : 's'}</span>}
                    <span> · ★ {sel.owner.rating.toFixed(1)}</span>
                    <span style={{ color: ACCENT, fontWeight: 600 }}> · View profile</span>
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M9 6l6 6-6 6" stroke="#AEB8C6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, paddingTop: 14, borderTop: '1px solid #EDF0F4', fontSize: 12.5, color: '#6A7180' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="8.5" stroke="#A8AEB9" strokeWidth="1.7" />
                  <path d="M12 7.5V12l3 2" stroke="#A8AEB9" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
                Typically replies in {sel.owner.rt}
              </div>
            </Link>
          </aside>
        </div>

        {/* ===== SIMILAR HOMES ===== */}
        {similar.length > 0 && (
          <div style={{ marginTop: 56 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 400, fontSize: 28, margin: 0, color: '#15243B' }}>Similar homes nearby</h2>
              <Link
                href={`/search?cat=${sel.cat}&beds=${sel.beds}`}
                style={{ fontSize: 13.5, fontWeight: 700, color: ACCENT, textDecoration: 'none', whiteSpace: 'nowrap' }}
              >
                See all similar →
              </Link>
            </div>
            <div className="g3-22">
              {similar.map(c => (
                <ListingCard
                  key={c.id}
                  listing={c}
                  saved={!!saved[c.id]}
                  onSave={e => { e.preventDefault(); toggleSave(c.id); }}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <div className="detail-mobile-spacer" />
      <Footer />

      {/* ===== MOBILE BOTTOM PRICE BAR ===== */}
      {!isOwnListing && (
        <div className="detail-mobile-bar">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#15243B', whiteSpace: 'nowrap' }}>{priceLabel}</div>
            <div style={{ fontSize: 11.5, color: '#8B93A1' }}>{sel.sale ? 'Sale price' : `Move-in ৳${bdGroup(sel.price * sel.adv + sel.service)}`}</div>
          </div>
          <button
            onClick={openBooking}
            style={{ background: ACCENT, color: '#fff', border: 'none', borderRadius: 13, padding: '13px 22px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
          >
            {sel.sale ? 'Enquire' : 'Request a visit'}
          </button>
        </div>
      )}

      {/* ===== LIGHTBOX ===== */}
      {lightboxOpen && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setLightboxOpen(false); }}
          className="px-2 py-14 sm:px-[60px] sm:py-6"
          style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(12,20,33,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}
        >
          {/* Close */}
          <button
            onClick={() => setLightboxOpen(false)}
            aria-label="Close gallery"
            style={{ position: 'absolute', top: 20, right: 22, width: 42, height: 42, borderRadius: 999, border: 'none', background: 'rgba(255,255,255,0.14)', color: '#fff', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}
          >✕</button>

          {/* Counter */}
          <div style={{ position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600 }}>
            {clampedGallery + 1} / {mediaItems.length}
          </div>

          {/* Prev button */}
          {clampedGallery > 0 && (
            <button
              onClick={e => { e.stopPropagation(); setGallery(g => Math.max(g - 1, 0)); }}
              aria-label="Previous photo"
              className="left-2 sm:left-4"
              style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: 999, border: 'none', background: 'rgba(255,255,255,0.16)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          )}

          {/* Main image / video */}
          {heroItem.type === 'video' ? (
            <video key={heroItem.url} src={heroItem.url} controls autoPlay playsInline onClick={e => e.stopPropagation()} style={{ width: 'min(1040px, 94vw)', aspectRatio: '16/10', borderRadius: 16, background: '#000', objectFit: 'contain' }} />
          ) : (
            <div style={{ width: 'min(1040px, 94vw)', aspectRatio: '16/10', borderRadius: 16, overflow: 'hidden', backgroundColor: '#1A2433', backgroundImage: `url('${heroItem.url}')`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }} />
          )}

          {/* Next button */}
          {clampedGallery < mediaItems.length - 1 && (
            <button
              onClick={e => { e.stopPropagation(); setGallery(g => Math.min(g + 1, mediaCountRef.current - 1)); }}
              aria-label="Next photo"
              className="right-2 sm:right-4"
              style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: 999, border: 'none', background: 'rgba(255,255,255,0.16)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          )}

          {/* Thumbnail strip */}
          {detailMedia.length > 1 && (
            <div style={{ display: 'flex', gap: 9, maxWidth: '92vw', overflowX: 'auto', paddingBottom: 4 }}>
              {detailMedia.map(m => (
                <div
                  key={m.idx}
                  onClick={e => { e.stopPropagation(); setGallery(m.idx); }}
                  style={{ position: 'relative', width: 78, height: 56, borderRadius: 9, overflow: 'hidden', cursor: 'pointer', flexShrink: 0, border: `2.5px solid ${clampedGallery === m.idx ? '#fff' : 'transparent'}`, opacity: clampedGallery === m.idx ? 1 : 0.6, backgroundColor: m.type === 'video' ? '#000' : 'transparent', backgroundImage: m.type === 'photo' ? `url('${m.url}')` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}
                >
                  {m.type === 'video' && (
                    <>
                      <video src={m.url} muted preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16 }}>▶</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== BOOKING MODAL ===== */}
      {bookingOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(21,36,59,0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) closeBooking(); }}
        >
          <div style={{ background: '#FFFFFF', borderRadius: 24, width: 560, maxWidth: '100%', maxHeight: '92vh', overflow: 'auto', boxShadow: '0 40px 90px -30px rgba(0,0,0,0.5)', animation: 'bvpop .22s ease' }}>
            {/* Modal header */}
            <div style={{ padding: '22px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E7EAEE' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', background: '#DDD3C5' }}>
                  <div style={{ width: '100%', height: '100%', backgroundImage: `url('${sel.coverUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#15243B' }}>{sel.title}</div>
                  <div style={{ fontSize: 12.5, color: '#8A8F9C' }}>{sel.area}</div>
                </div>
              </div>
              <button onClick={closeBooking} style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #D3D9E0', background: '#fff', cursor: 'pointer', fontSize: 16, color: '#6A7180' }}>✕</button>
            </div>

            {/* Stepper */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '20px 26px 4px' }}>
              {steps.map((s, i) => (
                <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 26, height: 26, minWidth: 26, borderRadius: '50%',
                    background: s.circleBg, color: s.circleFg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12.5, fontWeight: 700, flexShrink: 0,
                    boxShadow: s.current ? `0 0 0 2px #fff, 0 0 0 4px ${ACCENT}` : 'none',
                  }}>
                    {s.done
                      ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      : s.n
                    }
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: s.current ? 700 : 500, color: s.current ? ACCENT : s.done ? '#2E7D55' : '#8B93A1' }}>{s.t}</span>
                  {i < steps.length - 1 && <div style={{ width: 20, height: 1.5, background: s.done ? '#2E7D55' : '#E7EAEE', margin: '0 2px', borderRadius: 1 }} />}
                </div>
              ))}
            </div>

            {/* Step 1: Pick date + time */}
            {bookingStep === 1 && (
              <div style={{ padding: '18px 26px 26px' }}>
                <h3 style={{ fontSize: 19, fontWeight: 700, margin: '8px 0 4px', color: '#15243B' }}>Propose a visit time</h3>
                <p style={{ fontSize: 14, color: '#6A7180', margin: '0 0 18px' }}>Pick a date and time. The owner will confirm or suggest a new time.</p>

                {/* Calendar card */}
                <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 4px 28px rgba(21,36,59,0.11)', padding: '20px 16px 16px', marginBottom: 18 }}>
                  {/* Month nav */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <button onClick={prevCalMonth} style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid #E7EAEE', background: '#F9FAFC', cursor: 'pointer', fontSize: 18, color: '#6A7180', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>‹</button>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#15243B' }}>{MONTH_NAMES[calMonth]} {calYear}</span>
                    <button onClick={nextCalMonth} style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid #E7EAEE', background: '#F9FAFC', cursor: 'pointer', fontSize: 18, color: '#6A7180', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>›</button>
                  </div>

                  {/* Weekday headers */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
                    {DAY_ABBR.map((d, i) => (
                      <div key={i} style={{ textAlign: 'center', fontSize: 11.5, fontWeight: 700, color: '#A8AEB9', paddingBottom: 8 }}>{d}</div>
                    ))}
                  </div>

                  {/* Date grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                    {calCells.map((dayNum, i) => {
                      if (!dayNum) return <div key={i} style={{ height: 36 }} />;
                      const cellDate = new Date(calYear, calMonth, dayNum);
                      const isPast = cellDate < todayMidnight;
                      const isToday = cellDate.getTime() === todayMidnight.getTime();
                      const isSel = pickedDate ? cellDate.getTime() === pickedDate.getTime() : false;
                      return (
                        <div key={i} style={{ height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onClick={isPast ? undefined : () => { setPickedDate(cellDate); setPickedTime(null); }}>
                          <span style={{
                            width: 34, height: 34,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: '50%',
                            fontSize: 13.5,
                            fontWeight: isSel || isToday ? 700 : 500,
                            background: isSel ? ACCENT : 'transparent',
                            color: isSel ? '#fff' : isPast ? '#C8CDD8' : isToday ? ACCENT : '#15243B',
                            border: isToday && !isSel ? `2px solid ${ACCENT}` : 'none',
                            cursor: isPast ? 'default' : 'pointer',
                            transition: 'background .12s',
                          }}>
                            {dayNum}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Time slots — appear after date selected */}
                {pickedDate && (
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#8B93A1', textTransform: 'uppercase', letterSpacing: '0.55px', marginBottom: 10 }}>Choose a time</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                      {TIME_SLOTS.map(t => {
                        const active = pickedTime === t;
                        return (
                          <div key={t} onClick={() => setPickedTime(t)} style={{
                            border: `1.6px solid ${active ? ACCENT : '#E7EAEE'}`,
                            background: active ? '#EEF4FA' : '#fff',
                            borderRadius: 12,
                            padding: '12px 8px',
                            fontSize: 13,
                            fontWeight: 600,
                            color: active ? ACCENT : '#41495A',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all .12s',
                          }}>
                            {t}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Note */}
            {bookingStep === 2 && (
              <div style={{ padding: '18px 26px 26px' }}>
                <h3 style={{ fontSize: 19, fontWeight: 700, margin: '8px 0 4px', color: '#15243B' }}>Add a note for the owner</h3>
                <p style={{ fontSize: 14, color: '#6A7180', margin: '0 0 16px' }}>Selected time: <span style={{ fontWeight: 700, color: '#15243B' }}>{slotLabel}</span></p>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Hi! I'm interested in this flat for a long-term lease. Could I visit and see the parking and water supply?"
                  style={{ width: '100%', minHeight: 120, border: '1.6px solid #DBE0E6', borderRadius: 13, padding: 14, fontSize: 14.5, fontFamily: 'inherit', color: '#15243B', resize: 'vertical', background: '#fff', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, background: '#F4F6F9', borderRadius: 12, padding: '13px 15px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="#4F8A6B" strokeWidth="1.8" />
                    <path d="M8.5 12l2.4 2.4L15.5 9.5" stroke="#4F8A6B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ fontSize: 13, color: '#51596A' }}>Your phone number stays private until you both agree to share it.</span>
                </div>
              </div>
            )}

            {/* Step 3: Confirmed */}
            {bookingStep === 3 && (
              <div style={{ padding: '18px 26px 26px', textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#EAF1ED', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '8px auto 16px' }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="#4F8A6B" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 style={{ fontSize: 21, fontWeight: 700, margin: '0 0 6px', color: '#15243B' }}>Visit request sent!</h3>
                <p style={{ fontSize: 14.5, color: '#6A7180', margin: '0 0 22px' }}>
                  {sel.owner.name} usually replies in {sel.owner.rt}. We'll notify you once they confirm.
                </p>
                <div style={{ textAlign: 'left', background: '#fff', border: '1px solid #E7EAEE', borderRadius: 15, padding: 18 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#8B93A1', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>Your visit card</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 11, background: ACCENT, color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                      <span style={{ fontSize: 9, fontWeight: 700 }}>{slotDay}</span>
                      <span style={{ fontSize: 16, fontWeight: 800 }}>{slotDateNum}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#15243B' }}>{slotLabel}</div>
                      <div style={{ fontSize: 12.5, color: '#8A8F9C' }}>Pending owner confirmation</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#6A7180', paddingTop: 12, borderTop: '1px solid #EDF0F4' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M12 21s7-5.6 7-11a7 7 0 10-14 0c0 5.4 7 11 7 11z" stroke="#A8AEB9" strokeWidth="1.8" />
                    </svg>
                    {sel.area}
                  </div>
                </div>
              </div>
            )}

            {/* Modal footer */}
            <div style={{ padding: '16px 26px 24px', display: 'flex', gap: 12, borderTop: '1px solid #E7EAEE' }}>
              {bookingStep > 1 && bookingStep < 3 && (
                <button
                  onClick={() => setBookingStep(s => s - 1)}
                  style={{ flexShrink: 0, background: '#fff', color: '#15243B', border: '1px solid #D3D9E0', borderRadius: 13, padding: '14px 22px', fontSize: 14.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Back
                </button>
              )}
              <button
                onClick={handleBookingPrimary}
                disabled={bookingPrimaryDisabled}
                style={{ flex: 1, background: bookingPrimaryDisabled ? '#C0CCDA' : ACCENT, color: '#fff', border: 'none', borderRadius: 13, padding: 14, fontSize: 15, fontWeight: 700, cursor: bookingPrimaryDisabled ? 'default' : 'pointer', fontFamily: 'inherit' }}
              >
                {bookingPrimaryLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {chatOpen && (
        <ChatDrawer
          listingId={sel.id}
          listingTitle={sel.title}
          listingCover={sel.coverUrl}
          ownerName={sel.owner.name}
          ownerType={sel.owner.type}
          onClose={() => setChatOpen(false)}
        />
      )}

      {/* ===== REPORT MODAL ===== */}
      {reportOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(21,36,59,0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setReportOpen(false); }}
        >
          <div style={{ background: '#fff', borderRadius: 22, width: 460, maxWidth: '100%', maxHeight: '92vh', overflow: 'auto', boxShadow: '0 40px 90px -30px rgba(0,0,0,0.5)', animation: 'bvpop .22s ease' }}>
            {reportSent ? (
              <div style={{ padding: '34px 28px', textAlign: 'center' }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#EAF1ED', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="#4F8A6B" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 style={{ fontSize: 19, fontWeight: 700, margin: '0 0 6px', color: '#15243B' }}>Report submitted</h3>
                <p style={{ fontSize: 14, color: '#6A7180', margin: '0 0 22px' }}>Thanks for flagging this. Our team will review it shortly.</p>
                <button onClick={() => setReportOpen(false)} style={{ background: ACCENT, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Done</button>
              </div>
            ) : (
              <>
                <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E7EAEE' }}>
                  <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: '#15243B' }}>Report this listing</h3>
                  <button onClick={() => setReportOpen(false)} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid #D3D9E0', background: '#fff', cursor: 'pointer', fontSize: 15, color: '#6A7180' }}>✕</button>
                </div>
                <div style={{ padding: '20px 24px' }}>
                  <p style={{ fontSize: 13.5, color: '#6A7180', margin: '0 0 14px' }}>Why are you reporting this listing? Reports are sent privately to our moderation team.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                    {REPORT_REASONS.map(r => {
                      const active = reportReason === r;
                      return (
                        <button
                          key={r}
                          onClick={() => setReportReason(r)}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', padding: '11px 14px', borderRadius: 11, border: `1.6px solid ${active ? ACCENT : '#E7EAEE'}`, background: active ? '#EEF4FA' : '#fff', color: active ? ACCENT : '#41495A', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                          <span style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${active ? ACCENT : '#C4CBD4'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {active && <span style={{ width: 8, height: 8, borderRadius: '50%', background: ACCENT }} />}
                          </span>
                          {r}
                        </button>
                      );
                    })}
                  </div>
                  <textarea
                    value={reportDetails}
                    onChange={e => setReportDetails(e.target.value)}
                    placeholder="Add any details (optional)…"
                    style={{ width: '100%', minHeight: 80, border: '1.6px solid #DBE0E6', borderRadius: 12, padding: 12, fontSize: 14, fontFamily: 'inherit', color: '#15243B', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ padding: '0 24px 22px', display: 'flex', gap: 12 }}>
                  <button onClick={() => setReportOpen(false)} style={{ flex: 1, background: '#fff', color: '#15243B', border: '1px solid #D3D9E0', borderRadius: 12, padding: 13, fontSize: 14.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                  <button
                    onClick={submitReport}
                    disabled={!reportReason || reportBusy}
                    style={{ flex: 1, background: !reportReason || reportBusy ? '#C0CCDA' : '#B4402B', color: '#fff', border: 'none', borderRadius: 12, padding: 13, fontSize: 14.5, fontWeight: 700, cursor: !reportReason || reportBusy ? 'default' : 'pointer', fontFamily: 'inherit' }}
                  >
                    {reportBusy ? 'Submitting…' : 'Submit report'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
