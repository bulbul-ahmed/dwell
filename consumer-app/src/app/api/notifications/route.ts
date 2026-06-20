import { NextResponse } from 'next/server';
import { db, notifications } from '@/db';
import { and, eq, ne, desc } from 'drizzle-orm';
import { getSession } from '@/lib/session';
import { pruneOldRead } from '@/lib/notifications';

export async function GET() {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  pruneOldRead(userId, 30).catch(() => {});

  const rows = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, userId), ne(notifications.type, 'message')))
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  return NextResponse.json({ notifications: rows });
}
