import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db, bookings, listings, owners } from '@/db';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/session';
import { createNotification } from '@/lib/notifications';

// PATCH /api/bookings/[id]
// Renter or listing owner updates a booking's status.
//   { status, acceptSuggested? }
// acceptSuggested: renter accepts the owner's proposed time → copies suggested → visit.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { id } = await params;
  const bookingId = parseInt(id, 10);
  if (isNaN(bookingId)) return NextResponse.json({ error: 'Invalid booking id' }, { status: 400 });
  const { status, acceptSuggested } = await request.json().catch(() => ({})) as {
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'suggested';
    acceptSuggested?: boolean;
  };
  const ALL_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed', 'suggested'] as const;
  if (!ALL_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  // Load booking + listing owner; enforce that the caller is a party to it.
  const [row] = await db
    .select({
      bookingUserId: bookings.userId,
      ownerUserId:   owners.userId,
      title:         listings.title,
      area:          listings.area,
      suggestedDate: bookings.suggestedDate,
      suggestedTime: bookings.suggestedTime,
    })
    .from(bookings)
    .innerJoin(listings, eq(bookings.listingId, listings.id))
    .innerJoin(owners, eq(listings.ownerId, owners.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const isRenter = row.bookingUserId === userId;
  const isOwner  = row.ownerUserId === userId;
  if (!isRenter && !isOwner) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  // Role-scoped transitions: owners manage approval/completion; renters may only
  // cancel, or confirm by accepting the owner's suggested time.
  const ownerAllowed  = ['confirmed', 'cancelled', 'completed', 'suggested'];
  const renterAllowed = acceptSuggested ? ['confirmed', 'cancelled'] : ['cancelled'];
  const allowed = isOwner ? ownerAllowed : renterAllowed;
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: 'Not allowed to set this status' }, { status: 403 });
  }

  const set: Partial<typeof bookings.$inferInsert> = { status };
  if (acceptSuggested && row.suggestedDate && row.suggestedTime) {
    set.visitDate = row.suggestedDate;
    set.visitTime = row.suggestedTime;
    set.suggestedDate = null;
    set.suggestedTime = null;
  }

  const [updated] = await db.update(bookings).set(set).where(eq(bookings.id, bookingId)).returning();

  // Notify the OTHER party (not the actor).
  const recipient = isRenter ? row.ownerUserId : row.bookingUserId;
  if (recipient && recipient !== userId && (status === 'confirmed' || status === 'cancelled')) {
    const when = updated.visitDate && updated.visitTime ? ` — ${updated.visitDate} at ${updated.visitTime}` : '';
    const actor = isRenter ? 'The renter' : 'The owner';
    const title = status === 'confirmed'
      ? `Visit confirmed — ${row.title}`
      : `Visit cancelled — ${row.title}`;
    const body = status === 'confirmed'
      ? `${actor} confirmed the visit for ${row.title}, ${row.area}${when}.`
      : `${actor} cancelled the visit for ${row.title}, ${row.area}${when}.`;
    const href = isRenter ? '/dashboard/visits' : '/visits';
    createNotification({ userId: recipient, type: 'visit', title, body, href }).catch(() => {});
  }

  return NextResponse.json({ booking: updated });
}
