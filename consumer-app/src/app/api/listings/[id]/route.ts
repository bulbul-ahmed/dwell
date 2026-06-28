import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db, listings, owners, saves, users, bookings } from '@/db';
import { eq, and, count, avg, ne, inArray } from 'drizzle-orm';
import type { Listing } from '@/types';
import { getSession } from '@/lib/session';

function mapListing(
  row: { listing: typeof listings.$inferSelect; owner: typeof owners.$inferSelect },
  extras?: {
    savesCount?: number;
    listingCount?: number;
    avatarUrl?: string | null;
    priceContext?: { label: string; pctDiff: number } | null;
  },
): Listing {
  return {
    id: row.listing.id,
    cat: row.listing.cat as Listing['cat'],
    title: row.listing.title,
    area: row.listing.area,
    price: row.listing.price,
    beds: row.listing.beds,
    baths: row.listing.baths,
    size: row.listing.size,
    floor: row.listing.floor,
    furnishing: row.listing.furnishing as Listing['furnishing'],
    pref: row.listing.pref,
    adv: row.listing.advance,
    service: row.listing.service,
    verified: row.listing.verified,
    sale: row.listing.sale,
    owner: {
      name: row.owner.name,
      type: row.owner.type,
      rating: row.owner.rating,
      rt: row.owner.responseTime ?? '',
      listingCount: extras?.listingCount,
      avatarUrl: extras?.avatarUrl,
    },
    ownerId: row.owner.id,
    ownerUserId: row.owner.userId ?? null,
    cover: row.listing.cover,
    coverUrl: row.listing.cover,
    shots: row.listing.shots ?? [],
    shotUrls: row.listing.shots ?? [],
    shotCats: row.listing.shotCats ?? null,
    amen: row.listing.amenities ?? [],
    mapX: row.listing.mapX ?? '',
    mapY: row.listing.mapY ?? '',
    desc: row.listing.description ?? '',
    propertyType: row.listing.propertyType ?? null,
    availableFrom: row.listing.availableFrom ?? null,
    createdAt: row.listing.createdAt ? row.listing.createdAt.toISOString() : null,
    landmark: row.listing.landmark ?? null,
    facing: row.listing.facing ?? null,
    balconies: row.listing.balconies ?? null,
    totalFloors: row.listing.totalFloors ?? null,
    videos: row.listing.videos ?? null,
    meta: (row.listing.meta as Record<string, unknown>) ?? null,
    views: row.listing.views ?? 0,
    savesCount: extras?.savesCount,
    priceContext: extras?.priceContext ?? null,
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const listingId = parseInt(id, 10);

  const rows = await db
    .select({ listing: listings, owner: owners })
    .from(listings)
    .innerJoin(owners, eq(listings.ownerId, owners.id))
    .where(eq(listings.id, listingId));

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const row = rows[0];
  const l = row.listing;

  // Run enrichment queries in parallel
  const [savesResult, listingCountResult, userRow, areaAvgResult] = await Promise.all([
    // Task 2: saves count
    db.select({ cnt: count() }).from(saves).where(eq(saves.listingId, listingId)),
    // Task 5: owner listing count
    db.select({ cnt: count() }).from(listings).where(
      and(eq(listings.ownerId, row.owner.id), eq(listings.verified, true))
    ),
    // Task 5: owner's user avatar
    row.owner.userId
      ? db.select({ avatarUrl: users.avatarUrl }).from(users).where(eq(users.id, row.owner.userId)).limit(1)
      : Promise.resolve([]),
    // Task 9: area median price for same cat + similar beds (±1)
    !l.sale
      ? db.select({ avgPrice: avg(listings.price) }).from(listings).where(
          and(
            eq(listings.cat, l.cat),
            eq(listings.verified, true),
            ne(listings.id, listingId),
          )
        )
      : Promise.resolve([]),
  ]);

  const savesCount = savesResult[0]?.cnt ?? 0;
  const listingCount = listingCountResult[0]?.cnt ?? 0;
  const avatarUrl = (userRow as { avatarUrl: string | null }[])[0]?.avatarUrl ?? null;

  // Compute price context
  let priceContext: { label: string; pctDiff: number } | null = null;
  if (!l.sale && areaAvgResult.length > 0) {
    const marketAvg = parseFloat(String(areaAvgResult[0]?.avgPrice ?? '0'));
    if (marketAvg > 0) {
      const pctDiff = Math.round(((l.price - marketAvg) / marketAvg) * 100);
      const label = pctDiff <= -10 ? 'Below market' : pctDiff >= 10 ? 'Above market' : 'Fair price';
      priceContext = { label, pctDiff };
    }
  }

  // Exact coordinates are private until the visit is approved. Reveal them only to
  // the listing owner or a renter with a confirmed/completed booking; everyone else
  // gets null and the client falls back to the ~approximate (blurred) area map.
  const viewerId = await getSession();
  let canSeeExact = false;
  if (viewerId) {
    if (viewerId === row.owner.userId) {
      canSeeExact = true;
    } else {
      const approved = await db
        .select({ id: bookings.id })
        .from(bookings)
        .where(and(
          eq(bookings.listingId, listingId),
          eq(bookings.userId, viewerId),
          inArray(bookings.status, ['confirmed', 'completed']),
        ))
        .limit(1);
      canSeeExact = approved.length > 0;
    }
  }

  return NextResponse.json({
    listing: mapListing(row, { savesCount, listingCount, avatarUrl, priceContext }),
    edit: {
      mapLat: canSeeExact ? l.mapLat : null,
      mapLng: canSeeExact ? l.mapLng : null,
      zoneId: canSeeExact ? l.zoneId : null,
      area: l.area,
      videos: l.videos ?? [],
    },
  });
}

type ListingBody = {
  cat: string; title: string; area?: string; landmark?: string;
  beds: number; baths?: number; size?: number; floor?: string;
  facing?: string; furnishing: string; totalFloors?: string; pref?: string;
  price: number; advance?: number; service?: number; negotiable?: boolean;
  amenities?: string[]; shots?: string[]; shotCats?: string[];
  videos?: string[]; meta?: Record<string, unknown>;
  description?: string;
  mapLat?: number; mapLng?: number; zoneId?: number;
  availableFrom?: string;
};

// Owner-only edit. Re-submits the listing for review (verified=false, moderation reset).
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const { id } = await params;
  const listingId = parseInt(id, 10);

  const [owner] = await db.select().from(owners).where(eq(owners.userId, userId)).limit(1);
  if (!owner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [existing] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.ownerId !== owner.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json() as ListingBody;
  const shots = body.shots ?? existing.shots ?? [];
  const FALLBACK = 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1100&q=70';

  const [updated] = await db.update(listings).set({
    cat:          body.cat as typeof listings.$inferInsert['cat'],
    title:        body.title,
    area:         body.area ?? existing.area,
    price:        body.price,
    beds:         body.beds,
    baths:        body.baths ?? (body.beds >= 3 ? 2 : 1),
    size:         body.size ?? body.beds * 400,
    floor:        body.floor ?? existing.floor,
    facing:       body.facing ?? null,
    furnishing:   body.furnishing,
    pref:         body.pref ?? 'Any',
    advance:      body.advance ?? 2,
    service:      body.service ?? Math.round(body.price * 0.06),
    availableFrom: body.availableFrom ?? existing.availableFrom ?? 'immediate',
    sale:         body.cat === 'buy',
    cover:        shots[0] ?? FALLBACK,
    shots,
    shotCats:     body.shotCats ?? null,
    amenities:    body.amenities ?? [],
    landmark:     body.landmark ?? null,
    totalFloors:  body.totalFloors ?? null,
    videos:       body.videos ?? existing.videos ?? null,
    meta:         body.meta ?? null,
    description:  body.description ?? existing.description ?? '',
    mapLat:       body.mapLat ?? existing.mapLat,
    mapLng:       body.mapLng ?? existing.mapLng,
    zoneId:       body.zoneId ?? existing.zoneId,
    // edits go back to the review queue
    verified:         false,
    moderationStatus: 'pending',
    rejectionReason:  null,
  }).where(eq(listings.id, listingId)).returning();

  return NextResponse.json({ listing: updated });
}
