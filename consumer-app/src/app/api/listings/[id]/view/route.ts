import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db, listings } from '@/db';
import { eq, sql } from 'drizzle-orm';

// Increments the view counter for a listing. Fire-and-forget from the detail page.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const listingId = parseInt(id, 10);
  if (isNaN(listingId)) {
    return NextResponse.json({ error: 'Bad id' }, { status: 400 });
  }

  const [updated] = await db
    .update(listings)
    .set({ views: sql`${listings.views} + 1` })
    .where(eq(listings.id, listingId))
    .returning({ views: listings.views });

  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ views: updated.views });
}
