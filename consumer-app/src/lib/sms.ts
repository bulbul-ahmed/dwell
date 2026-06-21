// BulkSMSBD sender (Bangladesh). No-ops to console if no API key configured.
const BULKSMS_API_KEY  = process.env.BULKSMSBD_API_KEY;
const BULKSMS_SENDER   = process.env.BULKSMSBD_SENDER_ID ?? 'Dwell';
const BULKSMS_ENDPOINT = 'https://bulksmsbd.net/api/smsapi';

export function normalizeBDPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('880') && digits.length === 13) return digits;
  if (digits.startsWith('01') && digits.length === 11) return '88' + digits;
  if (digits.startsWith('1') && digits.length === 10) return '880' + digits;
  return null;
}

export async function sendSMS(phone: string, message: string): Promise<boolean> {
  if (!BULKSMS_API_KEY) {
    console.log('[sms] No BULKSMSBD_API_KEY — would send to', phone, '|', message);
    return false;
  }
  const number = normalizeBDPhone(phone);
  if (!number) {
    console.warn('[sms] Cannot normalize phone:', phone);
    return false;
  }
  try {
    const res = await fetch(BULKSMS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: BULKSMS_API_KEY, senderid: BULKSMS_SENDER, number, message }),
    });
    if (!res.ok) { console.error('[sms] BulkSMSBD error:', await res.text()); return false; }
    return true;
  } catch (err) {
    console.error('[sms] BulkSMSBD fetch failed:', err);
    return false;
  }
}
