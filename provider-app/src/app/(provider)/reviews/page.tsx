import { db, reviews, listings, users } from '@/db';
import { eq, inArray, count } from 'drizzle-orm';
import { getProviderSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ReviewsClient, { type ReviewRow } from '@/components/provider/ReviewsClient';

export const dynamic = 'force-dynamic';

function starsStr(n: number) {
  return '★'.repeat(Math.min(n, 5));
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default async function ReviewsPage() {
  const session = await getProviderSession();
  if (!session) redirect('/login');

  const myListings = await db
    .select({ id: listings.id })
    .from(listings)
    .where(eq(listings.ownerId, session.ownerId));

  const listingIds = myListings.map(l => l.id);

  const rows = listingIds.length
    ? await db
        .select({
          id: reviews.id,
          rating: reviews.rating,
          comment: reviews.comment,
          createdAt: reviews.createdAt,
          userName: users.name,
          listingTitle: listings.title,
        })
        .from(reviews)
        .innerJoin(listings, eq(reviews.listingId, listings.id))
        .innerJoin(users, eq(reviews.userId, users.id))
        .where(inArray(reviews.listingId, listingIds))
        .orderBy(reviews.createdAt)
    : [];

  const totalReviews = rows.length;
  const avgRating = totalReviews > 0
    ? rows.reduce((s, r) => s + r.rating, 0) / totalReviews
    : 0;

  const starCounts = [5,4,3,2,1].map(star => ({
    star,
    count: rows.filter(r => r.rating === star).length,
    w: totalReviews > 0 ? `${Math.round(rows.filter(r => r.rating === star).length / totalReviews * 100)}%` : '0%',
  }));

  const AV_COLORS = ['#2C557F','#2E7D55','#7B3F9E','#9A6A1F','#2A5C8A','#B4402B'];
  const data: ReviewRow[] = rows.map((r, idx) => ({
    id: r.id,
    by: r.userName,
    when: timeAgo(new Date(r.createdAt)),
    context: r.listingTitle,
    stars: starsStr(r.rating),
    rating: r.rating,
    text: r.comment ?? '',
    avBg: AV_COLORS[idx % AV_COLORS.length],
    initial: r.userName.charAt(0).toUpperCase(),
    reply: null,
  }));

  return (
    <ReviewsClient
      reviews={data}
      totalReviews={totalReviews}
      avgRating={Math.round(avgRating * 10) / 10}
      starCounts={starCounts}
    />
  );
}
