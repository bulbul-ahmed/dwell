import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db, notifications } from '@/db';
import { and, eq } from 'drizzle-orm';
import { getSession } from '@/lib/session';

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { id } = await params;
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.id, parseInt(id, 10)), eq(notifications.userId, userId)));

  return NextResponse.json({ ok: true });
}
