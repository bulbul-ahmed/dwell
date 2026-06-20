'use client';

import { useState, useEffect } from 'react';
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
  const [photoTab, setPhotoTab] = useState('All');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
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
    setLoading(true);
    fetch(`/api/listings/${id}`)
      .then(r => r.json())
      .then(({ listing: l, edit }: { listing: import('@/types').Listing; edit?: { mapLat: number | null; mapLng: number | null } }) => {
        setListing(l);
        setCoords({ lat: edit?.mapLat ?? null, lng: edit?.mapLng ?? null });
        setGallery(0);
        return fetch(`/api/listings?cat=${l.cat}&limit=4`);
      })
      .then(r => r.json())
      .then(({ listings: ls }: { listings: import('@/types').Listing[] }) => {
        setSimilar(ls.filter(l => l.id !== Number(id)).slice(0, 3));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

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
  const providerUrl = (process.env.NEXT_PUBLIC_PROVIDER_URL ?? '') + `/listings/${sel.id}`;

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

  const clampedGallery = Math.min(gallery, Math.max(0, filteredShots.length - 1));
  const heroShot = filteredShots[clampedGallery]?.url ?? sel.coverUrl;
  const detailShots = filteredShots.map((s, i) => ({ url: s.url, ring: clampedGallery === i ? ACCENT : 'transparent', idx: i }));

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
  ].map((s, i) => ({
    ...s,
    circleBg: bookingStep > i + 1 ? ACCENT : bookingStep === i + 1 ? ACCENT : '#F0F2F5',
    circleFg: bookingStep >= i + 1 ? '#fff' : '#8B93A1',
  }));

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

            {/* ===== GALLERY ===== */}
            <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', aspectRatio: '16/10', background: '#DDD3C5', cursor: 'zoom-in', marginBottom: 12 }} onClick={() => setLightboxOpen(true)}>
              <div style={{ width: '100%', height: '100%', backgroundImage: `url('${heroShot}')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
              {filteredShots.length > 1 && (
                <div style={{ position: 'absolute', right: 14, bottom: 14, display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(21,36,59,0.78)', color: '#fff', borderRadius: 999, padding: '8px 14px', fontSize: 13, fontWeight: 700, backdropFilter: 'blur(4px)' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="3" stroke="#fff" strokeWidth="1.8" />
                    <circle cx="8.5" cy="8.5" r="1.6" fill="#fff" />
                    <path d="M21 15l-5-5L5 21" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  View all {filteredShots.length} photos
                </div>
              )}
            </div>

            {/* Category tabs — only when ≥2 labeled categories */}
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

            {/* Thumbnail strip */}
            {detailShots.length > 1 && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 30, flexWrap: 'wrap' }}>
                {detailShots.map(sh => (
                  <div
                    key={sh.idx}
                    onClick={() => setGallery(sh.idx)}
                    style={{ width: 84, height: 60, borderRadius: 11, overflow: 'hidden', background: '#DDD3C5', cursor: 'pointer', border: `2.5px solid ${sh.ring}`, flexShrink: 0 }}
                  >
                    <div style={{ width: '100%', height: '100%', backgroundImage: `url('${sh.url}')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              {sel.verified && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#EAF1ED', color: '#3C7A58', borderRadius: 999, padding: '5px 11px', fontSize: 12, fontWeight: 700 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="#3C7A58" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Verified listing
                </span>
              )}
              <span style={{ fontSize: 12.5, color: '#8B93A1', fontWeight: 600 }}>{sel.furnishing} · For {sel.pref}</span>
            </div>
            <h1 className="font-sans font-normal leading-[1.12] m-0 mb-2 text-accent-dark text-[clamp(26px,6.5vw,36px)]">{sel.title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14.5, color: '#6A7180', marginBottom: 24 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M12 21s7-5.6 7-11a7 7 0 10-14 0c0 5.4 7 11 7 11z" stroke="#A8AEB9" strokeWidth="1.8" />
                <circle cx="12" cy="10" r="2.4" stroke="#A8AEB9" strokeWidth="1.8" />
              </svg>
              {sel.area}
            </div>

            {/* Facts band */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-4" style={{ padding: 20, background: '#fff', border: '1px solid #E7EAEE', borderRadius: 16, marginBottom: 30 }}>
              <div>
                <div style={{ fontSize: 12, color: '#8B93A1', fontWeight: 600, marginBottom: 4 }}>Bedrooms</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#15243B' }}>{sel.beds}</div>
              </div>
              <div style={{ borderLeft: '1px solid #EDF0F4', paddingLeft: 16 }}>
                <div style={{ fontSize: 12, color: '#8B93A1', fontWeight: 600, marginBottom: 4 }}>Bathrooms</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#15243B' }}>{sel.baths}</div>
              </div>
              <div style={{ borderLeft: '1px solid #EDF0F4', paddingLeft: 16 }}>
                <div style={{ fontSize: 12, color: '#8B93A1', fontWeight: 600, marginBottom: 4 }}>Size</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#15243B' }}>{sel.size} sqft</div>
              </div>
              <div style={{ borderLeft: '1px solid #EDF0F4', paddingLeft: 16 }}>
                <div style={{ fontSize: 12, color: '#8B93A1', fontWeight: 600, marginBottom: 4 }}>Floor</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#15243B' }}>{sel.floor}</div>
              </div>
            </div>

            <h3 style={{ fontSize: 19, fontWeight: 700, margin: '0 0 12px', color: '#15243B' }}>About this home</h3>
            <p style={{ fontSize: 15.5, lineHeight: 1.7, color: '#51596A', margin: '0 0 32px' }}>{sel.desc}</p>

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
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 32, color: '#15243B' }}>{priceLabel}</span>
              </div>
              <div style={{ fontSize: 13, color: '#8B93A1', marginBottom: 20 }}>{sel.furnishing} · Available now</div>

              <div style={{ background: '#F4F6F9', borderRadius: 13, padding: '15px 16px', marginBottom: 18 }}>
                {costRows.map(r => (
                  <div key={r.k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', fontSize: 13.5 }}>
                    <span style={{ color: '#6A7180' }}>{r.k}</span>
                    <span style={{ color: '#15243B', fontWeight: 700 }}>{r.v}</span>
                  </div>
                ))}
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
                      href={(process.env.NEXT_PUBLIC_PROVIDER_URL ?? '') + '/leads'}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ flex: 1, textAlign: 'center', background: '#fff', color: '#15243B', border: '1px solid #D3D9E0', borderRadius: 12, padding: '11px 0', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
                    >
                      View leads
                    </a>
                    <a
                      href={(process.env.NEXT_PUBLIC_PROVIDER_URL ?? '') + '/analytics'}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ flex: 1, textAlign: 'center', background: '#fff', color: '#15243B', border: '1px solid #D3D9E0', borderRadius: 12, padding: '11px 0', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
                    >
                      Analytics
                    </a>
                  </div>
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
                <div style={{ width: 48, height: 48, borderRadius: 13, background: '#15243B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20 }}>
                  {sel.owner.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#15243B' }}>{sel.owner.name}</div>
                  <div style={{ fontSize: 12.5, color: '#8A8F9C' }}>{sel.owner.type} · ★ {sel.owner.rating.toFixed(1)} · View profile</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
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
        <div style={{ marginTop: 56 }}>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 400, fontSize: 28, margin: '0 0 20px', color: '#15243B' }}>Similar homes nearby</h2>
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
          style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(12,20,33,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 18 }}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            aria-label="Close"
            style={{ position: 'absolute', top: 20, right: 22, width: 42, height: 42, borderRadius: 999, border: 'none', background: 'rgba(255,255,255,0.14)', color: '#fff', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}
          >✕</button>

          <div style={{ width: 'min(1040px, 92vw)', aspectRatio: '16/10', borderRadius: 16, overflow: 'hidden', background: '#1A2433', backgroundImage: `url('${heroShot}')`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600 }}>{clampedGallery + 1} / {filteredShots.length}</span>
          </div>

          {detailShots.length > 1 && (
            <div style={{ display: 'flex', gap: 9, maxWidth: '92vw', overflowX: 'auto', paddingBottom: 4 }}>
              {detailShots.map(sh => (
                <div
                  key={sh.idx}
                  onClick={() => setGallery(sh.idx)}
                  style={{ width: 78, height: 56, borderRadius: 9, overflow: 'hidden', cursor: 'pointer', flexShrink: 0, border: `2.5px solid ${clampedGallery === sh.idx ? '#fff' : 'transparent'}`, opacity: clampedGallery === sh.idx ? 1 : 0.6, backgroundImage: `url('${sh.url}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                />
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
                <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: s.circleBg, color: s.circleFg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 700 }}>{s.n}</div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#51596A' }}>{s.t}</span>
                  {i < steps.length - 1 && <div style={{ width: 24, height: 1, background: '#E7EAEE', margin: '0 4px' }} />}
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
    </div>
  );
}
