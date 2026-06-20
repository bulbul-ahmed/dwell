'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Footer from '@/components/Footer';

interface Notif {
  id: number;
  type: 'visit' | 'message' | 'listing' | 'review' | 'system';
  title: string;
  body: string;
  href: string;
  icon: string;
  icoBg: string;
  icoFg: string;
  read: boolean;
  createdAt: string;
}

const ACCENT = '#1E3A5C';

const GROUP_META: Record<string, { label: string; icon: string; color: string }> = {
  visit:   { label: 'Visits',   icon: 'ti-calendar',   color: ACCENT },
  message: { label: 'Messages', icon: 'ti-message-2',  color: ACCENT },
  listing: { label: 'Listings', icon: 'ti-home',        color: '#41495A' },
  review:  { label: 'Reviews',  icon: 'ti-star',        color: '#B8660A' },
  system:  { label: 'System',   icon: 'ti-bell',        color: '#41495A' },
};

const GROUP_ORDER = ['visit', 'message', 'listing', 'review', 'system'];

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'yesterday';
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en', { day: 'numeric', month: 'short' });
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifs, setNotifs]       = useState<Notif[]>([]);
  const [loading, setLoading]     = useState(true);
  const [openId, setOpenId]       = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/notifications')
      .then(r => r.json())
      .then(({ notifications: rows }: { notifications: Notif[] }) => {
        setNotifs(rows ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    Promise.all(['visit', 'listing', 'review', 'system'].map(type =>
      fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      }).catch(() => {})
    ));
  }, []);

  const markRead = (id: number) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    fetch(`/api/notifications/${id}`, { method: 'PATCH' }).catch(() => {});
  };

  const markAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    setOpenId(null);
    fetch('/api/notifications/read-all', { method: 'POST' }).catch(() => {});
  };

  const toggleDetail = (id: number) => {
    if (openId === id) { setOpenId(null); return; }
    setOpenId(id);
    const n = notifs.find(x => x.id === id);
    if (n && !n.read) markRead(id);
  };

  const grouped = GROUP_ORDER
    .map(type => ({
      type,
      meta: GROUP_META[type],
      items: notifs.filter(n => n.type === type),
    }))
    .filter(g => g.items.length > 0);

  const totalUnread = notifs.filter(n => !n.read).length;

  const inputStyle: React.CSSProperties = {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    minHeight: '100vh',
    background: '#FFFFFF',
  };

  return (
    <div style={inputStyle}>
      <style>{`
        @keyframes bvfade { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
        .nrow { cursor:pointer; transition:background .15s; }
        .nrow:hover { background:#F9FAFB !important; }
        .detail-panel { overflow:hidden; max-height:0; transition:max-height .3s cubic-bezier(0.22,1,0.36,1), opacity .25s; opacity:0; }
        .detail-panel.open { max-height:220px; opacity:1; }
        .nav-btn:hover { background:#F4F6F9 !important; }
      `}</style>

      <main className="pg-xs" style={{ animation: 'bvfade .4s ease both' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 26 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontWeight: 400, fontSize: 32, margin: 0, color: '#15243B' }}>Notifications</h1>
            {totalUnread > 0 && (
              <span style={{ fontSize: 12, fontWeight: 700, background: ACCENT, color: '#fff', borderRadius: 999, padding: '2px 9px' }}>{totalUnread}</span>
            )}
          </div>
          {totalUnread > 0 && (
            <button onClick={markAllRead} style={{ fontSize: 13, fontWeight: 600, color: '#6A7180', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#AEB8C6', fontSize: 14 }}>Loading…</div>
        ) : grouped.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔔</div>
            <p style={{ fontSize: 15, color: '#8893A4', margin: 0 }}>You're all caught up</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {grouped.map(group => {
              const unread = group.items.filter(n => !n.read).length;
              return (
                <div key={group.type}>
                  {/* Group header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
                    <i className={`ti ${group.meta.icon}`} style={{ fontSize: 15, color: group.meta.color }} aria-hidden="true" />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#41495A', letterSpacing: '.03em' }}>{group.meta.label}</span>
                    {unread > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 700, background: '#EEF3F8', color: ACCENT, borderRadius: 999, padding: '1px 8px' }}>
                        {unread} new
                      </span>
                    )}
                  </div>

                  {/* Rows */}
                  <div style={{ background: '#F9FAFB', borderRadius: 16, overflow: 'hidden', border: '1px solid #ECEEF2' }}>
                    {group.items.map((n, i) => {
                      const isOpen = openId === n.id;
                      return (
                        <div key={n.id}>
                          {/* Row */}
                          <div
                            className="nrow"
                            onClick={() => toggleDetail(n.id)}
                            style={{
                              display: 'flex', alignItems: 'flex-start', gap: 12,
                              padding: '11px 14px',
                              background: isOpen ? '#EEF3F8' : (n.read ? '#F9FAFB' : '#fff'),
                              borderBottom: (i < group.items.length - 1 || isOpen) ? '1px solid #ECEEF2' : 'none',
                            }}
                          >
                            {/* Icon */}
                            <div style={{ width: 34, height: 34, borderRadius: 10, background: n.icoBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <i className={`ti ${n.icon}`} style={{ fontSize: 16, color: n.icoFg }} aria-hidden="true" />
                            </div>

                            {/* Text */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 13.5, fontWeight: n.read ? 400 : 600, color: '#15243B', margin: 0, lineHeight: 1.4 }}>{n.title}</p>
                              <p style={{ fontSize: 12, color: '#8893A4', margin: '2px 0 0', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.body}</p>
                            </div>

                            {/* Time + dot */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0, marginTop: 2 }}>
                              <span style={{ fontSize: 11, color: '#B0BBC8' }}>{relativeTime(n.createdAt)}</span>
                              {!n.read && <span style={{ width: 7, height: 7, borderRadius: '50%', background: ACCENT, flexShrink: 0 }} />}
                            </div>
                          </div>

                          {/* Expandable detail */}
                          <div className={`detail-panel${isOpen ? ' open' : ''}`}>
                            <div style={{ padding: '14px 16px', background: '#EEF3F8', borderBottom: i < group.items.length - 1 ? '1px solid #D8E3EE' : 'none' }}>
                              <p style={{ fontSize: 13, color: '#41495A', margin: '0 0 12px', lineHeight: 1.5 }}>{n.body}</p>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                  onClick={e => { e.stopPropagation(); router.push(n.href); }}
                                  style={{ height: 34, padding: '0 16px', borderRadius: 10, border: 'none', background: ACCENT, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                                >
                                  {group.type === 'visit'   ? 'View visit'    :
                                   group.type === 'message' ? 'Open thread'   :
                                   group.type === 'review'  ? 'See review'    :
                                   group.type === 'listing' ? 'View listing'  : 'View'}
                                </button>
                                <button
                                  onClick={e => { e.stopPropagation(); setOpenId(null); }}
                                  className="nav-btn"
                                  style={{ height: 34, padding: '0 14px', borderRadius: 10, border: '1px solid #D0D9E4', background: '#fff', color: '#6A7180', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                                >
                                  Dismiss
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
