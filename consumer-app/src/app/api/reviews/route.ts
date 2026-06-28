import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db, reviews, users, listings, owners } from '@/db';
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

  const { listingId, rating, subRatings, comment } = await request.json().catch(() => ({})) as {
    listingId?: number;
    rating?: number;
    subRatings?: object;
    comment?: string;
  };

  if (!Number.isInteger(listingId)) return NextResponse.json({ error: 'Invalid listingId' }, { status: 400 });
  if (!Number.isFinite(rating) || (rating as number) < 1 || (rating as number) > 5) {
    return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 });
  }
  // Confirm the listing exists before writing a review against it.
  const [exists] = await db.select({ id: listings.id }).from(listings).where(eq(listings.id, listingId as number)).limit(1);
  if (!exists) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

  const [inserted] = await db
    .insert(reviews)
    .values({ listingId: listingId as number, userId, rating: rating as number, subRatings, comment })
    .returning();

  const [listing] = await db
    .select({ title: listings.title, ownerUserId: owners.userId })
    .from(listings)
    .innerJoin(owners, eq(listings.ownerId, owners.id))
    .where(eq(listings.id, listingId))
    .limit(1);

  if (listing) {
    // Notify reviewer
    createNotification({
      userId,
      type:  'review',
      title: `Your ${rating}-star review was published`,
      body:  `Your review for ${listing.title} is now live and visible to other renters.`,
      href:  `/listings/${listingId}`,
    }).catch(() => {});

    // Notify listing owner
    if (listing.ownerUserId && listing.ownerUserId !== userId) {
      createNotification({
        userId: listing.ownerUserId,
        type:   'review',
        title:  `New ${rating}-star review — ${listing.title}`,
        body:   `A renter left a ${rating}-star review on ${listing.title}.`,
        href:   '/dashboard/reviews',
      }).catch(() => {});
    }
  }

  return NextResponse.json({ review: inserted }, { status: 201 });
}
