'use client';

import { Suspense } from 'react';
import StatusClient from '@/app/listings/[id]/status/StatusClient';

export default function DashboardListingStatusPage() {
  return (
    <Suspense fallback={<div style={{ height: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B93A1', fontSize: 14 }}>Loading…</div>}>
      <StatusClient fromDashboard={true} />
    </Suspense>
  );
}
