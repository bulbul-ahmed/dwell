import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken  = process.env.CLOUDFLARE_STREAM_API_TOKEN;

  if (!accountId || !apiToken) {
    return NextResponse.json({ error: 'Cloudflare Stream not configured' }, { status: 503 });
  }

  const { maxDurationSeconds = 60 } = await request.json() as { maxDurationSeconds?: number };

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
