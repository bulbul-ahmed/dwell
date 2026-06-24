import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db, users, saves, bookings, reviews, owners } from '@/db';
import { eq, count } from 'drizzle-orm';
import { getSession } from '@/lib/session';
import { signToken, COOKIE_NAME } from '@/lib/jwt';

export async function GET() {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const [[{ savedCount }], [{ visitsCount }], [{ reviewsCount }]] = await Promise.all([
    db.select({ savedCount: count() }).from(saves).where(eq(saves.userId, userId)),
    db.select({ visitsCount: count() }).from(bookings).where(eq(bookings.userId, userId)),
    db.select({ reviewsCount: count() }).from(reviews).where(eq(reviews.userId, userId)),
  ]);

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role,
      createdAt: user.createdAt,
      hasPassword: !!user.passwordHash,
    },
    stats: { savedCount, visitsCount, reviewsCount },
  });
}

export async function PATCH(request: NextRequest) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const body = await request.json() as { name?: string; phone?: string; avatarUrl?: string; role?: string };

  const updates: Partial<typeof users.$inferInsert> = {};
  if (body.name)      updates.name      = body.name;
  if (body.phone)     updates.phone     = body.phone;
  if (body.avatarUrl) updates.avatarUrl = body.avatarUrl;

  // Role switch is renter↔owner only. Never demote an admin — the consumer
  // "switch mode" toggle must not clobber an admin account's role.
  if (body.role === 'renter' || body.role === 'owner') {
    const [current] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
    if (current && current.role !== 'admin') updates.role = body.role;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'nothing to update' }, { status: 400 });
  }

  const [updated] = await db.update(users).set(updates).where(eq(users.id, userId)).returning();

  // Promoting to owner must never leave the account without an owners profile —
  // getProviderSession requires that row, so a role flip alone would lock the
  // user out of Provider Studio (redirect to login). Ensure it exists.
  if (updates.role === 'owner') {
    const [owner] = await db.select({ id: owners.id }).from(owners).where(eq(owners.userId, userId)).limit(1);
    if (!owner) {
      await db.insert(owners).values({
        name:         updated.name,
        type:         'Owner',
        responseTime: 'New',
        status:       'unverified',
        userId,
      });
    }
  }

  if (updates.role) {
    const token = await signToken({ sub: String(updated.id), name: updated.name, email: updated.email, role: updated.role });
    const res = NextResponse.json({ user: updated });
    res.cookies.set(COOKIE_NAME, token, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' });
    return res;
  }

  return NextResponse.json({ user: updated });
}
