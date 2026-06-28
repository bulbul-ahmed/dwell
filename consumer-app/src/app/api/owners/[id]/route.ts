import { NextResponse } from 'next/server';
import { db, owners, listings, reviews, users } from '@/db';
import { eq, inArray, desc } from 'drizzle-orm';
import type { Listing } from '@/types';

function mapListing(row: typeof listings.$inferSelect, owner: typeof owners.$inferSelect): Listing {
  return {
    id: row.id, cat: row.cat as Listing['cat'], title: row.title, area: row.area,
    price: row.price, beds: row.beds, baths: row.baths, size: row.size, floor: row.floor,
    furnishing: row.furnishing as Listing['furnishing'], pref: row.pref,
    adv: row.advance, service: row.service, verified: row.verified, sale: row.sale,
    owner: { name: owner.name, type: owner.type, rating: owner.rating, rt: owner.responseTime ?? '' },
    cover: row.cover, coverUrl: row.cover,
    shots: row.shots ?? [], shotUrls: row.shots ?? [],
    amen: row.amenities ?? [], mapX: row.mapX ?? '', mapY: row.mapY ?? '',
    desc: row.description ?? '',
  };
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ownerId = parseInt(id, 10);
  if (isNaN(ownerId)) return NextResponse.json({ error: 'invalid id' }, { status: 400 });

  const [owner] = await db.select().from(owners).where(eq(owners.id, ownerId)).limit(1);
  if (!owner) return NextResponse.json({ error: 'not found' }, { status: 404 });
  // Public profile — never expose KYC/PII (nidNumber, tradeLicense, phone, verifiedBy).
  const publicOwner = {
    id: owner.id, name: owner.name, type: owner.type, rating: owner.rating,
    responseTime: owner.responseTime, verified: owner.verified, createdAt: owner.createdAt,
  };

  const ownerListings = await db.select().from(listings).where(eq(listings.ownerId, ownerId));

  // Reviews across all of this owner's listings, newest first.
  const listingIds = ownerListings.map(l => l.id);
  const ownerReviews = listingIds.length
    ? await db
        .select({
          id:        reviews.id,
          rating:    reviews.rating,
          comment:   reviews.comment,
          createdAt: reviews.createdAt,
          userName:  users.name,
        })
        .from(reviews)
        .innerJoin(users, eq(reviews.userId, users.id))
        .where(inArray(reviews.listingId, listingIds))
        .orderBy(desc(reviews.createdAt))
    : [];

  return NextResponse.json({
    owner: publicOwner,
    listings: ownerListings.map(l => mapListing(l, owner)),
    reviews: ownerReviews,
  });
}
