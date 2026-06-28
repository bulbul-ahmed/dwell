import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken  = process.env.CLOUDFLARE_STREAM_API_TOKEN;

  if (!accountId || !apiToken) {
    return NextResponse.json({ error: 'Cloudflare Stream not configured' }, { status: 503 });
  }

  const body = await request.json().catch(() => ({})) as { maxDurationSeconds?: number };
  // Clamp caller-supplied duration to a sane range (avoid quota/cost abuse).
  const maxDurationSeconds = Math.min(Math.max(Number(body.maxDurationSeconds) || 60, 1), 120);

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ maxDurationSeconds }),
    },
  );

  if (!res.ok) {
    return NextResponse.json({ error: 'Cloudflare request failed' }, { status: 502 });
  }

  const data = await res.json() as { result: { uid: string; uploadURL: string } };

  return NextResponse.json({ uid: data.result.uid, uploadURL: data.result.uploadURL });
}
