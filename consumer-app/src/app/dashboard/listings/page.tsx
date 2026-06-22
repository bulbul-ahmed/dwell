import { db, listings, bookings, threads, saves } from '@/db';
import { eq, inArray, count } from 'drizzle-orm';
import { getProviderSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ListingsClient, { type ListingRow } from '@/components/provider/ListingsClient';

export const dynamic = 'force-dynamic';

export default async function ListingsPage() {
  const session = await getProviderSession();
  if (!session) redirect('/auth?next=/dashboard');

  const rows = await db
    .select({
      id: listings.id,
      title: listings.title,
      area: listings.area,
      price: listings.price,
      cat: listings.cat,
      beds: listings.beds,
      baths: listings.baths,
      size: listings.size,
      cover: listings.cover,
      verified: listings.verified,
    })
    .from(listings)
    .where(eq(listings.ownerId, session.ownerId))
    .orderBy(listings.createdAt);

  const listingIds = rows.map(l => l.id);

  const threadCounts = listingIds.length
    ? await db
        .select({ listingId: threads.listingId, cnt: count() })
        .from(threads)
        .where(inArray(threads.listingId, listingIds))
        .groupBy(threads.listingId)
    : [];

  const bookingCounts = listingIds.length
    ? await db
        .select({ listingId: bookings.listingId, cnt: count() })
        .from(bookings)
        .where(inArray(bookings.listingId, listingIds))
        .groupBy(bookings.listingId)
    : [];

  const saveCounts = listingIds.length
    ? await db
        .select({ listingId: saves.listingId, cnt: count() })
        .from(saves)
        .where(inArray(saves.listingId, listingIds))
        .groupBy(saves.listingId)
    : [];

  const tMap = Object.fromEntries(threadCounts.map(r => [r.listingId, r.cnt]));
  const bMap = Object.fromEntries(bookingCounts.map(r => [r.listingId, r.cnt]));
  const sMap = Object.fromEntries(saveCounts.map(r => [r.listingId, r.cnt]));

  const data: ListingRow[] = rows.map(l => ({
    ...l,
    threadCount: tMap[l.id] ?? 0,
    bookingCount: bMap[l.id] ?? 0,
    saveCount: sMap[l.id] ?? 0,
  }));

  return <ListingsClient listings={data} />;
}
