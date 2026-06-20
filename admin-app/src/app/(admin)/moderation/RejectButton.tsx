'use client';

import { useState } from 'react';

export default function RejectButton({ listingId }: { listingId: number }) {
  const [busy, setBusy] = useState(false);

  async function handleReject() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch('/api/admin/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: listingId, action: 'reject' }),
      });
      // Refresh the page to reflect the change
      window.location.reload();
    } catch {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleReject}
      disabled={busy}
      title="Reject"
      style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        border: '1.5px solid #F0D9D2', background: busy ? '#F5EAE7' : '#fff',
        cursor: busy ? 'not-allowed' : 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, color: '#B4402B',
        transition: 'background .12s, border-color .12s',
      }}
    >
      {busy ? '…' : '✕'}
    </button>
  );
}
