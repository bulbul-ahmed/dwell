import { db } from '@/db';
import { sql } from 'drizzle-orm';

// Cross-process realtime: emit a Postgres NOTIFY that the consumer app's SSE
// listener forwards to the affected user's live notification badge.
//
// The channel + payload shape MUST match consumer-app/src/lib/notify-user.ts.
const CHANNEL = 'user_event';

export interface UserEvent {
  kind: string;
  [k: string]: unknown;
}

export async function notifyUser(userId: number, event: UserEvent): Promise<void> {
  const payload = JSON.stringify({ userId, event });
  try {
    await db.execute(sql`SELECT pg_notify(${CHANNEL}, ${payload})`);
  } catch (e) {
    console.error('[admin:notify-user]', e);
  }
}
