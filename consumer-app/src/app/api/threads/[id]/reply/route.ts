import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db, messages, threads, listings, owners, users } from '@/db';
import { eq } from 'drizzle-orm';
import { getProviderSession } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getProviderSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const threadId = parseInt(id, 10);
  if (isNaN(threadId)) return NextResponse.json({ error: 'Bad thread id' }, { status: 400 });

  const { content } = await request.json() as { content: string };
  if (typeof content !== 'string' || !content.trim()) {
    return NextResponse.json({ error: 'Empty content' }, { status: 400 });
  }

  const [thread] = await db
    .select({
      listingOwnerId: listings.ownerId,
      renterUserId:   threads.userId,
      renterName:     users.name,
      ownerName:      owners.name,
    })
    .from(threads)
    .innerJoin(listings, eq(threads.listingId, listings.id))
    .innerJoin(owners,   eq(listings.ownerId,  owners.id))
    .innerJoin(users,    eq(threads.userId,    users.id))
    .where(eq(threads.id, threadId))
    .limit(1);

  if (!thread) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (thread.listingOwnerId !== session.ownerId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const insertedRows = await db
    .insert(messages)
    .values({ threadId, senderRole: 'other', content })
    .returning();
  const inserted = insertedRows[0];

  await db
    .update(threads)
    .set({ lastMessage: content, lastAt: new Date() })
    .where(eq(threads.id, threadId));

  const preview = content.length > 80 ? content.slice(0, 80) + '…' : content;
  createNotification({
    userId:     thread.renterUserId,
    type:       'message',
    title:      `${thread.ownerName} replied to your message`,
    body:       preview,
    href:       `/messages?thread=${threadId}`,
    threadId,
    senderName: thread.ownerName,
  }).catch(() => {});

  return NextResponse.json({ message: inserted }, { status: 201 });
}
