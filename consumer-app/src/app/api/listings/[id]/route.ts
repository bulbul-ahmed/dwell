import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db, listings, owners } from '@/db';
import { eq } from 'drizzle-orm';
import type { Listing } from '@/types';
import { getSession } from '@/lib/session';

function mapListing(row: { listing: typeof listings.$inferSelect; owner: typeof owners.$inferSelect }): Listing {
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
    landmark: row.listing.landmark ?? null,
    facing: row.listing.facing ?? null,
    balconies: row.listing.balconies ?? null,
    totalFloors: row.listing.totalFloors ?? null,
    videos: row.listing.videos ?? null,
    meta: (row.listing.meta as Record<string, unknown>) ?? null,
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const rows = await db
    .select({ listing: listings, owner: owners })
    .from(listings)
    .innerJoin(owners, eq(listings.ownerId, owners.id))
    .where(eq(listings.id, parseInt(id, 10)));

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // `edit` carries raw fields the public Listing shape omits (pin, zone) for the wizard's edit mode.
  const l = rows[0].listing;
  return NextResponse.json({
    listing: mapListing(rows[0]),
    edit: { mapLat: l.mapLat, mapLng: l.mapLng, zoneId: l.zoneId, area: l.area, videos: l.videos ?? [] },
  });
}

type ListingBody = {
  cat: string; title: string; area?: string; landmark?: string;
  beds: number; baths?: number; size?: number; floor?: string;
  facing?: string; furnishing: string; totalFloors?: string; pref?: string;
  price: number; advance?: number; service?: number; negotiable?: boolean;
  amenities?: string[]; shots?: string[]; shotCats?: string[];
  videos?: string[]; meta?: Record<string, unknown>;
  mapLat?: number; mapLng?: number; zoneId?: number;
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
    sale:         body.cat === 'buy',
    cover:        shots[0] ?? FALLBACK,
    shots,
    shotCats:     body.shotCats ?? null,
    amenities:    body.amenities ?? [],
    landmark:     body.landmark ?? null,
    totalFloors:  body.totalFloors ?? null,
    videos:       body.videos ?? existing.videos ?? null,
    meta:         body.meta ?? null,
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
