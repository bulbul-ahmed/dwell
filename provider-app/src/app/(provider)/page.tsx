import Link from 'next/link';
import { db, listings, bookings, threads, saves, users } from '@/db';
import { eq, inArray, count } from 'drizzle-orm';
import { getProviderSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { badge } from '@/lib/provider/badge';
import { bdGroup } from '@/lib/provider/formatters';
import { PERF_VIEWS, PERF_LEADS } from '@/lib/provider/data';
import { Eye, Building2, Inbox, Calendar, Heart } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getOverviewData(ownerId: number) {
  const myListings = await db
    .select({ id: listings.id, title: listings.title, cover: listings.cover, verified: listings.verified })
    .from(listings)
    .where(eq(listings.ownerId, ownerId));

  const listingIds = myListings.map(l => l.id);

  const [threadCount] = listingIds.length
    ? await db.select({ count: count() }).from(threads).where(inArray(threads.listingId, listingIds))
    : [{ count: 0 }];

  const [bookingCount] = listingIds.length
    ? await db.select({ count: count() }).from(bookings).where(inArray(bookings.listingId, listingIds))
    : [{ count: 0 }];

  const [saveCount] = listingIds.length
    ? await db.select({ count: count() }).from(saves).where(inArray(saves.listingId, listingIds))
    : [{ count: 0 }];

  const activeCount = myListings.filter(l => l.verified).length;

  const todayVisits = listingIds.length
    ? await db
        .select({
          id: bookings.id, slot: bookings.slot, status: bookings.status,
          userName: users.name, listingTitle: listings.title,
        })
        .from(bookings)
        .innerJoin(listings, eq(bookings.listingId, listings.id))
        .innerJoin(users, eq(bookings.userId, users.id))
        .where(inArray(bookings.listingId, listingIds))
        .orderBy(bookings.createdAt)
        .limit(3)
    : [];

  return {
    activeCount,
    totalCount: myListings.length,
    threadCount: threadCount.count,
    bookingCount: bookingCount.count,
    saveCount: saveCount.count,
    topListings: myListings.slice(0, 3),
    todayVisits,
  };
}

const maxV = 180, maxL = 14;

export default async function OverviewPage() {
  const session = await getProviderSession();
  if (!session) redirect('/login');

  const data = await getOverviewData(session.ownerId);
  const firstName = session.ownerName.split(' ')[0];

  const KPIs = [
    { Icon: Building2, label: 'Active listings', value: String(data.activeCount),      delta: '',       dFg: '#2E7D55', bg: '#E8EDF4', fg: '#1E3A5C' },
    { Icon: Eye,       label: 'Total listings',  value: String(data.totalCount),        delta: '',       dFg: '#2E7D55', bg: '#E6EFF7', fg: '#2A5C8A' },
    { Icon: Inbox,     label: 'Leads (threads)', value: String(data.threadCount),       delta: '',       dFg: '#2E7D55', bg: '#E7F1EC', fg: '#2E7D55' },
    { Icon: Calendar,  label: 'Visits booked',   value: String(data.bookingCount),      delta: '',       dFg: '#2E7D55', bg: '#F6EFD9', fg: '#9A7B1F' },
    { Icon: Heart,     label: 'Saves',            value: String(data.saveCount),         delta: '',       dFg: '#2E7D55', bg: '#EFE9F5', fg: '#6B4E8A' },
  ];

  return (
    <div className="animate-bvfade">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 25, fontWeight: 800, letterSpacing: -0.5, color: '#15243B', margin: 0 }}>
            Good morning, {firstName} 👋
          </h2>
          <p style={{ fontSize: 14, color: '#8893A4', margin: '6px 0 0' }}>
            You have <strong style={{ color: '#2E7D55' }}>{data.threadCount} leads</strong> and <strong style={{ color: '#1E3A5C' }}>{data.bookingCount} visits</strong> booked.
          </p>
        </div>
        <Link href="/listings">
          <button className="bv-press" style={{
            height: 44, padding: '0 20px', borderRadius: 12, border: 'none',
            cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
            color: '#fff', background: '#1E3A5C', boxShadow: '0 10px 22px -10px rgba(30,58,92,.55)',
          }}>
            View listings
          </button>
        </Link>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 20 }}>
        {KPIs.map(({ Icon, label, value, delta, dFg, bg, fg }) => (
          <div key={label} className="bv-lift" style={{
            background: '#fff', border: '1px solid #ECEEF1', borderRadius: 16,
            padding: 17, boxShadow: '0 1px 2px rgba(20,40,70,.03)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} strokeWidth={1.9} />
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: dFg }}>{delta}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.6, color: '#15243B', marginTop: 13, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#8893A4', marginTop: 6 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Performance chart — static 14-day visual */}
        <div style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18, padding: '22px 24px', boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#15243B', margin: 0 }}>Portfolio performance</h3>
              <p style={{ fontSize: 12.5, color: '#8893A4', margin: '4px 0 0' }}>Views &amp; leads across your listings · 14 days</p>
            </div>
            <div style={{ display: 'flex', gap: 14 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#5A6172' }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: '#1E3A5C', display: 'inline-block' }} />Views
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#5A6172' }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: '#2E7D55', display: 'inline-block' }} />Leads
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 9, height: 200, paddingTop: 22 }}>
            {PERF_VIEWS.map((v, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: '100%', width: '100%', justifyContent: 'center' }}>
                  <div className="animate-bvrise" style={{
                    width: '42%', height: `${Math.round(v / maxV * 100)}%`, minHeight: 3,
                    borderRadius: '4px 4px 0 0', background: 'linear-gradient(180deg, #2C557F, #1E3A5C)',
                    transformOrigin: 'bottom',
                  }} />
                  <div className="animate-bvrise" style={{
                    width: '42%', height: `${Math.round(PERF_LEADS[i] / maxL * 100)}%`, minHeight: 3,
                    borderRadius: '4px 4px 0 0', background: 'linear-gradient(180deg, #34A06C, #2E7D55)',
                    transformOrigin: 'bottom', animationDelay: '.06s',
                  }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#BAC4D0' }}>
                  {i % 2 === 0 ? String(i + 1) : ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Today's visits */}
        <div style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18, padding: '22px 24px', boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#15243B', margin: 0 }}>Recent visits</h3>
            <Link href="/visits">
              <span className="bv-press" style={{ fontSize: 13, fontWeight: 700, color: '#1E3A5C', cursor: 'pointer' }}>All →</span>
            </Link>
          </div>
          {data.todayVisits.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#8893A4', fontSize: 13 }}>No visits yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {data.todayVisits.map(v => {
                const statusKey = v.status === 'confirmed' ? 'Confirmed' : v.status === 'pending' ? 'Requested' : v.status;
                const b = badge(statusKey);
                const tFg = v.status === 'pending' ? '#9A6A1F' : '#1E3A5C';
                const tBg = v.status === 'pending' ? '#F7EFDD' : '#E8EDF4';
                const slotParts = v.slot?.split('·') ?? [];
                const timePart = slotParts[1]?.trim().split('–')[0]?.trim() ?? '';
                const hour = timePart.replace(/\s*(AM|PM).*/, '');
                const ampm = timePart.includes('PM') ? 'PM' : 'AM';
                return (
                  <div key={v.id} className="bv-rowh" style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: 11, border: '1px solid #EEF1F5', borderRadius: 13,
                  }}>
                    <div style={{
                      width: 46, height: 46, borderRadius: 12, background: tBg, color: tFg,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.5 }}>{ampm}</span>
                      <span style={{ fontSize: 14, fontWeight: 800, lineHeight: 1 }}>{hour}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#15243B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.userName}</div>
                      <div style={{ fontSize: 12, color: '#8893A4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.listingTitle}</div>
                    </div>
                    <span style={{ fontSize: 10.5, fontWeight: 800, color: b.fg, background: b.bg, padding: '4px 9px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                      {statusKey}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Listings preview */}
      <div style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18, padding: '22px 24px', boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#15243B', margin: 0 }}>Your listings</h3>
          <Link href="/listings">
            <span className="bv-press" style={{ fontSize: 13, fontWeight: 700, color: '#1E3A5C', cursor: 'pointer' }}>Manage all →</span>
          </Link>
        </div>
        {data.topListings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#8893A4', fontSize: 13 }}>No listings yet</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {data.topListings.map(l => {
              const statusLabel = l.verified ? 'Active' : 'Pending';
              const b = badge(statusLabel);
              return (
                <Link key={l.id} href={`/listings/${l.id}`} style={{ textDecoration: 'none' }}>
                  <div className="bv-lift" style={{ border: '1px solid #EEF1F5', borderRadius: 15, overflow: 'hidden', cursor: 'pointer' }}>
                    <div style={{ height: 120, backgroundImage: `url('${l.cover}')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#DDD3C5', position: 'relative' }}>
                      <span style={{ position: 'absolute', top: 9, left: 9, fontSize: 10.5, fontWeight: 800, color: b.fg, background: b.bg, padding: '3px 9px', borderRadius: 999 }}>
                        {statusLabel}
                      </span>
                    </div>
                    <div style={{ padding: 13 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#15243B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title}</div>
                      <div style={{ fontSize: 12, color: '#8893A4', marginTop: 6 }}>
                        <strong style={{ color: '#15243B' }}>—</strong> views · <strong style={{ color: '#15243B' }}>—</strong> leads
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
