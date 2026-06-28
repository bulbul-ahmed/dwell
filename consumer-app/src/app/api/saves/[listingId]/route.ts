import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db, saves } from '@/db';
import { and, eq } from 'drizzle-orm';
import { getSession } from '@/lib/session';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> },
) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { listingId } = await params;
  const lid = parseInt(listingId, 10);
  if (isNaN(lid)) return NextResponse.json({ error: 'Invalid listingId' }, { status: 400 });
  await db.delete(saves).where(and(eq(saves.userId, userId), eq(saves.listingId, lid)));
  return NextResponse.json({ ok: true });
}
