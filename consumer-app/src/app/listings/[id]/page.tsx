import { Suspense } from 'react';
import DetailClient from './DetailClient';

export default function ListingDetailPage() {
  return (
    <Suspense fallback={<div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B93A1', fontSize: 14 }}>Loading…</div>}>
      <DetailClient />
    </Suspense>
  );
}
