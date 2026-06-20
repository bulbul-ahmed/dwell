import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db, reviews, users, listings } from '@/db';
import { eq, desc } from 'drizzle-orm';
import { getSession } from '@/lib/session';
import { createNotification } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const listingId = searchParams.get('listingId');
  if (!listingId) return NextResponse.json({ error: 'listingId required' }, { status: 400 });

  const rows = await db
    .select({
      id:         reviews.id,
      listingId:  reviews.listingId,
      rating:     reviews.rating,
      subRatings: reviews.subRatings,
      comment:    reviews.comment,
      createdAt:  reviews.createdAt,
      userName:   users.name,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.listingId, parseInt(listingId, 10)))
    .orderBy(desc(reviews.createdAt));

  return NextResponse.json({ reviews: rows });
}

export async function POST(request: NextRequest) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { listingId, rating, subRatings, comment } = await request.json() as {
    listingId: number;
    rating: number;
    subRatings?: object;
    comment?: string;
  };

  const [inserted] = await db
    .insert(reviews)
    .values({ listingId, userId, rating, subRatings, comment })
    .returning();

  const [listing] = await db
    .select({ title: listings.title })
    .from(listings)
    .where(eq(listings.id, listingId))
    .limit(1);

  if (listing) {
    createNotification({
      userId,
      type:  'review',
      title: `Your ${rating}-star review was published`,
      body:  `Your review for ${listing.title} is now live and visible to other renters.`,
      href:  `/listings/${listingId}`,
    }).catch(() => {});
  }

  return NextResponse.json({ review: inserted }, { status: 201 });
}
