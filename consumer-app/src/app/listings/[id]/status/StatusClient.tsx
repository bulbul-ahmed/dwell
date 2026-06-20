'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Footer from '@/components/Footer';

const ACCENT = '#1E3A5C';

type StatusListing = {
  id: number; title: string; area: string; price: number; cover: string;
  beds: number; floor: string; verified: boolean;
  moderationStatus: string; rejectionReason: string | null;
  createdAt: string;
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${h}:${m} ${ap}`;
}

type StepState = 'done' | 'active' | 'fail' | 'todo';
function StepRow({ state, label, sub, last }: { state: StepState; label: string; sub: string; last?: boolean }) {
  const color = state === 'fail' ? '#B4402B' : state === 'done' ? '#2E7D55' : state === 'active' ? ACCENT : '#C2C9D3';
  const fill  = state === 'todo' ? '#fff' : color;
  const glyph = state === 'fail' ? '✕' : state === 'done' ? '✓' : '';
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: fill, border: `2px solid ${color}`, color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {glyph}
        </div>
        {!last && <div style={{ width: 2, flex: 1, minHeight: 26, background: state === 'done' ? '#2E7D55' : '#E3E8EE', marginTop: 2 }} />}
      </div>
      <div style={{ paddingBottom: last ? 0 : 16 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: state === 'todo' ? '#9AA6B6' : '#15243B' }}>{label}</div>
        <div style={{ fontSize: 12, color: '#8893A4', marginTop: 1 }}>{sub}</div>
      </div>
    </div>
  );
}

export default function StatusClient() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [listing, setListing] = useState<StatusListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [confirmWd, setConfirmWd] = useState(false);

  useEffect(() => {
    fetch(`/api/listings/${id}/status`)
      .then(r => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json();
      })
      .then(d => { if (d?.listing) setListing(d.listing); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  async function withdraw() {
    setWithdrawing(true);
    try {
      const r = await fetch(`/api/listings/${id}/status`, { method: 'DELETE' });
      if (r.ok) { router.push('/account'); return; }
    } catch { /* fall through */ }
    setWithdrawing(false);
    setConfirmWd(false);
  }

  if (loading) {
    return <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B93A1', fontSize: 14 }}>Loading…</div>;
  }
  if (notFound || !listing) {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 30, marginBottom: 10 }}>🔍</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#15243B', marginBottom: 6 }}>Listing not found</div>
        <div style={{ fontSize: 13, color: '#8893A4', marginBottom: 18 }}>It may have been removed, or it isn’t yours.</div>
        <Link href="/account" style={{ fontSize: 13.5, fontWeight: 700, color: ACCENT, textDecoration: 'none' }}>← Back to account</Link>
      </div>
    );
  }

  const status = listing.moderationStatus ?? (listing.verified ? 'active' : 'pending');
  const isRejected = status === 'rejected';
  const isLive     = status === 'active';
  const isPending  = !isRejected && !isLive;

  const badgeBg = isRejected ? '#FDF1EF' : isLive ? '#EAF1ED' : '#FFF8E7';
  const badgeFg = isRejected ? '#B4402B' : isLive ? '#2E7D55' : '#A06D1A';
  const badgeLabel = isRejected ? '✕ Rejected' : isLive ? '✓ Live' : '⏳ Pending review';

  const submittedAt = fmtDateTime(listing.createdAt);

  return (
    <>
    <div style={{ maxWidth: 620, margin: '0 auto', padding: '20px 18px 40px' }}>
      <Link href="/account" style={{ fontSize: 13, fontWeight: 700, color: '#8893A4', textDecoration: 'none' }}>← Back to account</Link>

      {/* Header card */}
      <div style={{ marginTop: 16, background: '#fff', border: '1px solid #E7EAEE', borderRadius: 18, padding: 18, boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ width: 84, height: 66, borderRadius: 11, overflow: 'hidden', flexShrink: 0, background: '#DDD3C5' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={listing.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#15243B' }}>{listing.title}</div>
            <div style={{ fontSize: 12.5, color: '#8893A4', marginTop: 3 }}>{listing.area} · ৳{listing.price.toLocaleString('en')}/mo</div>
            <span style={{ display: 'inline-block', marginTop: 8, fontSize: 11, fontWeight: 800, borderRadius: 999, padding: '3px 11px', background: badgeBg, color: badgeFg }}>
              {badgeLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ marginTop: 16, background: '#fff', border: '1px solid #E7EAEE', borderRadius: 18, padding: 20, boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: '#15243B', margin: '0 0 16px' }}>Submission status</h3>

        <StepRow state="done" label="Submitted" sub={submittedAt} />
        {isRejected ? (
          <StepRow state="fail" label="Rejected" sub="Needs changes — see reason below" last />
        ) : (
          <>
            <StepRow state={isLive ? 'done' : 'active'} label="In review" sub={isLive ? 'Verification complete' : 'Our team is verifying · usually within 24h'} />
            <StepRow state={isLive ? 'done' : 'todo'} label="Published" sub={isLive ? 'Live in search' : 'Goes live once approved'} last />
          </>
        )}

        {/* Status note */}
        {isPending && (
          <div style={{ marginTop: 16, padding: '11px 14px', background: '#F4F8FC', borderRadius: 11, border: '1px solid #DDE7F0' }}>
            <span style={{ fontSize: 12.5, color: '#3D5878' }}>ℹ️ We verify every listing before it goes live. No action needed — you can still edit while it’s in review.</span>
          </div>
        )}
        {isRejected && listing.rejectionReason && (
          <div style={{ marginTop: 16, padding: '11px 14px', background: '#FDF1EF', borderRadius: 11, border: '1px solid #F0D9D2' }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: '#B4402B', marginBottom: 3 }}>Reason for rejection</div>
            <div style={{ fontSize: 12.5, color: '#B4402B' }}>{listing.rejectionReason}</div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isLive && (
          <Link href={`/listings/${listing.id}`} style={{ height: 46, borderRadius: 12, background: ACCENT, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            View public listing
          </Link>
        )}
        {isRejected && (
          <Link href={`/list?edit=${listing.id}`} style={{ height: 46, borderRadius: 12, background: '#B4402B', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Edit &amp; resubmit
          </Link>
        )}
        {(isPending || isLive) && (
          <Link href={`/list?edit=${listing.id}`} style={{ height: 46, borderRadius: 12, background: '#fff', color: ACCENT, border: `1.5px solid ${ACCENT}`, fontSize: 14, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Edit listing
          </Link>
        )}

        {/* Withdraw */}
        {!confirmWd ? (
          <button onClick={() => setConfirmWd(true)} style={{ height: 44, borderRadius: 12, background: '#fff', color: '#B4402B', border: '1.5px solid #F0D9D2', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Withdraw listing
          </button>
        ) : (
          <div style={{ padding: 14, borderRadius: 12, background: '#FDF1EF', border: '1px solid #F0D9D2' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#B4402B', marginBottom: 10 }}>Withdraw this listing? This removes it permanently.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={withdraw} disabled={withdrawing} style={{ flex: 1, height: 40, borderRadius: 10, background: '#B4402B', color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: withdrawing ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                {withdrawing ? 'Withdrawing…' : 'Yes, withdraw'}
              </button>
              <button onClick={() => setConfirmWd(false)} disabled={withdrawing} style={{ flex: 1, height: 40, borderRadius: 10, background: '#fff', color: '#6A7180', fontSize: 13, fontWeight: 700, border: '1.5px solid #D3D9E0', cursor: 'pointer', fontFamily: 'inherit' }}>
                Keep it
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
    <div style={{ marginTop: 40 }}><Footer /></div>
    </>
  );
}
