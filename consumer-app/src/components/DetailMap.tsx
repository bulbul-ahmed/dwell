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
  // Offset ~80m so exact address isn't revealed until visit is approved
  const approx = exact
    ? { lat: exact.lat + 0.0007, lng: exact.lng + 0.0005 }
    : AFTAB_NAGAR_CENTER;

  return (
    <div style={{ position: 'relative', height: 260, borderRadius: 16, overflow: 'hidden', border: '1px solid #DDE2E8', marginBottom: 8 }}>
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
            <div style={{
              width: 28,
              height: 28,
              background: ACCENT,
              borderRadius: '50% 50% 50% 0',
              transform: 'rotate(-45deg)',
              border: '3px solid #fff',
              boxShadow: '0 6px 14px -4px rgba(22,48,77,0.7)',
            }} />
          </AdvancedMarker>
        </Map>
      </APIProvider>
      <div style={{
        position: 'absolute',
        left: 16,
        bottom: 16,
        background: 'rgba(21,36,59,0.86)',
        color: '#fff',
        borderRadius: 8,
        padding: '7px 12px',
        fontSize: 12.5,
        fontWeight: 600,
        pointerEvents: 'none',
      }}>
        Exact pin shown after visit is approved
      </div>
    </div>
  );
}
