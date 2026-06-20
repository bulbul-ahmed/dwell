import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM ?? 'Dwell <noreply@dwell.com.bd>';
const MARKETPLACE = process.env.NEXT_PUBLIC_MARKETPLACE_URL ?? 'http://localhost:3000';

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { margin:0; padding:0; background:#F4F6F9; font-family:'Helvetica Neue',Arial,sans-serif; }
  .wrap { max-width:560px; margin:40px auto; background:#fff; border-radius:16px; overflow:hidden; border:1px solid #E2E8F0; }
  .header { background:#1E3A5C; padding:28px 32px; }
  .header h1 { color:#fff; margin:0; font-size:22px; font-weight:700; letter-spacing:-0.3px; }
  .header p { color:rgba(255,255,255,0.65); margin:4px 0 0; font-size:14px; }
  .body { padding:28px 32px; }
  .body p { color:#44506A; font-size:15px; line-height:1.65; margin:0 0 16px; }
  .listing-card { background:#F7F9FC; border:1px solid #E2E8F0; border-radius:12px; padding:16px 18px; margin:20px 0; }
  .listing-card .title { font-size:16px; font-weight:700; color:#15243B; margin:0 0 4px; }
  .listing-card .area  { font-size:13px; color:#8893A4; margin:0; }
  .btn { display:inline-block; padding:13px 26px; border-radius:12px; text-decoration:none; font-size:15px; font-weight:700; }
  .btn-primary { background:#2E7D55; color:#fff; }
  .btn-danger  { background:#B4402B; color:#fff; }
  .reason-box { background:#FDF1EF; border:1px solid #F0D9D2; border-radius:12px; padding:14px 16px; margin:16px 0; }
  .reason-box p { color:#B4402B; margin:0; font-size:14px; font-weight:600; }
  .footer { padding:20px 32px; border-top:1px solid #EEF1F5; }
  .footer p { color:#B0BAC8; font-size:12px; margin:0; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>Dwell</h1>
    <p>Property Marketplace · Aftab Nagar</p>
  </div>
  <div class="body">${content}</div>
  <div class="footer"><p>© 2026 Dwell. Aftab Nagar, Dhaka, Bangladesh.</p></div>
</div>
</body>
</html>`;
}

export async function sendApprovalEmail(opts: {
  to: string;
  ownerName: string;
  listingTitle: string;
  listingArea: string;
  listingId: number;
}) {
  if (!resend) {
    console.log('[email:approve] No RESEND_API_KEY — skipping email to', opts.to);
    return;
  }

  const listingUrl = `${MARKETPLACE}/listings/${opts.listingId}`;

  const html = baseTemplate(`
    <p>Hi ${opts.ownerName},</p>
    <p>Great news! Your property listing has been reviewed and <strong>approved</strong> by our team. It is now live on Dwell and visible to renters.</p>
    <div class="listing-card">
      <p class="title">${opts.listingTitle}</p>
      <p class="area">${opts.listingArea}</p>
    </div>
    <p>
      <a href="${listingUrl}" class="btn btn-primary">View your live listing →</a>
    </p>
    <p style="font-size:13px;color:#8893A4;">Renters can now contact you directly through the platform.</p>
  `);

  await resend.emails.send({
    from: FROM,
    to: [opts.to],
    subject: `✓ Your listing is live — ${opts.listingTitle}`,
    html,
  });
}

export async function sendRejectionEmail(opts: {
  to: string;
  ownerName: string;
  listingTitle: string;
  listingArea: string;
  listingId: number;
  reason: string;
  note?: string;
}) {
  if (!resend) {
    console.log('[email:reject] No RESEND_API_KEY — skipping email to', opts.to);
    return;
  }

  const editUrl = `${MARKETPLACE}/list?edit=${opts.listingId}`;

  const html = baseTemplate(`
    <p>Hi ${opts.ownerName},</p>
    <p>Your listing was reviewed by our moderation team and could not be approved at this time.</p>
    <div class="listing-card">
      <p class="title">${opts.listingTitle}</p>
      <p class="area">${opts.listingArea}</p>
    </div>
    <div class="reason-box">
      <p>Reason: ${opts.reason}</p>
      ${opts.note ? `<p style="margin-top:8px;font-weight:400;color:#B4402B;">${opts.note}</p>` : ''}
    </div>
    <p>Please update your listing to address the issue above and resubmit for review.</p>
    <p>
      <a href="${editUrl}" class="btn btn-danger">Edit and resubmit →</a>
    </p>
    <p style="font-size:13px;color:#8893A4;">If you believe this was a mistake, please contact our support team.</p>
  `);

  await resend.emails.send({
    from: FROM,
    to: [opts.to],
    subject: `Your listing needs attention — ${opts.listingTitle}`,
    html,
  });
}
