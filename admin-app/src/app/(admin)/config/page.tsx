import { db, blocks, amenities, categories, pricingPlans, configAudit } from '@/db';
import { asc, desc, sql } from 'drizzle-orm';
import { getAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Topbar from '@/components/Topbar';
import { initials } from '@/lib/utils';
import ConfigManager from '@/components/ConfigManager';

export default async function ConfigPage() {
  const session = await getAdminSession();
  if (!session) redirect('/login');

  const [blockRows, amenityRows, categoryRows, pricingRows, auditRows, observedRows] = await Promise.all([
    db.select().from(blocks).orderBy(asc(blocks.sortOrder), asc(blocks.id)),
    db.select().from(amenities).orderBy(asc(amenities.sortOrder), asc(amenities.id)),
    db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.id)),
    db.select().from(pricingPlans).orderBy(asc(pricingPlans.sortOrder), asc(pricingPlans.id)),
    db.select().from(configAudit).orderBy(desc(configAudit.id)).limit(12),
    db.execute<{ area: string; count: string }>(
      sql`SELECT area, COUNT(*) as count FROM listings WHERE verified = true AND btrim(area) <> '' GROUP BY area ORDER BY count DESC LIMIT 12`
    ),
  ]);

  const observed = (observedRows as unknown as { area: string; count: string }[])
    .map(r => ({ area: r.area, count: parseInt(r.count, 10) }));

  const adminInitials = initials(session.name);

  return (
    <>
      <Topbar
        crumb="System"
        title="Areas & configuration"
        adminInitials={adminInitials}
        adminName={session.name}
        adminEmail={session.email}
      />
      <main style={{ flex: 1, padding: '28px 34px 56px', minWidth: 0 }}>
        <ConfigManager
          initialBlocks={blockRows}
          initialAmenities={amenityRows}
          initialCategories={categoryRows}
          initialPricing={pricingRows}
          observed={observed}
          initialAudit={auditRows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() }))}
        />
      </main>
    </>
  );
}
