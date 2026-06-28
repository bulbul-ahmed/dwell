import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db, owners, otpCodes } from '@/db';
import { eq, and, gt, desc } from 'drizzle-orm';
import { getSession } from '@/lib/session';
import { generateOTP, hashOTP } from '@/lib/otp';

// POST /api/owners/verify-phone
//   { phone }          → send OTP to phone (SMS if configured, else server log)
//   { phone, code }    → verify code, set owners.phone + status='phone_verified'
// Reuses the otp_codes table, keyed by the phone string.
export async function POST(request: NextRequest) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const [owner] = await db.select().from(owners).where(eq(owners.userId, userId)).limit(1);
  if (!owner) return NextResponse.json({ error: 'No owner profile — enter owner mode first' }, { status: 409 });

  const { phone, code } = await request.json() as { phone?: string; code?: string };
  if (!phone) return NextResponse.json({ error: 'Phone required' }, { status: 400 });
  const key = phone.replace(/\s+/g, '');

  // ── Send step ──
  if (!code) {
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await db.insert(otpCodes).values({ email: key, codeHash: hashOTP(otp), expiresAt });

    const apiKey = process.env.BULKSMSBD_API_KEY;
    if (apiKey) {
      const sender = process.env.BULKSMSBD_SENDER_ID ?? 'Dwell';
      const url = `https://bulksmsbd.net/api/smsapi?api_key=${apiKey}&type=text&number=${encodeURIComponent(key)}&senderid=${encodeURIComponent(sender)}&message=${encodeURIComponent(`${otp} is your Dwell verification code`)}`;
      await fetch(url).catch(e => console.error('[verify-phone:sms]', e));
    } else {
      console.log(`\n[DWELL PHONE OTP] ${key} → ${otp}\n`);
    }
    return NextResponse.json({ ok: true, sent: true, expiresAt: expiresAt.toISOString() });
  }

  // ── Verify step ──
  const TEST_CODE = '000000';
  const isTestBypass = !process.env.BULKSMSBD_API_KEY && code.trim() === TEST_CODE;

  if (!isTestBypass) {
    const [row] = await db
      .select()
      .from(otpCodes)
      .where(and(
        eq(otpCodes.email, key),
        eq(otpCodes.codeHash, hashOTP(code.trim())),
        eq(otpCodes.used, false),
        gt(otpCodes.expiresAt, new Date()),
      ))
      .orderBy(desc(otpCodes.createdAt))
      .limit(1);

    if (!row) return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
    await db.update(otpCodes).set({ used: true }).where(eq(otpCodes.id, row.id));
  }

  // Only advance from unverified — never downgrade kyc/agency owners.
  const nextStatus = owner.status === 'unverified' ? 'phone_verified' as const : owner.status;
  await db.update(owners).set({ phone: key, status: nextStatus }).where(eq(owners.id, owner.id));

  return NextResponse.json({ ok: true, status: nextStatus });
}
