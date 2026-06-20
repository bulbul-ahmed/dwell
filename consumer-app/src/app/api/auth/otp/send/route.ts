import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db, otpCodes } from '@/db';
import { generateOTP, hashOTP } from '@/lib/otp';

export async function POST(request: NextRequest) {
  const { email } = await request.json() as { email: string };
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const code = generateOTP();
  const codeHash = hashOTP(code);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  await db.insert(otpCodes).values({ email: email.toLowerCase().trim(), codeHash, expiresAt });

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: 'Dwell <noreply@dwell.app>',
      to: email,
      subject: `${code} is your Dwell sign-in code`,
      html: `
        <div style="font-family:sans-serif;max-width:420px;margin:0 auto">
          <h2 style="color:#1E3A5C">Your sign-in code</h2>
          <p style="font-size:36px;font-weight:800;letter-spacing:8px;color:#1E3A5C">${code}</p>
          <p style="color:#6A7180">Expires in 10 minutes. Do not share this code.</p>
        </div>
      `,
    });
  } else {
    // Dev fallback — log to server console
    console.log(`\n[DWELL OTP] ${email} → ${code}\n`);
  }

  return NextResponse.json({ ok: true });
}
