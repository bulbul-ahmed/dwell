import { db, listings, threads, bookings, saves } from '@/db';
import { eq, inArray, count } from 'drizzle-orm';
import { getProviderSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { bdGroup } from '@/lib/provider/formatters';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const session = await getProviderSession();
  if (!session) redirect('/login');

  const myListings = await db
    .select({ id: listings.id, title: listings.title, cover: listings.cover, verified: listings.verified, area: listings.area })
    .from(listings)
    .where(eq(listings.ownerId, session.ownerId));

  const listingIds = myListings.map(l => l.id);

  const threadCounts = listingIds.length
    ? await db.select({ listingId: threads.listingId, cnt: count() }).from(threads).where(inArray(threads.listingId, listingIds)).groupBy(threads.listingId)
    : [];
  const bookingCounts = listingIds.length
    ? await db.select({ listingId: bookings.listingId, cnt: count() }).from(bookings).where(inArray(bookings.listingId, listingIds)).groupBy(bookings.listingId)
    : [];
  const saveCounts = listingIds.length
    ? await db.select({ listingId: saves.listingId, cnt: count() }).from(saves).where(inArray(saves.listingId, listingIds)).groupBy(saves.listingId)
    : [];

  const tMap = Object.fromEntries(threadCounts.map(r => [r.listingId, r.cnt]));
  const bMap = Object.fromEntries(bookingCounts.map(r => [r.listingId, r.cnt]));
  const sMap = Object.fromEntries(saveCounts.map(r => [r.listingId, r.cnt]));

  const enriched = myListings.map(l => ({
    ...l,
    threads: tMap[l.id] ?? 0,
    bookings: bMap[l.id] ?? 0,
    saves: sMap[l.id] ?? 0,
    engagement: (tMap[l.id] ?? 0) + (bMap[l.id] ?? 0) + (sMap[l.id] ?? 0),
  })).sort((a, b) => b.engagement - a.engagement);

  const totalLeads = threadCounts.reduce((s, r) => s + r.cnt, 0);
  const totalVisits = bookingCounts.reduce((s, r) => s + r.cnt, 0);
  const totalSaves = saveCounts.reduce((s, r) => s + r.cnt, 0);
  const activeCount = myListings.filter(l => l.verified).length;
  const maxEngagement = enriched[0]?.engagement ?? 1;

  const KPIS = [
    { label: 'Active listings', value: String(activeCount),       delta: '' },
    { label: 'Total leads',     value: String(totalLeads),        delta: '' },
    { label: 'Total visits',    value: String(totalVisits),       delta: '' },
    { label: 'Total saves',     value: String(totalSaves),        delta: '' },
  ];

  const SRC_LEGEND = [
    { label: 'Direct search',    value: `${Math.round(totalLeads * 0.53)}`, color: '#1E3A5C' },
    { label: 'Saved & returned', value: `${Math.round(totalLeads * 0.30)}`, color: '#C9A24B' },
    { label: 'Referral',         value: `${Math.round(totalLeads * 0.17)}`, color: '#2E7D55' },
  ];

  return (
    <div className="animate-bvfade">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        {KPIS.map(k => (
          <div key={k.label} className="bv-lift" style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 16, padding: 18, boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#8893A4' }}>{k.label}</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 9 }}>
              <div style={{ fontSize: 27, fontWeight: 800, color: '#15243B', letterSpacing: -0.6, lineHeight: 1 }}>{k.value}</div>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: '#2E7D55' }}>{k.delta}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
        {/* Listings by engagement */}
        <div style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18, padding: 24, boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#15243B', margin: '0 0 16px' }}>Listings by engagement</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {enriched.map(l => (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                <div style={{ width: 40, height: 34, borderRadius: 9, backgroundImage: `url('${l.cover}')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#DDD3C5', flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#44506A', flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title}</span>
                <div style={{ width: 130, height: 9, borderRadius: 999, background: '#F0F3F7', overflow: 'hidden', flexShrink: 0 }}>
                  <div
                    className="animate-bvriseX"
                    style={{ height: '100%', width: `${Math.max(l.engagement / Math.max(maxEngagement, 1) * 100, l.engagement > 0 ? 4 : 0)}%`, borderRadius: 999, background: 'linear-gradient(90deg,#2C557F,#1E3A5C)', transformOrigin: 'left' }}
                  />
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: '#15243B', width: 54, textAlign: 'right', flexShrink: 0 }}>{l.engagement}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lead sources */}
        <div style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18, padding: 24, boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#15243B', margin: '0 0 16px' }}>Where leads come from</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <div style={{
              width: 120, height: 120, borderRadius: '50%',
              background: 'conic-gradient(#1E3A5C 0 53%, #C9A24B 53% 83%, #2E7D55 83% 100%)',
              flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ width: 76, height: 76, borderRadius: '50%', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 17, fontWeight: 800, color: '#15243B' }}>{totalLeads}</span>
                <span style={{ fontSize: 10, color: '#9AA6B6', fontWeight: 700 }}>leads</span>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SRC_LEGEND.map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ width: 11, height: 11, borderRadius: 4, background: l.color, display: 'inline-block' }} />
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: '#44506A', flex: 1 }}>{l.label}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: '#15243B' }}>{l.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
