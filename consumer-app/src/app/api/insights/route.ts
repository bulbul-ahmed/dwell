import { NextResponse } from 'next/server';
import { db, listings, priceSnapshots } from '@/db';
import { eq, asc } from 'drizzle-orm';

// Market insights aggregated from live verified listings. The price "trend" is
// plotted from the price_snapshots table (written periodically by the snapshot
// job — see src/lib/snapshot.ts), so it reflects real market movement over time.
// The chart needs >=2 snapshots; until then the UI shows an empty state.

const BLOCK_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function avg(ns: number[]) { return ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : 0; }
function median(ns: number[]) {
  if (!ns.length) return 0;
  const s = [...ns].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function fmtMoney(n: number, buy: boolean): string {
  if (!n) return '—';
  if (buy) {
    if (n >= 1e7) return `৳${(n / 1e7).toFixed(2)} Cr`;
    if (n >= 1e5) return `৳${Math.round(n / 1e5)} Lakh`;
    return `৳${Math.round(n).toLocaleString('en-US')}`;
  }
  return `৳${Math.round(n).toLocaleString('en-US')}`;
}

type Row = typeof listings.$inferSelect;
type Snap = typeof priceSnapshots.$inferSelect;

function buildIntent(rows: Row[], buy: boolean, snaps: Snap[]) {
  const prices = rows.map(r => r.price);
  const avgPrice = avg(prices);
  const sqftRates = rows.filter(r => r.size > 0).map(r => r.price / r.size);
  const avgSqft = avg(sqftRates);

  const stats = [
    { label: buy ? 'Average asking price' : 'Average rent', value: fmtMoney(avgPrice, buy), note: 'live' },
    { label: 'Price per sqft', value: fmtMoney(avgSqft, false), note: 'live' },
    { label: buy ? 'Median asking price' : 'Median rent', value: fmtMoney(median(prices), buy), note: 'live' },
    { label: 'Verified supply', value: String(rows.filter(r => r.verified).length), note: 'live' },
  ];

  // Size bars — by bedroom bucket (1 / 2 / 3 / 4+)
  const buckets: { label: string; match: (b: number) => boolean }[] = [
    { label: '1 Bedroom', match: b => b === 1 },
    { label: '2 Bedrooms', match: b => b === 2 },
    { label: '3 Bedrooms', match: b => b === 3 },
    { label: '4+ Bedrooms', match: b => b >= 4 },
  ];
  const sizeRaw = buckets.map(bk => {
    const v = avg(rows.filter(r => bk.match(r.beds)).map(r => r.price));
    return { label: bk.label, raw: v };
  }).filter(s => s.raw > 0);
  const sizeMax = Math.max(1, ...sizeRaw.map(s => s.raw));
  const sizeRows = sizeRaw.map(s => ({
    label: s.label,
    value: fmtMoney(s.raw, buy),
    w: `${Math.round((s.raw / sizeMax) * 100)}%`,
  }));

  // Block bars — parse "Block X" from area text
  const byBlock = BLOCK_LABELS.map(letter => {
    const v = avg(rows.filter(r => new RegExp(`Block ${letter}\\b`, 'i').test(r.area)).map(r => r.price));
    return { letter, raw: Math.round(v) };
  }).filter(b => b.raw > 0);

  // Trend — real captured snapshots over time (ascending by capture date).
  const trend = snaps.map(s => s.avgPrice);
  const trendMonths = snaps.map(s => {
    const d = s.capturedAt instanceof Date ? s.capturedAt : new Date(s.capturedAt as unknown as string);
    return MONTHS[d.getMonth()];
  });

  return {
    stats,
    sizeRows,
    blocks: byBlock.map(b => b.raw),
    blockLabels: byBlock.map(b => b.letter),
    trend,
    trendMonths,
    sampleSize: rows.length,
  };
}

export async function GET() {
  // Match the public listings endpoint: only verified listings are exposed.
  const all = await db.select().from(listings).where(eq(listings.verified, true));
  const rentRows = all.filter(r => !r.sale);
  const buyRows = all.filter(r => r.sale);

  const snaps = await db.select().from(priceSnapshots).orderBy(asc(priceSnapshots.capturedAt));
  const rentSnaps = snaps.filter(s => s.scope === 'rent');
  const buySnaps = snaps.filter(s => s.scope === 'buy');

  return NextResponse.json({
    rent: buildIntent(rentRows, false, rentSnaps),
    buy: buildIntent(buyRows, true, buySnaps),
  });
}
