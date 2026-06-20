import type { NextRequest } from 'next/server';
import { db, threads, listings, owners } from '@/db';
import { eq } from 'drizzle-orm';
import { subscribe } from '@/lib/sse';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getSession();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const { id } = await params;
  const threadId = parseInt(id, 10);
  if (isNaN(threadId)) return new Response('Bad thread id', { status: 400 });

  const [thread] = await db
    .select({
      renterUserId: threads.userId,
      ownerUserId:  owners.userId,
    })
    .from(threads)
    .innerJoin(listings, eq(threads.listingId, listings.id))
    .innerJoin(owners,   eq(listings.ownerId,  owners.id))
    .where(eq(threads.id, threadId))
    .limit(1);

  if (!thread) return new Response('Not found', { status: 404 });
  if (thread.renterUserId !== userId && thread.ownerUserId !== userId) {
    return new Response('Forbidden', { status: 403 });
  }

  const isOwnerViewer = thread.ownerUserId === userId;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (data: string) => {
        try {
          if (isOwnerViewer) {
            const parsed = JSON.parse(data) as { senderRole?: 'me' | 'other' };
            if (parsed.senderRole === 'me') parsed.senderRole = 'other';
            else if (parsed.senderRole === 'other') parsed.senderRole = 'me';
            data = JSON.stringify(parsed);
          }
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch { /* closed */ }
      };

      const unsub = subscribe(threadId, send);

      const ping = setInterval(() => {
        try { controller.enqueue(encoder.encode(': keepalive\n\n')); }
        catch { clearInterval(ping); }
      }, 25000);

      request.signal.addEventListener('abort', () => {
        clearInterval(ping);
        unsub();
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection':    'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
