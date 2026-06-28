'use client';

import { useState } from 'react';
import BecomeOwnerSheet from '@/components/BecomeOwnerSheet';

// Shown in the dashboard when the owner hasn't verified their phone yet.
// Publishing listings is blocked until verified — this nudges them to finish.
export default function OwnerVerifyBanner({ status }: { status: string }) {
  const [open, setOpen] = useState(false);
  if (status !== 'unverified') return null;

  return (
    <>
      <div style={{ margin: '0 34px', marginTop: 18, padding: '14px 18px', borderRadius: 14, background: '#FFF6E6', border: '1px solid #F0DCB4', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 20 }}>📱</span>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: '#7A5A12' }}>Verify your phone to publish listings</div>
          <div style={{ fontSize: 12.5, color: '#9A7A2E' }}>Add and verify your phone number plus your address to start listing properties.</div>
        </div>
        <button onClick={() => setOpen(true)} style={{ height: 38, padding: '0 18px', borderRadius: 10, border: 'none', background: '#1E3A5C', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          Verify now
        </button>
      </div>
      {open && <BecomeOwnerSheet onClose={() => setOpen(false)} />}
    </>
  );
}
