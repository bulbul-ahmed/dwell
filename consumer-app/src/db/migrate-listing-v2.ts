import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const sql = postgres(process.env.DATABASE_URL!);

async function run() {
  // Add 'office' value to listing_cat enum
  await sql`
    DO $$ BEGIN
      ALTER TYPE listing_cat ADD VALUE IF NOT EXISTS 'office';
    EXCEPTION WHEN others THEN NULL;
    END $$
  `;

  await sql`
    ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS landmark     text,
      ADD COLUMN IF NOT EXISTS facing       text,
      ADD COLUMN IF NOT EXISTS balconies    integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS total_floors text,
      ADD COLUMN IF NOT EXISTS videos       text[],
      ADD COLUMN IF NOT EXISTS meta         jsonb
  `;

  console.log('Migration v2 complete');
  await sql.end();
}

run().catch(e => { console.error(e); process.exit(1); });
