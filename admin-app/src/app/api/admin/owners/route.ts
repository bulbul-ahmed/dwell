import { NextRequest, NextResponse } from 'next/server';
import { db, owners } from '@/db';
import { eq } from 'drizzle-orm';
import { getAdminSession } from '@/lib/auth';

// POST /api/admin/owners
//   { id, action }
//     verify | unverify          → legacy flag toggle (owners.verified)
//     approve-kyc                → status='kyc_verified', verified=true
//     approve-agency             → status='agency_verified', verified=true
//     reject                     → status back to 'phone_verified' (+ optional reason)
//     suspend                    → status='suspended'
export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, action } = await req.json() as { id?: number; action?: string };
  const ACTIONS = ['verify', 'unverify', 'approve-kyc', 'approve-agency', 'reject', 'suspend'];
  if (!id || !action || !ACTIONS.includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const adminId = Number(session.sub);
  const now = new Date();

  let set: Partial<typeof owners.$inferInsert> = {};
  switch (action) {
    case 'verify':         set = { verified: true }; break;
    case 'unverify':       set = { verified: false }; break;
    case 'approve-kyc':    set = { status: 'kyc_verified', verified: true, verifiedBy: adminId, verifiedAt: now }; break;
    case 'approve-agency': set = { status: 'agency_verified', verified: true, verifiedBy: adminId, verifiedAt: now }; break;
    case 'reject':         set = { status: 'phone_verified', verified: false, verifiedBy: adminId, verifiedAt: now }; break;
    case 'suspend':        set = { status: 'suspended', verified: false }; break;
  }

  await db.update(owners).set(set).where(eq(owners.id, id));

  return NextResponse.json({ ok: true, action });
}
