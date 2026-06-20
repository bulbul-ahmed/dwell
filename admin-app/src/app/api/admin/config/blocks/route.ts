import { NextRequest, NextResponse } from 'next/server';
import { db, blocks } from '@/db';
import { asc } from 'drizzle-orm';
import { requireAdmin, logConfig, badRequest } from '@/lib/config-api';

export async function GET() {
  const auth = await requireAdmin();
  if ('res' in auth) return auth.res;
  const rows = await db.select().from(blocks).orderBy(asc(blocks.sortOrder), asc(blocks.id));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ('res' in auth) return auth.res;

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const areaName = typeof body?.areaName === 'string' && body.areaName.trim() ? body.areaName.trim() : 'Aftab Nagar';
  if (!name) return badRequest('name required');

  const [row] = await db.insert(blocks).values({ name, areaName }).returning();
  await logConfig(auth.session, 'block', row.id, 'create', `Added block “${name}” (${areaName})`);
  return NextResponse.json(row, { status: 201 });
}
