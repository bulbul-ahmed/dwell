import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'Google OAuth not configured' }, { status: 503 });
  }

  // Carry the post-login destination through OAuth via `state`.
  const next = request.nextUrl.searchParams.get('next') || '/';

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001';
  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  `${appUrl}/api/auth/google/callback`,
    response_type: 'code',
    scope:         'openid email profile',
    access_type:   'offline',
    prompt:        'select_account',
    state:         next,
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
