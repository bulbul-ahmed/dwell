import { db, listings, threads, bookings, saves } from '@/db';
import { eq, inArray, count } from 'drizzle-orm';
import { getProviderSession } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { bdGroup } from '@/lib/provider/formatters';
import { badge } from '@/lib/provider/badge';
import Link from 'next/link';
import ListingDetailActions from '@/components/provider/ListingDetailActions';

export const dynamic = 'force-dynamic';

const COMPARE = [
  { label: 'Views per day', delta: '—',    fg: '#9A6A1F', note: 'No view tracking yet' },
  { label: 'Lead rate',     delta: '—',    fg: '#9A6A1F', note: 'Based on threads vs saves' },
  { label: 'Days listed',   delta: '—',    fg: '#9A6A1F', note: 'Area median is 11 days'    },
];

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getProviderSession();
  if (!session) redirect('/login');

  const [listing] = await db
    .select()
    .from(listings)
    .where(eq(listings.id, parseInt(id)))
    .limit(1);

  if (!listing || listing.ownerId !== session.ownerId) notFound();

  const listingIdArr = [listing.id];

  const [threadCount] = await db.select({ count: count() }).from(threads).where(inArray(threads.listingId, listingIdArr));
  const [bookingCount] = await db.select({ count: count() }).from(bookings).where(inArray(bookings.listingId, listingIdArr));
  const [saveCount] = await db.select({ count: count() }).from(saves).where(inArray(saves.listingId, listingIdArr));

  const tc = threadCount.count;
  const bc = bookingCount.count;
  const sc = saveCount.count;

  const statusLabel = listing.verified ? 'Active' : 'Pending';
  const b = badge(statusLabel);

  const impressionsEst = Math.max(sc * 6, tc * 4, bc * 8, 1);
  const funnel = [
    { label: 'Impressions (est.)', value: bdGroup(impressionsEst), pct: 100,                                        bar: 'linear-gradient(90deg,#2C557F,#1E3A5C)' },
    { label: 'Saves',              value: String(sc),              pct: Math.round(sc / impressionsEst * 100),      bar: 'linear-gradient(90deg,#3C6E9E,#2C557F)' },
    { label: 'Chats started',      value: String(tc),              pct: Math.round(tc / impressionsEst * 100),      bar: 'linear-gradient(90deg,#C9A24B,#A67C2E)' },
    { label: 'Visits booked',      value: String(bc),              pct: Math.round(bc / impressionsEst * 100),      bar: 'linear-gradient(90deg,#2E7D55,#246046)' },
  ];

  const priceLabel = listing.price > 100000
    ? `৳${bdGroup(listing.price)}`
    : `৳${bdGroup(listing.price)}/mo`;

  return (
    <div className="animate-bvfade">
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 22, alignItems: 'start' }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Hero card */}
          <div style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18, overflow: 'hidden', boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
            <div style={{ height: 230, backgroundImage: `url('${listing.cover}')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#DDD3C5' }} />
            <div style={{ padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: '#15243B', margin: '0 0 4px' }}>{listing.title}</h2>
                  <div style={{ fontSize: 13.5, color: '#8893A4' }}>{listing.area} · {priceLabel}</div>
                </div>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: b.fg, background: b.bg, padding: '5px 12px', borderRadius: 999, flexShrink: 0 }}>
                  {statusLabel}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 24, marginTop: 16, paddingTop: 16, borderTop: '1px solid #F2F4F7' }}>
                <div><div style={{ fontSize: 19, fontWeight: 800, color: '#15243B' }}>{sc}</div><div style={{ fontSize: 12, color: '#9AA6B6' }}>Saves</div></div>
                <div><div style={{ fontSize: 19, fontWeight: 800, color: '#15243B' }}>{tc}</div><div style={{ fontSize: 12, color: '#9AA6B6' }}>Leads</div></div>
                <div><div style={{ fontSize: 19, fontWeight: 800, color: '#15243B' }}>{bc}</div><div style={{ fontSize: 12, color: '#9AA6B6' }}>Visits</div></div>
                <div><div style={{ fontSize: 19, fontWeight: 800, color: '#15243B' }}>{listing.beds}b/{listing.baths}ba</div><div style={{ fontSize: 12, color: '#9AA6B6' }}>{listing.size} sqft</div></div>
              </div>
            </div>
          </div>

          {/* Funnel */}
          <div style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18, padding: 24, boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#15243B', margin: '0 0 18px' }}>Funnel · all time</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {funnel.map(f => (
                <div key={f.label}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#44506A' }}>{f.label}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: '#15243B' }}>{f.value}</span>
                  </div>
                  <div style={{ height: 9, borderRadius: 999, background: '#F0F3F7', overflow: 'hidden' }}>
                    <div
                      className="animate-bvriseX"
                      style={{ height: '100%', width: `${Math.max(f.pct, f.pct > 0 ? 3 : 0)}%`, borderRadius: 999, background: f.bar, transformOrigin: 'left' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sticky */}
        <div style={{ position: 'sticky', top: 86, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <ListingDetailActions listingId={listing.id} statusLabel={statusLabel} />

          {/* vs. area average */}
          <div style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18, padding: 22, boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: '#9AA6B6', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 14px' }}>vs. area average</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {COMPARE.map(c => (
                <div key={c.label}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: '#44506A' }}>{c.label}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: c.fg }}>{c.delta}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#9AA6B6' }}>{c.note}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
