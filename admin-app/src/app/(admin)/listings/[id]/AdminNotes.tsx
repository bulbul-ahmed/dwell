'use client';
import { useState } from 'react';

interface Props {
  listingId: number;
  initialNotes: string;
}

export default function AdminNotes({ listingId, initialNotes }: Props) {
  const [notes, setNotes] = useState(initialNotes);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const fd = new FormData();
    fd.append('id', String(listingId));
    fd.append('adminNotes', notes);
    await fetch('/api/admin/listings/notes', { method: 'POST', body: fd });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{
      background: '#fff', border: '1px solid #ECEEF1',
      borderRadius: 18, padding: 22,
      boxShadow: '0 1px 2px rgba(20,40,70,.03)',
    }}>
      <h3 style={{ fontSize: 13, fontWeight: 800, color: '#9AA6B6', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 12px' }}>
        Internal notes
      </h3>
      <p style={{ fontSize: 12, color: '#B0BAC8', margin: '0 0 10px' }}>Visible to admins only. Never shown to owner.</p>
      <textarea
        value={notes}
        onChange={e => { setNotes(e.target.value); setSaved(false); }}
        placeholder="Add moderation notes, verification details, follow-up actions…"
        style={{
          width: '100%', minHeight: 100, border: '1px solid #E2E7EE', borderRadius: 12,
          padding: '10px 12px', fontFamily: 'inherit', fontSize: 13, color: '#15243B',
          resize: 'vertical', outline: 'none', lineHeight: 1.55, boxSizing: 'border-box',
          marginBottom: 10,
        }}
      />
      <button
        onClick={save}
        disabled={saving}
        style={{
          width: '100%', height: 38, borderRadius: 10, border: 'none',
          background: saved ? '#2E7D55' : '#1E3A5C', color: '#fff',
          fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
          cursor: saving ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s',
        }}
      >
        {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save notes'}
      </button>
    </div>
  );
}
