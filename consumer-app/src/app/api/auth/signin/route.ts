import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db, users } from '@/db';
import { eq } from 'drizzle-orm';
import { compare } from 'bcryptjs';
import { signToken, COOKIE_NAME } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json() as { email: string; password?: string };

  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });
  if (!password) return NextResponse.json({ error: 'Password required' }, { status: 400 });

  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
  // Generic message — avoid revealing whether an email exists or how it signs in.
  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }
  const valid = await compare(password, user.passwordHash);
  if (!valid) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

  const token = await signToken({ sub: String(user.id), name: user.name, email: user.email, role: user.role });
  const res = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  res.cookies.set(COOKIE_NAME, token, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' });
  return res;
}
