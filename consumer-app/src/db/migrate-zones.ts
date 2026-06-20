import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const sql = postgres(process.env.DATABASE_URL!);

async function run() {
  await sql`
    CREATE TABLE IF NOT EXISTS zones (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL,
      area_name   TEXT NOT NULL,
      polygon     JSONB NOT NULL,
      color       TEXT NOT NULL DEFAULT '#1E3A5C',
      active      BOOLEAN NOT NULL DEFAULT true,
      created_at  TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;

  await sql`
    ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS zone_id INTEGER REFERENCES zones(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS map_lat DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS map_lng DOUBLE PRECISION
  `;

  console.log('migrate-zones complete');
  await sql.end();
}

run().catch(e => { console.error(e); process.exit(1); });
