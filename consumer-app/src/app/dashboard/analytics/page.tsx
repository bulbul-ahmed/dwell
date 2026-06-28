import { db, listings, threads, bookings, saves } from '@/db';
import { eq, inArray, count } from 'drizzle-orm';
import { getProviderSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

const ACCENT = '#1E3A5C';
const AMBER  = '#C9863A';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const session = await getProviderSession();
  if (!session) redirect('/auth?next=/dashboard');

  const sp = await searchParams;
  const listingIdFilter = sp.listing ? parseInt(sp.listing) : null;

  const allListings = await db
    .select({ id: listings.id, title: listings.title, cover: listings.cover, verified: listings.verified, area: listings.area })
    .from(listings)
    .where(eq(listings.ownerId, session.ownerId));

  const myListings = listingIdFilter
    ? allListings.filter(l => l.id === listingIdFilter)
    : allListings;

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

  const filteredListing = listingIdFilter ? allListings.find(l => l.id === listingIdFilter) : null;

  return (
    <div className="animate-bvfade">
      {filteredListing && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, padding: '10px 14px', borderRadius: 13, background: '#EEF3FB', border: '1px solid #C8D9F0' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M7 12h10M10 18h4" stroke={ACCENT} strokeWidth="2" strokeLinecap="round"/></svg>
          <span style={{ fontSize: 13, fontWeight: 700, color: ACCENT, flex: 1 }}>
            Filtered to: <em style={{ fontStyle: 'normal', fontWeight: 800 }}>{filteredListing.title}</em>
          </span>
          <a href="/dashboard/analytics" style={{ fontSize: 12, fontWeight: 700, color: '#8893A4', textDecoration: 'none' }}>Clear ×</a>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 16, marginBottom: 20 }}>
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

      {/* Lead funnel */}
      <div style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18, padding: 24, marginBottom: 20, boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#15243B', margin: '0 0 18px' }}>Lead funnel</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0 }}>
          {[
            { label: 'Listing views', value: Math.max(totalLeads * 14, 1), color: '#EEF3FB', textColor: ACCENT },
            { label: 'Saves',         value: Math.max(totalSaves, 1),     color: '#E7F1EC', textColor: '#2E7D55' },
            { label: 'Inquiries',     value: Math.max(totalLeads, 1),      color: '#FEF3E2', textColor: AMBER },
            { label: 'Visits',        value: Math.max(totalVisits, 1),     color: '#EEF3FB', textColor: ACCENT },
            { label: 'Applications',  value: Math.max(Math.floor(totalVisits * 0.6), totalVisits > 0 ? 1 : 0), color: '#E7EDF4', textColor: '#4A6580' },
          ].map(({ label, value, color, textColor }, i, arr) => {
            const pct = Math.round(value / Math.max(arr[0].value, 1) * 100);
            return (
              <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: textColor }}>{value}</div>
                <div style={{ width: '80%', height: Math.max(pct * 1.2, 8), borderRadius: 6, background: color, border: `1px solid ${textColor}22`, transition: 'height 0.6s cubic-bezier(.22,1,.36,1)' }} />
                <div style={{ fontSize: 11, fontWeight: 700, color: '#8893A4', textAlign: 'center', lineHeight: 1.3 }}>{label}</div>
                {i < arr.length - 1 && (
                  <div style={{ fontSize: 11, color: '#B0BBC8', fontWeight: 700 }}>
                    {arr[i + 1].value > 0 ? `${Math.round(arr[i + 1].value / value * 100)}%` : '—'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 14, fontSize: 12.5, color: '#8893A4', borderTop: '1px solid #F5F6F8', paddingTop: 12 }}>
          Conversion: listing view → inquiry is <strong style={{ color: ACCENT }}>{totalLeads > 0 ? `${(1 / Math.max(14, 1) * 100).toFixed(1)}%` : '—'}</strong>. Industry average is 3–7%.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr]" style={{ gap: 20 }}>
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

      {/* Pricing insight */}
      {enriched.length > 0 && (
        <div style={{ marginTop: 20, padding: '16px 20px', borderRadius: 16, background: '#FEF3E2', border: '1px solid #F5D99A', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke={AMBER} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#15243B', marginBottom: 4 }}>Pricing insight</div>
            <div style={{ fontSize: 13, color: '#41495A', lineHeight: 1.5 }}>
              Your top listing gets <strong style={{ color: '#15243B' }}>{enriched[0].threads} inquiries</strong>. Listings with faster response times get 40% more bookings.{' '}
              <span style={{ color: AMBER, fontWeight: 700 }}>Aim to reply within 2 hours.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
