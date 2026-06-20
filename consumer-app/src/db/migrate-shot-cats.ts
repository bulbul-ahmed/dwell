import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const sql = postgres(process.env.DATABASE_URL!);

async function run() {
  await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS shot_cats text[]`;
  console.log('Migration complete: listings.shot_cats added');
  await sql.end();
}

run().catch(e => { console.error(e); process.exit(1); });
