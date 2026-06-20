import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db, listings, owners } from '@/db';
import { and, eq } from 'drizzle-orm';
import { getSession } from '@/lib/session';

// Resolve the listing the current user owns, or null.
async function ownedListing(id: number, userId: number) {
  const [owner] = await db.select().from(owners).where(eq(owners.userId, userId)).limit(1);
  if (!owner) return null;
  const [row] = await db
    .select()
    .from(listings)
    .where(and(eq(listings.id, id), eq(listings.ownerId, owner.id)))
    .limit(1);
  return row ?? null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const { id } = await params;
  const row = await ownedListing(parseInt(id, 10), userId);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    listing: {
      id:               row.id,
      title:            row.title,
      area:             row.area,
      price:            row.price,
      cover:            row.cover,
      beds:             row.beds,
      floor:            row.floor,
      verified:         row.verified,
      moderationStatus: row.moderationStatus,
      rejectionReason:  row.rejectionReason,
      createdAt:        row.createdAt,
    },
  });
}

// Withdraw a listing — owner only.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const { id } = await params;
  const row = await ownedListing(parseInt(id, 10), userId);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.delete(listings).where(eq(listings.id, row.id));
  return NextResponse.json({ ok: true });
}
