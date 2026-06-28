'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToastStore } from '@/lib/provider/toast-store';
import { Users, CheckCircle2, XCircle, Clock, Filter } from 'lucide-react';

const ACCENT = '#1E3A5C';
const AMBER  = '#C9863A';

export interface ApplicationRow {
  id: number;
  listingId: number;
  listingTitle: string;
  listingCover: string | null;
  status: string;
  slot: string | null;
  createdAt: string;
  userName: string;
  userEmail: string;
  userAvatar: string | null;
}

const STATUS_META: Record<string, { label: string; bg: string; fg: string; Icon: typeof CheckCircle2 }> = {
  pending:   { label: 'Pending',   bg: '#FEF3E2', fg: AMBER,    Icon: Clock         },
  confirmed: { label: 'Confirmed', bg: '#E7F1EC', fg: '#2E7D55', Icon: CheckCircle2  },
  declined:  { label: 'Declined',  bg: '#FDE8E5', fg: '#C7553B', Icon: XCircle       },
};

const AV_COLORS = ['#2C557F','#2E7D55','#7B3F9E','#9A6A1F','#2A5C8A','#B4402B'];

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function timeAgo(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7)   return `${days}d ago`;
  return d.toLocaleDateString('en-BD', { month: 'short', day: 'numeric' });
}

type FilterKey = 'all' | 'pending' | 'confirmed' | 'declined';

export default function ApplicationsClient({ applications }: { applications: ApplicationRow[] }) {
  const [filter, setFilter]     = useState<FilterKey>('all');
  const [listingFilter, setListingFilter] = useState<number | null>(null);
  const [actioning, setActioning] = useState<number | null>(null);
  const [localStatus, setLocalStatus] = useState<Record<number, string>>({});
  const notify = useToastStore(s => s.notify);
  const router  = useRouter();

  const uniqueListings = Array.from(
    new Map(applications.map(a => [a.listingId, { id: a.listingId, title: a.listingTitle }])).values()
  );

  const rows = applications.filter(a => {
    const status = localStatus[a.id] ?? a.status;
    if (filter !== 'all' && status !== filter) return false;
    if (listingFilter !== null && a.listingId !== listingFilter) return false;
    return true;
  });

  const counts = {
    all:       applications.length,
    pending:   applications.filter(a => (localStatus[a.id] ?? a.status) === 'pending').length,
    confirmed: applications.filter(a => (localStatus[a.id] ?? a.status) === 'confirmed').length,
    declined:  applications.filter(a => (localStatus[a.id] ?? a.status) === 'declined').length,
  };

  const handleAction = async (id: number, action: 'confirmed' | 'declined') => {
    setActioning(id);
    try {
      const res = await fetch(`/api/bookings/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action }),
      });
      if (res.ok) {
        setLocalStatus(prev => ({ ...prev, [id]: action }));
        notify(
          action === 'confirmed' ? 'Application accepted' : 'Application declined',
          action === 'confirmed' ? 'Renter will be notified.' : 'Renter notified.',
          action === 'confirmed' ? 'success' : 'info',
        );
        router.refresh();
      } else {
        notify('Action failed', 'Could not update status. Try again.', 'error');
      }
    } catch {
      notify('Action failed', 'Network error.', 'error');
    } finally {
      setActioning(null);
    }
  };

  return (
    <div className="animate-bvfade">
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.4, color: '#15243B', margin: 0 }}>Applications</h2>
        <p style={{ fontSize: 14, color: '#8893A4', margin: '5px 0 0' }}>Visit requests and rental applications from renters</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-3" style={{ gap: 12, marginBottom: 20 }}>
        {([['pending', 'Pending'], ['confirmed', 'Confirmed'], ['declined', 'Declined']] as const).map(([key, label]) => {
          const m = STATUS_META[key];
          return (
            <div key={key} style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 14, padding: '14px 16px', cursor: 'pointer' }} onClick={() => setFilter(filter === key ? 'all' : key)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <m.Icon size={15} color={m.fg} strokeWidth={2} />
                </div>
                {filter === key && <span style={{ fontSize: 10, fontWeight: 800, color: m.fg, padding: '1px 6px', borderRadius: 999, background: m.bg }}>Active filter</span>}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#15243B', letterSpacing: -0.5 }}>{counts[key]}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#8893A4', marginTop: 2 }}>{label}</div>
            </div>
          );
        })}
      </div>

      {/* Filters row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 5, background: '#fff', border: '1px solid #ECEEF1', borderRadius: 11, padding: 4 }}>
          {(['all', 'pending', 'confirmed', 'declined'] as FilterKey[]).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 13px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700,
              color: filter === f ? '#fff' : '#5A6172',
              background: filter === f ? ACCENT : 'transparent',
            }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {counts[f as FilterKey] > 0 && <span style={{ marginLeft: 5, opacity: 0.75 }}>{counts[f as FilterKey]}</span>}
            </button>
          ))}
        </div>

        {uniqueListings.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={13} color="#8893A4" strokeWidth={2} />
            <select
              value={listingFilter ?? ''}
              onChange={e => setListingFilter(e.target.value ? Number(e.target.value) : null)}
              style={{ border: '1px solid #ECEEF1', borderRadius: 9, padding: '7px 10px', fontSize: 12.5, fontFamily: 'inherit', color: '#41495A', background: '#fff', cursor: 'pointer', outline: 'none' }}
            >
              <option value="">All listings</option>
              {uniqueListings.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Application list */}
      {rows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', border: '1px dashed #D3D9E0', borderRadius: 18 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: '#EEF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Users size={24} color={ACCENT} strokeWidth={1.7} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#15243B', marginBottom: 5 }}>
            {filter === 'all' ? 'No applications yet' : `No ${filter} applications`}
          </div>
          <div style={{ fontSize: 13, color: '#8893A4' }}>
            {filter === 'all' ? 'When renters book visits or apply, they appear here' : `Switch to "All" to see other applications`}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map((a, idx) => {
            const status = localStatus[a.id] ?? a.status;
            const m = STATUS_META[status] ?? STATUS_META.pending;
            const isActioning = actioning === a.id;
            return (
              <div key={a.id} style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', flexWrap: 'wrap' }}>
                  {/* Applicant avatar */}
                  <div style={{
                    width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                    backgroundColor: a.userAvatar ? '#ECEEF1' : AV_COLORS[idx % AV_COLORS.length],
                    backgroundImage: a.userAvatar ? `url('${a.userAvatar}')` : undefined,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 800,
                  }}>
                    {!a.userAvatar && initials(a.userName)}
                  </div>

                  {/* Applicant info */}
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: '#15243B' }}>{a.userName}</div>
                    <div style={{ fontSize: 12.5, color: '#8893A4', marginTop: 2 }}>{a.userEmail}</div>
                  </div>

                  {/* Listing */}
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#B0BBC8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>Listing</div>
                    <Link href={`/dashboard/listings/${a.listingId}`} style={{ fontSize: 13, fontWeight: 700, color: ACCENT, textDecoration: 'none' }}>
                      {a.listingTitle}
                    </Link>
                  </div>

                  {/* Date + slot */}
                  <div style={{ minWidth: 120 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#B0BBC8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>Requested</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#41495A' }}>{timeAgo(a.createdAt)}</div>
                    {a.slot && <div style={{ fontSize: 11.5, color: '#8893A4', marginTop: 2 }}>{a.slot}</div>}
                  </div>

                  {/* Status badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 999, background: m.bg }}>
                    <m.Icon size={13} color={m.fg} strokeWidth={2} />
                    <span style={{ fontSize: 12, fontWeight: 800, color: m.fg }}>{m.label}</span>
                  </div>

                  {/* Actions */}
                  {status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button
                        onClick={() => handleAction(a.id, 'confirmed')}
                        disabled={isActioning}
                        style={{
                          height: 34, padding: '0 14px', borderRadius: 9,
                          border: '1px solid #A8D5B8', background: '#E7F1EC',
                          color: '#2E7D55', fontSize: 12.5, fontWeight: 700,
                          cursor: isActioning ? 'wait' : 'pointer', fontFamily: 'inherit',
                          opacity: isActioning ? 0.6 : 1,
                        }}
                      >
                        {isActioning ? '…' : 'Accept'}
                      </button>
                      <button
                        onClick={() => handleAction(a.id, 'declined')}
                        disabled={isActioning}
                        style={{
                          height: 34, padding: '0 14px', borderRadius: 9,
                          border: '1px solid #F0D3CF', background: '#FDE8E5',
                          color: '#C7553B', fontSize: 12.5, fontWeight: 700,
                          cursor: isActioning ? 'wait' : 'pointer', fontFamily: 'inherit',
                          opacity: isActioning ? 0.6 : 1,
                        }}
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
