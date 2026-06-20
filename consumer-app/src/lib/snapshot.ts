import { db, listings, priceSnapshots } from '@/db';
import { eq } from 'drizzle-orm';

// Captures one price_snapshots row per scope ('rent' | 'buy') from the current
// verified listings. Run periodically (see scripts/snapshot.ts + cron) so the
// insights trend chart can plot real market movement over time.

function avg(ns: number[]) { return ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : 0; }
function median(ns: number[]) {
  if (!ns.length) return 0;
  const s = [...ns].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export async function captureSnapshots() {
  const rows = await db.select().from(listings).where(eq(listings.verified, true));
  const scopes: { scope: 'rent' | 'buy'; rows: typeof rows }[] = [
    { scope: 'rent', rows: rows.filter(r => !r.sale) },
    { scope: 'buy', rows: rows.filter(r => r.sale) },
  ];

  const inserted: { scope: string; avgPrice: number; sampleSize: number }[] = [];
  for (const { scope, rows: rs } of scopes) {
    if (!rs.length) continue; // nothing to record for this scope right now
    const prices = rs.map(r => r.price);
    const sqftRates = rs.filter(r => r.size > 0).map(r => r.price / r.size);
    const row = {
      scope,
      avgPrice:    Math.round(avg(prices)),
      medianPrice: Math.round(median(prices)),
      perSqft:     Math.round(avg(sqftRates)),
      sampleSize:  rs.length,
    };
    await db.insert(priceSnapshots).values(row);
    inserted.push({ scope, avgPrice: row.avgPrice, sampleSize: row.sampleSize });
  }
  return inserted;
}
