import { Suspense } from 'react';
import StatusClient from './StatusClient';

export default function ListingStatusPage() {
  return (
    <Suspense fallback={<div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B93A1', fontSize: 14 }}>Loading…</div>}>
      <StatusClient />
    </Suspense>
  );
}
