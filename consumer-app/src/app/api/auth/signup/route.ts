import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db, users, owners } from '@/db';
import { eq } from 'drizzle-orm';
import { hash } from 'bcryptjs';
import { signToken, COOKIE_NAME } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  const { name, email, phone, password, role, ownerType, marketingConsent, acceptTos } = await request.json() as {
    name: string;
    email: string;
    phone?: string;
    password?: string;
    role?: string;
    ownerType?: 'Owner' | 'Agency';
    marketingConsent?: boolean;
    acceptTos?: boolean;
  };

  if (!name || !email) return NextResponse.json({ error: 'Name and email required' }, { status: 400 });
  if (!acceptTos) return NextResponse.json({ error: 'You must accept the Terms & Privacy Policy' }, { status: 400 });
  if (password && password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });

  const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
  if (existing.length > 0) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

  const passwordHash = password ? await hash(password, 10) : undefined;
  const dbRole = role === 'owner' ? 'owner' : 'renter';
  const normalPhone = phone ? phone.replace(/\s+/g, '') : undefined;

  const [user] = await db.insert(users).values({
    name,
    email: email.toLowerCase().trim(),
    phone: normalPhone,
    role: dbRole,
    passwordHash,
    marketingConsent: !!marketingConsent,
    tosAcceptedAt: new Date(),
  }).returning();

  // Owner intent → create the owner profile up front (type from signup, unverified).
  if (dbRole === 'owner') {
    await db.insert(owners).values({
      name,
      type: ownerType === 'Agency' ? 'Agency' : 'Owner',
      responseTime: 'New',
      status: 'unverified',
      phone: normalPhone ?? null,
      userId: user.id,
    });
  }

  const token = await signToken({ sub: String(user.id), name: user.name, email: user.email, role: user.role });
  const res = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } }, { status: 201 });
  res.cookies.set(COOKIE_NAME, token, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' });
  return res;
}
