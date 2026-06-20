import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const sql = postgres(process.env.DATABASE_URL!);

async function run() {
  const [user] = await sql`SELECT id FROM users LIMIT 1`;
  if (!user) { console.log('No users found'); await sql.end(); return; }

  const userId = user.id;

  await sql`DELETE FROM notifications WHERE user_id = ${userId}`;

  await sql`
    INSERT INTO notifications (user_id, type, title, body, href, icon, ico_bg, ico_fg, read, created_at) VALUES
    (${userId}, 'visit',   'Visit confirmed — Sunlit 2-Bed, Block B',       'Owner confirmed your visit for Sat 21 Jun at 11:00 AM.',             '/visits',    'ti-calendar-check', '#EEF3F8', '#1E3A5C', false, NOW() - INTERVAL '2 minutes'),
    (${userId}, 'visit',   'Reminder — Block A visit tomorrow at 10 AM',    'Block A, Aftab Nagar · 3-bed flat. Bring your NID/passport.',        '/visits',    'ti-bell',           '#EEF3F8', '#1E3A5C', false, NOW() - INTERVAL '3 hours'),
    (${userId}, 'message', 'Karim (Block D) replied to your message',        '"The flat is available from 1st July. Let me know if you have questions."', '/messages',  'ti-message-2',      '#EEF3F8', '#1E3A5C', false, NOW() - INTERVAL '1 hour'),
    (${userId}, 'listing', 'Price drop — Cozy 1-Bed near the Lake',          'Was ৳28,000 · now ৳26,000/mo · Block C, Aftab Nagar.',              '/saved',     'ti-trending-down',  '#EAF1ED', '#2E7D55', true,  NOW() - INTERVAL '1 day'),
    (${userId}, 'listing', 'New match in Block C — 2-bed under ৳40k',       'Matches your saved search: Block C · 2 beds · under ৳40,000.',      '/search?intent=rent', 'ti-search', '#F2F4F7', '#41495A', true, NOW() - INTERVAL '2 days'),
    (${userId}, 'review',  'Your review was published',                      'Your 4-star review for Spacious 3-Bed, Block D is now live.',        '/saved',     'ti-star',           '#FFF8ED', '#B8660A', true,  NOW() - INTERVAL '3 days')
  `;

  console.log(`Seeded 6 notifications for user ${userId}`);
  await sql.end();
}

run().catch(e => { console.error(e); process.exit(1); });
