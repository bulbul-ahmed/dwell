import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const sql = postgres(process.env.DATABASE_URL!);

async function run() {
  await sql`
    ALTER TABLE owners
      ADD COLUMN IF NOT EXISTS user_id integer REFERENCES users(id)
  `;
  console.log('Migration complete: owners.user_id added');
  await sql.end();
}

run().catch(e => { console.error(e); process.exit(1); });
