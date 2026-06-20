import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db, bookings, listings } from '@/db';
import { eq } from 'drizzle-orm';
import { createNotification } from '@/lib/notifications';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bookingId = parseInt(id, 10);
  const { status } = await request.json() as { status: 'pending' | 'confirmed' | 'cancelled' | 'completed' };

  const [updated] = await db
    .update(bookings)
    .set({ status })
    .where(eq(bookings.id, bookingId))
    .returning();

  if (!updated) return NextResponse.json({ error: 'not found' }, { status: 404 });

  if (status === 'confirmed' || status === 'cancelled') {
    const [listing] = await db
      .select({ title: listings.title, area: listings.area })
      .from(listings)
      .where(eq(listings.id, updated.listingId))
      .limit(1);

    if (listing) {
      const when = updated.visitDate && updated.visitTime
        ? ` — ${updated.visitDate} at ${updated.visitTime}`
        : '';

      createNotification({
        userId: updated.userId,
        type:   'visit',
        title:  status === 'confirmed'
          ? `Visit confirmed — ${listing.title}`
          : `Visit cancelled — ${listing.title}`,
        body:   status === 'confirmed'
          ? `Owner confirmed your visit for ${listing.title}, ${listing.area}${when}.`
          : `Your visit for ${listing.title}, ${listing.area}${when} was cancelled.`,
        href: '/visits',
      }).catch(() => {});
    }
  }

  return NextResponse.json({ booking: updated });
}
