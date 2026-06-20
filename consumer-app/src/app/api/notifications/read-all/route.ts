import { NextResponse } from 'next/server';
import { db, notifications } from '@/db';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/session';

export async function POST() {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  await db.update(notifications).set({ read: true }).where(eq(notifications.userId, userId));
  return NextResponse.json({ ok: true });
}
