import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import Sidebar from '@/components/Sidebar';
import { Suspense } from 'react';
import SavedToast from '@/components/SavedToast';

async function getPendingCounts() {
  const [mod] = await db.execute(
    sql`SELECT COUNT(*) as count FROM listings WHERE verified = false`
  );
  return { pendingMod: Number((mod as { count: string }).count) };
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect('/login');

  const { pendingMod } = await getPendingCounts();
  const initials = session.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F6F9' }}>
      <Sidebar
        adminName={session.name}
        adminRole="Lead Moderator"
        pendingMod={pendingMod}
      />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {children}
        <Suspense fallback={null}>
          <SavedToast />
        </Suspense>
      </div>
    </div>
  );
}
