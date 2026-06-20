'use client';
import { useState } from 'react';

const REASONS = [
  'Fake or misleading photos',
  'Wrong / inaccurate information',
  'Duplicate listing',
  'Policy violation',
  'Incomplete information',
  'Other',
];

interface Props {
  listingId: number;
  onClose: () => void;
}

export default function RejectModal({ listingId, onClose }: Props) {
  const [reason, setReason] = useState(REASONS[0]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleReject() {
    setLoading(true);
    const fd = new FormData();
    fd.append('id', String(listingId));
    fd.append('action', 'reject');
    fd.append('reason', reason);
    fd.append('note', note);
    await fetch('/api/admin/moderation', { method: 'POST', body: fd });
    window.location.href = '/moderation';
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: 'rgba(15,25,45,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 20, padding: 28, width: 440,
          boxShadow: '0 24px 64px rgba(15,25,45,0.22)',
          animation: 'bvfade .25s cubic-bezier(.22,1,.36,1) both',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#15243B' }}>Reject listing</h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#8893A4' }}>Select a reason — this will be sent to the owner.</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#8893A4', lineHeight: 1 }}>✕</button>
        </div>

        {/* Reason selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {REASONS.map(r => (
            <label
              key={r}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 11, cursor: 'pointer',
                border: reason === r ? '1.5px solid #B4402B' : '1.5px solid #E2E7EE',
                background: reason === r ? '#FDF1EF' : '#fff',
                transition: 'all 0.15s',
              }}
            >
              <input
                type="radio"
                name="reject_reason"
                value={r}
                checked={reason === r}
                onChange={() => setReason(r)}
                style={{ accentColor: '#B4402B', width: 16, height: 16 }}
              />
              <span style={{ fontSize: 13.5, fontWeight: 600, color: reason === r ? '#B4402B' : '#44506A' }}>{r}</span>
            </label>
          ))}
        </div>

        {/* Optional note */}
        <textarea
          placeholder="Additional note for the owner (optional)..."
          value={note}
          onChange={e => setNote(e.target.value)}
          style={{
            width: '100%', minHeight: 80, border: '1px solid #E2E7EE', borderRadius: 12,
            padding: '10px 14px', fontFamily: 'inherit', fontSize: 13.5, color: '#15243B',
            resize: 'none', outline: 'none', lineHeight: 1.55, boxSizing: 'border-box',
            marginBottom: 20,
          }}
        />

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleReject}
            disabled={loading}
            style={{
              flex: 1, height: 44, borderRadius: 12, border: 'none',
              background: loading ? '#E8A49B' : '#B4402B', color: '#fff',
              fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Rejecting…' : '✕ Confirm rejection'}
          </button>
          <button
            onClick={onClose}
            style={{
              height: 44, padding: '0 20px', borderRadius: 12,
              border: '1px solid #E2E7EE', background: '#fff', color: '#44506A',
              fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
