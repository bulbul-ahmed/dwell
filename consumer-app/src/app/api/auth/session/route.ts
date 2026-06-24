import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/jwt';
import { db, users } from '@/db';
import { eq } from 'drizzle-orm';

export async function GET() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ user: null });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ user: null });

  const [row] = await db
    .select({ avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, Number(payload.sub)))
    .limit(1);

  return NextResponse.json({ user: { name: payload.name, email: payload.email, role: payload.role, avatarUrl: row?.avatarUrl ?? null } });
}
