'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { fmtPrice } from '@/data/listings';
import Footer from '@/components/Footer';

const ACCENT = '#1E3A5C';

// ─── API types ────────────────────────────────────────────────────────────────
interface ThreadRow {
  id: number;
  listingId: number;
  listingTitle: string;
  listingCover: string;
  ownerName: string;
  lastMessage: string | null;
  lastAt: string;
}

interface MsgRow {
  id: number;
  threadId: number;
  senderRole: 'me' | 'other';
  content: string;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtTime(iso: string): string {
  const d   = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit', hour12: true });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7)   return d.toLocaleDateString('en-BD', { weekday: 'short' });
  return d.toLocaleDateString('en-BD', { month: 'short', day: 'numeric' });
}

// ─── Bubble ───────────────────────────────────────────────────────────────────
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

// ─── Main page ────────────────────────────────────────────────────────────────
export default function MessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagesInner />
    </Suspense>
  );
}

function MessagesInner() {
  const [threads,       setThreads]       = useState<ThreadRow[]>([]);
  const [activeThread,  setActiveThread]  = useState<ThreadRow | null>(null);
  const [msgs,          setMsgs]          = useState<MsgRow[]>([]);
  const [draft,         setDraft]         = useState('');
  const [loading,       setLoading]       = useState(true);
  const [sending,       setSending]       = useState(false);
  const msgsRef = useRef<HTMLDivElement>(null);
  const seenIds = useRef(new Set<number>());
  const search = useSearchParams();
  const wantThreadId = Number(search?.get('thread') ?? '') || null;

  // ── Load thread list + mark message notifications read ───────────────────
  useEffect(() => {
    fetch('/api/threads')
      .then(r => r.json())
      .then(({ threads: rows }: { threads: ThreadRow[] }) => {
        setThreads(rows);
        const picked = wantThreadId ? rows.find(t => t.id === wantThreadId) : null;
        if (picked) setActiveThread(picked);
        else if (rows.length > 0) setActiveThread(rows[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    const refresh = setInterval(() => {
      fetch('/api/threads')
        .then(r => r.json())
        .then(({ threads: rows }: { threads: ThreadRow[] }) => setThreads(rows))
        .catch(() => {});
    }, 10000);
    return () => clearInterval(refresh);
  }, []);

  // ── Load messages when active thread changes ──────────────────────────────
  useEffect(() => {
    if (!activeThread) return;
    seenIds.current = new Set();
    fetch(`/api/threads/${activeThread.id}`)
      .then(r => r.json())
      .then(({ messages: rows }: { messages: MsgRow[] }) => {
        rows?.forEach((m: MsgRow) => seenIds.current.add(m.id));
        setMsgs(rows ?? []);
      })
      .catch(() => setMsgs([]));

    fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'message', threadId: activeThread.id }),
    }).catch(() => {});
  }, [activeThread?.id]);

  // ── SSE subscription ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeThread) return;
    const es = new EventSource(`/api/threads/${activeThread.id}/stream`);
    es.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data) as MsgRow;
        if (msg.senderRole !== 'other') return;
        if (seenIds.current.has(msg.id)) return;
        seenIds.current.add(msg.id);
        setMsgs(prev => [...prev, msg]);
      } catch { /* malformed */ }
    };
    return () => es.close();
  }, [activeThread?.id]);

  // ── User-channel SSE for thread list refresh on any new message ──────────
  useEffect(() => {
    const es = new EventSource('/api/notifications/stream');
    es.onmessage = (ev) => {
      try {
        const evt = JSON.parse(ev.data) as { kind: string; threadId?: number; message?: MsgRow };
        if (evt.kind !== 'message') return;
        fetch('/api/threads')
          .then(r => r.json())
          .then(({ threads: rows }: { threads: ThreadRow[] }) => setThreads(rows))
          .catch(() => {});
        if (evt.threadId && evt.threadId === activeThread?.id && evt.message) {
          const m = evt.message;
          if (!seenIds.current.has(m.id)) {
            seenIds.current.add(m.id);
            setMsgs(prev => [...prev, { ...m, senderRole: 'other' }]);
          }
        }
      } catch {}
    };
    return () => es.close();
  }, [activeThread?.id]);

  // ── Auto-scroll (scroll the container, not the page) ─────────────────────
  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [msgs.length]);

  // ── Switch thread ─────────────────────────────────────────────────────────
  const switchThread = useCallback((t: ThreadRow) => {
    setActiveThread(t);
    setMsgs([]);
  }, []);

  // ── Send message ──────────────────────────────────────────────────────────
  const send = async () => {
    const txt = draft.trim();
    if (!txt || !activeThread || sending) return;
    setDraft('');
    setSending(true);

    const res = await fetch(`/api/threads/${activeThread.id}/messages`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: txt }),
    }).catch(() => null);

    if (res?.ok) {
      const { message } = await res.json() as { message: MsgRow };
      if (!seenIds.current.has(message.id)) {
        seenIds.current.add(message.id);
        setMsgs(prev => [...prev, message]);
      }
    }

    setThreads(prev => prev.map(t =>
      t.id === activeThread.id ? { ...t, lastMessage: txt, lastAt: new Date().toISOString() } : t
    ));

    setSending(false);
  };

  // ── Empty state (no threads yet) ──────────────────────────────────────────
  if (!loading && threads.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#FFFFFF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <main className="pg">
          <h1 style={{ fontWeight: 400, fontSize: 30, margin: '0 0 18px', color: '#15243B' }}>Messages</h1>
          <div style={{ padding: '64px 24px', textAlign: 'center', border: '1px dashed #D3D9E0', borderRadius: 20, color: '#8B93A1', fontSize: 14 }}>
            No conversations yet. Start a chat from any listing page.
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <main className="pg">
        <h1 style={{ fontWeight: 400, fontSize: 30, margin: '0 0 18px', color: '#15243B' }}>Messages</h1>

        <div className="g-messages-wrap g-messages">

          {/* ── Thread list ── */}
          <div className="messages-thread-list">
            <div style={{ padding: '16px 18px', borderBottom: '1px solid #E7EAEE' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#F4F6F9', borderRadius: 11, padding: '9px 12px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="7" stroke="#8B93A1" strokeWidth="2" />
                  <path d="M20 20l-3.2-3.2" stroke="#8B93A1" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span style={{ fontSize: 13.5, color: '#8B93A1' }}>Search conversations</span>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '14px 18px', alignItems: 'center' }}>
                      <div style={{ width: 46, height: 46, borderRadius: 12, background: '#E7EAEE', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ height: 13, background: '#E7EAEE', borderRadius: 6, marginBottom: 8, width: '60%' }} />
                        <div style={{ height: 11, background: '#F0F2F5', borderRadius: 6, width: '85%' }} />
                      </div>
                    </div>
                  ))
                : threads.map(t => {
                    const active = t.id === activeThread?.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => switchThread(t)}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: 'pointer', background: active ? '#F4F6F9' : '#fff', borderLeft: `3px solid ${active ? ACCENT : 'transparent'}`, transition: 'background .15s' }}
                      >
                        <div style={{ width: 46, height: 46, borderRadius: 12, background: ACCENT, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 700, flexShrink: 0 }}>
                          {t.ownerName.charAt(0)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                            <span style={{ fontSize: 14.5, fontWeight: 700, color: '#15243B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.ownerName}</span>
                            <span style={{ fontSize: 11.5, color: '#A8AEB9', flexShrink: 0 }}>{fmtTime(t.lastAt)}</span>
                          </div>
                          <div style={{ fontSize: 12.5, color: '#8B93A1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
                            {t.lastMessage ?? t.listingTitle}
                          </div>
                        </div>
                      </div>
                    );
                  })
              }
            </div>
          </div>

          {/* ── Active chat ── */}
          <div className="messages-chat">
            {activeThread ? (
              <>
                {/* Chat header */}
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #E7EAEE', display: 'flex', alignItems: 'center', gap: 12, background: '#fff' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: ACCENT, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>
                    {activeThread.ownerName.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#15243B' }}>{activeThread.ownerName}</div>
                    <div style={{ fontSize: 12, color: '#4F8A6B', fontWeight: 600 }}>● Online · Agent</div>
                  </div>
                  <Link href={`/listings/${activeThread.listingId}`} style={{ background: '#fff', border: '1px solid #E7EAEE', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 600, color: '#15243B', textDecoration: 'none' }}>
                    View listing
                  </Link>
                </div>

                {/* Messages area */}
                <div ref={msgsRef} style={{ flex: 1, overflowY: 'auto', padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Inline listing card */}
                  <Link href={`/listings/${activeThread.listingId}`} style={{ alignSelf: 'center', display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid #E7EAEE', borderRadius: 14, padding: '10px 14px 10px 10px', boxShadow: '0 8px 20px -16px rgba(21,36,59,0.4)', maxWidth: 340, textDecoration: 'none' }}>
                    <div style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', background: '#DDD3C5', flexShrink: 0 }}>
                      <div style={{ width: '100%', height: '100%', backgroundImage: `url('${activeThread.listingCover}')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#15243B' }}>{activeThread.listingTitle}</div>
                      <div style={{ fontSize: 12, color: '#8B93A1' }}>Aftab Nagar</div>
                    </div>
                  </Link>

                  {/* Bubbles */}
                  {msgs.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#A8AEB9', fontSize: 13, padding: '16px 0' }}>
                      No messages yet. Say hello!
                    </div>
                  )}
                  {msgs.map(m => (
                    <Bubble key={m.id} me={m.senderRole === 'me'} text={m.content} time={fmtTime(m.createdAt)} />
                  ))}
                </div>

                {/* Input */}
                <div style={{ padding: '14px 18px', borderTop: '1px solid #E7EAEE', background: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                    placeholder="Write a message…"
                    style={{ flex: 1, border: '1px solid #DBE0E6', borderRadius: 12, padding: '12px 14px', fontSize: 14, fontFamily: 'inherit', color: '#15243B', outline: 'none', background: '#fff' }}
                  />
                  <button
                    onClick={send}
                    disabled={!draft.trim() || sending}
                    style={{ width: 44, height: 44, borderRadius: 12, background: draft.trim() ? ACCENT : '#C0CCDA', border: 'none', cursor: draft.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .15s' }}
                  >
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                      <path d="M4 12l16-7-7 16-2.5-6.5L4 12z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B93A1', fontSize: 14 }}>
                Select a conversation
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
