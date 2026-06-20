import { NextResponse } from 'next/server';
import { StreamChat } from 'stream-chat';

const DEMO_USER_ID = 'user_1';

export async function GET() {
  const apiKey = process.env.STREAM_API_KEY;
  const secret = process.env.STREAM_API_SECRET;

  if (!apiKey || !secret) {
    return NextResponse.json({ error: 'Stream not configured' }, { status: 503 });
  }

  const serverClient = StreamChat.getInstance(apiKey, secret);
  const token = serverClient.createToken(DEMO_USER_ID);
  return NextResponse.json({ token });
}
