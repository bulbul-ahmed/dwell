import { NextRequest, NextResponse } from 'next/server';
import { db, blocks } from '@/db';
import { eq } from 'drizzle-orm';
import { requireAdmin, logConfig, badRequest, notFound, parseId } from '@/lib/config-api';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ('res' in auth) return auth.res;

  const { id } = await params;
  const numId = parseId(id);
  if (!numId) return badRequest('invalid id');

  const [current] = await db.select().from(blocks).where(eq(blocks.id, numId));
  if (!current) return notFound();

  const body = await req.json().catch(() => null);
  const patch: Partial<typeof blocks.$inferInsert> = {};
  const changes: string[] = [];

  if (typeof body?.name === 'string') {
    const v = body.name.trim();
    if (!v) return badRequest('name cannot be empty');
    if (v !== current.name) { patch.name = v; changes.push(`name “${current.name}” → “${v}”`); }
  }
  if (typeof body?.areaName === 'string') {
    const v = body.areaName.trim() || 'Aftab Nagar';
    if (v !== current.areaName) { patch.areaName = v; changes.push(`area “${current.areaName}” → “${v}”`); }
  }
  if (typeof body?.active === 'boolean' && body.active !== current.active) {
    patch.active = body.active;
    changes.push(body.active ? 'enabled' : 'disabled');
  }

  if (Object.keys(patch).length === 0) return NextResponse.json(current);

  const [row] = await db.update(blocks).set(patch).where(eq(blocks.id, numId)).returning();
  const action = 'active' in patch && changes.length === 1 ? 'toggle' : 'update';
  await logConfig(auth.session, 'block', numId, action, `Block “${row.name}”: ${changes.join(', ')}`);
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ('res' in auth) return auth.res;

  const { id } = await params;
  const numId = parseId(id);
  if (!numId) return badRequest('invalid id');

  const [current] = await db.select().from(blocks).where(eq(blocks.id, numId));
  if (!current) return notFound();

  await db.delete(blocks).where(eq(blocks.id, numId));
  await logConfig(auth.session, 'block', numId, 'delete', `Removed block “${current.name}”`);
  return NextResponse.json({ ok: true });
}
