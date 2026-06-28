import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db, listings, owners, users } from '@/db';
import { eq, and, ilike, lte, desc, asc, or, isNull } from 'drizzle-orm';
import type { Listing } from '@/types';
import { getSession } from '@/lib/session';
import { signToken, COOKIE_NAME } from '@/lib/jwt';

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
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const cat       = searchParams.get('cat');
  const beds      = searchParams.get('beds');
  const maxPrice  = searchParams.get('maxPrice');
  const verified  = searchParams.get('verified');
  const q         = searchParams.get('q');
  const sort      = searchParams.get('sort') ?? 'relevance';
  const ownerId   = searchParams.get('ownerId');
  const limit     = searchParams.get('limit');
  const propType  = searchParams.get('propType');
  const moveIn    = searchParams.get('moveIn');

  const conditions = [];

  if (cat)                 conditions.push(eq(listings.cat, cat as typeof listings.$inferSelect['cat']));
  if (beds)                conditions.push(eq(listings.beds, parseInt(beds, 10)));
  if (maxPrice)            conditions.push(lte(listings.price, parseInt(maxPrice, 10)));
  if (verified === 'true') conditions.push(eq(listings.verified, true));
  if (q)                   conditions.push(or(ilike(listings.title, `%${q}%`), ilike(listings.area, `%${q}%`))!);
  if (ownerId)             conditions.push(eq(listings.ownerId, parseInt(ownerId, 10)));
  if (propType && propType !== 'any') conditions.push(eq(listings.propertyType, propType));
  if (moveIn && moveIn !== 'any') {
    if (moveIn === 'immediate') {
      conditions.push(or(eq(listings.availableFrom, 'immediate'), isNull(listings.availableFrom))!);
    } else {
      // YYYY-MM: listings available on/before that month, or already immediate
      conditions.push(or(lte(listings.availableFrom, moveIn), eq(listings.availableFrom, 'immediate'), isNull(listings.availableFrom))!);
    }
  }

  // Public endpoint — never expose unverified listings
  conditions.push(eq(listings.verified, true));

  const base = db
    .select({ listing: listings, owner: owners })
    .from(listings)
    .innerJoin(owners, eq(listings.ownerId, owners.id))
    .$dynamic();

  const filtered = base.where(and(...conditions));

  const sorted = sort === 'low'  ? filtered.orderBy(asc(listings.price))
               : sort === 'high' ? filtered.orderBy(desc(listings.price))
               : sort === 'new'  ? filtered.orderBy(desc(listings.createdAt))
               :                   filtered;

  // Always bound the result set — default 60, hard cap 100 (prevents unbounded scans).
  const reqLimit = limit ? parseInt(limit, 10) : NaN;
  const lim = Math.min(Number.isFinite(reqLimit) && reqLimit > 0 ? reqLimit : 60, 100);
  const rows = await sorted.limit(lim);

  return NextResponse.json({ listings: rows.map(mapListing) });
}

export async function POST(request: NextRequest) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const body = await request.json() as {
    cat: string; title: string; area?: string; landmark?: string;
    beds: number; baths?: number; size?: number; floor?: string;
    facing?: string; furnishing: string; totalFloors?: string; pref?: string;
    price: number; advance?: number; service?: number; negotiable?: boolean;
    amenities?: string[]; shots?: string[]; shotCats?: string[];
    videos?: string[]; meta?: Record<string, unknown>;
    description?: string;
    mapLat?: number; mapLng?: number; zoneId?: number;
    availableFrom?: string;
    action?: 'draft' | 'submit';
  };

  // Fetch user record
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Find or create owner record linked to this user
  let [owner] = await db.select().from(owners).where(eq(owners.userId, userId)).limit(1);
  if (!owner) {
    [owner] = await db.insert(owners).values({
      name:         user.name,
      type:         'Owner',
      rating:       5.0,
      responseTime: 'New',
      userId,
    }).returning();
  }

  // Gate publishing behind verification — drafts always allowed.
  const action = body.action ?? 'submit';
  if (action === 'submit' && owner.status === 'unverified') {
    return NextResponse.json(
      { error: 'Verify your phone before publishing', needs: 'phone_verification' },
      { status: 403 },
    );
  }

  // Promote renter → owner in users table and reissue JWT
  const res = NextResponse.json({}, { status: 201 });
  if (user.role === 'renter') {
    await db.update(users).set({ role: 'owner' }).where(eq(users.id, userId));
    const token = await signToken({ sub: String(user.id), name: user.name, email: user.email, role: 'owner' });
    res.cookies.set(COOKIE_NAME, token, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' });
  }

  const shots = body.shots ?? [];
  const FALLBACK = 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1100&q=70';

  const [inserted] = await db.insert(listings).values({
    cat:          body.cat as typeof listings.$inferInsert['cat'],
    title:        body.title,
    area:         body.area ?? 'Aftab Nagar, Dhaka',
    price:        body.price,
    beds:         body.beds,
    baths:        body.baths ?? (body.beds >= 3 ? 2 : 1),
    size:         body.size ?? body.beds * 400,
    floor:        body.floor ?? '1st',
    facing:       body.facing ?? null,
    furnishing:   body.furnishing,
    pref:         body.pref ?? 'Any',
    advance:      body.advance ?? 2,
    service:      body.service ?? Math.round(body.price * 0.06),
    availableFrom: body.availableFrom ?? 'immediate',
    verified:     false,
    moderationStatus: action === 'draft' ? 'draft' : 'pending',
    sale:         body.cat === 'buy',
    ownerId:      owner.id,
    cover:        shots[0] ?? FALLBACK,
    shots,
    shotCats:     body.shotCats ?? null,
    amenities:    body.amenities ?? [],
    landmark:     body.landmark ?? null,
    totalFloors:  body.totalFloors ?? null,
    videos:       body.videos ?? null,
    meta:         body.meta ?? null,
    description:  body.description ?? '',
    mapLat:       body.mapLat ?? null,
    mapLng:       body.mapLng ?? null,
    zoneId:       body.zoneId ?? null,
  }).returning();

  return NextResponse.json({ listing: inserted }, { status: 201, headers: res.headers });
}
