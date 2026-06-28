'use client';

import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { toLatLng } from '@/lib/mapUtils';

const ACCENT = '#1E3A5C';
const MAP_ID = 'DEMO_MAP_ID';
const AFTAB_NAGAR_CENTER = { lat: 23.7525, lng: 90.4523 };

interface Props {
  mapX: string;
  mapY: string;
  /** real DB coordinates (preferred over the legacy percent mapX/mapY) */
  lat?: number | null;
  lng?: number | null;
}

export default function DetailMap({ mapX, mapY, lat, lng }: Props) {
  const exact = (typeof lat === 'number' && typeof lng === 'number')
    ? { lat, lng }
    : toLatLng(mapX, mapY);
  // Offset ~80m so exact address isn't pinpointed until visit is approved
  const approx = exact
    ? { lat: exact.lat + 0.0007, lng: exact.lng + 0.0005 }
    : AFTAB_NAGAR_CENTER;

  return (
    <div style={{ position: 'relative', height: 280, borderRadius: 16, overflow: 'hidden', border: '1px solid #DDE2E8', marginBottom: 8 }}>
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!} libraries={['places']}>
        <Map
          mapId={MAP_ID}
          defaultCenter={approx}
          defaultZoom={15}
          gestureHandling="none"
          disableDefaultUI
          style={{ width: '100%', height: '100%' }}
        >
          <AdvancedMarker position={approx}>
            {/* Blurred radius circle — visual cue that exact location is hidden */}
            <div style={{
              position: 'relative',
              width: 80,
              height: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {/* Pulsing blur halo */}
              <div style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: `rgba(30,58,92,0.12)`,
                backdropFilter: 'blur(3px)',
              }} />
              {/* Inner dot */}
              <div style={{
                width: 18,
                height: 18,
                background: ACCENT,
                borderRadius: '50%',
                border: '3px solid #fff',
                boxShadow: '0 3px 10px -2px rgba(22,48,77,0.7)',
                position: 'relative',
                zIndex: 1,
              }} />
            </div>
          </AdvancedMarker>
        </Map>
      </APIProvider>

      {/* Small disclaimer — bottom corner only, doesn't cover the map */}
      <div style={{
        position: 'absolute',
        left: 12,
        bottom: 12,
        background: 'rgba(21,36,59,0.78)',
        color: '#fff',
        borderRadius: 6,
        padding: '5px 10px',
        fontSize: 11.5,
        fontWeight: 600,
        pointerEvents: 'none',
        backdropFilter: 'blur(4px)',
        maxWidth: 220,
      }}>
        📍 Exact address after visit is approved
      </div>
    </div>
  );
}
