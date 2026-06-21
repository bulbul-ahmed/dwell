import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db, owners } from '@/db';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/session';

// POST /api/owners/verify-kyc
//   { nidNumber, nidDocUrl }  → submit identity docs for admin review.
// Stores NID, leaves status at 'phone_verified'. Admin approval flips to
// 'kyc_verified'. Review queue = owners where nid_number is set and verified_at is null.
export async function POST(request: NextRequest) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const [owner] = await db.select().from(owners).where(eq(owners.userId, userId)).limit(1);
  if (!owner) return NextResponse.json({ error: 'No owner profile' }, { status: 409 });

  if (owner.status === 'unverified') {
    return NextResponse.json({ error: 'Verify phone first', needs: 'phone_verification' }, { status: 409 });
  }

  const { nidNumber, nidDocUrl } = await request.json() as { nidNumber?: string; nidDocUrl?: string };
  if (!nidNumber || !nidDocUrl) {
    return NextResponse.json({ error: 'nidNumber and nidDocUrl required' }, { status: 400 });
  }

  await db.update(owners)
    .set({ nidNumber, nidDocUrl, verifiedAt: null, verifiedBy: null })
    .where(eq(owners.id, owner.id));

  return NextResponse.json({ ok: true, status: 'pending_review' }, { status: 202 });
}
