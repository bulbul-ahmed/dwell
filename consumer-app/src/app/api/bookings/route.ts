import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db, bookings, listings, owners } from '@/db';
import { eq, desc } from 'drizzle-orm';
import { getSession } from '@/lib/session';
import { createNotification } from '@/lib/notifications';

export async function GET() {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const rows = await db
    .select({
      id:           bookings.id,
      listingId:    bookings.listingId,
      slot:         bookings.slot,
      visitDate:    bookings.visitDate,
      visitTime:    bookings.visitTime,
      note:         bookings.note,
      status:       bookings.status,
      createdAt:    bookings.createdAt,
      listingTitle: listings.title,
      listingCover: listings.cover,
      listingArea:  listings.area,
    })
    .from(bookings)
    .innerJoin(listings, eq(bookings.listingId, listings.id))
    .where(eq(bookings.userId, userId))
    .orderBy(desc(bookings.createdAt));

  return NextResponse.json({ bookings: rows });
}

export async function POST(request: NextRequest) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { listingId, slot, visitDate, visitTime, note } = await request.json() as {
    listingId: number;
    slot: string;
    visitDate?: string;
    visitTime?: string;
    note?: string;
  };

  const [inserted] = await db
    .insert(bookings)
    .values({ listingId, userId, slot, visitDate, visitTime, note })
    .returning();

  const [listing] = await db
    .select({ title: listings.title, area: listings.area, ownerUserId: owners.userId })
    .from(listings)
    .innerJoin(owners, eq(listings.ownerId, owners.id))
    .where(eq(listings.id, listingId))
    .limit(1);

  if (listing) {
    const when = visitDate && visitTime ? ` on ${visitDate} at ${visitTime}` : '';

    // Notify the visitor — confirmation their request was submitted.
    createNotification({
      userId,
      type: 'visit',
      title: `Visit request submitted — ${listing.title}`,
      body: `Your visit request for ${listing.title}, ${listing.area}${when} is pending owner approval.`,
      href: '/visits',
    }).catch(() => {});

    // Notify the listing owner — a new visit request needs their approval.
    if (listing.ownerUserId && listing.ownerUserId !== userId) {
      createNotification({
        userId: listing.ownerUserId,
        type: 'visit',
        title: `New visit request — ${listing.title}`,
        body: `Someone requested a visit to ${listing.title}, ${listing.area}${when}. Review and approve.`,
        href: '/visits',
      }).catch(() => {});
    }
  }

  return NextResponse.json({ booking: inserted }, { status: 201 });
}
