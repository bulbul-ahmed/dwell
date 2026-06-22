'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Footer from '@/components/Footer';
import BecomeOwnerSheet from '@/components/BecomeOwnerSheet';
import { GoogleMap, Polygon, Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';

type ZoneData = {
  id: number; name: string; areaName: string;
  polygon: { type: string; coordinates: number[][][] };
  color: string; active: boolean;
};

const MAP_LIBRARIES: ('places')[] = ['places'];
const DHAKA_CENTER = { lat: 23.7637, lng: 90.4264 };

const ACCENT = '#1E3A5C';
const GREEN  = '#2E7D55';

const WIZ_STEPS = [
  { n: 1, label: 'Type'     },
  { n: 2, label: 'Location' },
  { n: 3, label: 'Details'  },
  { n: 4, label: 'Photos'   },
  { n: 5, label: 'Pricing'  },
  { n: 6, label: 'Review'   },
];

const WIZ_TYPES = [
  { k: 'rent',    icon: '🏠', label: 'Flat for rent',  sub: 'Residential lease'   },
  { k: 'buy',     icon: '🔑', label: 'Flat for sale',  sub: 'Sell your property'  },
  { k: 'office',  icon: '🏢', label: 'Office space',   sub: 'Rent or sale'        },
  { k: 'sublet',  icon: '🛋️', label: 'Sublet',         sub: 'Short-term / shared' },
  { k: 'room',    icon: '🚪', label: 'Single room',    sub: 'Room for rent'       },
  { k: 'student', icon: '🎓', label: 'Student hostel', sub: 'Seats near campus'   },
];

const FACING_OPTS   = ['North','South','East','West','North-East','North-West','South-East','South-West'];
const FLOOR_OPTS    = ['Ground','1st','2nd','3rd','4th','5th','6th','7th','8th+'];
const FURNISH_OPTS  = ['Unfurnished','Semi-furnished','Furnished'];
const FURNISH_OFF   = ['Bare shell','Fitted','Fully-fitted'];
const BED_OPTS      = ['1','2','3','4+'];
const BATH_OPTS     = ['1','2','3+'];
const BFLOOR_OPTS   = ['3','4','5','6','7','8','9','10+'];
const PREF_OPTS     = ['Any','Family','Bachelor'];
const CONF_OPTS     = ['0','1','2','3+'];
const WASH_OPTS     = ['1','2','3+'];

const SEAT_TYPES = [
  { k: 'single', label: 'Single', sub: '1 person/room' },
  { k: 'twin',   label: 'Twin',   sub: '2 persons/room' },
  { k: 'triple', label: 'Triple', sub: '3 persons/room' },
];

const HOSTEL_AMEN = [
  { k: 'Bed & mattress',    icon: '🛏️' },
  { k: 'Locker',            icon: '🔐' },
  { k: 'WiFi',              icon: '📶' },
  { k: 'Fridge',            icon: '🧊' },
  { k: 'AC',                icon: '❄️' },
  { k: 'Study desk',        icon: '📚' },
  { k: 'Attached bathroom', icon: '🚿' },
  { k: 'Hot water',         icon: '🚰' },
  { k: 'Generator backup',  icon: '⚡' },
  { k: 'Laundry',           icon: '🧺' },
  { k: 'Common room / TV',  icon: '📺' },
  { k: 'Water purifier',    icon: '💧' },
  { k: 'CCTV',              icon: '📷' },
  { k: 'Security guard',    icon: '🔒' },
  { k: 'Prayer room',       icon: '🕌' },
  { k: 'Parking',           icon: '🅿️' },
];

const FLAT_AMEN = [
  { k: 'AC',             icon: '❄️' },
  { k: 'Generator',      icon: '⚡' },
  { k: 'Lift',           icon: '🛗' },
  { k: 'Parking',        icon: '🅿️' },
  { k: 'Gas line',       icon: '🔥' },
  { k: 'CCTV',           icon: '📷' },
  { k: 'Rooftop access', icon: '🏠' },
  { k: 'Security guard', icon: '🔒' },
];

const MEAL_OPTS = ['Breakfast','Lunch','Dinner'];

const PHOTO_CATS_FLAT   = ['Living Room','Bedroom','Kitchen','Bathroom','Dining','Balcony','Building / Exterior','Other'];
const PHOTO_CATS_HOSTEL = ['Dorm Room','Study Area','Prayer Room','Bathroom','Common Area','Building / Exterior','Other'];
const PHOTO_CATS_OFFICE = ['Workspace','Conference Room','Reception','Washroom','Exterior','Other'];

function photoCatsFor(wt: string) {
  if (wt === 'student') return PHOTO_CATS_HOSTEL;
  if (wt === 'office')  return PHOTO_CATS_OFFICE;
  return PHOTO_CATS_FLAT;
}

type PhotoItem = { file: File; previewUrl: string };
type VideoItem = { file: File; cfId?: string; uploading: boolean; error?: string };

// ── UI atoms ─────────────────────────────────────────────────────────────────

function LabelTag({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ fontSize: 12.5, fontWeight: 700, color: '#8B93A1', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
      {children}
    </label>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <span
      role="switch"
      aria-checked={on}
      // stopPropagation: parent rows also toggle on click — without this the click
      // fires twice (here + parent) and cancels out, making the switch feel stuck.
      onClick={e => { e.stopPropagation(); onChange(); }}
      style={{ width: 48, height: 28, borderRadius: 999, background: on ? ACCENT : '#CBD3DC', position: 'relative', display: 'inline-block', transition: 'background .25s ease', cursor: 'pointer', flexShrink: 0 }}
    >
      <span style={{ position: 'absolute', top: 3, left: 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'transform .25s cubic-bezier(.4,0,.2,1)', transform: on ? 'translateX(20px)' : 'translateX(0)' }} />
    </span>
  );
}

function CheckBox({ checked, label, icon, onChange }: { checked: boolean; label: string; icon?: string; onChange: () => void }) {
  return (
    <label onClick={onChange} style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', padding: '8px 10px', borderRadius: 10, border: `1.5px solid ${checked ? ACCENT : '#E7EAEE'}`, background: checked ? '#EEF3F8' : '#fff', transition: 'all .15s' }}>
      <span style={{ width: 16, height: 16, border: `1.6px solid ${checked ? ACCENT : '#C5CCD5'}`, borderRadius: 5, background: checked ? ACCENT : '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {checked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </span>
      {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
      <span style={{ fontSize: 13, fontWeight: 600, color: checked ? ACCENT : '#41495A' }}>{label}</span>
    </label>
  );
}

function FieldInput({ label, value, onChange, placeholder, hint, numeric }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string; numeric?: boolean }) {
  return (
    <div>
      <LabelTag>{label}</LabelTag>
      <input
        value={value}
        onChange={e => onChange(numeric ? e.target.value.replace(/\D/g, '') : e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', border: '1.6px solid #DBE0E6', borderRadius: 11, padding: '12px 14px', fontSize: 14.5, fontFamily: 'inherit', color: '#15243B', outline: 'none', boxSizing: 'border-box' }}
      />
      {hint && <div style={{ fontSize: 12, color: '#8B93A1', marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

function SegRow({ label, opts, value, onChange }: { label: string; opts: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <LabelTag>{label}</LabelTag>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {opts.map(o => {
          const on = value === o;
          return (
            <button key={o} onClick={() => onChange(o)} style={{ border: `1.6px solid ${on ? ACCENT : '#DBE0E6'}`, background: on ? '#EEF3F8' : '#fff', color: on ? ACCENT : '#15243B', borderRadius: 10, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const inp: React.CSSProperties = { width: '100%', border: '1.6px solid #DBE0E6', borderRadius: 11, padding: '12px 14px', fontSize: 14.5, fontFamily: 'inherit', color: '#15243B', outline: 'none', boxSizing: 'border-box' };

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ListPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(({ user }) => {
      if (!user) router.replace('/auth?next=/list');
    });
  }, [router]);

  // Step 1
  const [wizType, setWizType] = useState('rent');

  // Step 2
  const [pinLat, setPinLat]         = useState<number | null>(null);
  const [pinLng, setPinLng]         = useState<number | null>(null);
  const [detectedZone, setDetectedZone] = useState<ZoneData | null>(null);
  const [activeZones, setActiveZones]   = useState<ZoneData[]>([]);
  const [address, setAddress]   = useState('');
  const [landmark, setLandmark] = useState('');
  const mapRef = useRef<google.maps.Map | null>(null);
  const acRef  = useRef<google.maps.places.Autocomplete | null>(null);
  const geoRef = useRef<google.maps.Geocoder | null>(null);
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  // Once the user edits the address by hand, stop auto-filling it from the map pin.
  const addressTouched = useRef(false);

  // Reverse-geocode the dropped pin into the Road/house field (unless the user typed their own).
  const reverseGeocode = useCallback((lat: number, lng: number) => {
    if (addressTouched.current) return;
    if (typeof google === 'undefined' || !google.maps) return;
    if (!geoRef.current) geoRef.current = new google.maps.Geocoder();
    setGeocoding(true);
    geoRef.current.geocode({ location: { lat, lng } }, (results, status) => {
      setGeocoding(false);
      if (addressTouched.current) return;
      if (status === 'OK' && results && results[0]) {
        setAddress(results[0].formatted_address.replace(/,?\s*Bangladesh$/i, ''));
      }
    });
  }, []);

  // Whenever the pin lands on new coordinates, pull the address from Google (debounced via the ref guard).
  useEffect(() => {
    if (pinLat == null || pinLng == null) return;
    reverseGeocode(pinLat, pinLng);
  }, [pinLat, pinLng, reverseGeocode]);

  // Step 3 — shared
  const [title, setTitle]           = useState('');
  const [beds,  setBeds]            = useState('2');
  const [baths, setBaths]           = useState('2');
  const [size,  setSize]            = useState('');
  const [floor, setFloor]           = useState('3rd');
  const [facing, setFacing]         = useState('');
  const [furnishing, setFurnishing] = useState('Semi-furnished');
  const [totalFloors, setTotalFloors] = useState('5');
  const [amenities, setAmenities]   = useState<Set<string>>(new Set());
  const [pref, setPref]             = useState('Any');

  // Step 3 — hostel
  const [gender, setGender]         = useState<'boys'|'girls'>('boys');
  const [seatType, setSeatType]     = useState('twin');
  const [totalSeats, setTotalSeats] = useState('');
  const [hasCurfew, setHasCurfew]   = useState(false);
  const [curfewTime, setCurfewTime] = useState('10:00 PM');

  // Step 3 — office
  const [officeDesks, setOfficeDesks]         = useState('');
  const [officeConfRooms, setOfficeConfRooms] = useState('1');
  const [officeWashrooms, setOfficeWashrooms] = useState('1');
  const [officeFurnish, setOfficeFurnish]     = useState('Fitted');

  // Step 4
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos]               = useState<PhotoItem[]>([]);
  const [shotCatAssign, setShotCatAssign] = useState<Record<number, string>>({});
  const [videos, setVideos]               = useState<VideoItem[]>([]);

  // Step 5
  const [price, setPrice]                   = useState('');
  const [advance, setAdvance]               = useState('2');
  const [serviceCharge, setServiceCharge]   = useState('');
  const [negotiable, setNegotiable]         = useState(false);
  const [availMode, setAvailMode]           = useState<'immediate' | 'date'>('immediate');
  const [availDate, setAvailDate]           = useState('');
  const [hostelAmen, setHostelAmen]         = useState<Set<string>>(new Set(['Bed & mattress','WiFi']));
  const [mealsIncluded, setMealsIncluded]   = useState(false);
  const [meals, setMeals]                   = useState<Set<string>>(new Set());

  const [submitting, setSubmitting] = useState(false);
  const [verifyGate, setVerifyGate] = useState(false);

  // ── Edit mode ──────────────────────────────────────────────────────────────
  const [editId, setEditId]               = useState<number | null>(null);
  const [editArea, setEditArea]           = useState('');
  const [editZoneId, setEditZoneId]       = useState<number | null>(null);
  const [existingShots, setExistingShots]       = useState<string[]>([]);
  const [existingShotCats, setExistingShotCats] = useState<string[] | null>(null);
  const [existingVideos, setExistingVideos]     = useState<string[]>([]);
  const isEdit = editId !== null;

  // Prefill the wizard when ?edit=<id> is present (read via location to avoid a Suspense boundary)
  useEffect(() => {
    const eid = new URLSearchParams(window.location.search).get('edit');
    if (!eid) return;
    const idNum = parseInt(eid, 10);
    if (Number.isNaN(idNum)) return;
    fetch(`/api/listings/${idNum}`)
      .then(r => r.ok ? r.json() : null)
      .then((d: { listing: import('@/types').Listing; edit: { mapLat: number | null; mapLng: number | null; zoneId: number | null; area: string; videos: string[] } } | null) => {
        if (!d?.listing) return;
        const l = d.listing;
        setEditId(idNum);
        setWizType(l.cat);
        setTitle(l.title);
        setBeds(String(l.beds || 2));
        setBaths(String(l.baths || 1));
        setSize(l.size ? String(l.size) : '');
        setFloor(l.floor || '3rd');
        setFacing(l.facing || '');
        setFurnishing(l.furnishing || 'Semi-furnished');
        setTotalFloors(l.totalFloors || '5');
        setPref(l.pref || 'Any');
        setAmenities(new Set(l.amen ?? []));
        setPrice(l.price ? l.price.toLocaleString('en') : '');
        setAdvance(String(l.adv ?? 2));
        setServiceCharge(l.service ? String(l.service) : '');
        if (l.availableFrom && l.availableFrom !== 'immediate') { setAvailMode('date'); setAvailDate(l.availableFrom); }
        if (l.landmark) {
          const parts = l.landmark.split(' · ');
          setAddress(parts[0] ?? '');
          setLandmark(parts[1] ?? '');
          if (parts[0]) addressTouched.current = true; // keep the saved address, don't auto-overwrite
        }
        if (d.edit?.mapLat != null && d.edit?.mapLng != null) {
          setPinLat(d.edit.mapLat); setPinLng(d.edit.mapLng);
        }
        setEditArea(d.edit?.area ?? l.area ?? '');
        setEditZoneId(d.edit?.zoneId ?? null);
        setExistingShots(l.shotUrls ?? l.shots ?? []);
        setExistingShotCats((l.shotCats as string[] | null) ?? null);
        setExistingVideos(d.edit?.videos ?? []);
        // hostel / office meta
        const meta = (l.meta ?? {}) as Record<string, unknown>;
        if (l.cat === 'student') {
          if (meta.gender === 'girls' || meta.gender === 'boys') setGender(meta.gender);
          if (typeof meta.seatType === 'string') setSeatType(meta.seatType);
          if (meta.totalSeats != null) setTotalSeats(String(meta.totalSeats));
          if (typeof meta.curfew === 'string') { setHasCurfew(true); setCurfewTime(meta.curfew); }
          if (Array.isArray(meta.meals) && meta.meals.length) { setMealsIncluded(true); setMeals(new Set(meta.meals as string[])); }
          if (Array.isArray(l.amen)) setHostelAmen(new Set(l.amen));
        } else if (l.cat === 'office') {
          if (meta.desks != null) setOfficeDesks(String(meta.desks));
          if (typeof meta.confRooms === 'string') setOfficeConfRooms(meta.confRooms);
          if (typeof meta.washrooms === 'string') setOfficeWashrooms(meta.washrooms);
          setOfficeFurnish(l.furnishing || 'Fitted');
        }
      })
      .catch(() => {});
  }, []);

  const { isLoaded: mapsLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!,
    libraries: MAP_LIBRARIES,
  });

  useEffect(() => {
    if (step === 2 && activeZones.length === 0) {
      fetch('/api/zones').then(r => r.json()).then(setActiveZones).catch(() => {});
    }
  }, [step, activeZones.length]);

  const detectZone = useCallback((lat: number, lng: number): ZoneData | null => {
    for (const z of activeZones) {
      if (booleanPointInPolygon([lng, lat] as [number, number], z.polygon as Parameters<typeof booleanPointInPolygon>[1])) {
        return z;
      }
    }
    return null;
  }, [activeZones]);

  // Default map focus = centroid of the first active zone (Aftab Nagar), so a new
  // listing's pin starts INSIDE a coloured zone instead of generic Dhaka.
  const zonesCenter = useMemo(() => {
    if (activeZones.length === 0) return DHAKA_CENTER;
    const ring = activeZones[0].polygon.coordinates[0];
    let sx = 0, sy = 0;
    for (const [lng, lat] of ring) { sx += lng; sy += lat; }
    return { lat: sy / ring.length, lng: sx / ring.length };
  }, [activeZones]);

  // Edit mode: re-detect the zone for the prefilled pin once zones have loaded
  useEffect(() => {
    if (!isEdit || detectedZone || pinLat === null || pinLng === null || activeZones.length === 0) return;
    const z = detectZone(pinLat, pinLng);
    if (z) setDetectedZone(z);
  }, [isEdit, detectedZone, pinLat, pinLng, activeZones, detectZone]);

  // New listing: seed the pin at the zone centroid as soon as zones load, so the
  // address auto-fills even if the map's `idle` event is slow/never fires.
  useEffect(() => {
    if (isEdit || pinLat !== null || activeZones.length === 0) return;
    const c = zonesCenter;
    setPinLat(c.lat); setPinLng(c.lng);
    setDetectedZone(detectZone(c.lat, c.lng));
  }, [isEdit, pinLat, activeZones, zonesCenter, detectZone]);

  const isHostel = wizType === 'student';
  const isOffice = wizType === 'office';
  const isRoom   = wizType === 'room';
  const isBuy    = wizType === 'buy';

  const area = detectedZone ? `${detectedZone.name}, ${detectedZone.areaName}` : '';
  const previewTitle = title || (
    isHostel ? `${gender === 'boys' ? 'Boys' : 'Girls'} Hostel${detectedZone ? `, ${detectedZone.name}` : ''}` :
    isOffice ? `Office space${detectedZone ? `, ${detectedZone.name}` : ''}` :
    isRoom   ? `Room for rent${detectedZone ? `, ${detectedZone.name}` : ''}` :
               `${beds}-bed flat${detectedZone ? `, ${detectedZone.name}` : ''}`
  );
  const previewPrice = price
    ? `৳${Number(price.replace(/,/g, '')).toLocaleString('en')}${isHostel ? '/seat/mo' : isBuy ? '' : '/mo'}`
    : '৳ —';
  const previewCover = photos[0]?.previewUrl
    ?? 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1100&q=70';

  const toggleAmen       = (k: string) => setAmenities(p => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const toggleHostelAmen = (k: string) => setHostelAmen(p => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const toggleMeal       = (m: string) => setMeals(p => { const n = new Set(p); n.has(m) ? n.delete(m) : n.add(m); return n; });

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const items: PhotoItem[] = Array.from(files).slice(0, 20 - photos.length).map(file => ({
      file, previewUrl: URL.createObjectURL(file),
    }));
    setPhotos(p => [...p, ...items]);
  };

  const removePhoto = (i: number) => {
    setPhotos(p => p.filter((_, idx) => idx !== i));
    setShotCatAssign(prev => {
      const next: Record<number, string> = {};
      Object.entries(prev).forEach(([k, v]) => {
        const ki = parseInt(k);
        if (ki !== i) next[ki > i ? ki - 1 : ki] = v;
      });
      return next;
    });
  };

  const addVideo = async (file: File) => {
    if (videos.length >= 2) return;
    const item: VideoItem = { file, uploading: true };
    setVideos(p => [...p, item]);
    try {
      const r = await fetch('/api/upload-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxDurationSeconds: 60 }),
      });
      const { uid, uploadURL } = await r.json() as { uid: string; uploadURL: string };
      const fd = new FormData();
      fd.append('file', file);
      await fetch(uploadURL, { method: 'POST', body: fd });
      setVideos(p => p.map(v => v.file === file ? { ...v, cfId: uid, uploading: false } : v));
    } catch {
      setVideos(p => p.map(v => v.file === file ? { ...v, uploading: false, error: 'Upload failed' } : v));
    }
  };

  const removeVideo = (i: number) => setVideos(p => p.filter((_, idx) => idx !== i));

  const handlePrimary = async () => {
    if (step === 2 && pinLat === null) return;
    if (step < 6) { setStep(s => s + 1); return; }
    setSubmitting(true);
    try {
      // Upload any newly added photos; otherwise reuse the listing's existing shots (edit mode)
      let shots: string[] = [];
      if (photos.length > 0) {
        const fd = new FormData();
        photos.forEach(p => fd.append('files', p.file));
        const upRes = await fetch('/api/upload', { method: 'POST', body: fd });
        if (upRes.ok) shots = ((await upRes.json()) as { urls: string[] }).urls;
      } else if (isEdit) {
        shots = existingShots;
      }

      const cats     = photos.map((_, i) => shotCatAssign[i] || '');
      const hasCats  = cats.some(c => c !== '');
      const shotCats = photos.length > 0 ? (hasCats ? cats : undefined) : (existingShotCats ?? undefined);

      const newVideos = videos.filter(v => v.cfId).map(v => v.cfId!);
      const finalVideos = newVideos.length > 0 ? newVideos : (isEdit ? existingVideos : []);

      const body = {
        cat:         wizType,
        title:       title || previewTitle,
        area:        area || editArea,
        mapLat:      pinLat ?? undefined,
        mapLng:      pinLng ?? undefined,
        zoneId:      detectedZone?.id ?? editZoneId ?? undefined,
        landmark:    [address, landmark].filter(Boolean).join(' · ') || undefined,
        beds:        isOffice ? 0 : isRoom ? 1 : parseInt(beds) || 2,
        baths:       parseInt(baths) || 1,
        size:        parseInt(size) || 0,
        floor,
        facing:      facing || undefined,
        furnishing:  isOffice ? officeFurnish : furnishing,
        totalFloors,
        pref:        isHostel ? (gender === 'boys' ? 'Boys' : 'Girls') : pref,
        price:       parseInt(price.replace(/,/g, '')) || 0,
        negotiable,
        advance:     isBuy ? 0 : parseInt(advance) || 2,
        service:     parseInt(serviceCharge) || undefined,
        availableFrom: availMode === 'date' && availDate ? availDate : 'immediate',
        amenities:   isHostel ? [...hostelAmen] : [...amenities],
        shots,
        shotCats,
        videos:      finalVideos,
        meta: isHostel ? {
          gender, seatType,
          totalSeats: parseInt(totalSeats) || 0,
          curfew: hasCurfew ? curfewTime : null,
          meals: mealsIncluded ? [...meals] : [],
        } : isOffice ? {
          desks: parseInt(officeDesks) || 0,
          confRooms: officeConfRooms,
          washrooms: officeWashrooms,
        } : undefined,
      };

      const res = await fetch(isEdit ? `/api/listings/${editId}` : '/api/listings', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.status === 401) { router.replace(`/auth?next=/list${isEdit ? `?edit=${editId}` : ''}`); return; }
      // Unverified owner — gate publishing behind phone + address, then return here.
      if (res.status === 403) { setVerifyGate(true); setSubmitting(false); return; }
      if (res.ok) {
        if (isEdit) { router.push(`/listings/${editId}/status`); return; }
        const { id } = (await res.json()) as { id: number };
        router.push(`/list/success?id=${id}`);
        return;
      }
      setSubmitting(false);
    } catch {
      setSubmitting(false);
    }
  };

  // ── Review rows ───────────────────────────────────────────────────────────

  const reviewRows: { k: string; v: string }[] = isHostel ? [
    { k: 'Type',        v: 'Student hostel' },
    { k: 'Location',    v: area },
    { k: 'For',         v: gender === 'boys' ? '👦 Boys' : '👧 Girls' },
    { k: 'Seat type',   v: SEAT_TYPES.find(s => s.k === seatType)?.label ?? '' },
    { k: 'Total seats', v: totalSeats || '—' },
    { k: 'Name',        v: previewTitle },
    { k: 'Seat rent',   v: previewPrice },
    { k: 'Meals',       v: mealsIncluded ? ([...meals].join(', ') || 'Included') : 'Not included' },
    { k: 'Amenities',   v: [...hostelAmen].slice(0, 4).join(', ') + (hostelAmen.size > 4 ? ` +${hostelAmen.size - 4}` : '') },
    { k: 'Curfew',      v: hasCurfew ? curfewTime : 'None' },
    { k: 'Negotiable',  v: negotiable ? 'Yes' : 'No' },
  ] : isOffice ? [
    { k: 'Type',         v: 'Office space' },
    { k: 'Location',     v: area },
    { k: 'Name',         v: previewTitle },
    { k: 'Size',         v: size ? `${size} sqft` : '—' },
    { k: 'Workstations', v: officeDesks || '—' },
    { k: 'Conf. rooms',  v: officeConfRooms },
    { k: 'Furnishing',   v: officeFurnish },
    { k: 'Floor',        v: floor },
    { k: isBuy ? 'Sale price' : 'Rent/mo', v: previewPrice },
    { k: 'Negotiable',   v: negotiable ? 'Yes' : 'No' },
  ] : [
    { k: 'Type',       v: WIZ_TYPES.find(t => t.k === wizType)?.label ?? '' },
    { k: 'Location',   v: area },
    { k: 'Title',      v: previewTitle },
    { k: 'Bedrooms',   v: isRoom ? '1 (single room)' : beds },
    { k: 'Floor',      v: floor },
    { k: 'Furnishing', v: furnishing },
    { k: 'Amenities',  v: amenities.size > 0 ? [...amenities].slice(0, 3).join(', ') + (amenities.size > 3 ? ` +${amenities.size - 3}` : '') : '—' },
    { k: isBuy ? 'Sale price' : 'Rent/mo', v: previewPrice },
    { k: 'Negotiable', v: negotiable ? 'Yes' : 'No' },
  ];

  const primaryLabel = step < 6
    ? 'Continue'
    : submitting ? (isEdit ? 'Saving…' : 'Submitting…')
    : (isEdit ? 'Save changes' : 'Submit for review');

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <main className="pg-md">
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 600, color: '#6A7180', marginBottom: 18, textDecoration: 'none' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="#6A7180" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Cancel
        </Link>

        <h1 style={{ fontWeight: 400, fontSize: 34, margin: '0 0 6px', color: '#15243B' }}>{isEdit ? 'Edit listing' : 'List your property'}</h1>
        <p style={{ fontSize: 15, color: '#6A7180', margin: '0 0 26px' }}>{isEdit ? 'Update your details. Edits go back to review before they appear live.' : 'A few calm steps. We verify every listing before it goes live.'}</p>

        {/* Progress */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 30 }}>
          {WIZ_STEPS.map((w, i) => {
            const done = step > w.n, active = step === w.n, isLast = i === WIZ_STEPS.length - 1;
            return (
              <div key={w.n} style={{ display: 'flex', alignItems: 'center', flex: isLast ? '0 0 auto' : '1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: (done || active) ? ACCENT : '#fff', color: (done || active) ? '#fff' : '#8B93A1', border: `1.6px solid ${(done || active) ? ACCENT : '#D3D9E0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                    {done ? '✓' : w.n}
                  </div>
                  <span className={`text-[12.5px] font-semibold whitespace-nowrap ${active ? 'text-accent-dark' : 'text-[#8B93A1]'} ${active ? 'inline' : 'hidden min-[480px]:inline'}`}>{w.label}</span>
                </div>
                {!isLast && <div style={{ flex: 1, height: 2, background: done ? ACCENT : '#E7EAEE', margin: '0 10px' }} />}
              </div>
            );
          })}
        </div>

        <div className="g-list-wizard">

          {/* ── Form card ── */}
          <div style={{ background: '#fff', border: '1px solid #E7EAEE', borderRadius: 20, padding: '28px 30px', boxShadow: '0 18px 40px -32px rgba(21,36,59,0.4)' }}>

            {/* STEP 1 */}
            {step === 1 && (
              <>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: '#15243B' }}>What are you listing?</h2>
                <p style={{ fontSize: 14, color: '#8B93A1', margin: '0 0 22px' }}>Pick the type that best fits your property.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  {WIZ_TYPES.map(ty => {
                    const on = wizType === ty.k;
                    return (
                      <div key={ty.k} onClick={() => setWizType(ty.k)} style={{ display: 'flex', alignItems: 'center', gap: 12, border: `1.6px solid ${on ? ACCENT : '#E7EAEE'}`, background: on ? '#EEF3F8' : '#fff', borderRadius: 14, padding: 15, cursor: 'pointer' }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: on ? '#fff' : '#F4F6F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>{ty.icon}</div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#15243B' }}>{ty.label}</div>
                          <div style={{ fontSize: 11.5, color: '#8B93A1' }}>{ty.sub}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: '#15243B' }}>Where is it?</h2>
                <p style={{ fontSize: 14, color: '#8B93A1', margin: '0 0 18px' }}>Search an address or pan the map — pin stays centred on your property.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                  {/* Search + locate row */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    {mapsLoaded ? (
                      <Autocomplete
                        onLoad={ac => { acRef.current = ac; ac.setComponentRestrictions({ country: 'bd' }); }}
                        onPlaceChanged={() => {
                          const p = acRef.current?.getPlace();
                          const loc = p?.geometry?.location;
                          if (!loc || !mapRef.current) return;
                          const lat = loc.lat(), lng = loc.lng();
                          mapRef.current.panTo({ lat, lng });
                          mapRef.current.setZoom(17);
                          setPinLat(lat); setPinLng(lng);
                          setDetectedZone(detectZone(lat, lng));
                          if (!address && p.formatted_address) setAddress(p.formatted_address);
                        }}
                      >
                        <input
                          placeholder="Search address, area, or landmark…"
                          style={{ flex: 1, height: 42, padding: '0 14px', border: '1.5px solid #D3D9E0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#fff', width: '100%' }}
                        />
                      </Autocomplete>
                    ) : (
                      <input disabled placeholder="Loading search…" style={{ flex: 1, height: 42, padding: '0 14px', border: '1.5px solid #D3D9E0', borderRadius: 10, fontSize: 14, background: '#F4F6F9' }} />
                    )}
                    <button
                      type="button"
                      disabled={locating || !mapsLoaded}
                      onClick={() => {
                        if (!navigator.geolocation || !mapRef.current) return;
                        setLocating(true);
                        navigator.geolocation.getCurrentPosition(
                          pos => {
                            const lat = pos.coords.latitude, lng = pos.coords.longitude;
                            mapRef.current!.panTo({ lat, lng });
                            mapRef.current!.setZoom(17);
                            setPinLat(lat); setPinLng(lng);
                            setDetectedZone(detectZone(lat, lng));
                            setLocating(false);
                          },
                          () => setLocating(false),
                          { enableHighAccuracy: true, timeout: 8000 }
                        );
                      }}
                      style={{ height: 42, padding: '0 14px', border: '1.5px solid #D3D9E0', borderRadius: 10, background: '#fff', fontSize: 13, fontWeight: 600, color: ACCENT, cursor: locating ? 'wait' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                      title="Use my current location"
                    >
                      {locating ? '…' : '📍 My location'}
                    </button>
                  </div>

                  {/* Map with fixed centre crosshair */}
                  <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: '1px solid #E7EAEE', height: 320 }}>
                    {!mapsLoaded ? (
                      <div style={{ height: '100%', background: '#F4F6F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B93A1', fontSize: 13 }}>Loading map…</div>
                    ) : (
                      <>
                        <GoogleMap
                          mapContainerStyle={{ width: '100%', height: '100%' }}
                          center={pinLat && pinLng ? { lat: pinLat, lng: pinLng } : zonesCenter}
                          zoom={pinLat ? 17 : 15}
                          onLoad={m => { mapRef.current = m; }}
                          onIdle={() => {
                            // wait for zones so the auto-set pin lands inside Aftab Nagar, not generic Dhaka
                            if (activeZones.length === 0) return;
                            const c = mapRef.current?.getCenter();
                            if (!c) return;
                            const lat = c.lat(), lng = c.lng();
                            if (pinLat === lat && pinLng === lng) return;
                            setPinLat(lat); setPinLng(lng);
                            setDetectedZone(detectZone(lat, lng));
                          }}
                          options={{ mapTypeControl: false, streetViewControl: false, fullscreenControl: false, gestureHandling: 'greedy', clickableIcons: false, styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }] }}
                        >
                          {activeZones.map(z => (
                            <Polygon key={z.id}
                              path={z.polygon.coordinates[0].slice(0, -1).map(([lng, lat]) => ({ lat, lng }))}
                              options={{ fillColor: z.color, fillOpacity: 0.12, strokeColor: z.color, strokeWeight: 1.5, strokeOpacity: 0.7, clickable: false }}
                            />
                          ))}
                        </GoogleMap>
                        {/* Fixed centre pin overlay */}
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -100%)', pointerEvents: 'none', zIndex: 2 }}>
                          <svg width="34" height="44" viewBox="0 0 34 44" fill="none">
                            <path d="M17 2C9.27 2 3 8.27 3 16c0 10.5 14 26 14 26s14-15.5 14-26C31 8.27 24.73 2 17 2z" fill="#E03A2B" stroke="#fff" strokeWidth="2"/>
                            <circle cx="17" cy="16" r="5" fill="#fff"/>
                          </svg>
                        </div>
                        {/* Shadow dot at exact centre */}
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 8, height: 8, borderRadius: '50%', background: 'rgba(0,0,0,0.25)', pointerEvents: 'none', zIndex: 2 }} />
                      </>
                    )}
                  </div>

                  {/* Zone detection result */}
                  {pinLat != null && (
                    <div style={{ padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${detectedZone ? '#C6DDD1' : '#F0C8C0'}`, background: detectedZone ? '#EAF1ED' : '#FDF0EE', display: 'flex', alignItems: 'center', gap: 9 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill={detectedZone ? '#3C7A58' : '#B4402B'} /></svg>
                      <span style={{ fontSize: 13, fontWeight: 600, color: detectedZone ? '#3C7A58' : '#B4402B' }}>
                        {detectedZone ? `${detectedZone.name}, ${detectedZone.areaName}` : 'Outside service area — pan map so pin sits inside a coloured zone'}
                      </span>
                    </div>
                  )}
                  {pinLat == null && (
                    <div style={{ fontSize: 12.5, color: '#8B93A1', textAlign: 'center', padding: '4px 0' }}>Pan the map so the pin sits on your property</div>
                  )}

                  <FieldInput
                    label="Road / house / floor (optional)"
                    value={address}
                    onChange={v => { addressTouched.current = true; setAddress(v); }}
                    placeholder="e.g. Road 4, House 12, 3rd floor"
                    hint={geocoding ? 'Finding address from the map…' : (!addressTouched.current && address ? 'Auto-filled from the map pin — edit if needed' : undefined)}
                  />
                  <FieldInput label="Landmark (optional)" value={landmark} onChange={setLandmark} placeholder="e.g. Near IFIC Bank ATM" hint="Helps seekers find you faster" />
                </div>
              </>
            )}

            {/* STEP 3 — flat / buy / sublet / room */}
            {step === 3 && !isHostel && !isOffice && (
              <>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: '#15243B' }}>Property details</h2>
                <p style={{ fontSize: 14, color: '#8B93A1', margin: '0 0 22px' }}>More details = more serious enquiries.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <FieldInput label="Listing title" value={title} onChange={setTitle} placeholder={`e.g. Bright ${beds}-bed flat${detectedZone ? ` in ${detectedZone.name}` : ''}`} />
                  {!isRoom && <SegRow label="Bedrooms" opts={BED_OPTS} value={beds} onChange={setBeds} />}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <SegRow label="Bathrooms" opts={BATH_OPTS} value={baths} onChange={setBaths} />
                    <FieldInput label="Size (sqft)" value={size} onChange={setSize} placeholder="1100" numeric />
                  </div>
                  <SegRow label="Floor" opts={FLOOR_OPTS} value={floor} onChange={setFloor} />
                  <SegRow label="Total floors in building" opts={BFLOOR_OPTS} value={totalFloors} onChange={setTotalFloors} />
                  <div>
                    <LabelTag>Facing (optional)</LabelTag>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                      {FACING_OPTS.map(f => {
                        const on = facing === f;
                        return (
                          <button key={f} onClick={() => setFacing(on ? '' : f)} style={{ padding: '7px 13px', borderRadius: 999, border: `1.5px solid ${on ? ACCENT : '#D3D9E0'}`, background: on ? '#EEF3F8' : '#fff', color: on ? ACCENT : '#6A7180', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                            {f}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <SegRow label="Furnishing" opts={FURNISH_OPTS} value={furnishing} onChange={setFurnishing} />
                  {!isRoom && (
                    <div>
                      <LabelTag>Preferred tenant</LabelTag>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {PREF_OPTS.map(p => {
                          const on = pref === p;
                          return <button key={p} onClick={() => setPref(p)} style={{ flex: 1, border: `1.6px solid ${on ? ACCENT : '#DBE0E6'}`, background: on ? '#EEF3F8' : '#fff', color: on ? ACCENT : '#15243B', borderRadius: 10, padding: '10px 0', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{p}</button>;
                        })}
                      </div>
                      <div style={{ fontSize: 12, color: '#8B93A1', marginTop: 5 }}>Shown as filter. Bachelor-friendly shown in search.</div>
                    </div>
                  )}
                  {isRoom && (
                    <div>
                      <LabelTag>Room for</LabelTag>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {PREF_OPTS.map(p => {
                          const on = pref === p;
                          return <button key={p} onClick={() => setPref(p)} style={{ flex: 1, border: `1.6px solid ${on ? ACCENT : '#DBE0E6'}`, background: on ? '#EEF3F8' : '#fff', color: on ? ACCENT : '#15243B', borderRadius: 10, padding: '10px 0', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{p}</button>;
                        })}
                      </div>
                    </div>
                  )}
                  <div>
                    <LabelTag>Amenities</LabelTag>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                      {FLAT_AMEN.map(a => <CheckBox key={a.k} checked={amenities.has(a.k)} label={a.k} icon={a.icon} onChange={() => toggleAmen(a.k)} />)}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* STEP 3 — office */}
            {step === 3 && isOffice && (
              <>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: '#15243B' }}>Office details</h2>
                <p style={{ fontSize: 14, color: '#8B93A1', margin: '0 0 22px' }}>Describe the workspace for businesses.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <FieldInput label="Office / building name" value={title} onChange={setTitle} placeholder="e.g. Aftab Business Center" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <FieldInput label="Total area (sqft)" value={size} onChange={setSize} placeholder="2500" numeric />
                    <FieldInput label="Open workstations" value={officeDesks} onChange={setOfficeDesks} placeholder="20" numeric />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <SegRow label="Conference rooms" opts={CONF_OPTS} value={officeConfRooms} onChange={setOfficeConfRooms} />
                    <SegRow label="Washrooms" opts={WASH_OPTS} value={officeWashrooms} onChange={setOfficeWashrooms} />
                  </div>
                  <SegRow label="Floor" opts={FLOOR_OPTS} value={floor} onChange={setFloor} />
                  <SegRow label="Furnishing" opts={FURNISH_OFF} value={officeFurnish} onChange={setOfficeFurnish} />
                </div>
              </>
            )}

            {/* STEP 3 — hostel */}
            {step === 3 && isHostel && (
              <>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: '#15243B' }}>Hostel details</h2>
                <p style={{ fontSize: 14, color: '#8B93A1', margin: '0 0 22px' }}>Tell students who this hostel is for.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <LabelTag>Hostel for</LabelTag>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {(['boys','girls'] as const).map(g => {
                        const on = gender === g;
                        return (
                          <div key={g} onClick={() => setGender(g)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, border: `2px solid ${on ? ACCENT : '#E7EAEE'}`, background: on ? '#EEF3F8' : '#fff', borderRadius: 14, padding: '15px 0', cursor: 'pointer' }}>
                            {g === 'boys' ? (
                              <svg width="24" height="24" viewBox="0 0 44.758 44.759" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M25.239,29.567c0,0.631-1.281,1.145-2.859,1.145c-1.58,0-2.859-0.514-2.859-1.145c0-0.635,1.279-1.145,2.859-1.145C23.958,28.423,25.239,28.933,25.239,29.567z M43.735,28.302c0,2.926-1.837,5.408-4.361,6.242c-3.24,6.206-9.748,10.215-16.965,10.215c-7.211,0-13.708-3.998-16.949-10.191c-2.563-0.809-4.436-3.312-4.436-6.266c0-1.625,0.571-3.111,1.509-4.258C1.53,22.017,1.07,19.672,1.22,17.165c0.242-4.043,2.033-8.025,5.041-11.217c3.475-3.685,8.099-5.798,12.688-5.798c2.156,0,4.155,0.467,5.918,1.36c1.05-0.741,2.222-1.396,3.207-1.506c0.161-0.019,0.321,0.043,0.429,0.164c0.108,0.121,0.15,0.287,0.114,0.444c-0.228,0.982-0.431,2.164-0.549,3.293c0.306,0.318,0.593,0.652,0.858,1.002c0.047-0.021,0.09-0.049,0.138-0.069c0.916-0.39,1.896-0.588,2.914-0.588c4.104,0,8.208,3.166,10.213,7.878c1.757,4.129,1.478,8.48-0.381,11.453C42.995,24.772,43.735,26.445,43.735,28.302z M12.63,23.501c0,0.737,0,1.75,3.803,1.75c2.286,0,3.803-1.054,3.803-1.75s-1.517-1.75-3.803-1.75C12.63,21.75,12.63,22.408,12.63,23.501z M39.735,28.302c0-0.79-0.32-1.486-0.814-1.953c-0.092-0.088-0.19-0.166-0.295-0.236c-0.012-0.008-0.021-0.014-0.033-0.02c-0.096-0.063-0.192-0.117-0.297-0.162c-0.043-0.02-0.09-0.031-0.135-0.048c-0.076-0.028-0.154-0.059-0.234-0.075c-0.135-0.027-0.271-0.047-0.409-0.047c-0.341,0.581-0.729,1.143-1.173,1.674c0.414-1.416,0.64-2.873,0.64-4.318c0-0.051-0.007-0.098-0.008-0.146c-3.313-2.737-5.171-6.714-5.923-8.668c-2.207,4.013-5.664,4.646-7.627,4.646c-1.126,0-1.895-0.202-1.925-0.211c-0.153-0.043-0.277-0.152-0.335-0.301c-0.059-0.146-0.043-0.313,0.041-0.447c0.563-0.902,0.465-1.598,0.261-2.041c-0.74,1.052-2.302,2.011-4.161,2.848c2.207,0.189,4.055,1.089,5.074,2.373c1.151-1.451,3.357-2.415,5.948-2.415c4.896,0,6.803,1.332,6.803,4.75c0,4.75-5.119,4.75-6.803,4.75c-2.591,0-4.797-0.963-5.948-2.414c-1.151,1.451-3.357,2.414-5.947,2.414c-1.683,0-6.803,0-6.803-4.75c0-0.877,0.128-1.616,0.397-2.229c-0.813,0.219-1.555,0.402-2.182,0.553c-0.041,0.422-0.068,0.851-0.068,1.293c0,1.444,0.226,2.901,0.638,4.317c-0.441-0.533-0.831-1.094-1.171-1.675c-0.14,0-0.274,0.019-0.407,0.048c-0.047,0.01-0.092,0.024-0.138,0.038c-0.082,0.023-0.162,0.052-0.24,0.085c-0.056,0.024-0.11,0.053-0.164,0.081c-0.059,0.031-0.114,0.068-0.17,0.105c-0.062,0.042-0.124,0.083-0.182,0.131C5.919,26.273,5.895,26.3,5.87,26.32c-0.336,0.312-0.594,0.729-0.729,1.207c-0.069,0.246-0.116,0.504-0.116,0.775c0,1.404,0.99,2.541,2.223,2.541c0.309,0,0.602-0.072,0.867-0.199c2.016,5.879,7.648,10.115,14.295,10.115c6.64,0,12.267-4.229,14.291-10.096c0.25,0.112,0.523,0.18,0.812,0.18C38.745,30.843,39.735,29.704,39.735,28.302z M28.327,25.251c3.803,0,3.803-1.013,3.803-1.75c0-1.093,0-1.75-3.803-1.75c-2.285,0-3.803,1.054-3.803,1.75C24.526,24.197,26.042,25.251,28.327,25.251z" fill={on ? '#1E3A5C' : '#41495A'}/>
                              </svg>
                            ) : (
                              <svg width="24" height="24" viewBox="0 0 45.984 45.984" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.991,0C9.736,0,1.503,10.664,1.503,27.831c0,7.999,4.905,14.718,9.309,15.745c0.302,0.072,0.623-0.003,0.863-0.202c0.24-0.198,0.375-0.498,0.362-0.812l-0.026-0.709c0.844,1.641,1.813,3.233,2.664,3.912c0.18,0.145,0.399,0.219,0.623,0.219c0.143,0,0.285-0.03,0.42-0.094c0.344-0.158,0.567-0.498,0.58-0.877c0.002-0.068,0.162-4.272,1.674-7.586c1.597,0.527,3.295,0.816,5.045,0.816c1.73,0,3.414-0.284,4.996-0.804c1.508,3.311,1.672,7.503,1.674,7.571c0.014,0.379,0.236,0.719,0.58,0.877c0.344,0.16,0.746,0.109,1.043-0.125c0.852-0.678,1.818-2.271,2.664-3.912l-0.027,0.709c-0.014,0.313,0.123,0.611,0.361,0.812c0.24,0.2,0.562,0.272,0.865,0.202c4.494-1.049,9.309-7.626,9.309-15.745C44.479,10.664,36.245,0,22.991,0z M11.739,26.266c-0.21,0.102-0.441,0.158-0.684,0.158c-0.974,0-1.754-0.898-1.754-2.007c0-1.104,0.778-2.002,1.75-2.005c0.269,0.459,0.574,0.9,0.924,1.321c-0.325-1.117-0.504-2.266-0.504-3.406c0-0.372,0.021-0.732,0.059-1.086h14.415c0.553,0,1-0.447,1-1v-2.656l3.135,3.342c0.188,0.2,0.453,0.314,0.729,0.314h3.646c0.035,0.354,0.058,0.714,0.058,1.085c0,1.142-0.179,2.29-0.504,3.406c0.351-0.422,0.655-0.861,0.924-1.32c0.972,0.003,1.75,0.898,1.75,2.005s-0.78,2.007-1.754,2.007c-0.228,0-0.44-0.056-0.64-0.145c-1.596,4.629-6.032,7.965-11.271,7.965C17.771,34.246,13.329,30.903,11.739,26.266z M24.723,26.473c0,0.432-0.875,0.78-1.957,0.78c-1.08,0-1.955-0.351-1.955-0.78c0-0.435,0.875-0.782,1.955-0.782C23.848,25.69,24.723,26.04,24.723,26.473z M19.323,21.676c0,1.03-0.838,1.868-1.868,1.868c-1.03,0-1.868-0.838-1.868-1.868c0-1.029,0.838-1.867,1.868-1.867C18.485,19.809,19.323,20.644,19.323,21.676z M29.95,21.676c0,1.03-0.84,1.868-1.869,1.868s-1.869-0.838-1.869-1.868c0-1.029,0.84-1.867,1.869-1.867C29.11,19.808,29.95,20.644,29.95,21.676z" fill={on ? '#1E3A5C' : '#41495A'}/>
                              </svg>
                            )}
                            <span style={{ fontSize: 15, fontWeight: 700, color: on ? ACCENT : '#41495A' }}>{g === 'boys' ? 'Boys' : 'Girls'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <LabelTag>Seat / sharing type</LabelTag>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                      {SEAT_TYPES.map(s => {
                        const on = seatType === s.k;
                        return (
                          <div key={s.k} onClick={() => setSeatType(s.k)} style={{ border: `1.6px solid ${on ? ACCENT : '#E7EAEE'}`, background: on ? '#EEF3F8' : '#fff', borderRadius: 12, padding: '12px 8px', cursor: 'pointer', textAlign: 'center' }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: on ? ACCENT : '#15243B' }}>{s.label}</div>
                            <div style={{ fontSize: 11, color: '#8B93A1', marginTop: 2 }}>{s.sub}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <FieldInput label="Total seats" value={totalSeats} onChange={setTotalSeats} placeholder="20" numeric />
                    <FieldInput label="Hostel name" value={title} onChange={setTitle} placeholder={`Al-Amin ${gender === 'boys' ? 'Boys' : 'Girls'} Hostel`} />
                  </div>
                  <div style={{ border: '1px solid #E7EAEE', borderRadius: 12, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: hasCurfew ? 12 : 0 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#15243B' }}>Curfew time</div>
                        <div style={{ fontSize: 12, color: '#8B93A1' }}>Gates locked after this hour</div>
                      </div>
                      <Toggle on={hasCurfew} onChange={() => setHasCurfew(v => !v)} />
                    </div>
                    {hasCurfew && <input value={curfewTime} onChange={e => setCurfewTime(e.target.value)} placeholder="10:00 PM" style={inp} />}
                  </div>
                </div>
              </>
            )}

            {/* STEP 4 */}
            {step === 4 && (
              <>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: '#15243B' }}>Photos &amp; video</h2>
                <p style={{ fontSize: 14, color: '#8B93A1', margin: '0 0 20px' }}>Real, recent photos get 3× more enquiries. First photo is your cover.</p>

                {/* Photo drop zone */}
                <div
                  onClick={() => photoInputRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); addPhotos(e.dataTransfer.files); }}
                  style={{ border: '1.8px dashed #C5CCD5', borderRadius: 16, padding: 26, textAlign: 'center', marginBottom: 16, background: '#F8FAFC', cursor: 'pointer' }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff', border: '1px solid #E7EAEE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M12 16V5m0 0L8 9m4-4l4 4" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#15243B', marginBottom: 4 }}>Drag photos here or click to browse</div>
                  <div style={{ fontSize: 12.5, color: '#8B93A1' }}>JPG · PNG · up to 20 images</div>
                  <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e => addPhotos(e.target.files)} style={{ display: 'none' }} />
                </div>

                {photos.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#8B93A1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tag each photo (optional)</div>
                    {photos.map((p, i) => {
                      const assigned = shotCatAssign[i] ?? '';
                      const cats = photoCatsFor(wizType);
                      return (
                        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: '#F8FAFC', borderRadius: 13, padding: 11, border: '1px solid #E7EAEE' }}>
                          <div style={{ position: 'relative', width: 68, height: 52, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            {i === 0 && <span style={{ position: 'absolute', bottom: 3, left: 3, background: 'rgba(21,36,59,0.86)', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 4, padding: '2px 5px' }}>Cover</span>}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                              <span style={{ fontSize: 12, color: '#8B93A1', fontWeight: 600 }}>Photo {i + 1}</span>
                              <button onClick={() => removePhoto(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C5303A', fontSize: 12, fontWeight: 600, padding: '0 2px' }}>✕ Remove</button>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                              {cats.map(cat => {
                                const active = assigned === cat;
                                return (
                                  <button key={cat} onClick={() => setShotCatAssign(prev => ({ ...prev, [i]: active ? '' : cat }))} style={{ padding: '3px 9px', borderRadius: 999, border: `1.4px solid ${active ? ACCENT : '#D3D9E0'}`, background: active ? '#EEF3F8' : '#fff', color: active ? ACCENT : '#6A7180', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                    {cat}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Video section */}
                <div style={{ borderTop: '1px solid #EDF0F4', paddingTop: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: '#15243B' }}>Video tour</div>
                      <div style={{ fontSize: 12, color: '#8B93A1' }}>Max 2 videos · 60 s each · Cloudflare Stream</div>
                    </div>
                    {videos.length < 2 && (
                      <button onClick={() => videoInputRef.current?.click()} style={{ border: `1.5px solid ${ACCENT}`, color: ACCENT, background: '#fff', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                        + Add video
                      </button>
                    )}
                    <input ref={videoInputRef} type="file" accept="video/mp4,video/quicktime,video/webm" onChange={e => { if (e.target.files?.[0]) addVideo(e.target.files[0]); e.target.value = ''; }} style={{ display: 'none' }} />
                  </div>
                  {videos.length === 0 && (
                    <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 18, textAlign: 'center', border: '1px dashed #D3D9E0' }}>
                      <div style={{ fontSize: 13, color: '#8B93A1' }}>Optional — but videos get more callbacks</div>
                    </div>
                  )}
                  {videos.map((v, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, background: '#F8FAFC', borderRadius: 12, padding: '11px 13px', border: '1px solid #E7EAEE', marginBottom: 8 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 9, background: v.error ? '#FEF0F0' : '#EEF3F8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {v.uploading
                          ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke={ACCENT} strokeWidth="2" strokeDasharray="31.4" strokeDashoffset="10"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" /></circle></svg>
                          : v.error ? <span style={{ fontSize: 16 }}>⚠️</span>
                          : <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 3l14 9-14 9V3z" fill={ACCENT} /></svg>}
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#15243B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.file.name}</div>
                        <div style={{ fontSize: 11.5, color: v.error ? '#C5303A' : '#8B93A1' }}>
                          {v.uploading ? 'Uploading…' : v.error ?? (v.cfId ? `Ready · ${v.cfId.slice(0, 8)}…` : 'Queued')}
                        </div>
                      </div>
                      <button onClick={() => removeVideo(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C5303A', fontSize: 12, fontWeight: 600 }}>✕</button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* STEP 5 — hostel pricing */}
            {step === 5 && isHostel && (
              <>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: '#15243B' }}>Seat pricing &amp; amenities</h2>
                <p style={{ fontSize: 14, color: '#8B93A1', margin: '0 0 22px' }}>One inclusive price per seat per month.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                  <div>
                    <LabelTag>Seat rent per month (৳)</LabelTag>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: '#8B93A1', fontWeight: 600 }}>৳</span>
                      <input value={price} onChange={e => setPrice(e.target.value.replace(/\D/g, ''))} placeholder="8000" style={{ ...inp, paddingLeft: 30 }} />
                    </div>
                    <div style={{ fontSize: 12, color: '#8B93A1', marginTop: 5 }}>Per seat. Electricity/water on actuals unless listed below.</div>
                  </div>
                  <div style={{ border: '1px solid #E7EAEE', borderRadius: 14, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: mealsIncluded ? 14 : 0 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#15243B' }}>🍽️ Meals included</div>
                        <div style={{ fontSize: 12, color: '#8B93A1' }}>Included in seat rent</div>
                      </div>
                      <Toggle on={mealsIncluded} onChange={() => setMealsIncluded(v => !v)} />
                    </div>
                    {mealsIncluded && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        {MEAL_OPTS.map(m => {
                          const on = meals.has(m);
                          return <button key={m} onClick={() => toggleMeal(m)} style={{ flex: 1, border: `1.5px solid ${on ? GREEN : '#E7EAEE'}`, background: on ? '#EAF1ED' : '#F8FAFC', color: on ? GREEN : '#6A7180', borderRadius: 10, padding: '9px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{m}</button>;
                        })}
                      </div>
                    )}
                  </div>
                  <div>
                    <LabelTag>Amenities included in rent</LabelTag>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                      {HOSTEL_AMEN.map(a => <CheckBox key={a.k} checked={hostelAmen.has(a.k)} label={a.k} icon={a.icon} onChange={() => toggleHostelAmen(a.k)} />)}
                    </div>
                  </div>
                  <label onClick={() => setNegotiable(n => !n)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1.6px solid #DBE0E6', borderRadius: 11, padding: '13px 15px', cursor: 'pointer' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#15243B' }}>Seat rent is negotiable</span>
                    <Toggle on={negotiable} onChange={() => setNegotiable(n => !n)} />
                  </label>
                </div>
              </>
            )}

            {/* STEP 5 — normal pricing */}
            {step === 5 && !isHostel && (
              <>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 22px', color: '#15243B' }}>{isBuy ? 'Sale price' : 'Pricing & terms'}</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div>
                    <LabelTag>{isBuy ? 'Sale price (৳)' : 'Monthly rent (৳)'}</LabelTag>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: '#8B93A1', fontWeight: 600 }}>৳</span>
                      <input value={price} onChange={e => setPrice(e.target.value.replace(/\D/g, ''))} placeholder={isBuy ? '8000000' : '38000'} style={{ ...inp, paddingLeft: 30 }} />
                    </div>
                  </div>
                  {!isBuy && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div>
                        <LabelTag>Advance (months)</LabelTag>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {['1','2','3','6'].map(a => {
                            const on = advance === a;
                            return <button key={a} onClick={() => setAdvance(a)} style={{ flex: 1, border: `1.6px solid ${on ? ACCENT : '#DBE0E6'}`, background: on ? '#EEF3F8' : '#fff', color: on ? ACCENT : '#15243B', borderRadius: 10, padding: '10px 0', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{a}</button>;
                          })}
                        </div>
                      </div>
                      <FieldInput label="Service charge (৳/mo)" value={serviceCharge} onChange={setServiceCharge} placeholder="2500" numeric />
                    </div>
                  )}
                  <label onClick={() => setNegotiable(n => !n)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1.6px solid #DBE0E6', borderRadius: 11, padding: '13px 15px', cursor: 'pointer' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#15243B' }}>Price is negotiable</span>
                    <Toggle on={negotiable} onChange={() => setNegotiable(n => !n)} />
                  </label>

                  <div style={{ marginTop: 18 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#15243B', marginBottom: 8 }}>{isBuy ? 'Possession' : 'Available from'}</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {([['immediate', isBuy ? 'Ready now' : 'Immediately'], ['date', 'From a date']] as const).map(([m, lbl]) => {
                        const on = availMode === m;
                        return (
                          <button key={m} type="button" onClick={() => setAvailMode(m)} style={{ flex: 1, padding: '11px 0', borderRadius: 11, border: `1.6px solid ${on ? ACCENT : '#DBE0E6'}`, background: on ? '#EEF3F8' : '#fff', color: on ? ACCENT : '#41495A', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit' }}>{lbl}</button>
                        );
                      })}
                    </div>
                    {availMode === 'date' && (
                      <input type="date" value={availDate} onChange={e => setAvailDate(e.target.value)} style={{ marginTop: 10, width: '100%', height: 46, border: '1.6px solid #DBE0E6', borderRadius: 11, padding: '0 14px', fontFamily: 'inherit', fontSize: 14, color: '#15243B', boxSizing: 'border-box' }} />
                    )}
                  </div>
                </div>
              </>
            )}

            {/* STEP 6 */}
            {step === 6 && (
              <>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: '#15243B' }}>Review &amp; publish</h2>
                <p style={{ fontSize: 14, color: '#8B93A1', margin: '0 0 20px' }}>Check the details. We verify before publishing.</p>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {reviewRows.map((r, i) => (
                    <div key={r.k} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < reviewRows.length - 1 ? '1px solid #EDF0F4' : 'none', gap: 16 }}>
                      <span style={{ fontSize: 13.5, color: '#8B93A1', fontWeight: 600, flexShrink: 0 }}>{r.k}</span>
                      <span style={{ fontSize: 14, color: '#15243B', fontWeight: 700, textAlign: 'right' }}>{r.v}</span>
                    </div>
                  ))}
                </div>
                {photos.length > 0 && (
                  <div style={{ display: 'flex', gap: 7, marginTop: 16 }}>
                    {photos.slice(0, 5).map((p, i) => (
                      <div key={i} style={{ width: 52, height: 42, borderRadius: 8, overflow: 'hidden', border: '1.5px solid #E7EAEE', flexShrink: 0 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                    {photos.length > 5 && <div style={{ width: 52, height: 42, borderRadius: 8, border: '1.5px solid #E7EAEE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#8B93A1' }}>+{photos.length - 5}</div>}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18, background: '#EAF1ED', borderRadius: 12, padding: '13px 15px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#3C7A58" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  <span style={{ fontSize: 13, color: '#3C7A58', fontWeight: 600 }}>Free to list · verified by Dwell before going live.</span>
                </div>
              </>
            )}

            {/* Nav */}
            <div style={{ display: 'flex', gap: 12, marginTop: 28, paddingTop: 22, borderTop: '1px solid #EDF0F4' }}>
              {step > 1 && (
                <button onClick={() => setStep(s => s - 1)} style={{ background: '#fff', color: '#15243B', border: '1px solid #D3D9E0', borderRadius: 12, padding: '13px 24px', fontSize: 14.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Back
                </button>
              )}
              <button onClick={handlePrimary} disabled={submitting || (step === 2 && pinLat === null)} style={{ flex: 1, background: (step === 2 && pinLat === null) ? '#C5CCD5' : ACCENT, color: '#fff', border: 'none', borderRadius: 12, padding: 13, fontSize: 15, fontWeight: 700, cursor: (submitting || (step === 2 && pinLat === null)) ? 'default' : 'pointer', fontFamily: 'inherit', opacity: submitting ? 0.7 : 1 }}>
                {primaryLabel}
              </button>
            </div>
          </div>

          {/* ── Live preview ── */}
          <aside className="list-preview-col" style={{ position: 'sticky', top: 88 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#8B93A1', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 11 }}>Live preview</div>
            <div style={{ background: '#fff', border: '1px solid #E7EAEE', borderRadius: 18, overflow: 'hidden', boxShadow: '0 18px 40px -30px rgba(21,36,59,0.4)' }}>
              <div style={{ aspectRatio: '16/11', background: '#DDD3C5', overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewCover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '14px 15px 17px' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#15243B', marginBottom: 3, lineHeight: 1.25 }}>{previewTitle}</div>
                <div style={{ fontSize: 12, color: '#7A8090', marginBottom: 10 }}>{area}</div>
                {isHostel && hostelAmen.size > 0 && (
                  <div style={{ display: 'flex', gap: 5, marginBottom: 10, flexWrap: 'wrap' }}>
                    {[...hostelAmen].slice(0, 3).map(a => (
                      <span key={a} style={{ fontSize: 11, fontWeight: 600, background: '#F4F6F9', color: '#6A7180', borderRadius: 6, padding: '2px 7px' }}>
                        {HOSTEL_AMEN.find(h => h.k === a)?.icon} {a}
                      </span>
                    ))}
                    {hostelAmen.size > 3 && <span style={{ fontSize: 11, fontWeight: 600, background: '#F4F6F9', color: '#6A7180', borderRadius: 6, padding: '2px 7px' }}>+{hostelAmen.size - 3}</span>}
                  </div>
                )}
                <div style={{ fontSize: 12, color: '#5A6172', fontWeight: 500, paddingTop: 10, borderTop: '1px solid #EDF0F4' }}>
                  {isHostel ? `${SEAT_TYPES.find(s => s.k === seatType)?.label} seat · ${gender === 'boys' ? '👦' : '👧'}`
                   : isOffice ? `Office · ${size ? size + ' sqft' : 'Size TBD'}`
                   : isRoom   ? `Single room · ${furnishing}`
                   : `${beds} ${Number(beds) === 1 ? 'Bed' : 'Beds'} · ${furnishing}`}
                </div>
                <div style={{ fontSize: 22, color: '#15243B', marginTop: 10, fontWeight: 700 }}>{previewPrice}</div>
              </div>
            </div>
            {isHostel && (
              <div style={{ marginTop: 13, background: '#EEF3F8', borderRadius: 11, padding: '11px 13px', fontSize: 12, color: ACCENT, fontWeight: 600, lineHeight: 1.5 }}>
                🎓 Hostel listings show a Seat badge and appear in student search.
              </div>
            )}
          </aside>
        </div>
      </main>
      {verifyGate && <BecomeOwnerSheet onClose={() => setVerifyGate(false)} redirectTo="/list" />}
      <Footer />
    </div>
  );
}
