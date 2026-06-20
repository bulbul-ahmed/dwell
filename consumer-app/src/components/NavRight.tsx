'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDwellStore } from '@/lib/store';
import HeartIcon from '@/components/HeartIcon';

const ACCENT = '#1E3A5C';

interface SessionUser { name: string; email: string; role: string }

export default function NavRight() {
  const saved = useDwellStore(s => s.saved);
  const loadSaves = useDwellStore(s => s.loadSaves);
  const savedCount = Object.values(saved).filter(Boolean).length;
  const [user, setUser] = useState<SessionUser | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(({ user }) => setUser(user ?? null));
  }, []);

  useEffect(() => {
    if (user) loadSaves();
  }, [user, loadSaves]);

  const [unread, setUnread] = useState({ total: 0, messages: 0, bell: 0 });
  const prevMsgsRef = useRef(0);

  useEffect(() => {
    if (!user) { setUnread({ total: 0, messages: 0, bell: 0 }); return; }
    let cancelled = false;

    const load = async () => {
      try {
        const r = await fetch('/api/notifications/unread', { cache: 'no-store' });
        if (!r.ok) return;
        const d = await r.json() as { total: number; messages: number; bell: number };
        if (cancelled) return;
        if (d.messages > prevMsgsRef.current && prevMsgsRef.current !== 0) {
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try { new Notification('New message on Dwell'); } catch {}
          }
        }
        prevMsgsRef.current = d.messages;
        setUnread(d);
      } catch {}
    };

    load();
    const t = setInterval(load, 15000);
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);

    const es = new EventSource('/api/notifications/stream');
    es.onmessage = (ev) => {
      try {
        const evt = JSON.parse(ev.data) as { kind: string };
        if (evt.kind === 'notification') load();
      } catch {}
    };
    es.onerror = () => { /* auto-reconnect by browser */ };

    return () => { cancelled = true; clearInterval(t); document.removeEventListener('visibilitychange', onVisible); es.close(); };
  }, [user]);

  useEffect(() => {
    const base = (document.title || 'Dwell').replace(/^\(\d+\)\s*/, '');
    document.title = unread.total > 0 ? `(${unread.total > 99 ? '99+' : unread.total}) ${base}` : base;
  }, [unread.total]);

  useEffect(() => {
    if (!user) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, [user]);

  const initials = user
    ? user.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : '';

  const displayName = user
    ? user.name.split(' ').slice(0, 2).map((w: string, i: number) =>
        i === 1 ? w[0] + '.' : w
      ).join(' ')
    : '';

  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  async function handleSignOut() {
    setOpen(false);
    await fetch('/api/auth/signout', { method: 'POST' });
    setUser(null);
    router.push('/');
    router.refresh();
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>

      {user && (
        <>
          {/* Notifications */}
          <Link
            href="/notifications"
            title="Notifications"
            style={{ position: 'relative', width: 38, height: 38, borderRadius: '50%', border: '1px solid #E7EAEE', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path fill="none" d="M0 0h24v24H0z"/>
              <path fill="#41495A" d="M12 2c4.97 0 9 4.043 9 9.031V20H3v-8.969C3 6.043 7.03 2 12 2zM9.5 21h5a2.5 2.5 0 1 1-5 0z"/>
            </svg>
            {unread.bell > 0 && (
              <span style={{
                position: 'absolute', top: -3, right: -3,
                minWidth: 17, height: 17, padding: '0 5px', borderRadius: 999,
                background: '#C7553B', color: '#fff', border: '1.5px solid #fff',
                fontSize: 10, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
              }}>
                {unread.bell > 99 ? '99+' : unread.bell}
              </span>
            )}
          </Link>

          {/* Messages */}
          <Link
            href="/messages"
            title="Messages"
            style={{ position: 'relative', width: 38, height: 38, borderRadius: '50%', border: '1px solid #E7EAEE', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.09436 11.2288C6.03221 10.8282 5.99996 10.4179 5.99996 10C5.99996 5.58172 9.60525 2 14.0526 2C18.4999 2 22.1052 5.58172 22.1052 10C22.1052 10.9981 21.9213 11.9535 21.5852 12.8345C21.5154 13.0175 21.4804 13.109 21.4646 13.1804C21.4489 13.2512 21.4428 13.301 21.4411 13.3735C21.4394 13.4466 21.4493 13.5272 21.4692 13.6883L21.8717 16.9585C21.9153 17.3125 21.9371 17.4895 21.8782 17.6182C21.8266 17.731 21.735 17.8205 21.6211 17.8695C21.4911 17.9254 21.3146 17.8995 20.9617 17.8478L17.7765 17.3809C17.6101 17.3565 17.527 17.3443 17.4512 17.3448C17.3763 17.3452 17.3245 17.3507 17.2511 17.3661C17.177 17.3817 17.0823 17.4172 16.893 17.4881C16.0097 17.819 15.0524 18 14.0526 18C13.6344 18 13.2237 17.9683 12.8227 17.9073M7.63158 22C10.5965 22 13 19.5376 13 16.5C13 13.4624 10.5965 11 7.63158 11C4.66668 11 2.26316 13.4624 2.26316 16.5C2.26316 17.1106 2.36028 17.6979 2.53955 18.2467C2.61533 18.4787 2.65322 18.5947 2.66566 18.6739C2.67864 18.7567 2.68091 18.8031 2.67608 18.8867C2.67145 18.9668 2.65141 19.0573 2.61134 19.2383L2 22L4.9948 21.591C5.15827 21.5687 5.24 21.5575 5.31137 21.558C5.38652 21.5585 5.42641 21.5626 5.50011 21.5773C5.5701 21.5912 5.67416 21.6279 5.88227 21.7014C6.43059 21.8949 7.01911 22 7.63158 22Z" stroke="#41495A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {unread.messages > 0 && (
              <span style={{
                position: 'absolute', top: -3, right: -3,
                minWidth: 17, height: 17, padding: '0 5px', borderRadius: 999,
                background: '#E5342B', color: '#fff', border: '1.5px solid #fff',
                fontSize: 10, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
              }}>
                {unread.messages > 99 ? '99+' : unread.messages}
              </span>
            )}
          </Link>

          {/* Saved */}
          <Link
            href="/saved"
            title="Saved"
            style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid #E7EAEE', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
          >
            <HeartIcon saved={savedCount > 0} />
          </Link>
        </>
      )}

      {/* List your property */}
      <Link href="/list" style={{ fontSize: 14.5, fontWeight: 600, color: '#15243B', textDecoration: 'none' }}>
        List your property
      </Link>

      {/* Auth area */}
      {user ? (
        <div ref={wrapRef} style={{ position: 'relative' }}>
          {/* Pill button */}
          <button
            onClick={() => setOpen(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${open ? '#B0BBC8' : '#D3D9E0'}`, borderRadius: 999, padding: '5px 6px 5px 14px', cursor: 'pointer', background: open ? '#F4F6F9' : '#fff', fontFamily: 'inherit' }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: '#15243B' }}>{displayName}</span>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#15243B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
              {initials}
            </div>
          </button>

          {/* Dropdown */}
          <div className={`nav-dropdown ${open ? 'nav-dropdown--open' : ''}`} style={{
            position: 'absolute', top: 'calc(100% + 10px)', right: 0,
            width: 220, background: '#fff',
            border: '1px solid #E7EAEE', borderRadius: 18,
            boxShadow: '0 8px 32px rgba(20,40,80,.13)',
            overflow: 'hidden',
            transformOrigin: 'top right',
            pointerEvents: open ? 'all' : 'none',
          }}>
            {/* Header */}
            <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid #F2F4F7' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#15243B' }}>{user.name}</div>
              <div style={{ fontSize: 12, color: '#8893A4', marginTop: 2 }}>{user.email}</div>
            </div>

            {/* Links */}
            <div style={{ padding: '8px 0' }}>
              {[
                {
                  href: '/account', label: 'Account settings',
                  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path opacity="0.5" fillRule="evenodd" clipRule="evenodd" d="M14.2788 2.15224C13.9085 2 13.439 2 12.5 2C11.561 2 11.0915 2 10.7212 2.15224C10.2274 2.35523 9.83509 2.74458 9.63056 3.23463C9.53719 3.45834 9.50065 3.7185 9.48635 4.09799C9.46534 4.65568 9.17716 5.17189 8.69017 5.45093C8.20318 5.72996 7.60864 5.71954 7.11149 5.45876C6.77318 5.2813 6.52789 5.18262 6.28599 5.15102C5.75609 5.08178 5.22018 5.22429 4.79616 5.5472C4.47814 5.78938 4.24339 6.1929 3.7739 6.99993C3.30441 7.80697 3.06967 8.21048 3.01735 8.60491C2.94758 9.1308 3.09118 9.66266 3.41655 10.0835C3.56506 10.2756 3.77377 10.437 4.0977 10.639C4.57391 10.936 4.88032 11.4419 4.88029 12C4.88026 12.5581 4.57386 13.0639 4.0977 13.3608C3.77372 13.5629 3.56497 13.7244 3.41645 13.9165C3.09108 14.3373 2.94749 14.8691 3.01725 15.395C3.06957 15.7894 3.30432 16.193 3.7738 17C4.24329 17.807 4.47804 18.2106 4.79606 18.4527C5.22008 18.7756 5.75599 18.9181 6.28589 18.8489C6.52778 18.8173 6.77305 18.7186 7.11133 18.5412C7.60852 18.2804 8.2031 18.27 8.69012 18.549C9.17714 18.8281 9.46533 19.3443 9.48635 19.9021C9.50065 20.2815 9.53719 20.5417 9.63056 20.7654C9.83509 21.2554 10.2274 21.6448 10.7212 21.8478C11.0915 22 11.561 22 12.5 22C13.439 22 13.9085 22 14.2788 21.8478C14.7726 21.6448 15.1649 21.2554 15.3694 20.7654C15.4628 20.5417 15.4994 20.2815 15.5137 19.902C15.5347 19.3443 15.8228 18.8281 16.3098 18.549C16.7968 18.2699 17.3914 18.2804 17.8886 18.5412C18.2269 18.7186 18.4721 18.8172 18.714 18.8488C19.2439 18.9181 19.7798 18.7756 20.2038 18.4527C20.5219 18.2105 20.7566 17.807 21.2261 16.9999C21.6956 16.1929 21.9303 15.7894 21.9827 15.395C22.0524 14.8691 21.9088 14.3372 21.5835 13.9164C21.4349 13.7243 21.2262 13.5628 20.9022 13.3608C20.4261 13.0639 20.1197 12.558 20.1197 11.9999C20.1197 11.4418 20.4261 10.9361 20.9022 10.6392C21.2263 10.4371 21.435 10.2757 21.5836 10.0835C21.9089 9.66273 22.0525 9.13087 21.9828 8.60497C21.9304 8.21055 21.6957 7.80703 21.2262 7C20.7567 6.19297 20.522 5.78945 20.2039 5.54727C19.7799 5.22436 19.244 5.08185 18.7141 5.15109C18.4722 5.18269 18.2269 5.28136 17.8887 5.4588C17.3915 5.71959 16.7969 5.73002 16.3099 5.45096C15.8229 5.17191 15.5347 4.65566 15.5136 4.09794C15.4993 3.71848 15.4628 3.45833 15.3694 3.23463C15.1649 2.74458 14.7726 2.35523 14.2788 2.15224Z" fill="#41495A"/><path d="M15.5227 12C15.5227 13.6569 14.1694 15 12.4999 15C10.8304 15 9.47705 13.6569 9.47705 12C9.47705 10.3431 10.8304 9 12.4999 9C14.1694 9 15.5227 10.3431 15.5227 12Z" fill="#41495A"/></svg>,
                },
                {
                  href: '/saved', label: 'Saved homes',
                  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 5.50063C7.50016 0.825464 2 4.27416 2 9.1371C2 14 6.01943 16.5914 8.96173 18.9109C10 19.7294 11 20.5 12 20.5" stroke="#41495A" strokeWidth="1.5" strokeLinecap="round"/><path opacity="0.5" d="M12 5.50063C16.4998 0.825464 22 4.27416 22 9.1371C22 14 17.9806 16.5914 15.0383 18.9109C14 19.7294 13 20.5 12 20.5" stroke="#41495A" strokeWidth="1.5" strokeLinecap="round"/></svg>,
                },
                {
                  href: '/visits', label: 'Visit requests',
                  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 12C2 8.22876 2 6.34315 3.17157 5.17157C4.34315 4 6.22876 4 10 4H14C17.7712 4 19.6569 4 20.8284 5.17157C22 6.34315 22 8.22876 22 12V14C22 17.7712 22 19.6569 20.8284 20.8284C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.8284C2 19.6569 2 17.7712 2 14V12Z" stroke="#41495A" strokeWidth="1.5"/><path opacity="0.5" d="M7 4V2.5" stroke="#41495A" strokeWidth="1.5" strokeLinecap="round"/><path opacity="0.5" d="M17 4V2.5" stroke="#41495A" strokeWidth="1.5" strokeLinecap="round"/><path opacity="0.5" d="M2 9H22" stroke="#41495A" strokeWidth="1.5" strokeLinecap="round"/><path d="M9 14.5L10.5 13V17" stroke="#41495A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13 16V14C13 13.4477 13.4477 13 14 13C14.5523 13 15 13.4477 15 14V16C15 16.5523 14.5523 17 14 17C13.4477 17 13 16.5523 13 16Z" stroke="#41495A" strokeWidth="1.5" strokeLinecap="round"/></svg>,
                },
                {
                  href: '/messages', label: 'Messages',
                  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.09436 11.2288C6.03221 10.8282 5.99996 10.4179 5.99996 10C5.99996 5.58172 9.60525 2 14.0526 2C18.4999 2 22.1052 5.58172 22.1052 10C22.1052 10.9981 21.9213 11.9535 21.5852 12.8345C21.5154 13.0175 21.4804 13.109 21.4646 13.1804C21.4489 13.2512 21.4428 13.301 21.4411 13.3735C21.4394 13.4466 21.4493 13.5272 21.4692 13.6883L21.8717 16.9585C21.9153 17.3125 21.9371 17.4895 21.8782 17.6182C21.8266 17.731 21.735 17.8205 21.6211 17.8695C21.4911 17.9254 21.3146 17.8995 20.9617 17.8478L17.7765 17.3809C17.6101 17.3565 17.527 17.3443 17.4512 17.3448C17.3763 17.3452 17.3245 17.3507 17.2511 17.3661C17.177 17.3817 17.0823 17.4172 16.893 17.4881C16.0097 17.819 15.0524 18 14.0526 18C13.6344 18 13.2237 17.9683 12.8227 17.9073M7.63158 22C10.5965 22 13 19.5376 13 16.5C13 13.4624 10.5965 11 7.63158 11C4.66668 11 2.26316 13.4624 2.26316 16.5C2.26316 17.1106 2.36028 17.6979 2.53955 18.2467C2.61533 18.4787 2.65322 18.5947 2.66566 18.6739C2.67864 18.7567 2.68091 18.8031 2.67608 18.8867C2.67145 18.9668 2.65141 19.0573 2.61134 19.2383L2 22L4.9948 21.591C5.15827 21.5687 5.24 21.5575 5.31137 21.558C5.38652 21.5585 5.42641 21.5626 5.50011 21.5773C5.5701 21.5912 5.67416 21.6279 5.88227 21.7014C6.43059 21.8949 7.01911 22 7.63158 22Z" stroke="#41495A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
                },
                {
                  href: '/notifications', label: 'Notifications',
                  icon: <svg width="18" height="18" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M3.333333333333333 12h9.333333333333332v-4.645733333333333C12.666666666666666 4.765373333333333 10.577333333333332 2.6666666666666665 8 2.6666666666666665c-2.5773266666666665 0 -4.666666666666666 2.0987066666666667 -4.666666666666666 4.6876V12Zm4.666666666666666 -10.666666666666666c3.3137333333333334 0 6 2.695653333333333 6 6.020933333333333V13.333333333333332H2v-5.979066666666666C2 4.0289866666666665 4.686293333333333 1.3333333333333333 8 1.3333333333333333ZM6.333333333333333 14h3.333333333333333c0 0.9204666666666667 -0.7462 1.6666666666666665 -1.6666666666666665 1.6666666666666665S6.333333333333333 14.920466666666666 6.333333333333333 14Z" fill="#41495A"/></svg>,
                },
              ].map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 18px', textDecoration: 'none', color: '#15243B', fontSize: 13.5, fontWeight: 500 }}
                  className="nav-dd-item"
                >
                  <span style={{ width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Sign out */}
            <div style={{ borderTop: '1px solid #F2F4F7', padding: '8px 0' }}>
              <button
                onClick={handleSignOut}
                style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: '9px 18px', background: 'none', border: 'none', cursor: 'pointer', color: '#C7553B', fontSize: 13.5, fontWeight: 600, fontFamily: 'inherit' }}
                className="nav-dd-item"
              >
                <span style={{ width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 12H2M2 12L5.5 8.5M2 12L5.5 15.5" stroke="#C7553B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 8V6C9 4.89543 9.89543 4 11 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H11C9.89543 20 9 19.1046 9 18V16" stroke="#C7553B" strokeWidth="2" strokeLinecap="round"/></svg>
                </span>
                Sign out
              </button>
            </div>
          </div>
        </div>
      ) : (
        <Link
          href="/auth"
          style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #D3D9E0', borderRadius: 999, padding: '7px 18px', cursor: 'pointer', background: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600, color: '#15243B' }}
        >
          Sign in
        </Link>
      )}

      <style>{`
        .nav-dropdown {
          opacity: 0;
          transform: scale(0.94) translateY(-6px);
          transition: opacity 0.28s cubic-bezier(0.22,1,0.36,1), transform 0.28s cubic-bezier(0.22,1,0.36,1);
        }
        .nav-dropdown--open {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
        .nav-dd-item:hover { background: #F4F7FA; }
      `}</style>
    </div>
  );
}
