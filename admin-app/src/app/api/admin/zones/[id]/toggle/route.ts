import { NextRequest, NextResponse } from 'next/server';
import { db, zones } from '@/db';
import { eq } from 'drizzle-orm';
import { getAdminSession } from '@/lib/auth';

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const numId = parseInt(id);

  const [current] = await db.select({ active: zones.active }).from(zones).where(eq(zones.id, numId));
  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [zone] = await db.update(zones)
    .set({ active: !current.active })
    .where(eq(zones.id, numId))
    .returning();

  return NextResponse.json(zone);
}
