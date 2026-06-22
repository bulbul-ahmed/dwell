'use client';

import { useState } from 'react';
import { badge } from '@/lib/provider/badge';
import { useToastStore } from '@/lib/provider/toast-store';
import { Clock } from 'lucide-react';

export type VisitStatus = 'Requested' | 'Confirmed' | 'Suggested' | 'Completed' | 'Declined';

export interface BookingRow {
  id: number;
  seeker: string;
  listingTitle: string;
  slot: string;
  visitDate: string | null;
  visitTime: string | null;
  note: string | null;
  baseStatus: VisitStatus;
}

type StatusMap = Record<number, VisitStatus>;

function initials(name: string) {
  return name.split(' ')[0]?.[0]?.toUpperCase() ?? '?';
}

const AV_COLORS = ['#2C557F','#2E7D55','#7B3F9E','#9A6A1F','#2A5C8A','#B4402B'];

export default function VisitsClient({ bookings }: { bookings: BookingRow[] }) {
  const [statuses, setStatuses] = useState<StatusMap>({});
  const [suggestFor, setSuggestFor] = useState<number | null>(null);
  const [suggestDate, setSuggestDate] = useState('');
  const [suggestTime, setSuggestTime] = useState('');
  const [declineFor, setDeclineFor] = useState<number | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const notify = useToastStore(s => s.notify);

  function getStatus(b: BookingRow): VisitStatus {
    return statuses[b.id] ?? b.baseStatus;
  }

  async function act(b: BookingRow, action: string) {
    if (action === 'suggestOpen') {
      setDeclineFor(null);
      setSuggestFor(suggestFor === b.id ? null : b.id);
      return;
    }
    if (action === 'declineOpen') {
      setSuggestFor(null);
      setDeclineReason('');
      setDeclineFor(declineFor === b.id ? null : b.id);
      return;
    }

    const map: Record<string, { api: string; next: VisitStatus; ok: [string, string, 'success' | 'error' | 'info'] }> = {
      decline:     { api: 'decline',  next: 'Declined',  ok: ['Visit declined',     `${b.seeker} has been notified.`,      'error']   },
      complete:    { api: 'complete', next: 'Completed', ok: ['Marked complete',    'You can now leave a review.',         'success'] },
      cancel:      { api: 'cancel',   next: 'Declined',  ok: ['Visit cancelled',    `${b.seeker} has been notified.`,      'error']   },
      accept:      { api: 'accept',   next: 'Confirmed', ok: ['Visit confirmed',    `${b.seeker} has been notified.`,      'success'] },
      sendSuggest: { api: 'suggest',  next: 'Suggested', ok: ['New time suggested', `${b.seeker} will confirm your slot.`, 'info']    },
    };
    const m = map[action]; if (!m) return;

    const body: Record<string, string> = { action: m.api };
    if (action === 'sendSuggest') {
      if (!suggestDate || !suggestTime) { notify('Pick a time', 'Choose a date and time to suggest.', 'error'); return; }
      body.suggestedDate = suggestDate;
      body.suggestedTime = suggestTime;
    }
    if (action === 'decline') {
      body.reason = declineReason.trim();
    }

    const prev = statuses[b.id];
    setStatuses(p => ({ ...p, [b.id]: m.next }));   // optimistic
    setSuggestFor(null);
    setDeclineFor(null);
    try {
      const res = await fetch(`/api/visits/${b.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      notify(...m.ok);
    } catch {
      setStatuses(p => ({ ...p, [b.id]: prev }));   // rollback
      notify('Action failed', 'Please try again.', 'error');
    }
  }

  const requested = bookings.filter(b => { const s = getStatus(b); return s === 'Requested' || s === 'Suggested'; });
  const upcoming  = bookings.filter(b => getStatus(b) === 'Confirmed');
  const past      = bookings.filter(b => { const s = getStatus(b); return s === 'Completed' || s === 'Declined'; });

  const groups = [
    { title: 'Needs your response',  items: requested, cFg: '#9A6A1F', cBg: '#F7EFDD' },
    { title: 'Upcoming · confirmed', items: upcoming,  cFg: '#2E7D55', cBg: '#E7F1EC' },
    { title: 'Past visits',          items: past,      cFg: '#5A6172', cBg: '#EEF0F3' },
  ].filter(g => g.items.length);

  if (groups.length === 0) {
    return (
      <div className="animate-bvfade" style={{ textAlign: 'center', padding: '80px 0', color: '#8893A4', fontSize: 14 }}>
        No visits yet — accept leads to schedule visits.
      </div>
    );
  }

  return (
    <div className="animate-bvfade">
      {groups.map(grp => (
        <div key={grp.title} style={{ marginBottom: 26 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#15243B', margin: 0 }}>{grp.title}</h3>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: grp.cFg, background: grp.cBg, padding: '3px 9px', borderRadius: 999 }}>
              {grp.items.length}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {grp.items.map((v, idx) => {
              const status = getStatus(v);
              const b = badge(status);
              const dateColors: Record<string, [string, string]> = {
                Requested: ['#9A6A1F', '#F7EFDD'],
                Suggested: ['#2A5C8A', '#E6EFF7'],
                Confirmed: ['#2E7D55', '#E7F1EC'],
              };
              const [dateFg, dateBg] = dateColors[status] ?? ['#5A6172', '#EEF0F3'];
              const cardBd = status === 'Requested' ? '#EFE3C8' : '#ECEEF1';
              const avBg = AV_COLORS[idx % AV_COLORS.length];

              const dateParts = v.visitDate?.split('-') ?? [];
              const day = dateParts[2] ?? '—';
              const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
              const mon = dateParts[1] ? monthNames[parseInt(dateParts[1]) - 1] ?? '—' : '—';

              type BtnKind = 'primary' | 'suggest' | 'ghost' | 'neutral';
              const btnStyle = (kind: BtnKind) => ({
                primary:  { bg: '#2E7D55', fg: '#fff',    border: 'none',               fill: '#246046' },
                suggest:  { bg: '#fff',    fg: '#2A5C8A', border: '1px solid #D6E2EF',  fill: '#E6EFF7' },
                ghost:    { bg: '#fff',    fg: '#B4402B', border: '1px solid #F0D9D2',  fill: '#F8E8E3' },
                neutral:  { bg: '#fff',    fg: '#44506A', border: '1px solid #E2E7EE',  fill: '#EEF2F7' },
              }[kind]);

              type ActionDef = { label: string; action: string; kind: BtnKind };
              let actions: ActionDef[] = [];
              if (status === 'Requested') actions = [
                { label: '✓ Accept', action: 'accept', kind: 'primary' },
                { label: 'Suggest time', action: 'suggestOpen', kind: 'suggest' },
                { label: 'Decline', action: 'declineOpen', kind: 'ghost' },
              ];
              else if (status === 'Suggested') actions = [{ label: 'Awaiting seeker', action: '', kind: 'neutral' }];
              else if (status === 'Confirmed') actions = [
                { label: 'Mark complete', action: 'complete', kind: 'primary' },
                { label: 'Cancel', action: 'cancel', kind: 'ghost' },
              ];
              else if (status === 'Completed') actions = [{ label: 'Leave review', action: '', kind: 'neutral' }];
              else if (status === 'Declined')  actions = [{ label: 'Declined', action: '', kind: 'neutral' }];

              return (
                <div key={v.id} className="bv-lift" style={{ background: '#fff', border: `1px solid ${cardBd}`, borderRadius: 16, padding: 18, boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
                  <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:gap-4">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
                      <div style={{ width: 54, height: 60, borderRadius: 13, background: dateBg, color: dateFg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase' }}>{mon}</span>
                        <span style={{ fontSize: 22, fontWeight: 800, lineHeight: 1, marginTop: 1 }}>{day}</span>
                      </div>
                      <div style={{ width: 50, height: 50, borderRadius: 14, background: avBg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 17, flexShrink: 0 }}>
                        {initials(v.seeker)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 3, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 15, fontWeight: 700, color: '#15243B' }}>{v.seeker}</span>
                          <span style={{ fontSize: 10.5, fontWeight: 800, color: b.fg, background: b.bg, padding: '3px 9px', borderRadius: 999 }}>{status}</span>
                        </div>
                        <div style={{ fontSize: 13, color: '#44506A' }}>{v.listingTitle}</div>
                        <div style={{ fontSize: 12.5, color: '#8893A4', marginTop: 3, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <Clock size={14} color="#9AA6B6" strokeWidth={1.8} /> {v.visitTime ?? v.slot}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-[9px] lg:flex-shrink-0 lg:justify-end">
                      {actions.map(a => {
                        const s = btnStyle(a.kind);
                        return (
                          <button
                            key={a.label}
                            onClick={() => a.action && act(v, a.action)}
                            className={`bv-press ${a.kind !== 'primary' ? 'bv-fill' : ''}`}
                            style={{ '--fill': s.fill, height: 38, padding: '0 15px', borderRadius: 10, border: s.border, background: s.bg, cursor: a.action ? 'pointer' : 'default', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, color: s.fg } as React.CSSProperties}
                          >
                            {a.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {suggestFor === v.id && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px dashed #E2E7EE' }}>
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: '#44506A', marginBottom: 10 }}>Suggest an alternative time</div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                        <input type="date" value={suggestDate} onChange={e => setSuggestDate(e.target.value)}
                          style={{ padding: '10px 12px', borderRadius: 10, border: '1.5px solid #DBE0E6', fontFamily: 'inherit', fontSize: 13, color: '#3B4252' }} />
                        <input type="time" value={suggestTime} onChange={e => setSuggestTime(e.target.value)}
                          style={{ padding: '10px 12px', borderRadius: 10, border: '1.5px solid #DBE0E6', fontFamily: 'inherit', fontSize: 13, color: '#3B4252' }} />
                        <button onClick={() => act(v, 'sendSuggest')} className="bv-press" style={{ padding: '11px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: '#fff', background: '#2A5C8A' }}>
                          Send suggestion
                        </button>
                      </div>
                    </div>
                  )}

                  {declineFor === v.id && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px dashed #E2E7EE' }}>
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: '#44506A', marginBottom: 10 }}>Reason for declining (optional)</div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                        <input type="text" value={declineReason} onChange={e => setDeclineReason(e.target.value)} placeholder="e.g. Already rented"
                          style={{ flex: 1, minWidth: 200, padding: '10px 12px', borderRadius: 10, border: '1.5px solid #DBE0E6', fontFamily: 'inherit', fontSize: 13, color: '#3B4252' }} />
                        <button onClick={() => act(v, 'decline')} className="bv-press" style={{ padding: '11px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: '#fff', background: '#B4402B' }}>
                          Confirm decline
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
