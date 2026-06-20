import { NextResponse } from 'next/server';
import { db, listings, owners } from '@/db';
import { eq } from 'drizzle-orm';

// Home hero stats — derived live from verified listings + owners.
export async function GET() {
  const rows = await db
    .select({ area: listings.area })
    .from(listings)
    .where(eq(listings.verified, true));

  const verifiedCount = rows.length;

  // Distinct "Block X" letters present in verified listings.
  const blocks = new Set<string>();
  for (const r of rows) {
    const m = r.area.match(/Block\s+([A-Z])\b/i);
    if (m) blocks.add(m[1].toUpperCase());
  }

  const ownerRows = await db.select({ rating: owners.rating }).from(owners);
  const avgRating = ownerRows.length
    ? ownerRows.reduce((a, o) => a + o.rating, 0) / ownerRows.length
    : 0;

  return NextResponse.json({
    verifiedListings: verifiedCount,
    blocks: blocks.size,
    avgRating: Math.round(avgRating * 10) / 10,
  });
}
