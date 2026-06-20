import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const sql = postgres(process.env.DATABASE_URL!);

async function run() {
  await sql`
    ALTER TABLE notifications
      ADD COLUMN IF NOT EXISTS thread_id  integer,
      ADD COLUMN IF NOT EXISTS count      integer NOT NULL DEFAULT 1,
      ADD COLUMN IF NOT EXISTS updated_at timestamp NOT NULL DEFAULT now()
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS notifications_user_thread_unread_idx
      ON notifications (user_id, thread_id, read)
      WHERE thread_id IS NOT NULL AND read = false
  `;
  console.log('notif grouping migration complete');
  await sql.end();
}

run().catch(e => { console.error(e); process.exit(1); });
