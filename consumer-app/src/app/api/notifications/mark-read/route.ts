import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db, notifications } from '@/db';
import { and, eq } from 'drizzle-orm';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await request.json().catch(() => ({})) as {
    type?: 'message' | 'visit' | 'listing' | 'review' | 'system';
    threadId?: number;
  };

  const conds = [eq(notifications.userId, userId), eq(notifications.read, false)];
  if (body.type)     conds.push(eq(notifications.type, body.type));
  if (body.threadId) conds.push(eq(notifications.threadId, body.threadId));

  await db.update(notifications).set({ read: true }).where(and(...conds));
  return NextResponse.json({ ok: true });
}
