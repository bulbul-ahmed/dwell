import { NextRequest, NextResponse } from 'next/server';
import { db, listings } from '@/db';
import { eq } from 'drizzle-orm';
import { getAdminSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const id = parseInt(formData.get('id') as string);
  const adminNotes = formData.get('adminNotes') as string;

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  await db.update(listings).set({ adminNotes: adminNotes || null }).where(eq(listings.id, id));

  return NextResponse.json({ ok: true });
}
