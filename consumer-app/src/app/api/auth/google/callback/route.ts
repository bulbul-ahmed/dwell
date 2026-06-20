import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db, users } from '@/db';
import { eq } from 'drizzle-orm';
import { signToken, COOKIE_NAME } from '@/lib/jwt';

interface GoogleTokens { access_token?: string; error?: string }
interface GoogleProfile { email?: string; name?: string; picture?: string }

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code  = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(new URL('/auth?error=google_denied', request.url));
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001';

  // Exchange code for access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri:  `${appUrl}/api/auth/google/callback`,
      grant_type:    'authorization_code',
    }),
  });

  const tokens = await tokenRes.json() as GoogleTokens;
  if (!tokens.access_token) {
    return NextResponse.redirect(new URL('/auth?error=google_token', request.url));
  }

  // Get user profile
  const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const profile = await profileRes.json() as GoogleProfile;

  if (!profile.email) {
    return NextResponse.redirect(new URL('/auth?error=google_profile', request.url));
  }

  // Upsert user
  let [user] = await db.select().from(users).where(eq(users.email, profile.email)).limit(1);
  if (!user) {
    [user] = await db.insert(users).values({
      name:      profile.name ?? profile.email.split('@')[0],
      email:     profile.email,
      avatarUrl: profile.picture,
      role:      'renter',
    }).returning();
  } else if (profile.picture && !user.avatarUrl) {
    [user] = await db.update(users)
      .set({ avatarUrl: profile.picture })
      .where(eq(users.id, user.id))
      .returning();
  }

  const token = await signToken({ sub: String(user.id), name: user.name, email: user.email, role: user.role });
  const next = searchParams.get('state') ?? '/';
  const res = NextResponse.redirect(new URL(next, request.url));
  res.cookies.set(COOKIE_NAME, token, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' });
  return res;
}
