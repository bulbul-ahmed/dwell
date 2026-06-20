import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db, listings, owners } from '@/db';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  void request;
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const [owner] = await db.select().from(owners).where(eq(owners.userId, userId)).limit(1);
  if (!owner) return NextResponse.json({ listings: [] });

  const rows = await db
    .select({
      id:               listings.id,
      cat:              listings.cat,
      title:            listings.title,
      area:             listings.area,
      price:            listings.price,
      cover:            listings.cover,
      verified:         listings.verified,
      beds:             listings.beds,
      floor:            listings.floor,
      moderationStatus: listings.moderationStatus,
      rejectionReason:  listings.rejectionReason,
      createdAt:        listings.createdAt,
    })
    .from(listings)
    .where(eq(listings.ownerId, owner.id))
    .orderBy(listings.createdAt);

  return NextResponse.json({ listings: rows });
}
