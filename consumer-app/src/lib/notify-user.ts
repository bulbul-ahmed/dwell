import postgres from 'postgres';
import { publishUser } from './sse-user';

// Cross-process realtime via Postgres LISTEN/NOTIFY.
//
// SSE subscribers (publishUser/subscribeUser) live in-memory in THIS process.
// But notifications can be written by another process entirely (the admin app
// approving/rejecting a listing). pg_notify lets any writer fan out to every
// consumer process's SSE clients over the shared database.

const CHANNEL = 'user_event';

const g = globalThis as unknown as {
  _notifNotifier?: postgres.Sql;
  _notifListener?: boolean;
};

// Dedicated connection for emitting NOTIFY (kept off the pooled app client).
function notifier(): postgres.Sql {
  if (!g._notifNotifier) g._notifNotifier = postgres(process.env.DATABASE_URL!, { max: 1 });
  return g._notifNotifier;
}

export interface UserEvent {
  kind: string;
  [k: string]: unknown;
}

// Publish an event to a user across all processes. Routed through Postgres so
// it reaches SSE clients connected to any consumer-app instance.
export async function notifyUser(userId: number, event: UserEvent): Promise<void> {
  const payload = JSON.stringify({ userId, event });
  try {
    await notifier().notify(CHANNEL, payload);
  } catch (e) {
    // Fall back to local-only delivery so same-process clients still update.
    console.error('[notify-user]', e);
    publishUser(userId, event);
  }
}

// Start the singleton LISTEN connection that forwards NOTIFY payloads to local
// SSE subscribers. Idempotent — safe to call on every SSE connection.
export function ensureUserListener(): void {
  if (g._notifListener) return;
  g._notifListener = true;

  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  sql
    .listen(CHANNEL, (payload) => {
      try {
        const { userId, event } = JSON.parse(payload) as { userId: number; event: UserEvent };
        publishUser(userId, event);
      } catch {
        /* ignore malformed payloads */
      }
    })
    .catch((e) => {
      g._notifListener = false; // allow a later retry
      console.error('[notify-user:listen]', e);
    });
}
