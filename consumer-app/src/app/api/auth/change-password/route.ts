import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db, users } from '@/db';
import { eq } from 'drizzle-orm';
import { compare, hash } from 'bcryptjs';
import { getSession } from '@/lib/session';
import { signToken, COOKIE_NAME } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { currentPassword, newPassword } = await request.json() as {
    currentPassword?: string;
    newPassword: string;
  };

  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  if (user.passwordHash) {
    if (!currentPassword) {
      return NextResponse.json({ error: 'Current password required' }, { status: 400 });
    }
    const valid = await compare(currentPassword, user.passwordHash);
    if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
  }

  const passwordHash = await hash(newPassword, 10);
  const [updated] = await db.update(users).set({ passwordHash }).where(eq(users.id, userId)).returning();

  const token = await signToken({ sub: String(updated.id), name: updated.name, email: updated.email, role: updated.role });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' });
  return res;
}
