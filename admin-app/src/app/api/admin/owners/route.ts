import { NextRequest, NextResponse } from 'next/server';
import { db, owners } from '@/db';
import { eq } from 'drizzle-orm';
import { getAdminSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, action } = await req.json();
  if (!id || !['verify', 'unverify'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  await db
    .update(owners)
    .set({ verified: action === 'verify' })
    .where(eq(owners.id, id));

  return NextResponse.json({ ok: true });
}
