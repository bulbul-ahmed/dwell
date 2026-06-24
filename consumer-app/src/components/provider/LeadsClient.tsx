'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToastStore } from '@/lib/provider/toast-store';

export interface LeadRow {
  id: number;
  userName: string;
  userAvatar: string | null;
  listingId: number;
  listingTitle: string;
  listingCover: string | null;
  lastMessage: string | null;
  timeAgo: string;
  lastAtMs: number;
}

// Urgency for unreplied leads, based on age of last activity.
function urgency(l: LeadRow): { color: string; label: string } | null {
  const hrs = (Date.now() - l.lastAtMs) / 3600000;
  if (hrs >= 48) return { color: '#C0392B', label: 'Overdue' };
  if (hrs >= 24) return { color: '#C77A0A', label: 'Waiting' };
  return null;
}

interface MsgRow {
  id: number;
  threadId: number;
  senderRole: 'me' | 'other';
  content: string;
  createdAt: string;
}

type Filter = 'all' | 'New' | 'Replied';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',     label: 'All'     },
  { key: 'New',     label: 'New'     },
  { key: 'Replied', label: 'Replied' },
];

const ACCENT = '#1E3A5C';
const AV_COLORS = ['#2C557F','#2E7D55','#7B3F9E','#9A6A1F','#2A5C8A','#B4402B'];

// Quick-reply templates. {name} → renter first name, {listing} → listing title.
const CANNED: { label: string; text: string }[] = [
  { label: 'Still available',  text: 'Hi {name}, yes — {listing} is still available. Would you like to schedule a visit?' },
  { label: 'Propose a visit',  text: 'Hi {name}, I can show you {listing} tomorrow between 4–6 PM. Does that work for you?' },
  { label: 'Share rent & terms', text: 'Hi {name}, the rent and advance details for {listing} are in the listing. Happy to answer any questions.' },
  { label: 'Already rented',   text: 'Hi {name}, thanks for your interest — {listing} has just been rented. I’ll let you know if it frees up.' },
];

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit', hour12: true });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7)   return d.toLocaleDateString('en-BD', { weekday: 'short' });
  return d.toLocaleDateString('en-BD', { month: 'short', day: 'numeric' });
}

// ─── Message bubble ──────────────────────────────────────────────────────────
function Bubble({ me, text, time }: { me: boolean; text: string; time: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: me ? 'flex-end' : 'flex-start' }}>
      <div style={{
        maxWidth: '78%',
        background: me ? ACCENT : '#fff',
        color: me ? '#fff' : '#15243B',
        border: me ? 'none' : '1px solid #E7EAEE',
        borderRadius: me ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
        padding: '10px 14px', fontSize: 14, lineHeight: 1.45,
      }}>
        {text}
        <div style={{ fontSize: 10.5, color: me ? 'rgba(255,255,255,0.7)' : '#A8AEB9', textAlign: 'right', marginTop: 4 }}>
          {time}
        </div>
      </div>
    </div>
  );
}

export default function LeadsClient({ leads }: { leads: LeadRow[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [replied, setReplied] = useState<Set<number>>(new Set());
  const [active, setActive] = useState<LeadRow | null>(null);
  const [msgs, setMsgs] = useState<MsgRow[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const msgsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const seenIds = useRef(new Set<number>());
  const notify = useToastStore(s => s.notify);
  const router = useRouter();

  const byFilter = filter === 'all'
    ? leads
    : filter === 'Replied'
      ? leads.filter(l => replied.has(l.id))
      : leads.filter(l => !replied.has(l.id));

  const q = query.trim().toLowerCase();
  const rows = q
    ? byFilter.filter(l =>
        l.userName.toLowerCase().includes(q) ||
        l.listingTitle.toLowerCase().includes(q) ||
        (l.lastMessage ?? '').toLowerCase().includes(q))
    : byFilter;

  // ── Load messages when active thread changes ──────────────────────────────
  useEffect(() => {
    if (!active) return;
    seenIds.current = new Set();
    setLoadingMsgs(true);
    fetch(`/api/threads/${active.id}`)
      .then(r => r.json())
      .then(({ messages: rows }: { messages: MsgRow[] }) => {
        rows?.forEach(m => seenIds.current.add(m.id));
        setMsgs(rows ?? []);
      })
      .catch(() => setMsgs([]))
      .finally(() => setLoadingMsgs(false));
  }, [active?.id]);

  // ── Live incoming renter messages via SSE ─────────────────────────────────
  useEffect(() => {
    if (!active) return;
    const es = new EventSource(`/api/threads/${active.id}/stream`);
    es.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data) as MsgRow;
        if (msg.senderRole !== 'other') return; // 'other' = renter (owner viewer)
        if (seenIds.current.has(msg.id)) return;
        seenIds.current.add(msg.id);
        setMsgs(prev => [...prev, msg]);
      } catch { /* malformed */ }
    };
    return () => es.close();
  }, [active?.id]);

  // ── Auto-scroll to newest ─────────────────────────────────────────────────
  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [msgs.length, active?.id]);

  const send = useCallback(async () => {
    const txt = draft.trim();
    if (!txt || !active || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/threads/${active.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: txt }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed' }));
        notify('Reply failed', err.error ?? 'Could not send message.', 'error');
        return;
      }
      const { message } = await res.json() as { message: MsgRow };
      // From provider's perspective our reply renders as "me"
      seenIds.current.add(message.id);
      setMsgs(prev => [...prev, { ...message, senderRole: 'me' }]);
      setReplied(prev => new Set(prev).add(active.id));
      setDraft('');
      router.refresh();
    } catch {
      notify('Reply failed', 'Network error.', 'error');
    } finally {
      setSending(false);
    }
  }, [draft, active, sending, notify, router]);

  return (
    <div className="animate-bvfade flex flex-col lg:flex-row lg:gap-4" style={{ height: 'calc(100vh - 150px)', minHeight: 460 }}>

      {/* ── LEFT: lead list ── */}
      <div
        className={`${active ? 'hidden lg:flex' : 'flex'} flex-col min-h-0 lg:w-[360px] lg:flex-shrink-0`}
      >
        <div style={{ display: 'flex', gap: 6, background: '#fff', border: '1px solid #E6E9EE', borderRadius: 12, padding: 5, width: 'fit-content', marginBottom: 14 }}>
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
                background: filter === f.key ? ACCENT : 'transparent',
              }}
            >
              {f.label}{f.key === 'New' && (() => { const n = leads.filter(l => !replied.has(l.id)).length; return n ? ` ${n}` : ''; })()}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="7" stroke="#8B93A1" strokeWidth="2" />
            <path d="M20 20l-3.2-3.2" stroke="#8B93A1" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search name, listing or message"
            style={{ width: '100%', border: '1px solid #E6E9EE', borderRadius: 11, padding: '10px 12px 10px 34px', fontSize: 13, fontFamily: 'inherit', color: '#15243B', outline: 'none', background: '#fff' }}
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label="Clear search"
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 22, height: 22, borderRadius: 6, border: 'none', background: '#EEF2F7', color: '#5A6172', cursor: 'pointer', fontSize: 13, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          )}
        </div>

        {rows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#8893A4', fontSize: 14 }}>
            {q ? `No leads match “${query.trim()}”` : leads.length === 0 ? 'No leads yet' : 'Nothing here'}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 overflow-y-auto min-h-0 pr-0.5">
            {rows.map((l, idx) => {
              const isNew = !replied.has(l.id);
              const isActive = active?.id === l.id;
              const u = isNew ? urgency(l) : null;
              return (
                <button
                  key={l.id}
                  onClick={() => setActive(l)}
                  className="bv-lift text-left"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 13, width: '100%',
                    background: '#fff',
                    border: `1px solid ${isActive ? '#B9CFE2' : isNew ? '#D9E7DD' : '#ECEEF1'}`,
                    borderLeft: `3px solid ${isActive ? ACCENT : u ? u.color : 'transparent'}`,
                    borderRadius: 14, padding: '13px 15px', cursor: 'pointer',
                    fontFamily: 'inherit',
                    boxShadow: '0 1px 2px rgba(20,40,70,.03)',
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    backgroundColor: l.userAvatar ? '#E7EAEE' : AV_COLORS[idx % AV_COLORS.length],
                    backgroundImage: l.userAvatar ? `url('${l.userAvatar}')` : undefined,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 15, flexShrink: 0,
                  }}>
                    {!l.userAvatar && initials(l.userName)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#15243B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.userName}</span>
                      {u ? (
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: u.color, padding: '2px 7px', borderRadius: 999, flexShrink: 0, textTransform: 'uppercase', letterSpacing: 0.3 }}>{u.label}</span>
                      ) : isNew ? (
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2E7D55', flexShrink: 0 }} />
                      ) : null}
                    </div>
                    <div style={{ fontSize: 12.5, color: '#44506A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {l.lastMessage ?? 'Started a conversation'}
                    </div>
                    <div style={{ fontSize: 11.5, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span style={{ color: '#9AA6B6' }}>{l.listingTitle} · </span>
                      <span style={{ color: u ? u.color : '#9AA6B6', fontWeight: u ? 700 : 400 }}>{l.timeAgo}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── RIGHT: conversation pane ── */}
      <div
        className={`${active ? 'flex' : 'hidden lg:flex'} flex-col min-h-0 flex-1`}
        style={{ background: '#fff', border: '1px solid #E7EAEE', borderRadius: 16, overflow: 'hidden' }}
      >
        {!active ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B93A1', fontSize: 14 }}>
            Select a lead to view the conversation
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ padding: '13px 16px', borderBottom: '1px solid #E7EAEE', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <button
                onClick={() => setActive(null)}
                className="lg:hidden bv-press"
                aria-label="Back"
                style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #E2E7EE', background: '#fff', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="#44506A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <div style={{ width: 42, height: 42, borderRadius: 11, backgroundColor: active.userAvatar ? '#E7EAEE' : ACCENT, backgroundImage: active.userAvatar ? `url('${active.userAvatar}')` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, flexShrink: 0 }}>
                {!active.userAvatar && initials(active.userName)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#15243B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{active.userName}</div>
                <div style={{ fontSize: 12, color: '#8B93A1' }}>Inquiry on {active.listingTitle}</div>
              </div>
              <button
                onClick={() => router.push('/dashboard/visits')}
                className="bv-press bv-fill"
                style={{ '--fill': '#EEF2F7', height: 36, padding: '0 14px', borderRadius: 10, border: '1px solid #E2E7EE', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, color: '#44506A', flexShrink: 0 } as React.CSSProperties}
              >
                View visit
              </button>
            </div>

            {/* Messages */}
            <div ref={msgsRef} style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 11, background: '#FAFBFC' }}>
              {/* Listing context card */}
              <a href={`/listings/${active.listingId}`} target="_blank" rel="noopener noreferrer"
                 style={{ alignSelf: 'center', display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid #E7EAEE', borderRadius: 14, padding: '9px 14px 9px 9px', boxShadow: '0 8px 20px -16px rgba(21,36,59,0.4)', maxWidth: 340, textDecoration: 'none', marginBottom: 4 }}>
                <div style={{ width: 50, height: 50, borderRadius: 10, overflow: 'hidden', backgroundColor: '#DDD3C5', flexShrink: 0, backgroundImage: active.listingCover ? `url('${active.listingCover}')` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#15243B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{active.listingTitle}</div>
                  <div style={{ fontSize: 12, color: '#8B93A1' }}>View listing ↗</div>
                </div>
              </a>

              {loadingMsgs ? (
                <div style={{ textAlign: 'center', color: '#A8AEB9', fontSize: 13, padding: '16px 0' }}>Loading…</div>
              ) : msgs.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#A8AEB9', fontSize: 13, padding: '16px 0' }}>No messages yet</div>
              ) : (
                msgs.map(m => <Bubble key={m.id} me={m.senderRole === 'me'} text={m.content} time={fmtTime(m.createdAt)} />)
              )}
            </div>

            {/* Quick replies */}
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', padding: '10px 16px 0', flexShrink: 0 }}>
              {CANNED.map(c => (
                <button
                  key={c.label}
                  onClick={() => {
                    setDraft(c.text
                      .replace('{name}', active.userName.split(' ')[0])
                      .replace('{listing}', active.listingTitle));
                    inputRef.current?.focus();
                  }}
                  className="bv-press"
                  style={{ padding: '6px 12px', borderRadius: 999, border: '1px solid #DCE3EC', background: '#F7F9FC', color: '#3C4A63', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Composer */}
            <div style={{ padding: '13px 16px', borderTop: '1px solid #E7EAEE', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <input
                ref={inputRef}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder={`Reply to ${active.userName.split(' ')[0]}…`}
                disabled={sending}
                style={{ flex: 1, border: '1px solid #DBE0E6', borderRadius: 12, padding: '12px 14px', fontSize: 14, fontFamily: 'inherit', color: '#15243B', outline: 'none', background: '#fff' }}
              />
              <button
                onClick={send}
                disabled={!draft.trim() || sending}
                className="bv-press"
                style={{ width: 44, height: 44, borderRadius: 12, background: draft.trim() && !sending ? ACCENT : '#C0CCDA', border: 'none', cursor: draft.trim() && !sending ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                aria-label="Send"
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                  <path d="M4 12l16-7-7 16-2.5-6.5L4 12z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
