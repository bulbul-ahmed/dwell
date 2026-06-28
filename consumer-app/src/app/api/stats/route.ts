import { NextResponse } from 'next/server';
import { db, listings, owners } from '@/db';
import { eq, avg } from 'drizzle-orm';

// Home hero stats — derived live from verified listings + owners.
export async function GET() {
  // Avg rating in SQL (was: load every owner row into JS).
  // Block letters still need the area regex, so fetch only the area column of
  // verified listings (small, index-backed) and derive count + blocks from it.
  const [areaRows, [ratingRow]] = await Promise.all([
    db.select({ area: listings.area }).from(listings).where(eq(listings.verified, true)),
    db.select({ avg: avg(owners.rating) }).from(owners),
  ]);

  const blocks = new Set<string>();
  for (const r of areaRows) {
    const m = r.area.match(/Block\s+([A-Z])\b/i);
    if (m) blocks.add(m[1].toUpperCase());
  }

  const avgRating = ratingRow?.avg ? parseFloat(ratingRow.avg) : 0;

  return NextResponse.json({
    verifiedListings: areaRows.length,
    blocks: blocks.size,
    avgRating: Math.round(avgRating * 10) / 10,
  });
}
