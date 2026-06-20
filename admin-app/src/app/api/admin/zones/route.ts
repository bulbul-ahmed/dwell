import { NextRequest, NextResponse } from 'next/server';
import { db, zones } from '@/db';
import { getAdminSession } from '@/lib/auth';
import { desc } from 'drizzle-orm';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db.select().from(zones).orderBy(desc(zones.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, areaName, polygon, color } = body;

  if (!name || !areaName || !polygon) {
    return NextResponse.json({ error: 'name, areaName, polygon required' }, { status: 400 });
  }

  const [zone] = await db.insert(zones).values({
    name,
    areaName,
    polygon,
    color: color || '#1E3A5C',
    active: true,
  }).returning();

  return NextResponse.json(zone);
}
