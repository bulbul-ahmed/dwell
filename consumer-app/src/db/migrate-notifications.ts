import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const sql = postgres(process.env.DATABASE_URL!);

async function run() {
  // Create enum if not exists
  await sql`
    DO $$ BEGIN
      CREATE TYPE notif_type AS ENUM ('visit', 'message', 'listing', 'review', 'system');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `;

  // Add new columns (idempotent)
  await sql`
    ALTER TABLE notifications
      ADD COLUMN IF NOT EXISTS type       notif_type NOT NULL DEFAULT 'system',
      ADD COLUMN IF NOT EXISTS title      text       NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS href       text       NOT NULL DEFAULT '/',
      ALTER COLUMN icon      SET DEFAULT 'ti-bell',
      ALTER COLUMN ico_bg    SET DEFAULT '#EEF3F8',
      ALTER COLUMN ico_fg    SET DEFAULT '#1E3A5C'
  `;

  // Drop old time column if it exists
  await sql`
    ALTER TABLE notifications DROP COLUMN IF EXISTS time
  `;

  console.log('Migration complete');
  await sql.end();
}

run().catch(e => { console.error(e); process.exit(1); });
