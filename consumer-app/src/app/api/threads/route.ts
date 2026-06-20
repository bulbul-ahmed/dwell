import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db, threads, listings, owners, users } from '@/db';
import { eq, and, or, desc } from 'drizzle-orm';
import { getSession } from '@/lib/session';

export async function GET() {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db
    .select({
      id:           threads.id,
      listingId:    threads.listingId,
      lastMessage:  threads.lastMessage,
      lastAt:       threads.lastAt,
      createdAt:    threads.createdAt,
      listingTitle: listings.title,
      listingCover: listings.cover,
      ownerName:    owners.name,
      ownerUserId:  owners.userId,
      renterUserId: threads.userId,
      renterName:   users.name,
    })
    .from(threads)
    .innerJoin(listings, eq(threads.listingId, listings.id))
    .innerJoin(owners, eq(listings.ownerId, owners.id))
    .innerJoin(users, eq(threads.userId, users.id))
    .where(or(eq(threads.userId, userId), eq(owners.userId, userId)))
    .orderBy(desc(threads.lastAt));

  const shaped = rows.map(r => {
    const role: 'renter' | 'owner' = r.renterUserId === userId ? 'renter' : 'owner';
    const counterpartyName = role === 'renter' ? r.ownerName : r.renterName;
    return {
      id: r.id,
      listingId: r.listingId,
      lastMessage: r.lastMessage,
      lastAt: r.lastAt,
      createdAt: r.createdAt,
      listingTitle: r.listingTitle,
      listingCover: r.listingCover,
      ownerName: counterpartyName,
      counterpartyName,
      role,
    };
  });

  return NextResponse.json({ threads: shaped });
}

export async function POST(request: NextRequest) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { listingId } = await request.json() as { listingId: number };

  const [listingOwner] = await db
    .select({ ownerUserId: owners.userId })
    .from(listings)
    .innerJoin(owners, eq(listings.ownerId, owners.id))
    .where(eq(listings.id, listingId))
    .limit(1);

  if (listingOwner?.ownerUserId === userId) {
    return NextResponse.json({ error: 'Cannot chat with yourself on your own listing' }, { status: 400 });
  }

  const existing = await db
    .select({ id: threads.id })
    .from(threads)
    .where(and(eq(threads.userId, userId), eq(threads.listingId, listingId)));

  if (existing.length > 0) return NextResponse.json({ threadId: existing[0].id });

  const inserted = await db
    .insert(threads)
    .values({ listingId, userId })
    .returning({ id: threads.id });

  return NextResponse.json({ threadId: inserted[0].id });
}
