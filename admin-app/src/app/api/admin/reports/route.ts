import { NextRequest, NextResponse } from 'next/server';
import { db, reports, listings, owners, notifications } from '@/db';
import { eq, and } from 'drizzle-orm';
import { getAdminSession } from '@/lib/auth';
import { notifyUser } from '@/lib/notify-user';

// Resolve a report. action = 'dismiss' (no-op on listing) | 'remove' (take listing down).
export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const id = parseInt(formData.get('id') as string);
  const action = formData.get('action') as string;

  if (!id || !action) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

  const [report] = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
  if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });

  if (action === 'dismiss') {
    await db.update(reports)
      .set({ status: 'resolved', resolvedAs: 'dismissed', resolvedAt: new Date() })
      .where(eq(reports.id, id));
    return NextResponse.redirect(new URL('/reports', req.url));
  }

  if (action === 'remove') {
    // Take the listing down (back to rejected/unverified) and resolve every open report on it.
    const [listing] = await db
      .select({ id: listings.id, title: listings.title, ownerId: listings.ownerId })
      .from(listings)
      .where(eq(listings.id, report.listingId))
      .limit(1);

    if (listing) {
      await db.update(listings)
        .set({ verified: false, moderationStatus: 'rejected', rejectionReason: 'Removed after a community report' })
        .where(eq(listings.id, listing.id));

      // Notify the listing owner.
      const [owner] = await db.select({ userId: owners.userId }).from(owners).where(eq(owners.id, listing.ownerId)).limit(1);
      if (owner?.userId) {
        await db.insert(notifications).values({
          userId: owner.userId,
          type: 'listing',
          title: 'Your listing was taken down',
          body: `"${listing.title}" was removed following a community report. Please review our policies and edit before resubmitting.`,
          href: `/list?edit=${listing.id}`,
          icon: 'ti-home',
          icoBg: '#FDF1EF',
          icoFg: '#B4402B',
          read: false,
        });
        await notifyUser(owner.userId, { kind: 'notification' });
      }
    }

    await db.update(reports)
      .set({ status: 'resolved', resolvedAs: 'removed', resolvedAt: new Date() })
      .where(and(eq(reports.listingId, report.listingId), eq(reports.status, 'open')));

    return NextResponse.redirect(new URL('/reports', req.url));
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
