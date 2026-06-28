import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db, saves, listings, owners } from '@/db';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/session';

export async function GET() {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ savedIds: [] });
  const rows = await db.select({ listingId: saves.listingId }).from(saves).where(eq(saves.userId, userId));
  return NextResponse.json({ savedIds: rows.map((r) => r.listingId) });
}

export async function POST(request: NextRequest) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { listingId } = await request.json().catch(() => ({})) as { listingId?: number };
  if (!Number.isInteger(listingId)) return NextResponse.json({ error: 'Invalid listingId' }, { status: 400 });

  const [listingOwner] = await db
    .select({ ownerUserId: owners.userId })
    .from(listings)
    .innerJoin(owners, eq(listings.ownerId, owners.id))
    .where(eq(listings.id, listingId))
    .limit(1);

  if (listingOwner?.ownerUserId === userId) {
    return NextResponse.json({ error: 'Cannot save your own listing' }, { status: 400 });
  }

  await db.insert(saves).values({ userId, listingId }).onConflictDoNothing();
  return NextResponse.json({ ok: true }, { status: 201 });
}
