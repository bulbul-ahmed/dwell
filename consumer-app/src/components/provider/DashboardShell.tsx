'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Toast from './Toast';
import OwnerVerifyBanner from './OwnerVerifyBanner';

interface Props {
  ownerName?: string;
  ownerType?: string;
  ownerStatus: string;
  avatarUrl?: string | null;
  children: React.ReactNode;
}

export default function DashboardShell({ ownerName, ownerType, ownerStatus, avatarUrl, children }: Props) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F6F9' }}>
      <Sidebar
        ownerName={ownerName}
        ownerType={ownerType}
        avatarUrl={avatarUrl}
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />

      {/* mobile scrim — tap to close the drawer */}
      {navOpen && (
        <div
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-hidden
        />
      )}

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Header onMenu={() => setNavOpen(true)} avatarUrl={avatarUrl} />
        <OwnerVerifyBanner status={ownerStatus} />
        <main className="px-4 py-5 lg:px-[34px] lg:pt-7 lg:pb-14" style={{ flex: 1, minWidth: 0 }}>
          {children}
        </main>
      </div>

      <Toast />
    </div>
  );
}
