'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToastStore } from '@/lib/provider/toast-store';

export interface LeadRow {
  id: number;
  userName: string;
  listingTitle: string;
  lastMessage: string | null;
  timeAgo: string;
}

type Filter = 'all' | 'New' | 'Replied';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',     label: 'All'     },
  { key: 'New',     label: 'New'     },
  { key: 'Replied', label: 'Replied' },
];

const AV_COLORS = ['#2C557F','#2E7D55','#7B3F9E','#9A6A1F','#2A5C8A','#B4402B'];

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export default function LeadsClient({ leads }: { leads: LeadRow[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [replied, setReplied] = useState<Set<number>>(new Set());
  const notify = useToastStore(s => s.notify);
  const router = useRouter();

  const rows = filter === 'all'
    ? leads
    : filter === 'Replied'
      ? leads.filter(l => replied.has(l.id))
      : leads.filter(l => !replied.has(l.id));

  const [sending, setSending] = useState<number | null>(null);

  async function reply(l: LeadRow) {
    const content = window.prompt(`Reply to ${l.userName}:`);
    if (!content || !content.trim()) return;
    setSending(l.id);
    try {
      const res = await fetch(`/api/threads/${l.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed' }));
        notify('Reply failed', err.error ?? 'Could not send message.', 'error');
        return;
      }
      setReplied(prev => new Set(prev).add(l.id));
      notify('Reply sent', `Your message was delivered to ${l.userName}.`, 'success');
      router.refresh();
    } catch {
      notify('Reply failed', 'Network error.', 'error');
    } finally {
      setSending(null);
    }
  }

  return (
    <div className="animate-bvfade">
      <div style={{ display: 'flex', gap: 6, background: '#fff', border: '1px solid #E6E9EE', borderRadius: 12, padding: 5, width: 'fit-content', marginBottom: 18 }}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="bv-press"
            style={{
              whiteSpace: 'nowrap', padding: '7px 15px', borderRadius: 9,
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 12.5, fontWeight: 700,
              color: filter === f.key ? '#fff' : '#5A6172',
              background: filter === f.key ? '#1E3A5C' : 'transparent',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#8893A4', fontSize: 14 }}>No leads yet</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          {rows.map((l, idx) => {
            const isNew = !replied.has(l.id);
            return (
              <div key={l.id} className="bv-lift flex flex-col gap-3.5 lg:flex-row lg:items-center lg:gap-4" style={{
                background: '#fff', border: `1px solid ${isNew ? '#D9E7DD' : '#ECEEF1'}`, borderRadius: 16,
                padding: '16px 18px',
                boxShadow: '0 1px 2px rgba(20,40,70,.03)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 13, background: AV_COLORS[idx % AV_COLORS.length],
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 16, flexShrink: 0,
                }}>
                  {initials(l.userName)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 3 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 700, color: '#15243B' }}>{l.userName}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 800, color: '#2A5C8A', background: '#E6EFF7', padding: '3px 8px', borderRadius: 999 }}>Chat</span>
                    {isNew && (
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2E7D55', display: 'inline-block' }} />
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: '#44506A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {l.lastMessage ?? 'Started a conversation'}
                  </div>
                  <div style={{ fontSize: 12, color: '#9AA6B6', marginTop: 3 }}>on {l.listingTitle} · {l.timeAgo}</div>
                </div>
                </div>
                <div className="flex flex-wrap gap-[9px] lg:flex-shrink-0 lg:justify-end">
                  <button
                    onClick={() => reply(l)}
                    disabled={sending === l.id}
                    className="bv-press"
                    style={{ height: 38, padding: '0 16px', borderRadius: 10, border: 'none', cursor: sending === l.id ? 'wait' : 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: '#fff', background: '#1E3A5C', opacity: sending === l.id ? 0.6 : 1 }}
                  >
                    {sending === l.id ? 'Sending…' : 'Reply'}
                  </button>
                  <button
                    onClick={() => router.push('/dashboard/visits')}
                    className="bv-press bv-fill"
                    style={{ '--fill': '#EEF2F7', height: 38, padding: '0 14px', borderRadius: 10, border: '1px solid #E2E7EE', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: '#44506A' } as React.CSSProperties}
                  >
                    View visit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
