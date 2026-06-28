import { db, listings, bookings, users } from '@/db';
import { eq, inArray } from 'drizzle-orm';
import { getProviderSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ApplicationsClient from './ApplicationsClient';

export const dynamic = 'force-dynamic';

export default async function ApplicationsPage() {
  const session = await getProviderSession();
  if (!session) redirect('/auth?next=/dashboard/applications');

  const myListings = await db
    .select({ id: listings.id, title: listings.title, cover: listings.cover })
    .from(listings)
    .where(eq(listings.ownerId, session.ownerId));

  const listingIds = myListings.map(l => l.id);
  const listingMap = Object.fromEntries(myListings.map(l => [l.id, l]));

  const apps = listingIds.length
    ? await db
        .select({
          id: bookings.id,
          listingId: bookings.listingId,
          status: bookings.status,
          slot: bookings.slot,
          createdAt: bookings.createdAt,
          userId: bookings.userId,
          userName: users.name,
          userEmail: users.email,
          userAvatar: users.avatarUrl,
        })
        .from(bookings)
        .innerJoin(users, eq(bookings.userId, users.id))
        .where(inArray(bookings.listingId, listingIds))
        .orderBy(bookings.createdAt)
    : [];

  const rows = apps.map(a => ({
    id: a.id,
    listingId: a.listingId,
    listingTitle: listingMap[a.listingId]?.title ?? '',
    listingCover: listingMap[a.listingId]?.cover ?? null,
    status: a.status ?? 'pending',
    slot: a.slot ?? null,
    createdAt: a.createdAt ? String(a.createdAt) : '',
    userName: a.userName,
    userEmail: a.userEmail ?? '',
    userAvatar: a.userAvatar ?? null,
  }));

  return <ApplicationsClient applications={rows} />;
}
