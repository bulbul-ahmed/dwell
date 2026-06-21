import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db, bookings, listings, owners, users } from '@/db';
import { and, eq, isNull } from 'drizzle-orm';
import { createNotification } from '@/lib/notifications';
import { sendSMS } from '@/lib/sms';

export const dynamic = 'force-dynamic';

// Bangladesh is UTC+6, no DST. Compute the visit instant (epoch ms) directly so
// the result is independent of the server's local timezone.
const BD_OFFSET_MS = 6 * 60 * 60 * 1000;

function visitEpochMs(date: string, time: string | null): number | null {
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return null;
  let h = 0, min = 0;
  if (time) {
    const mt = time.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (mt) {
      h = parseInt(mt[1], 10); min = parseInt(mt[2], 10);
      const ap = mt[3]?.toUpperCase();
      if (ap === 'PM' && h < 12) h += 12;
      if (ap === 'AM' && h === 12) h = 0;
    }
  }
  return Date.UTC(y, m - 1, d, h, min) - BD_OFFSET_MS;
}

async function run(req: NextRequest) {
  // Auth: when CRON_SECRET is set, require it. Unset (local dev) → allow.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const sent = req.headers.get('x-cron-secret') ?? new URL(req.url).searchParams.get('secret');
    if (sent !== secret) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const leadMin = Number(new URL(req.url).searchParams.get('lead') ?? '60');
  const now = Date.now();
  const windowEnd = now + leadMin * 60_000;

  const candidates = await db
    .select({
      id:           bookings.id,
      visitDate:    bookings.visitDate,
      visitTime:    bookings.visitTime,
      title:        listings.title,
      area:         listings.area,
      renterId:     bookings.userId,
      renterName:   users.name,
      renterPhone:  users.phone,
      ownerUserId:  owners.userId,
      ownerPhone:   owners.phone,
    })
    .from(bookings)
    .innerJoin(listings, eq(bookings.listingId, listings.id))
    .innerJoin(owners, eq(listings.ownerId, owners.id))
    .innerJoin(users, eq(bookings.userId, users.id))
    .where(and(eq(bookings.status, 'confirmed'), isNull(bookings.reminderSentAt)));

  let reminded = 0;
  for (const c of candidates) {
    if (!c.visitDate) continue;
    const startMs = visitEpochMs(c.visitDate, c.visitTime);
    if (startMs === null || startMs <= now || startMs > windowEnd) continue;

    // Atomic claim — only the first run to flip the marker sends.
    const [claimed] = await db
      .update(bookings)
      .set({ reminderSentAt: new Date() })
      .where(and(eq(bookings.id, c.id), isNull(bookings.reminderSentAt)))
      .returning({ id: bookings.id });
    if (!claimed) continue;

    const when = `${c.visitDate}${c.visitTime ? ` at ${c.visitTime}` : ''}`;

    // Renter
    createNotification({
      userId: c.renterId, type: 'visit',
      title: `Reminder — visit soon: ${c.title}`,
      body: `Your visit to ${c.title}, ${c.area} is coming up — ${when}.`,
      href: '/visits',
    }).catch(() => {});
    if (c.renterPhone) sendSMS(c.renterPhone, `Dwell: Reminder — your visit to ${c.title} is at ${when}.`).catch(() => {});

    // Owner
    if (c.ownerUserId) {
      createNotification({
        userId: c.ownerUserId, type: 'visit',
        title: `Reminder — visit soon: ${c.title}`,
        body: `${c.renterName} is visiting ${c.title}, ${c.area} — ${when}.`,
        href: '/visits',
      }).catch(() => {});
    }
    if (c.ownerPhone) sendSMS(c.ownerPhone, `Dwell: Reminder — ${c.renterName} visits ${c.title} at ${when}.`).catch(() => {});

    reminded++;
  }

  return NextResponse.json({ scanned: candidates.length, reminded, leadMin });
}

export const GET  = run;
export const POST = run;
