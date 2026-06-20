'use client';

import Link from 'next/link';
import { useToastStore } from '@/lib/provider/toast-store';

export default function ListingDetailActions({ listingId, statusLabel }: { listingId: number; statusLabel: string }) {
  const notify = useToastStore(s => s.notify);
  return (
    <div style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18, padding: 22, boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
      <h3 style={{ fontSize: 13, fontWeight: 800, color: '#9AA6B6', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 14px' }}>Manage</h3>
      <Link href={`/boost?listing=${listingId}`} style={{ textDecoration: 'none' }}>
        <button className="bv-press" style={{
          width: '100%', height: 44, borderRadius: 12, border: 'none', cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 14, fontWeight: 700, color: '#fff',
          background: 'linear-gradient(135deg, #C9A24B, #A67C2E)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: '0 10px 22px -10px rgba(166,124,46,.6)', marginBottom: 10,
        }}>
          ★ Boost this listing
        </button>
      </Link>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button onClick={() => notify('Opening editor', 'Edit listing details in the wizard.', 'info')} className="bv-press bv-fill" style={{ '--fill': '#EEF2F7', height: 42, borderRadius: 12, border: '1px solid #E2E7EE', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: '#44506A' } as React.CSSProperties}>Edit</button>
        <button onClick={() => notify(statusLabel === 'Paused' ? 'Listing resumed' : 'Listing paused', statusLabel === 'Paused' ? 'It is live in search again.' : 'Hidden from search until resumed.', 'info')} className="bv-press bv-fill" style={{ '--fill': '#EEF0F3', height: 42, borderRadius: 12, border: '1px solid #E2E7EE', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: '#5A6172' } as React.CSSProperties}>
          {statusLabel === 'Paused' ? 'Resume' : 'Pause'}
        </button>
        <button onClick={() => notify('Marked as rented', 'Removed from active search results.', 'success')} className="bv-press bv-fill" style={{ '--fill': '#E6EFF7', height: 42, borderRadius: 12, border: '1px solid #D6E2EF', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: '#2A5C8A' } as React.CSSProperties}>✓ Mark rented</button>
        <button onClick={() => notify('Link copied', 'Public listing URL copied to clipboard.', 'success')} className="bv-press bv-fill" style={{ '--fill': '#E7F1EC', height: 42, borderRadius: 12, border: '1px solid #CDE6D8', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: '#2E7D55' } as React.CSSProperties}>Share</button>
      </div>
    </div>
  );
}
