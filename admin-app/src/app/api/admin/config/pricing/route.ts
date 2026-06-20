import { NextRequest, NextResponse } from 'next/server';
import { db, pricingPlans } from '@/db';
import { asc } from 'drizzle-orm';
import { requireAdmin, logConfig, badRequest } from '@/lib/config-api';

export async function GET() {
  const auth = await requireAdmin();
  if ('res' in auth) return auth.res;
  const rows = await db.select().from(pricingPlans).orderBy(asc(pricingPlans.sortOrder), asc(pricingPlans.id));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ('res' in auth) return auth.res;

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!name) return badRequest('name required');
  const price = Number(body?.price);
  if (!Number.isInteger(price) || price < 0) return badRequest('price must be a non-negative whole number');
  const description = typeof body?.description === 'string' ? body.description.trim() : '';
  const period = typeof body?.period === 'string' && body.period.trim() ? body.period.trim() : 'mo';

  const [row] = await db.insert(pricingPlans).values({ name, price, description, period }).returning();
  await logConfig(auth.session, 'pricing', row.id, 'create', `Added plan “${name}” at ৳${price}/${period}`);
  return NextResponse.json(row, { status: 201 });
}
