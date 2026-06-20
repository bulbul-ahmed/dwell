import { NextRequest, NextResponse } from 'next/server';
import { db, zones } from '@/db';
import { eq } from 'drizzle-orm';
import { getAdminSession } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, areaName, polygon, color } = body;

  if (!name || !areaName || !polygon) {
    return NextResponse.json({ error: 'name, areaName, polygon required' }, { status: 400 });
  }

  const [zone] = await db.update(zones)
    .set({ name, areaName, polygon, color: color || '#1E3A5C' })
    .where(eq(zones.id, parseInt(id)))
    .returning();

  return NextResponse.json(zone);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await db.delete(zones).where(eq(zones.id, parseInt(id)));
  return NextResponse.json({ ok: true });
}
