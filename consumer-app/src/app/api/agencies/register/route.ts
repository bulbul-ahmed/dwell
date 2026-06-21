import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db, owners } from '@/db';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/session';

// POST /api/agencies/register
//   { businessName, tradeLicense, businessDocUrl, phone? }
// Converts owner → Agency, status='agency_pending'. Always human-reviewed by admin.
export async function POST(request: NextRequest) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const [owner] = await db.select().from(owners).where(eq(owners.userId, userId)).limit(1);
  if (!owner) return NextResponse.json({ error: 'No owner profile — enter owner mode first' }, { status: 409 });
  if (owner.status === 'agency_verified' || owner.status === 'agency_pending') {
    return NextResponse.json({ error: 'Agency registration already submitted' }, { status: 409 });
  }

  const { businessName, tradeLicense, businessDocUrl, phone } = await request.json() as {
    businessName?: string; tradeLicense?: string; businessDocUrl?: string; phone?: string;
  };
  if (!businessName || !tradeLicense || !businessDocUrl) {
    return NextResponse.json({ error: 'businessName, tradeLicense and businessDocUrl required' }, { status: 400 });
  }

  await db.update(owners).set({
    type:          'Agency',
    businessName,
    tradeLicense,
    businessDocUrl,
    status:        'agency_pending',
    verifiedAt:    null,
    verifiedBy:    null,
    ...(phone ? { phone: phone.replace(/\s+/g, '') } : {}),
  }).where(eq(owners.id, owner.id));

  return NextResponse.json({ ok: true, type: 'Agency', status: 'agency_pending' }, { status: 202 });
}
