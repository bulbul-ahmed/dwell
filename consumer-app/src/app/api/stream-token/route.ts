import { NextResponse } from 'next/server';
import { StreamChat } from 'stream-chat';
import { getSession } from '@/lib/session';

export async function GET() {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.STREAM_API_KEY;
  const secret = process.env.STREAM_API_SECRET;

  if (!apiKey || !secret) {
    return NextResponse.json({ error: 'Stream not configured' }, { status: 503 });
  }

  const serverClient = StreamChat.getInstance(apiKey, secret);
  // Scope the token to the authenticated caller, not a hardcoded demo user.
  const token = serverClient.createToken(`user_${userId}`);
  return NextResponse.json({ token, userId: `user_${userId}` });
}
