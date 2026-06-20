import { NextResponse } from 'next/server';
import { db, configAudit } from '@/db';
import { desc } from 'drizzle-orm';
import { requireAdmin } from '@/lib/config-api';

export async function GET() {
  const auth = await requireAdmin();
  if ('res' in auth) return auth.res;
  const rows = await db.select().from(configAudit).orderBy(desc(configAudit.id)).limit(12);
  return NextResponse.json(rows);
}
