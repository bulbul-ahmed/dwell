'use client';

import { useState } from 'react';

// Approve / reject an owner's KYC submission. Approve action depends on owner
// type: individuals → approve-kyc, agencies → approve-agency.
export default function VerifyActions({ ownerId, isAgency }: { ownerId: number; isAgency: boolean }) {
  const [busy, setBusy] = useState<null | 'approve' | 'reject'>(null);

  async function run(action: string, which: 'approve' | 'reject') {
    if (busy) return;
    setBusy(which);
    try {
      await fetch('/api/admin/owners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ownerId, action }),
      });
      window.location.reload();
    } catch {
      setBusy(null);
    }
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        onClick={() => run('reject', 'reject')}
        disabled={!!busy}
        style={{
          height: 38, padding: '0 14px', borderRadius: 10,
          border: '1.5px solid #F0D9D2', background: '#fff',
          cursor: busy ? 'not-allowed' : 'pointer',
          fontSize: 13, fontWeight: 700, color: '#B4402B', fontFamily: 'inherit',
        }}
      >
        {busy === 'reject' ? '…' : 'Reject'}
      </button>
      <button
        onClick={() => run(isAgency ? 'approve-agency' : 'approve-kyc', 'approve')}
        disabled={!!busy}
        style={{
          height: 38, padding: '0 16px', borderRadius: 10, border: 'none',
          background: '#2E7D55', color: '#fff',
          cursor: busy ? 'not-allowed' : 'pointer',
          fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
        }}
      >
        {busy === 'approve' ? '…' : 'Approve'}
      </button>
    </div>
  );
}
