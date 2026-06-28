'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { timeAgo } from '@/lib/format';

interface Notif {
  id: number;
  type: string;
  title: string;
  body: string;
  href: string;
  icoBg: string;
  icoFg: string;
  read: boolean;
  count: number;
  createdAt: string;
}

const TYPE_ICON: Record<string, string> = {
  visit:   '📅',
  review:  '★',
  listing: '🏠',
  system:  '💬',
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch('/api/notifications')
      .then(r => r.ok ? r.json() : { notifications: [] })
      .then(d => { setNotifs(d.notifications ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const markAllRead = () => {
    fetch('/api/notifications/read-all', { method: 'POST' })
      .then(() => load())
      .catch(() => {});
  };

  const markRead = (id: number) => {
    fetch(`/api/notifications/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ read: true }) })
      .then(() => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)))
      .catch(() => {});
  };

  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: 18, color: '#15243B', margin: 0 }}>Notifications</h2>
          {unreadCount > 0 && (
            <p style={{ fontSize: 13, color: '#6B7A90', margin: '2px 0 0' }}>{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            style={{
              fontSize: 13, fontWeight: 700, color: '#2E7D55',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}
          >
            Mark all read
          </button>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: '#93A0B2', fontSize: 14 }}>Loading…</div>
      )}

      {!loading && notifs.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '48px 0',
          color: '#93A0B2', fontSize: 14,
        }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🔔</div>
          No notifications yet
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {notifs.map(n => (
          <Link
            key={n.id}
            href={n.href}
            onClick={() => { if (!n.read) markRead(n.id); }}
            style={{ textDecoration: 'none' }}
          >
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 14,
              padding: '14px 16px', borderRadius: 14,
              background: n.read ? '#fff' : '#F0F5FF',
              border: `1px solid ${n.read ? '#ECEEF1' : '#C8D8F0'}`,
              cursor: 'pointer', transition: 'background 0.15s',
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                background: n.icoBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16,
              }}>
                {TYPE_ICON[n.type] ?? '🔔'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#15243B' }}>{n.title}</span>
                  {!n.read && (
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: '#2E7D55', flexShrink: 0,
                    }} />
                  )}
                </div>
                <p style={{ fontSize: 13, color: '#6B7A90', margin: '0 0 4px', lineHeight: 1.4 }}>{n.body}</p>
                <span style={{ fontSize: 11.5, color: '#93A0B2', fontWeight: 600 }}>{timeAgo(n.createdAt)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
