'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { useEffect } from 'react';
import type { Listing } from '@/types';
import { fmtPrice } from '@/data/listings';
import { toLatLng, AFTAB_NAGAR_CENTER } from '@/lib/mapUtils';

const ACCENT = '#1E3A5C';
const MAP_ID = 'DEMO_MAP_ID';
const DEFAULT_ZOOM = 15;

export interface MapBounds { north: number; south: number; east: number; west: number }

function shortPrice(l: Listing): string {
  if (l.sale) {
    const p = l.price;
    if (p >= 1e7) return `৳${+(p / 1e7).toFixed(1)}Cr`;
    return `৳${Math.round(p / 1e5)}L`;
  }
  return `৳${Math.round(l.price / 1000)}k`;
}

interface Props {
  listings: Listing[];
  activeId: number | null;
  hoverId: number | null;
  onActivate: (id: number | null) => void;
  onHover: (id: number | null) => void;
  /** show the in-map preview popover (desktop only; mobile uses the bottom sheet) */
  enablePopover?: boolean;
  /** fired whenever the visible map bounds change — drives "Search this area" */
  onBoundsChange?: (b: MapBounds) => void;
}

/** Null-rendering helper: pans to the selected pin (A & E) and reports zoom/bounds
 *  on the map's "idle" event — which settles after movement, so it never floods
 *  React with state updates during the map's own initialization. */
function MapController({ active, enablePopover, onZoom, onBounds }: {
  active: Listing | null;
  enablePopover: boolean;
  onZoom: (z: number) => void;
  onBounds?: (b: MapBounds) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !active) return;
    const pos = toLatLng(active.mapX, active.mapY);
    if (!pos) return;
    map.panTo(pos);
    if ((map.getZoom() ?? DEFAULT_ZOOM) < 16) map.setZoom(16);
    if (enablePopover) window.setTimeout(() => map.panBy(0, -110), 60);
  }, [map, active, enablePopover]);

  useEffect(() => {
    if (!map) return;
    const update = () => {
      const z = map.getZoom();
      if (typeof z === 'number') onZoom(Math.round(z));
      const b = map.getBounds();
      if (b && onBounds) onBounds(b.toJSON());
    };
    const listener = map.addListener('idle', update);
    update();
    return () => listener.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  return null;
}

export default function SearchMap({ listings, activeId, hoverId, onActivate, onHover, enablePopover = true, onBoundsChange }: Props) {
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  const active = activeId != null ? listings.find(l => l.id === activeId) ?? null : null;

  // ── Cluster pins by a zoom-dependent grid (feature G) ──────────────────────
  const clusters = useMemo(() => {
    const cell = 360 / Math.pow(2, zoom) / 6; // ~tile-sized: individual at default zoom, merge when zoomed out
    type Bucket = { items: { l: Listing; pos: { lat: number; lng: number } }[] };
    const buckets: Record<string, Bucket> = {};
    for (const l of listings) {
      const pos = toLatLng(l.mapX, l.mapY);
      if (!pos) continue;
      const key = l.id === activeId ? `solo-${l.id}` : `${Math.floor(pos.lat / cell)}_${Math.floor(pos.lng / cell)}`;
      (buckets[key] ??= { items: [] }).items.push({ l, pos });
    }
    return Object.values(buckets);
  }, [listings, zoom, activeId]);

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!} libraries={['places']}>
      <Map
        mapId={MAP_ID}
        defaultCenter={AFTAB_NAGAR_CENTER}
        defaultZoom={DEFAULT_ZOOM}
        gestureHandling="greedy"
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={false}
        style={{ width: '100%', height: '100%' }}
        onClick={() => onActivate(null)}
      >
        <MapController
          active={active}
          enablePopover={enablePopover}
          onZoom={z => setZoom(prev => (prev === z ? prev : z))}
          onBounds={onBoundsChange}
        />

        {clusters.map((cluster, ci) => {
          // ── Cluster bubble ──
          if (cluster.items.length > 1) {
            const lat = cluster.items.reduce((s, x) => s + x.pos.lat, 0) / cluster.items.length;
            const lng = cluster.items.reduce((s, x) => s + x.pos.lng, 0) / cluster.items.length;
            return (
              <ClusterMarker key={`cluster-${ci}`} lat={lat} lng={lng} count={cluster.items.length} zoom={zoom} />
            );
          }

          // ── Single price pin ──
          const { l } = cluster.items[0];
          const pos = toLatLng(l.mapX, l.mapY)!;
          const isActive = activeId === l.id;
          const isHover = hoverId === l.id;
          const lit = isActive || isHover;
          const dim = activeId != null && !isActive;
          return (
            <AdvancedMarker
              key={l.id}
              position={pos}
              zIndex={isActive ? 30 : isHover ? 20 : 1}
              onClick={() => onActivate(isActive ? null : l.id)}
            >
              <div
                onMouseEnter={() => onHover(l.id)}
                onMouseLeave={() => onHover(null)}
                style={{
                  background: lit ? '#fff' : ACCENT,
                  color: lit ? ACCENT : '#fff',
                  fontSize: 12, fontWeight: 700, padding: '6px 11px', borderRadius: 999,
                  cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: "'Plus Jakarta Sans', sans-serif",
                  border: `2px solid ${lit ? ACCENT : '#fff'}`,
                  opacity: dim ? 0.45 : 1,
                  transform: lit ? 'scale(1.08)' : 'scale(1)',
                  boxShadow: lit
                    ? `0 0 0 2px ${ACCENT}, 0 6px 14px -4px rgba(22,48,77,0.5)`
                    : '0 6px 14px -4px rgba(22,48,77,0.7)',
                  transition: 'all .15s',
                }}
              >
                {shortPrice(l)}
              </div>
            </AdvancedMarker>
          );
        })}

        {/* ===== Preview popover anchored above the selected pin (desktop) ===== */}
        {enablePopover && active && (() => {
          const pos = toLatLng(active.mapX, active.mapY);
          if (!pos) return null;
          return (
            <AdvancedMarker position={pos} zIndex={50}>
              <div
                onMouseEnter={() => onHover(active.id)}
                onMouseLeave={() => onHover(null)}
                style={{
                  position: 'absolute', bottom: 22, left: '50%', transform: 'translateX(-50%)',
                  width: 232, background: '#fff', borderRadius: 14, overflow: 'hidden',
                  boxShadow: '0 18px 40px -12px rgba(21,36,59,0.45)', fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                <Link href={`/listings/${active.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  <div style={{ position: 'relative', aspectRatio: '16/10', background: '#DDD3C5' }}>
                    <div style={{ width: '100%', height: '100%', backgroundImage: `url('${active.coverUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                  </div>
                  <div style={{ padding: '10px 12px 12px' }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#15243B', lineHeight: 1.25, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{active.title}</div>
                    <div style={{ fontSize: 11.5, color: '#7A8090', marginBottom: 8 }}>{active.area}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: '#5A6172', fontWeight: 500, marginBottom: 9 }}>
                      <span>{active.beds} {active.beds > 1 ? 'Beds' : 'Bed'}</span>
                      <span style={{ color: '#CCD3DB' }}>·</span>
                      <span>{active.baths} {active.baths > 1 ? 'Baths' : 'Bath'}</span>
                      <span style={{ color: '#CCD3DB' }}>·</span>
                      <span>{active.size} sqft</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#15243B' }}>{fmtPrice(active)}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: ACCENT, borderRadius: 999, padding: '5px 12px' }}>View details</span>
                    </div>
                  </div>
                </Link>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onActivate(null); }}
                  aria-label="Close preview"
                  style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.92)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="#41495A" strokeWidth="2.4" strokeLinecap="round" /></svg>
                </button>
                <div style={{ position: 'absolute', bottom: -7, left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: 14, height: 14, background: '#fff' }} />
              </div>
            </AdvancedMarker>
          );
        })()}
      </Map>
    </APIProvider>
  );
}

function ClusterMarker({ lat, lng, count, zoom }: { lat: number; lng: number; count: number; zoom: number }) {
  const map = useMap();
  return (
    <AdvancedMarker
      position={{ lat, lng }}
      zIndex={5}
      onClick={() => { if (map) { map.panTo({ lat, lng }); map.setZoom(Math.min((map.getZoom() ?? zoom) + 2, 19)); } }}
    >
      <div style={{
        background: ACCENT, color: '#fff', fontSize: 13, fontWeight: 700,
        width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '3px solid #fff', boxShadow: '0 6px 14px -4px rgba(22,48,77,0.7)', cursor: 'pointer',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        {count}
      </div>
    </AdvancedMarker>
  );
}
