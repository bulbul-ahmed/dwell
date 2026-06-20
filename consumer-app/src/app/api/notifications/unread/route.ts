import { NextResponse } from 'next/server';
import { db, notifications } from '@/db';
import { and, eq, ne, count } from 'drizzle-orm';
import { getSession } from '@/lib/session';

export async function GET() {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ total: 0, messages: 0, bell: 0 });

  const [allRow] = await db
    .select({ c: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));

  const [msgRow] = await db
    .select({ c: count() })
    .from(notifications)
    .where(and(
      eq(notifications.userId, userId),
      eq(notifications.read, false),
      eq(notifications.type, 'message'),
    ));

  const [bellRow] = await db
    .select({ c: count() })
    .from(notifications)
    .where(and(
      eq(notifications.userId, userId),
      eq(notifications.read, false),
      ne(notifications.type, 'message'),
    ));

  return NextResponse.json({
    total: Number(allRow?.c ?? 0),
    messages: Number(msgRow?.c ?? 0),
    bell: Number(bellRow?.c ?? 0),
  });
}
