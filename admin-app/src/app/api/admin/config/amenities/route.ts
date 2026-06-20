import { NextRequest, NextResponse } from 'next/server';
import { db, amenities } from '@/db';
import { asc } from 'drizzle-orm';
import { requireAdmin, logConfig, badRequest } from '@/lib/config-api';

export async function GET() {
  const auth = await requireAdmin();
  if ('res' in auth) return auth.res;
  const rows = await db.select().from(amenities).orderBy(asc(amenities.sortOrder), asc(amenities.id));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ('res' in auth) return auth.res;

  const body = await req.json().catch(() => null);
  const label = typeof body?.label === 'string' ? body.label.trim() : '';
  if (!label) return badRequest('label required');
  const icon = typeof body?.icon === 'string' ? body.icon.trim() : '';

  const [row] = await db.insert(amenities).values({ label, icon }).returning();
  await logConfig(auth.session, 'amenity', row.id, 'create', `Added amenity “${label}”`);
  return NextResponse.json(row, { status: 201 });
}
