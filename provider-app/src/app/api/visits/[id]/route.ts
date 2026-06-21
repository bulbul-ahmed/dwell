import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db, bookings, listings, users } from '@/db';
import { eq } from 'drizzle-orm';
import { getProviderSession } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

// PATCH /api/visits/[id]
// Provider acts on a visit request for one of their own listings.
//   { action: 'accept' | 'decline' | 'complete' | 'cancel' | 'suggest', reason?, suggestedDate?, suggestedTime? }
const NEXT: Record<string, 'confirmed' | 'cancelled' | 'completed' | 'suggested'> = {
  accept:   'confirmed',
  decline:  'cancelled',
  cancel:   'cancelled',
  complete: 'completed',
  suggest:  'suggested',
};

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getProviderSession();
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const { id } = await params;
  const bookingId = parseInt(id, 10);
  if (isNaN(bookingId)) return NextResponse.json({ error: 'Bad id' }, { status: 400 });

  const { action, reason, suggestedDate, suggestedTime } = await request.json() as {
    action: string; reason?: string; suggestedDate?: string; suggestedTime?: string;
  };
  const next = NEXT[action];
  if (!next) return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  if (action === 'suggest' && (!suggestedDate || !suggestedTime)) {
    return NextResponse.json({ error: 'suggestedDate and suggestedTime required' }, { status: 400 });
  }

  // Load booking + listing, enforce ownership.
  const [row] = await db
    .select({
      bookingUserId: bookings.userId,
      ownerId:       listings.ownerId,
      title:         listings.title,
      area:          listings.area,
      visitDate:     bookings.visitDate,
      visitTime:     bookings.visitTime,
    })
    .from(bookings)
    .innerJoin(listings, eq(bookings.listingId, listings.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (row.ownerId !== session.ownerId) {
    return NextResponse.json({ error: 'Not your listing' }, { status: 403 });
  }

  const set: Partial<typeof bookings.$inferInsert> = { status: next };
  if (action === 'decline') set.declineReason = reason ?? null;
  if (action === 'suggest') { set.suggestedDate = suggestedDate; set.suggestedTime = suggestedTime; }

  const [updated] = await db.update(bookings).set(set).where(eq(bookings.id, bookingId)).returning();

  // Notify the renter (links to their consumer /visits page).
  const when = row.visitDate && row.visitTime ? ` — ${row.visitDate} at ${row.visitTime}` : '';
  const NOTIF: Record<string, { title: string; body: string }> = {
    accept:   { title: `Visit confirmed — ${row.title}`,  body: `The owner confirmed your visit to ${row.title}, ${row.area}${when}.` },
    decline:  { title: `Visit declined — ${row.title}`,   body: `Your visit to ${row.title}, ${row.area} was declined${reason ? `: ${reason}` : '.'}` },
    cancel:   { title: `Visit cancelled — ${row.title}`,  body: `Your visit to ${row.title}, ${row.area}${when} was cancelled by the owner.` },
    complete: { title: `Visit completed — ${row.title}`,  body: `Your visit to ${row.title} is marked complete. Leave a review!` },
    suggest:  { title: `New time suggested — ${row.title}`, body: `The owner suggested ${suggestedDate} at ${suggestedTime} for ${row.title}. Accept or decline.` },
  };
  const n = NOTIF[action];
  if (n) {
    createNotification({ userId: row.bookingUserId, type: 'visit', title: n.title, body: n.body, href: '/visits' }).catch(() => {});
  }

  return NextResponse.json({ booking: updated });
}
