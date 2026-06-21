import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db, reports, listings } from '@/db';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/session';

const VALID_REASONS = [
  'Fake or fraudulent',
  'Wrong or misleading info',
  'Already rented or sold',
  'Duplicate listing',
  'Offensive content',
  'Spam',
  'Other',
];

// Submit a community flag on a listing. Reports are visible to admins only.
export async function POST(request: NextRequest) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const body = await request.json().catch(() => null) as
    | { listingId?: number; reason?: string; details?: string }
    | null;

  const listingId = Number(body?.listingId);
  const reason = (body?.reason ?? '').trim();
  const details = (body?.details ?? '').trim() || null;

  if (!listingId || isNaN(listingId)) {
    return NextResponse.json({ error: 'Missing listingId' }, { status: 400 });
  }
  if (!reason || !VALID_REASONS.includes(reason)) {
    return NextResponse.json({ error: 'Invalid reason' }, { status: 400 });
  }

  const [listing] = await db.select({ id: listings.id }).from(listings).where(eq(listings.id, listingId)).limit(1);
  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

  await db.insert(reports).values({
    listingId,
    reporterUserId: userId,
    reason,
    details,
  });

  return NextResponse.json({ ok: true });
}
