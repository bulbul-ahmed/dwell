import { db, bookings, listings, users } from '@/db';
import { eq, inArray } from 'drizzle-orm';
import { getProviderSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import VisitsClient, { type BookingRow, type VisitStatus } from '@/components/provider/VisitsClient';

export const dynamic = 'force-dynamic';

const STATUS_MAP: Record<string, VisitStatus> = {
  pending:   'Requested',
  confirmed: 'Confirmed',
  cancelled: 'Declined',
  completed: 'Completed',
  suggested: 'Suggested',
};

export default async function VisitsPage() {
  const session = await getProviderSession();
  if (!session) redirect('/login');

  const myListings = await db
    .select({ id: listings.id })
    .from(listings)
    .where(eq(listings.ownerId, session.ownerId));

  const listingIds = myListings.map(l => l.id);

  const rows = listingIds.length
    ? await db
        .select({
          id: bookings.id,
          slot: bookings.slot,
          visitDate: bookings.visitDate,
          visitTime: bookings.visitTime,
          note: bookings.note,
          status: bookings.status,
          userName: users.name,
          listingTitle: listings.title,
        })
        .from(bookings)
        .innerJoin(listings, eq(bookings.listingId, listings.id))
        .innerJoin(users, eq(bookings.userId, users.id))
        .where(inArray(bookings.listingId, listingIds))
        .orderBy(bookings.createdAt)
    : [];

  const data: BookingRow[] = rows.map(r => ({
    id: r.id,
    seeker: r.userName,
    listingTitle: r.listingTitle,
    slot: r.slot,
    visitDate: r.visitDate,
    visitTime: r.visitTime,
    note: r.note,
    baseStatus: STATUS_MAP[r.status] ?? 'Requested',
  }));

  return <VisitsClient bookings={data} />;
}
