import { NextRequest, NextResponse } from 'next/server';
import { db, pricingPlans } from '@/db';
import { eq } from 'drizzle-orm';
import { requireAdmin, logConfig, badRequest, notFound, parseId } from '@/lib/config-api';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ('res' in auth) return auth.res;

  const { id } = await params;
  const numId = parseId(id);
  if (!numId) return badRequest('invalid id');

  const [current] = await db.select().from(pricingPlans).where(eq(pricingPlans.id, numId));
  if (!current) return notFound();

  const body = await req.json().catch(() => null);
  const patch: Partial<typeof pricingPlans.$inferInsert> = {};
  const changes: string[] = [];

  if (typeof body?.name === 'string') {
    const v = body.name.trim();
    if (!v) return badRequest('name cannot be empty');
    if (v !== current.name) { patch.name = v; changes.push(`name “${current.name}” → “${v}”`); }
  }
  if (body?.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isInteger(price) || price < 0) return badRequest('price must be a non-negative whole number');
    if (price !== current.price) { patch.price = price; changes.push(`price ৳${current.price} → ৳${price}`); }
  }
  if (typeof body?.description === 'string') {
    const v = body.description.trim();
    if (v !== current.description) { patch.description = v; changes.push('description'); }
  }
  if (typeof body?.period === 'string' && body.period.trim() && body.period.trim() !== current.period) {
    patch.period = body.period.trim();
    changes.push(`period → ${body.period.trim()}`);
  }
  if (typeof body?.active === 'boolean' && body.active !== current.active) {
    patch.active = body.active;
    changes.push(body.active ? 'set LIVE' : 'set OFF');
  }

  if (Object.keys(patch).length === 0) return NextResponse.json(current);

  const [row] = await db.update(pricingPlans).set(patch).where(eq(pricingPlans.id, numId)).returning();
  const action = 'active' in patch && changes.length === 1 ? 'toggle' : 'update';
  await logConfig(auth.session, 'pricing', numId, action, `Plan “${row.name}”: ${changes.join(', ')}`);
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ('res' in auth) return auth.res;

  const { id } = await params;
  const numId = parseId(id);
  if (!numId) return badRequest('invalid id');

  const [current] = await db.select().from(pricingPlans).where(eq(pricingPlans.id, numId));
  if (!current) return notFound();

  await db.delete(pricingPlans).where(eq(pricingPlans.id, numId));
  await logConfig(auth.session, 'pricing', numId, 'delete', `Removed plan “${current.name}”`);
  return NextResponse.json({ ok: true });
}
