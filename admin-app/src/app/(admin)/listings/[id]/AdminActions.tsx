'use client';
import { useState } from 'react';
import Link from 'next/link';
import RejectModal from './RejectModal';

interface Props {
  listingId: number;
  verified: boolean;
  marketplaceUrl: string;
}

export default function AdminActions({ listingId, verified, marketplaceUrl }: Props) {
  const [showReject, setShowReject] = useState(false);

  return (
    <>
      <div style={{
        background: '#fff', border: '1px solid #ECEEF1',
        borderRadius: 18, padding: 22,
        boxShadow: '0 1px 2px rgba(20,40,70,.03)',
      }}>
        <h3 style={{ fontSize: 13, fontWeight: 800, color: '#9AA6B6', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 14px' }}>
          Admin actions
        </h3>

        <Link href={`/listings/${listingId}/edit`} style={{ textDecoration: 'none' }}>
          <button className="bv-press" style={{
            width: '100%', height: 44, borderRadius: 12, border: 'none',
            cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
            color: '#fff', background: '#1E3A5C',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 10px 22px -10px rgba(30,58,92,.55)', marginBottom: 10,
          }}>
            ✎ Edit listing
          </button>
        </Link>

        {!verified ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <form action="/api/admin/moderation" method="POST">
              <input type="hidden" name="id" value={listingId} />
              <input type="hidden" name="action" value="approve" />
              <button type="submit" className="bv-press" style={{
                width: '100%', height: 42, borderRadius: 12, border: 'none',
                cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                color: '#fff', background: '#2E7D55',
              }}>✓ Approve</button>
            </form>
            <button
              onClick={() => setShowReject(true)}
              className="bv-press"
              style={{
                width: '100%', height: 42, borderRadius: 12,
                border: '1px solid #F0D9D2', background: '#fff',
                cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                color: '#B4402B',
              }}
            >✕ Reject</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button className="bv-press bv-fill" style={{
              '--fill': '#F6EFD9', height: 42, borderRadius: 12,
              border: '1px solid #EBDCB4', background: '#fff', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: '#9A7B1F',
            } as React.CSSProperties}>★ Feature</button>
            <button className="bv-press bv-fill" style={{
              '--fill': '#F8E8E3', height: 42, borderRadius: 12,
              border: '1px solid #F0D9D2', background: '#fff', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: '#B4402B',
            } as React.CSSProperties}>Take down</button>
          </div>
        )}

        <a
          href={`${marketplaceUrl}/listings/${listingId}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            marginTop: 12, fontSize: 13, fontWeight: 600, color: '#5C7FA3',
            textDecoration: 'none',
          }}
        >
          ↗ View in marketplace
        </a>
      </div>

      {showReject && (
        <RejectModal listingId={listingId} onClose={() => setShowReject(false)} />
      )}
    </>
  );
}
