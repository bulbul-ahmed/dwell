import { NextResponse } from 'next/server';
import { db, notifications, owners } from '@/db';
import { and, eq, count } from 'drizzle-orm';
import { getProviderSession } from '@/lib/auth';

export async function GET() {
  const session = await getProviderSession();
  if (!session) return NextResponse.json({ count: 0 });

  const [owner] = await db
    .select({ userId: owners.userId })
    .from(owners)
    .where(eq(owners.id, session.ownerId))
    .limit(1);

  if (!owner?.userId) return NextResponse.json({ count: 0 });

  const [row] = await db
    .select({ c: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, owner.userId), eq(notifications.read, false)));

  return NextResponse.json({ count: Number(row?.c ?? 0) });
}
