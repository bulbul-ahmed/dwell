import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db, otpCodes, users, owners } from '@/db';
import { eq, and, gt, desc } from 'drizzle-orm';
import { hashOTP } from '@/lib/otp';
import { signToken, COOKIE_NAME } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  const { email, code, name, role, phone, ownerType, marketingConsent, acceptTos } = await request.json() as {
    email: string; code: string; name?: string; role?: string;
    phone?: string; ownerType?: 'Owner' | 'Agency'; marketingConsent?: boolean; acceptTos?: boolean;
  };
  if (!email || !code) return NextResponse.json({ error: 'Email and code required' }, { status: 400 });

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

  let [user] = await db.select().from(users).where(eq(users.email, normalEmail)).limit(1);
  if (!user) {
    const dbRole = role === 'owner' ? 'owner' : 'renter';
    const normalPhone = phone ? phone.replace(/\s+/g, '') : undefined;
    [user] = await db.insert(users)
      .values({
        name: name ?? normalEmail.split('@')[0],
        email: normalEmail,
        role: dbRole,
        phone: normalPhone,
        marketingConsent: !!marketingConsent,
        tosAcceptedAt: acceptTos ? new Date() : null,
      })
      .returning();
    if (dbRole === 'owner') {
      await db.insert(owners).values({
        name: user.name,
        type: ownerType === 'Agency' ? 'Agency' : 'Owner',
        responseTime: 'New',
        status: 'unverified',
        phone: normalPhone ?? null,
        userId: user.id,
      });
    }
  }

  const token = await signToken({ sub: String(user.id), name: user.name, email: user.email, role: user.role });
  const res = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
  res.cookies.set(COOKIE_NAME, token, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' });
  return res;
}
