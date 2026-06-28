import { NextResponse } from 'next/server';
import { db, notifications } from '@/db';
import { and, eq, sql } from 'drizzle-orm';
import { getSession } from '@/lib/session';

export async function GET() {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ total: 0, messages: 0, bell: 0 });

  // One round-trip via conditional aggregation (was 3 separate COUNT queries).
  const [row] = await db
    .select({
      total:    sql<number>`count(*)`,
      messages: sql<number>`count(*) filter (where ${notifications.type} = 'message')`,
      bell:     sql<number>`count(*) filter (where ${notifications.type} <> 'message')`,
    })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));

  return NextResponse.json({
    total: Number(row?.total ?? 0),
    messages: Number(row?.messages ?? 0),
    bell: Number(row?.bell ?? 0),
  });
}
