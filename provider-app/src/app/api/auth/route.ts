import { NextRequest, NextResponse } from 'next/server';
import { db, users, owners } from '@/db';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { signToken, COOKIE_NAME } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  const { email, password, remember } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user || user.role !== 'owner') {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  if (!user.passwordHash) {
    return NextResponse.json({ error: 'Password not set for this account' }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const [owner] = await db.select({ id: owners.id }).from(owners).where(eq(owners.userId, user.id)).limit(1);
  if (!owner) {
    return NextResponse.json({ error: 'No owner profile linked to this account' }, { status: 401 });
  }

  const token = await signToken({
    sub: String(user.id),
    name: user.name,
    email: user.email,
    role: user.role,
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: remember === false ? undefined : 60 * 60 * 24 * 30,
    path: '/',
  });
  return res;
}
