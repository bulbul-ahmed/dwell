import { db, zones } from '@/db';
import { getAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Topbar from '@/components/Topbar';
import { initials } from '@/lib/utils';
import ZoneManager from '@/components/ZoneManager';
import { desc } from 'drizzle-orm';

export default async function ZonesPage() {
  const session = await getAdminSession();
  if (!session) redirect('/login');

  const initialZones = await db.select().from(zones).orderBy(desc(zones.createdAt));
  const adminInitials = initials(session.name);

  return (
    <>
      <Topbar
        crumb="System"
        title="Zone Manager"
        adminInitials={adminInitials}
        adminName={session.name}
        adminEmail={session.email}
      />
      <main style={{ flex: 1, padding: '28px 34px 56px', minWidth: 0 }}>
        <ZoneManager initialZones={initialZones as unknown as Parameters<typeof ZoneManager>[0]['initialZones']} />
      </main>
    </>
  );
}
