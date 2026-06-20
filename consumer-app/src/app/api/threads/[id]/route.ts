import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db, threads, messages, listings, owners } from '@/db';
import { eq, asc } from 'drizzle-orm';
import { getSession } from '@/lib/session';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const threadId = parseInt(id, 10);
  if (isNaN(threadId)) return NextResponse.json({ error: 'Bad thread id' }, { status: 400 });

  const [thread] = await db
    .select({
      id:           threads.id,
      listingId:    threads.listingId,
      renterUserId: threads.userId,
      ownerUserId:  owners.userId,
      lastMessage:  threads.lastMessage,
      lastAt:       threads.lastAt,
      createdAt:    threads.createdAt,
    })
    .from(threads)
    .innerJoin(listings, eq(threads.listingId, listings.id))
    .innerJoin(owners,   eq(listings.ownerId,  owners.id))
    .where(eq(threads.id, threadId))
    .limit(1);

  if (!thread) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (thread.renterUserId !== userId && thread.ownerUserId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const isOwnerViewer = thread.ownerUserId === userId;

  const rawMsgs = await db
    .select()
    .from(messages)
    .where(eq(messages.threadId, threadId))
    .orderBy(asc(messages.createdAt));

  const msgRows = isOwnerViewer
    ? rawMsgs.map(m => ({ ...m, senderRole: m.senderRole === 'me' ? 'other' : 'me' }))
    : rawMsgs;

  return NextResponse.json({ thread, messages: msgRows });
}
