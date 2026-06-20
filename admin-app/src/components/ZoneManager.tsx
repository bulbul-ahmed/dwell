'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  GoogleMap, Polygon, DrawingManager, useJsApiLoader,
} from '@react-google-maps/api';
import { MapPin, Plus, Pencil, Trash2, X, MousePointer } from 'lucide-react';

export type Zone = {
  id: number;
  name: string;
  areaName: string;
  polygon: { type: string; coordinates: number[][][] };
  color: string;
  active: boolean;
  createdAt: string;
};

const LIBRARIES: ('drawing')[] = ['drawing'];
// Aftab Nagar, Dhaka
const DEFAULT_CENTER = { lat: 23.7525, lng: 90.4523 };
const DEFAULT_ZOOM   = 15;
const PALETTE = ['#1E3A5C', '#2E7D55', '#B4402B', '#9A6A1F', '#6B48C8', '#C85F48', '#2B7D8E', '#7D2B6B'];

function geoToPath(coords: number[][]): google.maps.LatLngLiteral[] {
  return coords.slice(0, -1).map(([lng, lat]) => ({ lat, lng }));
}

function polyToGeo(poly: google.maps.Polygon): { type: string; coordinates: number[][][] } {
  const arr = poly.getPath().getArray().map(p => [p.lng(), p.lat()]);
  arr.push(arr[0]);
  return { type: 'Polygon', coordinates: [arr] };
}

function centroid(coords: number[][]): { lat: number; lng: number } {
  const pts = coords.slice(0, -1);
  return {
    lat: pts.reduce((s, c) => s + c[1], 0) / pts.length,
    lng: pts.reduce((s, c) => s + c[0], 0) / pts.length,
  };
}

interface Props { initialZones: Zone[] }

export default function ZoneManager({ initialZones }: Props) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!,
    libraries: LIBRARIES,
    version: '3.64',
  });

  const [zones, setZones]         = useState<Zone[]>(initialZones);
  const [mode, setMode]           = useState<'view' | 'drawing' | 'editing'>('view');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [hoveredId, setHoveredId]   = useState<number | null>(null);
  const [draftGeo, setDraftGeo]   = useState<{ type: string; coordinates: number[][][] } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formName, setFormName]   = useState('');
  const [formArea, setFormArea]   = useState('Aftab Nagar');
  const [formColor, setFormColor] = useState(PALETTE[0]);
  const [saving, setSaving]       = useState(false);

  const editPolyRef  = useRef<google.maps.Polygon | null>(null);
  const mapRef       = useRef<google.maps.Map | null>(null);
  // stable ref always has latest zones — avoids stale closure in DrawingManager callback
  const zonesRef     = useRef(zones);
  useEffect(() => { zonesRef.current = zones; }, [zones]);

  const selectedZone = zones.find(z => z.id === selectedId) ?? null;
  const activeCount  = zones.filter(z => z.active).length;

  // ── ESC cancels drawing / editing ────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && mode !== 'view') {
        setMode('view');
        setSelectedId(null);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode]);

  // ── Polygon drawing complete — stable callback via ref ────────────────────
  const onPolygonComplete = useCallback((poly: google.maps.Polygon) => {
    const geo = polyToGeo(poly);
    poly.setMap(null);
    const idx = zonesRef.current.length % PALETTE.length;
    setDraftGeo(geo);
    setFormName('');
    setFormArea('Aftab Nagar');
    setFormColor(PALETTE[idx]);
    setModalOpen(true);
    setMode('view');
  }, []); // intentionally stable — uses zonesRef

  // ── Save new zone ─────────────────────────────────────────────────────────
  async function saveNewZone() {
    if (!formName.trim() || !draftGeo) return;
    setSaving(true);
    const res = await fetch('/api/admin/zones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: formName.trim(), areaName: formArea.trim(), polygon: draftGeo, color: formColor }),
    });
    const zone = await res.json();
    setZones(z => [zone, ...z]);
    setModalOpen(false);
    setDraftGeo(null);
    setSaving(false);
  }

  // ── Save edited zone ──────────────────────────────────────────────────────
  async function saveEdit() {
    if (!selectedZone) return;
    const geo = editPolyRef.current ? polyToGeo(editPolyRef.current) : selectedZone.polygon;
    setSaving(true);
    const res = await fetch(`/api/admin/zones/${selectedZone.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formName.trim() || selectedZone.name,
        areaName: formArea.trim() || selectedZone.areaName,
        polygon: geo,
        color: formColor,
      }),
    });
    const updated = await res.json();
    setZones(z => z.map(x => x.id === updated.id ? updated : x));
    setMode('view');
    setSelectedId(null);
    setSaving(false);
  }

  // ── Toggle active ─────────────────────────────────────────────────────────
  async function toggleZone(id: number) {
    const res = await fetch(`/api/admin/zones/${id}/toggle`, { method: 'PATCH' });
    const updated = await res.json();
    setZones(z => z.map(x => x.id === updated.id ? updated : x));
  }

  // ── Delete zone ───────────────────────────────────────────────────────────
  async function deleteZone(id: number) {
    if (!confirm('Delete this zone? Listings in it will lose zone reference.')) return;
    await fetch(`/api/admin/zones/${id}`, { method: 'DELETE' });
    setZones(z => z.filter(x => x.id !== id));
    if (selectedId === id) { setSelectedId(null); setMode('view'); }
  }

  // ── Start editing ─────────────────────────────────────────────────────────
  function startEdit(zone: Zone) {
    setSelectedId(zone.id);
    setFormName(zone.name);
    setFormArea(zone.areaName);
    setFormColor(zone.color);
    editPolyRef.current = null;
    setMode('editing');
    if (mapRef.current && zone.polygon.coordinates[0]) {
      const c = centroid(zone.polygon.coordinates[0]);
      mapRef.current.panTo(c);
      mapRef.current.setZoom(16);
    }
  }

  function cancelMode() {
    setMode('view');
    setSelectedId(null);
  }

  if (!isLoaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 500, color: '#8B93A1', fontSize: 14 }}>
        Loading map…
      </div>
    );
  }

  const currentPaletteColor = PALETTE[zones.length % PALETTE.length];

  return (
    <div style={{ animation: 'bvfade .45s cubic-bezier(.22,1,.36,1) both' }}>

      {/* ── Modal: name new zone ─────────────────────────────────────────── */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,24,42,.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '28px 30px 24px', width: 440, boxShadow: '0 24px 64px rgba(0,0,0,.22)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#15243B' }}>Name this zone</h3>
              <button onClick={() => { setModalOpen(false); setDraftGeo(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8B93A1', padding: 4 }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#8B93A1', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 6 }}>Zone name</label>
                <input
                  autoFocus
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && formName.trim()) saveNewZone(); }}
                  placeholder="e.g. Block B"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #DBE0E6', fontSize: 14, color: '#15243B', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#8B93A1', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 6 }}>Area / neighbourhood</label>
                <input
                  value={formArea}
                  onChange={e => setFormArea(e.target.value)}
                  placeholder="e.g. Aftab Nagar"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #DBE0E6', fontSize: 14, color: '#15243B', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#8B93A1', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 8 }}>Colour</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {PALETTE.map(c => (
                    <button key={c} onClick={() => setFormColor(c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: formColor === c ? '3px solid #fff' : '3px solid transparent', outline: formColor === c ? `2px solid ${c}` : 'none', cursor: 'pointer' }} />
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button onClick={() => { setModalOpen(false); setDraftGeo(null); }} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: '1.5px solid #DBE0E6', background: '#fff', color: '#41495A', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Discard
              </button>
              <button
                onClick={saveNewZone}
                disabled={!formName.trim() || saving}
                style={{ flex: 2, padding: '11px 0', borderRadius: 10, border: 'none', background: formName.trim() ? '#15243B' : '#C5CCD5', color: '#fff', fontSize: 14, fontWeight: 700, cursor: formName.trim() ? 'pointer' : 'default', fontFamily: 'inherit' }}
              >
                {saving ? 'Saving…' : 'Save zone'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'start' }}>

        {/* ── Left: zone list ───────────────────────────────────────────── */}
        <div style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18, overflow: 'hidden', boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>

          {/* header */}
          <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid #F0F2F5' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#15243B' }}>Zones</h3>
              <button
                onClick={() => mode === 'drawing' ? cancelMode() : setMode('drawing')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 13px', borderRadius: 99, border: 'none',
                  background: mode === 'drawing' ? '#FEF3EC' : '#15243B',
                  color: mode === 'drawing' ? '#B4402B' : '#fff',
                  fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'background .15s',
                }}
              >
                {mode === 'drawing' ? <><X size={13} /> Cancel (Esc)</> : <><Plus size={13} /> Add zone</>}
              </button>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: '#8B93A1' }}>{activeCount} active · {zones.length} total</p>
          </div>

          {/* drawing hint in list panel */}
          {mode === 'drawing' && (
            <div style={{ padding: '11px 16px', background: '#FFFBF0', borderBottom: '1px solid #F0E0A0', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <MousePointer size={14} color="#9A6A1F" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ margin: '0 0 2px', fontSize: 12.5, color: '#7A5400', fontWeight: 700 }}>Drawing mode active</p>
                <p style={{ margin: 0, fontSize: 11.5, color: '#9A6A1F', lineHeight: 1.5 }}>Click to place points. Click the first point again to close the shape.</p>
              </div>
            </div>
          )}

          {/* edit panel */}
          {mode === 'editing' && selectedZone && (
            <div style={{ padding: '14px 16px', background: '#EEF3F8', borderBottom: '1px solid #D8E3F0' }}>
              <p style={{ margin: '0 0 10px', fontSize: 12.5, fontWeight: 700, color: '#1E3A5C' }}>Editing: {selectedZone.name}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Zone name" style={{ padding: '8px 10px', borderRadius: 8, border: '1.5px solid #DBE0E6', fontSize: 13, color: '#15243B', outline: 'none', fontFamily: 'inherit' }} />
                <input value={formArea} onChange={e => setFormArea(e.target.value)} placeholder="Area name" style={{ padding: '8px 10px', borderRadius: 8, border: '1.5px solid #DBE0E6', fontSize: 13, color: '#15243B', outline: 'none', fontFamily: 'inherit' }} />
                <div style={{ display: 'flex', gap: 6 }}>
                  {PALETTE.map(c => <button key={c} onClick={() => setFormColor(c)} style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: formColor === c ? '3px solid #fff' : '2px solid transparent', outline: formColor === c ? `2px solid ${c}` : 'none', cursor: 'pointer' }} />)}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                  <button onClick={cancelMode} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: '1.5px solid #DBE0E6', background: '#fff', color: '#41495A', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                  <button onClick={saveEdit} disabled={saving} style={{ flex: 2, padding: '8px 0', borderRadius: 8, border: 'none', background: '#15243B', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{saving ? 'Saving…' : 'Save changes'}</button>
                </div>
              </div>
            </div>
          )}

          {/* zone list */}
          <div style={{ maxHeight: 520, overflowY: 'auto' }}>
            {zones.length === 0 && mode !== 'drawing' && (
              <div style={{ padding: '36px 20px 32px', textAlign: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EEF3F8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <MapPin size={20} color="#1E3A5C" />
                </div>
                <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: '#15243B' }}>No zones yet</p>
                <p style={{ margin: '0 0 16px', fontSize: 12.5, color: '#8B93A1', lineHeight: 1.6 }}>Click <strong>Add zone</strong>, then draw a polygon on the map to define a service area.</p>
                <button
                  onClick={() => setMode('drawing')}
                  style={{ padding: '8px 18px', borderRadius: 99, border: 'none', background: '#15243B', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  <Plus size={12} style={{ marginRight: 5, verticalAlign: 'middle' }} />Draw first zone
                </button>
              </div>
            )}
            {zones.length === 0 && mode === 'drawing' && (
              <div style={{ padding: '20px', textAlign: 'center', color: '#8B93A1', fontSize: 12.5 }}>
                Start drawing on the map →
              </div>
            )}
            {zones.map(zone => {
              const isHovered  = hoveredId === zone.id;
              const isSelected = selectedId === zone.id;
              return (
                <div
                  key={zone.id}
                  onMouseEnter={() => setHoveredId(zone.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    padding: '12px 16px', borderBottom: '1px solid #F4F6F9',
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: isSelected ? '#EEF3F8' : isHovered ? '#F8F9FB' : '#fff',
                    transition: 'background .12s', cursor: 'default',
                  }}
                >
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: zone.color, flexShrink: 0, boxShadow: `0 0 0 2px ${zone.color}22` }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#15243B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{zone.name}</div>
                    <div style={{ fontSize: 11, color: '#8B93A1' }}>{zone.areaName}</div>
                  </div>
                  <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 7px', borderRadius: 99, background: zone.active ? '#E7F1EC' : '#F4F6F9', color: zone.active ? '#2E7D55' : '#8B93A1', flexShrink: 0 }}>
                    {zone.active ? 'Active' : 'Off'}
                  </span>
                  <div style={{ display: 'flex', gap: 2 }}>
                    <button
                      onClick={() => toggleZone(zone.id)}
                      title={zone.active ? 'Disable' : 'Enable'}
                      role="switch"
                      aria-checked={zone.active}
                      style={{
                        position: 'relative',
                        width: 36,
                        height: 21,
                        flexShrink: 0,
                        borderRadius: 99,
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        background: zone.active ? '#34C759' : '#E2E5EA',
                        transition: 'background 180ms ease',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          top: 2,
                          left: 2,
                          width: 17,
                          height: 17,
                          borderRadius: '50%',
                          background: '#fff',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
                          transform: zone.active ? 'translateX(15px)' : 'translateX(0)',
                          transition: 'transform 180ms ease',
                        }}
                      />
                    </button>
                    <button onClick={() => startEdit(zone)} title="Edit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8B93A1', padding: 4, display: 'flex', borderRadius: 6 }}>
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => deleteZone(zone.id)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C5CCD5', padding: 4, display: 'flex', borderRadius: 6 }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#B4402B')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#C5CCD5')}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right: map ────────────────────────────────────────────────── */}
        <div style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18, overflow: 'hidden', boxShadow: '0 1px 2px rgba(20,40,70,.03)', position: 'relative' }}>

          {/* map header */}
          <div style={{ padding: '13px 18px', borderBottom: '1px solid #F0F2F5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: mode === 'drawing' ? '#F59E0B' : mode === 'editing' ? '#3B82F6' : '#2E7D55', boxShadow: `0 0 0 3px ${mode === 'drawing' ? '#FEF3EC' : mode === 'editing' ? '#EEF3F8' : '#E7F1EC'}` }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#15243B' }}>
                {mode === 'drawing' ? 'Drawing mode — click to place points, close the shape to finish'
                 : mode === 'editing' ? `Editing ${selectedZone?.name} — drag vertices to reshape`
                 : `${zones.length} zone${zones.length !== 1 ? 's' : ''} defined · Aftab Nagar`}
              </span>
            </div>
            {mode !== 'view' && (
              <button onClick={cancelMode} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 99, border: '1px solid #E7EAEE', background: '#fff', color: '#41495A', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                <X size={11} /> Cancel
              </button>
            )}
          </div>

          {/* drawing mode overlay banner ON MAP */}
          {mode === 'drawing' && (
            <div style={{
              position: 'absolute', top: 54, left: '50%', transform: 'translateX(-50%)',
              zIndex: 10, background: 'rgba(21,36,59,0.88)', color: '#fff',
              padding: '8px 18px', borderRadius: 99, fontSize: 12.5, fontWeight: 600,
              backdropFilter: 'blur(4px)', pointerEvents: 'none',
              display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap',
              boxShadow: '0 4px 16px rgba(0,0,0,.2)',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
              Click to place points · Click first point to close
            </div>
          )}

          <GoogleMap
            mapContainerStyle={{ width: '100%', height: 620 }}
            center={DEFAULT_CENTER}
            zoom={DEFAULT_ZOOM}
            onLoad={map => { mapRef.current = map; }}
            options={{
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: true,
              zoomControl: true,
              gestureHandling: 'cooperative',
              styles: [
                { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
                { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
              ],
            }}
          >
            {/* existing zone polygons — always rendered */}
            {zones.map(zone => {
              const isEditingThis = mode === 'editing' && zone.id === selectedId;
              const isHighlighted = hoveredId === zone.id || isEditingThis;
              return (
                <Polygon
                  key={zone.id}
                  path={geoToPath(zone.polygon.coordinates[0])}
                  options={{
                    fillColor: zone.color,
                    fillOpacity: isHighlighted ? 0.38 : (zone.active ? 0.18 : 0.06),
                    strokeColor: zone.color,
                    strokeOpacity: isHighlighted ? 1 : (zone.active ? 0.75 : 0.3),
                    strokeWeight: isHighlighted ? 2.5 : 1.6,
                    editable: isEditingThis,
                    draggable: false,
                    zIndex: isHighlighted ? 10 : 1,
                    clickable: true,
                  }}
                  onLoad={poly => { if (isEditingThis) editPolyRef.current = poly; }}
                  onMouseOver={() => setHoveredId(zone.id)}
                  onMouseOut={() => setHoveredId(null)}
                  onClick={() => { if (mode === 'view') startEdit(zone); }}
                />
              );
            })}

            {/* DrawingManager — ALWAYS mounted, drawingMode controlled via prop */}
            <DrawingManager
              onPolygonComplete={onPolygonComplete}
              options={{
                drawingControl: false,
                drawingMode: mode === 'drawing'
                  ? google.maps.drawing.OverlayType.POLYGON
                  : null,
                polygonOptions: {
                  fillColor: currentPaletteColor,
                  fillOpacity: 0.22,
                  strokeColor: currentPaletteColor,
                  strokeWeight: 2.5,
                  editable: true,
                  clickable: false,
                },
              }}
            />
          </GoogleMap>
        </div>

      </div>
    </div>
  );
}
