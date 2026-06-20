import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db, users, otpCodes } from '@/db';
import { eq, and, gt, desc } from 'drizzle-orm';
import { hash } from 'bcryptjs';
import { hashOTP } from '@/lib/otp';
import { signToken, COOKIE_NAME } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  const { email, code, newPassword } = await request.json() as {
    email: string;
    code: string;
    newPassword: string;
  };

  if (!email || !code || !newPassword) {
    return NextResponse.json({ error: 'Email, code and new password required' }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const normalEmail = email.toLowerCase().trim();
  const codeHash = hashOTP(code.trim());
  const now = new Date();

  const [row] = await db
    .select()
    .from(otpCodes)
    .where(and(
      eq(otpCodes.email, normalEmail),
      eq(otpCodes.codeHash, codeHash),
      eq(otpCodes.used, false),
      gt(otpCodes.expiresAt, now),
    ))
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);

  if (!row) return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });

  await db.update(otpCodes).set({ used: true }).where(eq(otpCodes.id, row.id));

  const passwordHash = await hash(newPassword, 10);
  let [user] = await db.select().from(users).where(eq(users.email, normalEmail)).limit(1);
  if (!user) {
    return NextResponse.json({ error: 'No account with that email' }, { status: 404 });
  }
  [user] = await db.update(users).set({ passwordHash }).where(eq(users.id, user.id)).returning();

  const token = await signToken({ sub: String(user.id), name: user.name, email: user.email, role: user.role });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' });
  return res;
}
