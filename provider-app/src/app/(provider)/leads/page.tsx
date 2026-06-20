import { db, threads, listings, users, notifications, owners } from '@/db';
import { eq, inArray, desc, and } from 'drizzle-orm';
import { getProviderSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LeadsClient, { type LeadRow } from '@/components/provider/LeadsClient';

export const dynamic = 'force-dynamic';

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default async function LeadsPage() {
  const session = await getProviderSession();
  if (!session) redirect('/login');

  const [me] = await db
    .select({ userId: owners.userId })
    .from(owners)
    .where(eq(owners.id, session.ownerId))
    .limit(1);

  if (me?.userId) {
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(
        eq(notifications.userId, me.userId),
        eq(notifications.type, 'message'),
        eq(notifications.read, false),
      ));
  }

  const myListings = await db
    .select({ id: listings.id })
    .from(listings)
    .where(eq(listings.ownerId, session.ownerId));

  const listingIds = myListings.map(l => l.id);

  const rows = listingIds.length
    ? await db
        .select({
          id: threads.id,
          lastMessage: threads.lastMessage,
          lastAt: threads.lastAt,
          userName: users.name,
          listingTitle: listings.title,
        })
        .from(threads)
        .innerJoin(listings, eq(threads.listingId, listings.id))
        .innerJoin(users, eq(threads.userId, users.id))
        .where(inArray(threads.listingId, listingIds))
        .orderBy(desc(threads.lastAt))
    : [];

  const data: LeadRow[] = rows.map(r => ({
    id: r.id,
    userName: r.userName,
    listingTitle: r.listingTitle,
    lastMessage: r.lastMessage,
    timeAgo: timeAgo(new Date(r.lastAt)),
  }));

  return <LeadsClient leads={data} />;
}
