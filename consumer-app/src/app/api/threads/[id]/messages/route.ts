import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db, messages, threads, listings, owners, users } from '@/db';
import { eq } from 'drizzle-orm';
import { publish } from '@/lib/sse';
import { publishUser } from '@/lib/sse-user';
import { createNotification } from '@/lib/notifications';
import { getSession } from '@/lib/session';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const threadId = parseInt(id, 10);
  if (isNaN(threadId)) return NextResponse.json({ error: 'Bad thread id' }, { status: 400 });

  const { content } = await request.json() as { content: string };
  if (typeof content !== 'string' || !content.trim()) {
    return NextResponse.json({ error: 'Empty content' }, { status: 400 });
  }

  const [thread] = await db
    .select({
      renterUserId: threads.userId,
      ownerUserId:  owners.userId,
      listingTitle: listings.title,
      ownerName:    owners.name,
      renterName:   users.name,
    })
    .from(threads)
    .innerJoin(listings, eq(threads.listingId, listings.id))
    .innerJoin(owners,   eq(listings.ownerId,  owners.id))
    .innerJoin(users,    eq(threads.userId,    users.id))
    .where(eq(threads.id, threadId))
    .limit(1);

  if (!thread) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const isRenter = thread.renterUserId === userId;
  const isOwner  = thread.ownerUserId === userId;
  if (!isRenter && !isOwner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const senderRole: 'me' | 'other' = isRenter ? 'me' : 'other';

  const insertedRows = await db
    .insert(messages)
    .values({ threadId, senderRole, content })
    .returning();
  const inserted = insertedRows[0];

  await db
    .update(threads)
    .set({ lastMessage: content, lastAt: new Date() })
    .where(eq(threads.id, threadId));

  publish(threadId, inserted);

  const recipientUserId = isRenter ? thread.ownerUserId : thread.renterUserId;
  if (recipientUserId) {
    publishUser(recipientUserId, { kind: 'message', threadId, message: inserted });
  }

  const preview = content.length > 80 ? content.slice(0, 80) + '…' : content;
  if (isRenter && thread.ownerUserId) {
    createNotification({
      userId:     thread.ownerUserId,
      type:       'message',
      title:      `${thread.renterName} sent you a message`,
      body:       preview,
      href:       `/messages?thread=${threadId}`,
      threadId,
      senderName: thread.renterName,
    }).catch(() => {});
  } else if (isOwner) {
    createNotification({
      userId:     thread.renterUserId,
      type:       'message',
      title:      `${thread.ownerName} replied to your message`,
      body:       preview,
      href:       `/messages?thread=${threadId}`,
      threadId,
      senderName: thread.ownerName,
    }).catch(() => {});
  }

  return NextResponse.json({ message: { ...inserted, senderRole: 'me' } }, { status: 201 });
}
