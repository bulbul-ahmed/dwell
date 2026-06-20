import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db, saves } from '@/db';
import { and, eq } from 'drizzle-orm';
import { getSessionOrDemo } from '@/lib/session';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> },
) {
  const userId = await getSessionOrDemo();
  const { listingId } = await params;
  await db.delete(saves).where(and(eq(saves.userId, userId), eq(saves.listingId, parseInt(listingId, 10))));
  return NextResponse.json({ ok: true });
}
