import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db, threads, listings, owners, users } from '@/db';
import { eq, and, or, desc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { getSession } from '@/lib/session';
import { createNotification } from '@/lib/notifications';

export async function GET() {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ownerUser = alias(users, 'owner_user');

  const rows = await db
    .select({
      id:             threads.id,
      listingId:      threads.listingId,
      lastMessage:    threads.lastMessage,
      lastAt:         threads.lastAt,
      createdAt:      threads.createdAt,
      listingTitle:   listings.title,
      listingCover:   listings.cover,
      ownerName:      owners.name,
      ownerUserId:    owners.userId,
      ownerAvatar:    ownerUser.avatarUrl,
      renterUserId:   threads.userId,
      renterName:     users.name,
      renterAvatar:   users.avatarUrl,
    })
    .from(threads)
    .innerJoin(listings, eq(threads.listingId, listings.id))
    .innerJoin(owners, eq(listings.ownerId, owners.id))
    .innerJoin(users, eq(threads.userId, users.id))
    .leftJoin(ownerUser, eq(owners.userId, ownerUser.id))
    .where(or(eq(threads.userId, userId), eq(owners.userId, userId)))
    .orderBy(desc(threads.lastAt));

  const shaped = rows.map(r => {
    const role: 'renter' | 'owner' = r.renterUserId === userId ? 'renter' : 'owner';
    const counterpartyName = role === 'renter' ? r.ownerName : r.renterName;
    const counterpartyAvatar = role === 'renter' ? r.ownerAvatar : r.renterAvatar;
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
      counterpartyAvatar,
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
    .select({ ownerUserId: owners.userId, title: listings.title, area: listings.area })
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

  // Notify the listing owner of a new inquiry.
  if (listingOwner?.ownerUserId && listingOwner.ownerUserId !== userId) {
    createNotification({
      userId: listingOwner.ownerUserId,
      type: 'system',
      title: `New inquiry — ${listingOwner.title}`,
      body: `Someone started a conversation about ${listingOwner.title}, ${listingOwner.area}.`,
      href: '/dashboard/leads',
    }).catch(() => {});
  }

  return NextResponse.json({ threadId: inserted[0].id });
}
