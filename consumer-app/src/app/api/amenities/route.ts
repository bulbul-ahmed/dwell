import { NextResponse } from 'next/server';
import { db, amenities } from '@/db';
import { asc, eq } from 'drizzle-orm';

// Public read-only: label → icon map for active amenities (admin-managed).
export async function GET() {
  const rows = await db
    .select({ label: amenities.label, icon: amenities.icon })
    .from(amenities)
    .where(eq(amenities.active, true))
    .orderBy(asc(amenities.sortOrder), asc(amenities.id));
  return NextResponse.json(rows);
}
