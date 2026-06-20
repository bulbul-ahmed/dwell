import { NextResponse } from 'next/server';
import { db, zones } from '@/db';
import { eq } from 'drizzle-orm';

export async function GET() {
  const rows = await db.select().from(zones).where(eq(zones.active, true));
  return NextResponse.json(rows);
}
