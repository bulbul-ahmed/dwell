import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const sql = postgres(process.env.DATABASE_URL!);

// Indexes on every FK / common filter column. All queries previously did
// sequential scans; these accelerate listings browse/search, dashboards,
// messaging, bookings, saves, reviews and notifications.
async function run() {
  const statements = [
    // listings — browse, search, dashboard, similar
    `CREATE INDEX IF NOT EXISTS listings_owner_idx       ON listings (owner_id)`,
    `CREATE INDEX IF NOT EXISTS listings_cat_verified_idx ON listings (cat, verified)`,
    `CREATE INDEX IF NOT EXISTS listings_verified_idx     ON listings (verified)`,
    `CREATE INDEX IF NOT EXISTS listings_property_type_idx ON listings (property_type)`,
    `CREATE INDEX IF NOT EXISTS listings_created_idx       ON listings (created_at)`,
    // threads / messages
    `CREATE INDEX IF NOT EXISTS threads_listing_idx ON threads (listing_id)`,
    `CREATE INDEX IF NOT EXISTS threads_user_idx    ON threads (user_id)`,
    `CREATE INDEX IF NOT EXISTS messages_thread_idx ON messages (thread_id)`,
    // bookings — visits, reminders
    `CREATE INDEX IF NOT EXISTS bookings_listing_idx ON bookings (listing_id)`,
    `CREATE INDEX IF NOT EXISTS bookings_user_idx    ON bookings (user_id)`,
    `CREATE INDEX IF NOT EXISTS bookings_status_idx  ON bookings (status)`,
    // saves
    `CREATE INDEX IF NOT EXISTS saves_listing_idx ON saves (listing_id)`,
    // reviews
    `CREATE INDEX IF NOT EXISTS reviews_listing_idx ON reviews (listing_id)`,
    `CREATE INDEX IF NOT EXISTS reviews_user_idx    ON reviews (user_id)`,
    // owners ↔ users link
    `CREATE INDEX IF NOT EXISTS owners_user_idx ON owners (user_id)`,
    // notifications — list + prune by age
    `CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON notifications (user_id, created_at)`,
    // reports moderation
    `CREATE INDEX IF NOT EXISTS reports_listing_idx ON reports (listing_id)`,
  ];

  for (const stmt of statements) {
    await sql.unsafe(stmt);
  }
  console.log(`indexes migration complete (${statements.length} indexes ensured)`);
  await sql.end();
}

run().catch(e => { console.error(e); process.exit(1); });
