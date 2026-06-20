'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

const ACCENT = '#1E3A5C';

interface MsgRow {
  id: number;
  threadId: number;
  senderRole: 'me' | 'other';
  content: string;
  createdAt: string;
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit', hour12: true });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString('en-BD', { weekday: 'short' });
  return d.toLocaleDateString('en-BD', { month: 'short', day: 'numeric' });
}

function Bubble({ me, text, time }: { me: boolean; text: string; time: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: me ? 'flex-end' : 'flex-start' }}>
      <div style={{
        maxWidth: '74%',
        background: me ? ACCENT : '#fff',
        color: me ? '#fff' : '#15243B',
        border: me ? 'none' : '1px solid #E7EAEE',
        borderRadius: me ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
        padding: '10px 14px',
        fontSize: 14,
        lineHeight: 1.45,
      }}>
        {text}
        <div style={{ fontSize: 10.5, color: me ? 'rgba(255,255,255,0.7)' : '#A8AEB9', textAlign: 'right', marginTop: 4 }}>
          {time}
        </div>
      </div>
    </div>
  );
}

interface ChatDrawerProps {
  listingId: number;
  listingTitle: string;
  listingCover: string;
  ownerName: string;
  ownerType?: string;
  onClose: () => void;
}

export default function ChatDrawer({ listingId, listingTitle, listingCover, ownerName, ownerType, onClose }: ChatDrawerProps) {
  const roleLabel = ownerType === 'Agency' ? 'Agency' : 'Owner';
  const [threadId, setThreadId] = useState<number | null>(null);
  const [msgs, setMsgs] = useState<MsgRow[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const msgsRef = useRef<HTMLDivElement>(null);
  // Synchronous dedup guard — outside React batching so cross-source races (POST + SSE) can't both add the same ID
  const seenIds = useRef(new Set<number>());

  useEffect(() => {
    fetch('/api/threads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId }),
    })
      .then(r => r.json())
      .then(({ threadId: id }: { threadId: number }) => {
        setThreadId(id);
        return fetch(`/api/threads/${id}`);
      })
      .then(r => r.json())
      .then(({ messages: rows }: { messages: MsgRow[] }) => {
        rows?.forEach(m => seenIds.current.add(m.id));
        setMsgs(rows ?? []);
      })
      .catch(() => {});
  }, [listingId]);

  useEffect(() => {
    if (!threadId) return;
    const es = new EventSource(`/api/threads/${threadId}/stream`);
    es.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data) as MsgRow;
        // Only SSE-append agent replies. Our own messages are added via POST response in send().
        if (msg.senderRole !== 'other') return;
        if (seenIds.current.has(msg.id)) return;
        seenIds.current.add(msg.id);
        setMsgs(prev => [...prev, msg]);
      } catch { /* malformed */ }
    };
    return () => es.close();
  }, [threadId]);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [msgs.length]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const send = async () => {
    const txt = draft.trim();
    if (!txt || !threadId || sending) return;
    setDraft('');
    setSending(true);

    const res = await fetch(`/api/threads/${threadId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: txt }),
    }).catch(() => null);

    if (res?.ok) {
      const { message } = await res.json() as { message: MsgRow };
      if (!seenIds.current.has(message.id)) {
        seenIds.current.add(message.id);
        setMsgs(prev => [...prev, message]);
      }
    }

    setSending(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(21,36,59,0.4)', zIndex: 400, backdropFilter: 'blur(2px)' }}
      />

      {/* Drawer */}
      <div className="chat-drawer-panel" style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
        background: '#fff', zIndex: 401,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 48px rgba(21,36,59,0.2)',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E7EAEE', display: 'flex', alignItems: 'center', gap: 12, background: '#fff' }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: ACCENT, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
            {ownerName.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#15243B' }}>{ownerName}</div>
            <div style={{ fontSize: 12, color: '#4F8A6B', fontWeight: 600 }}>{roleLabel} · Typically replies within 24h</div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid #E7EAEE', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="#8B93A1" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Listing pill */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #F0F2F5' }}>
          <Link
            href={`/listings/${listingId}`}
            style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F4F6F9', borderRadius: 12, padding: '10px 12px', textDecoration: 'none' }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 9, overflow: 'hidden', flexShrink: 0, background: '#DDD3C5' }}>
              <div style={{ width: '100%', height: '100%', backgroundImage: `url('${listingCover}')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#15243B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{listingTitle}</div>
              <div style={{ fontSize: 11.5, color: '#8B93A1', marginTop: 2 }}>View listing →</div>
            </div>
          </Link>
        </div>

        {/* Messages */}
        <div ref={msgsRef} style={{ flex: 1, overflowY: 'auto', padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 10, background: '#FBFCFD' }}>
          {msgs.length === 0 && (
            <div style={{ textAlign: 'center', color: '#A8AEB9', fontSize: 13, paddingTop: 32 }}>
              No messages yet. Say hello!
            </div>
          )}
          {msgs.map(m => (
            <Bubble key={m.id} me={m.senderRole === 'me'} text={m.content} time={fmtTime(m.createdAt)} />
          ))}
        </div>

        {/* Input */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid #E7EAEE', background: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Write a message…"
            autoFocus
            style={{ flex: 1, border: '1px solid #DBE0E6', borderRadius: 12, padding: '12px 14px', fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#15243B', outline: 'none', background: '#fff' }}
          />
          <button
            onClick={send}
            disabled={!draft.trim() || sending}
            style={{
              width: 44, height: 44, borderRadius: 12,
              background: draft.trim() ? ACCENT : '#C0CCDA',
              border: 'none',
              cursor: draft.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'background .15s',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 12l16-7-7 16-2.5-6.5L4 12z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
