const BULKSMS_API_KEY  = process.env.BULKSMSBD_API_KEY;
const BULKSMS_SENDER   = process.env.BULKSMSBD_SENDER_ID ?? 'Dwell';
const BULKSMS_ENDPOINT = 'https://bulksmsbd.net/api/smsapi';
const MARKETPLACE      = process.env.NEXT_PUBLIC_MARKETPLACE_URL ?? 'http://localhost:3000';

function normalizeBDPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('880') && digits.length === 13) return digits;
  if (digits.startsWith('01') && digits.length === 11) return '88' + digits;
  if (digits.startsWith('1') && digits.length === 10) return '880' + digits;
  return null;
}

async function sendSMS(phone: string, message: string): Promise<void> {
  if (!BULKSMS_API_KEY) {
    console.log('[sms] No BULKSMSBD_API_KEY — skipping SMS to', phone, '|', message);
    return;
  }

  const number = normalizeBDPhone(phone);
  if (!number) {
    console.warn('[sms] Cannot normalize phone number:', phone);
    return;
  }

  try {
    const res = await fetch(BULKSMS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: BULKSMS_API_KEY,
        senderid: BULKSMS_SENDER,
        number,
        message,
      }),
    });
    const body = await res.text();
    if (!res.ok) console.error('[sms] BulkSMSBD error:', body);
  } catch (err) {
    console.error('[sms] BulkSMSBD fetch failed:', err);
  }
}

export async function sendApprovalSMS(opts: {
  phone: string;
  listingTitle: string;
  listingId: number;
}) {
  const url = `${MARKETPLACE}/listings/${opts.listingId}`;
  const msg = `Dwell: Your listing "${opts.listingTitle}" has been approved and is now live! View: ${url}`;
  await sendSMS(opts.phone, msg);
}

export async function sendRejectionSMS(opts: {
  phone: string;
  listingTitle: string;
  listingId: number;
  reason: string;
}) {
  const url = `${MARKETPLACE}/list?edit=${opts.listingId}`;
  const msg = `Dwell: Your listing "${opts.listingTitle}" was not approved. Reason: ${opts.reason}. Edit & resubmit: ${url}`;
  await sendSMS(opts.phone, msg);
}
