import { NextRequest, NextResponse } from 'next/server';
import { db, categories } from '@/db';
import { eq } from 'drizzle-orm';
import { requireAdmin, logConfig, badRequest, notFound, parseId } from '@/lib/config-api';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ('res' in auth) return auth.res;

  const { id } = await params;
  const numId = parseId(id);
  if (!numId) return badRequest('invalid id');

  const [current] = await db.select().from(categories).where(eq(categories.id, numId));
  if (!current) return notFound();

  const body = await req.json().catch(() => null);
  const patch: Partial<typeof categories.$inferInsert> = {};
  const changes: string[] = [];

  if (typeof body?.label === 'string') {
    const v = body.label.trim();
    if (!v) return badRequest('label cannot be empty');
    if (v !== current.label) { patch.label = v; changes.push(`label “${current.label}” → “${v}”`); }
  }
  if (typeof body?.bg === 'string' && body.bg !== current.bg) { patch.bg = body.bg; changes.push('colour'); }
  if (typeof body?.fg === 'string' && body.fg !== current.fg) { patch.fg = body.fg; changes.push('text colour'); }
  if (typeof body?.active === 'boolean' && body.active !== current.active) {
    patch.active = body.active;
    changes.push(body.active ? 'enabled' : 'disabled');
  }

  if (Object.keys(patch).length === 0) return NextResponse.json(current);

  const [row] = await db.update(categories).set(patch).where(eq(categories.id, numId)).returning();
  const action = 'active' in patch && changes.length === 1 ? 'toggle' : 'update';
  await logConfig(auth.session, 'category', numId, action, `Category “${row.label}”: ${changes.join(', ')}`);
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ('res' in auth) return auth.res;

  const { id } = await params;
  const numId = parseId(id);
  if (!numId) return badRequest('invalid id');

  const [current] = await db.select().from(categories).where(eq(categories.id, numId));
  if (!current) return notFound();

  await db.delete(categories).where(eq(categories.id, numId));
  await logConfig(auth.session, 'category', numId, 'delete', `Removed category “${current.label}”`);
  return NextResponse.json({ ok: true });
}
