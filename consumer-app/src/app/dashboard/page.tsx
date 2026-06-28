import Link from 'next/link';
import { db, listings, bookings, threads, saves, users } from '@/db';
import { eq, inArray, count } from 'drizzle-orm';
import { getProviderSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { badge } from '@/lib/provider/badge';
import { PERF_VIEWS, PERF_LEADS } from '@/lib/provider/data';
import { Eye, Building2, Inbox, Calendar, Heart, TrendingUp, MessageSquare, Star, PlusCircle, DollarSign } from 'lucide-react';

const ACCENT = '#1E3A5C';
const AMBER  = '#C9863A';

export const dynamic = 'force-dynamic';

async function getOverviewData(ownerId: number) {
  const myListings = await db
    .select({ id: listings.id, title: listings.title, cover: listings.cover, verified: listings.verified })
    .from(listings)
    .where(eq(listings.ownerId, ownerId));

  const listingIds = myListings.map(l => l.id);
  const activeCount = myListings.filter(l => l.verified).length;

  // The three counts + recent visits are independent — run them concurrently.
  const [[threadCount], [bookingCount], [saveCount], todayVisits] = listingIds.length
    ? await Promise.all([
        db.select({ count: count() }).from(threads).where(inArray(threads.listingId, listingIds)),
        db.select({ count: count() }).from(bookings).where(inArray(bookings.listingId, listingIds)),
        db.select({ count: count() }).from(saves).where(inArray(saves.listingId, listingIds)),
        db.select({
            id: bookings.id, slot: bookings.slot, status: bookings.status,
            userName: users.name, listingTitle: listings.title,
          })
          .from(bookings)
          .innerJoin(listings, eq(bookings.listingId, listings.id))
          .innerJoin(users, eq(bookings.userId, users.id))
          .where(inArray(bookings.listingId, listingIds))
          .orderBy(bookings.createdAt)
          .limit(3),
      ])
    : [[{ count: 0 }], [{ count: 0 }], [{ count: 0 }], []];

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
  if (!session) redirect('/auth?next=/dashboard');

  const data = await getOverviewData(session.ownerId);
  const firstName = session.ownerName.split(' ')[0];

  const KPIs = [
    { Icon: Building2,    label: 'Active listings',  value: String(data.activeCount),  sub: `${data.totalCount} total`,  bg: '#EEF3FB', fg: ACCENT },
    { Icon: Inbox,        label: 'Leads',            value: String(data.threadCount),   sub: 'all time',                  bg: '#E7F1EC', fg: '#2E7D55' },
    { Icon: Calendar,     label: 'Visits booked',    value: String(data.bookingCount),  sub: 'all time',                  bg: '#FEF3E2', fg: AMBER },
    { Icon: Heart,        label: 'Saves',            value: String(data.saveCount),     sub: 'across all listings',       bg: '#EFE9F5', fg: '#6B4E8A' },
    { Icon: MessageSquare, label: 'Messages',        value: String(data.threadCount),   sub: 'active threads',            bg: '#E7F5EE', fg: '#246046' },
    { Icon: Eye,          label: 'Total listings',   value: String(data.totalCount),    sub: 'incl. drafts',              bg: '#F0F4F8', fg: '#4A6580' },
    { Icon: TrendingUp,   label: 'Occupancy rate',   value: data.activeCount ? `${Math.min(100, Math.round((data.bookingCount / Math.max(data.activeCount, 1)) * 34))}%` : '—', sub: 'est. this month', bg: '#E8EDF4', fg: ACCENT },
  ];

  const QUICK_ACTIONS = [
    { label: 'Add listing',    href: '/dashboard/listings/new', Icon: PlusCircle,    color: ACCENT,   bg: '#EEF3FB' },
    { label: 'View leads',     href: '/dashboard/leads',        Icon: Inbox,         color: '#2E7D55', bg: '#E7F1EC' },
    { label: 'Availability',   href: '/dashboard/calendar',     Icon: Calendar,      color: AMBER,    bg: '#FEF3E2' },
    { label: 'Revenue',        href: '/dashboard/revenue',      Icon: DollarSign,    color: '#6B4E8A', bg: '#EFE9F5' },
  ];

  return (
    <div className="animate-bvfade">
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 999, background: '#FEF3E2', border: '1px solid #F5D99A', marginBottom: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: AMBER, display: 'inline-block' }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: AMBER, letterSpacing: 0.4 }}>OWNER MODE</span>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, color: '#15243B', margin: 0 }}>
            Welcome back, {firstName}
          </h2>
          <p style={{ fontSize: 14, color: '#8893A4', margin: '5px 0 0' }}>
            <strong style={{ color: '#2E7D55' }}>{data.threadCount} active leads</strong> · <strong style={{ color: ACCENT }}>{data.bookingCount} visits</strong> booked · <strong style={{ color: '#6B4E8A' }}>{data.saveCount} saves</strong>
          </p>
        </div>
        <Link href="/dashboard/listings/new">
          <button className="bv-press" style={{
            height: 42, padding: '0 18px', borderRadius: 11, border: 'none',
            cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700,
            color: '#fff', background: ACCENT, boxShadow: '0 8px 20px -8px rgba(30,58,92,.5)',
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <PlusCircle size={15} strokeWidth={2.2} /> Add listing
          </button>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: 10, marginBottom: 20 }}>
        {QUICK_ACTIONS.map(({ label, href, Icon, color, bg }) => (
          <Link key={label} href={href} style={{ textDecoration: 'none' }}>
            <div className="bv-lift" style={{
              background: '#fff', border: '1px solid #ECEEF1', borderRadius: 13,
              padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer',
            }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={16} strokeWidth={2} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#15243B' }}>{label}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" style={{ gap: 14, marginBottom: 20 }}>
        {KPIs.slice(0, 4).map(({ Icon, label, value, sub, bg, fg }) => (
          <div key={label} className="bv-lift" style={{
            background: '#fff', border: '1px solid #ECEEF1', borderRadius: 16,
            padding: '16px 17px', boxShadow: '0 1px 2px rgba(20,40,70,.03)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={17} strokeWidth={1.9} />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.8, color: '#15243B', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#15243B', marginTop: 5 }}>{label}</div>
            <div style={{ fontSize: 11.5, color: '#B0BBC8', marginTop: 2 }}>{sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr]" style={{ gap: 20, marginBottom: 20 }}>
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
            <Link href="/dashboard/visits">
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
                    padding: 11, border: '1px solid #ECEEF1', borderRadius: 13,
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

      {/* Listings preview + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr]" style={{ gap: 18, marginBottom: 0 }}>

        {/* Listings */}
        <div style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18, padding: '20px 22px', boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15.5, fontWeight: 800, color: '#15243B', margin: 0 }}>Your listings</h3>
            <Link href="/dashboard/listings">
              <span className="bv-press" style={{ fontSize: 12.5, fontWeight: 700, color: ACCENT, cursor: 'pointer' }}>Manage all →</span>
            </Link>
          </div>
          {data.topListings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: '#EEF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Building2 size={22} color={ACCENT} strokeWidth={1.7} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#15243B', marginBottom: 4 }}>No listings yet</div>
              <div style={{ fontSize: 13, color: '#8893A4', marginBottom: 14 }}>Add your first property to start getting leads</div>
              <Link href="/dashboard/listings/new">
                <button style={{ height: 36, padding: '0 16px', borderRadius: 10, border: 'none', background: ACCENT, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Add first listing
                </button>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.topListings.map(l => {
                const statusLabel = l.verified ? 'Active' : 'Pending';
                const b = badge(statusLabel);
                return (
                  <Link key={l.id} href={`/dashboard/listings/${l.id}`} style={{ textDecoration: 'none' }}>
                    <div className="bv-rowh" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, border: '1px solid #ECEEF1', borderRadius: 13 }}>
                      <div style={{ width: 50, height: 50, borderRadius: 11, flexShrink: 0, backgroundImage: `url('${l.cover}')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#DDD3C5' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#15243B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title}</div>
                        <div style={{ fontSize: 12, color: '#8893A4', marginTop: 3 }}>— views · — leads</div>
                      </div>
                      <span style={{ fontSize: 10.5, fontWeight: 800, color: b.fg, background: b.bg, padding: '3px 9px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                        {statusLabel}
                      </span>
                    </div>
                  </Link>
                );
              })}
              <Link href="/dashboard/listings" style={{ textDecoration: 'none' }}>
                <div style={{ textAlign: 'center', padding: '10px 0', fontSize: 13, fontWeight: 700, color: ACCENT, cursor: 'pointer' }}>
                  View all {data.totalCount} listings →
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Recent Activity Feed */}
        <div style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18, padding: '20px 22px', boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15.5, fontWeight: 800, color: '#15243B', margin: 0 }}>Recent activity</h3>
            <Link href="/dashboard/leads">
              <span className="bv-press" style={{ fontSize: 12.5, fontWeight: 700, color: ACCENT, cursor: 'pointer' }}>All leads →</span>
            </Link>
          </div>

          {data.todayVisits.length === 0 && data.threadCount === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: '#FEF3E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Star size={22} color={AMBER} strokeWidth={1.7} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#15243B', marginBottom: 4 }}>No activity yet</div>
              <div style={{ fontSize: 13, color: '#8893A4' }}>Leads and visits will appear here</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {data.todayVisits.map((v, i) => {
                const statusKey = v.status === 'confirmed' ? 'Confirmed' : v.status === 'pending' ? 'Requested' : String(v.status);
                const b = badge(statusKey);
                return (
                  <div key={v.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '10px 0', borderBottom: i < data.todayVisits.length - 1 ? '1px solid #F5F6F8' : 'none' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: '#FEF3E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <Calendar size={15} color={AMBER} strokeWidth={2} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#15243B' }}>{v.userName}</div>
                      <div style={{ fontSize: 12, color: '#8893A4', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Visit request · {v.listingTitle}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: b.fg, background: b.bg, padding: '2px 7px', borderRadius: 999, whiteSpace: 'nowrap', marginTop: 3 }}>
                      {statusKey}
                    </span>
                  </div>
                );
              })}
              {data.threadCount > 0 && (
                <Link href="/dashboard/leads" style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '10px 0' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: '#E7F1EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <MessageSquare size={15} color="#2E7D55" strokeWidth={2} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#15243B' }}>{data.threadCount} active lead thread{data.threadCount > 1 ? 's' : ''}</div>
                      <div style={{ fontSize: 12, color: ACCENT, marginTop: 2, fontWeight: 600 }}>View all leads →</div>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
