import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db, owners } from '@/db';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/session';

// POST /api/owners/verify-kyc
//   Individual: { nidNumber, nidDocUrl }
//   Agency:     { businessName, tradeLicense, businessDocUrl }
// Submits docs for manual admin review. Sets status to a *_pending state and
// clears verifiedAt/By. Admin approval flips to kyc_verified / agency_verified.
// Review queue = owners with docs set and verified_at null.
export async function POST(request: NextRequest) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const [owner] = await db.select().from(owners).where(eq(owners.userId, userId)).limit(1);
  if (!owner) return NextResponse.json({ error: 'No owner profile' }, { status: 409 });

  if (owner.status === 'unverified') {
    return NextResponse.json({ error: 'Verify phone first', needs: 'phone_verification' }, { status: 409 });
  }

  const body = await request.json() as {
    nidNumber?: string; nidDocUrl?: string;
    businessName?: string; tradeLicense?: string; businessDocUrl?: string;
  };

  const isAgency = owner.type === 'Agency';

  if (isAgency) {
    if (!body.businessName || !body.tradeLicense || !body.businessDocUrl) {
      return NextResponse.json({ error: 'businessName, tradeLicense and businessDocUrl required' }, { status: 400 });
    }
    await db.update(owners)
      .set({
        businessName:   body.businessName,
        tradeLicense:   body.tradeLicense,
        businessDocUrl: body.businessDocUrl,
        status:         'agency_pending',
        verifiedAt: null, verifiedBy: null,
      })
      .where(eq(owners.id, owner.id));
  } else {
    if (!body.nidNumber || !body.nidDocUrl) {
      return NextResponse.json({ error: 'nidNumber and nidDocUrl required' }, { status: 400 });
    }
    await db.update(owners)
      .set({ nidNumber: body.nidNumber, nidDocUrl: body.nidDocUrl, verifiedAt: null, verifiedBy: null })
      .where(eq(owners.id, owner.id));
  }

  return NextResponse.json({ ok: true, status: 'pending_review' }, { status: 202 });
}
