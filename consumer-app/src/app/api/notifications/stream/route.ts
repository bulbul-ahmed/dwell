import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/session';
import { subscribeUser } from '@/lib/sse-user';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const userId = await getSession();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (data: string) => {
        try { controller.enqueue(encoder.encode(`data: ${data}\n\n`)); } catch {}
      };
      send(JSON.stringify({ kind: 'hello' }));
      const unsub = subscribeUser(userId, send);
      const ping = setInterval(() => send(JSON.stringify({ kind: 'ping' })), 25000);
      const close = () => { clearInterval(ping); unsub(); try { controller.close(); } catch {} };
      // @ts-expect-error - signal exists on request
      _req.signal?.addEventListener?.('abort', close);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
