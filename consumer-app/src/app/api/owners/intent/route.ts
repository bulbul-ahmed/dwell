import { NextResponse } from 'next/server';
import { db, users, owners } from '@/db';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/session';
import { signToken, COOKIE_NAME } from '@/lib/jwt';

// POST /api/owners/intent
// Enter "owner mode": flip role → owner, ensure an owners row (status unverified).
// No verification performed here — that gates publishing, not intent.
export async function POST() {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Upsert owner row (reuse if already linked — no duplicates).
  let [owner] = await db.select().from(owners).where(eq(owners.userId, userId)).limit(1);
  if (!owner) {
    [owner] = await db.insert(owners).values({
      name:         user.name,
      type:         'Owner',
      responseTime: 'New',
      status:       'unverified',
      userId,
    }).returning();
  }

  const res = NextResponse.json({
    ownerId: owner.id,
    type:    owner.type,
    status:  owner.status,
  }, { status: 201 });

  // Promote renter → owner mode + reissue JWT. Never touch admin accounts.
  if (user.role === 'renter') {
    await db.update(users).set({ role: 'owner' }).where(eq(users.id, userId));
    const token = await signToken({ sub: String(user.id), name: user.name, email: user.email, role: 'owner' });
    res.cookies.set(COOKIE_NAME, token, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' });
  }

  return res;
}
