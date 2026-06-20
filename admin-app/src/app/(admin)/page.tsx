import { db, listings, users, bookings } from '@/db';
import { sql, count, eq } from 'drizzle-orm';
import { getAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Topbar from '@/components/Topbar';
import { bdFormat, initials, timeAgo } from '@/lib/utils';
import Link from 'next/link';

async function getDashboardData() {
  const [totalListingsRow] = await db.select({ count: count() }).from(listings);
  const [verifiedListingsRow] = await db.select({ count: count() }).from(listings).where(eq(listings.verified, true));
  const [totalUsersRow] = await db.select({ count: count() }).from(users);
  const [totalBookingsRow] = await db.select({ count: count() }).from(bookings);

  const totalListings = totalListingsRow.count;
  const verifiedListings = verifiedListingsRow.count;
  const pendingMod = totalListings - verifiedListings;
  const totalUsers = totalUsersRow.count;
  const totalBookings = totalBookingsRow.count;

  const recentListings = await db
    .select({ id: listings.id, title: listings.title, area: listings.area, price: listings.price, cover: listings.cover, verified: listings.verified, createdAt: listings.createdAt })
    .from(listings)
    .where(eq(listings.verified, false))
    .orderBy(sql`${listings.createdAt} desc`)
    .limit(4);

  const recentUsers = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt })
    .from(users)
    .orderBy(sql`${users.createdAt} desc`)
    .limit(5);

  return { totalListings, verifiedListings, pendingMod, totalUsers, totalBookings, recentListings, recentUsers };
}

export default async function DashboardPage() {
  const session = await getAdminSession();
  if (!session) redirect('/login');

  const { totalListings, verifiedListings, pendingMod, totalUsers, totalBookings, recentListings, recentUsers } = await getDashboardData();
  const adminInitials = initials(session.name);

  const kpiCards = [
    {
      label: 'Pending moderation',
      value: pendingMod,
      iconBg: '#F7EFDD', iconFg: '#9A6A1F',
      delta: pendingMod > 0 ? `+${pendingMod}` : 'Clear',
      deltaFg: pendingMod > 0 ? '#9A6A1F' : '#2E7D55',
      deltaBg: pendingMod > 0 ? '#F7EFDD' : '#E7F1EC',
      icon: '⚑',
      href: '/moderation',
    },
    {
      label: 'Active listings',
      value: verifiedListings,
      iconBg: '#E6EFF7', iconFg: '#2A5C8A',
      delta: '+6.2%', deltaFg: '#2A5C8A', deltaBg: '#E6EFF7',
      icon: '🏠',
      href: '/listings?verified=true',
    },
    {
      label: 'Total users',
      value: totalUsers,
      iconBg: '#E8EDF4', iconFg: '#1E3A5C',
      delta: '+8.1%', deltaFg: '#1E3A5C', deltaBg: '#E8EDF4',
      icon: '👤',
      href: '/users',
    },
    {
      label: 'Open reports',
      value: 7,
      iconBg: '#F8E8E3', iconFg: '#B4402B',
      delta: '+2', deltaFg: '#B4402B', deltaBg: '#F8E8E3',
      icon: '⚠',
      href: '/reports',
    },
    {
      label: 'Revenue MTD',
      value: '৳1.84L',
      iconBg: '#E7F1EC', iconFg: '#2E7D55',
      delta: '+12.4%', deltaFg: '#2E7D55', deltaBg: '#E7F1EC',
      icon: '৳',
      isString: true,
      href: '/analytics',
    },
  ];

  const funnel = [
    { label: 'Listings browsed', value: bdFormat(totalListings * 38), pct: '100%', w: '100%', bar: 'linear-gradient(90deg,#2C557F,#1E3A5C)' },
    { label: 'Listing detail views', value: bdFormat(totalListings * 22), pct: '58%', w: '58%', bar: 'linear-gradient(90deg,#3A6A8C,#2A4E70)' },
    { label: 'Visit requests', value: bdFormat(totalBookings), pct: '14%', w: '14%', bar: 'linear-gradient(90deg,#C9A24B,#A67C2E)' },
    { label: 'Visits confirmed', value: bdFormat(Math.floor(totalBookings * 0.7)), pct: '10%', w: '10%', bar: 'linear-gradient(90deg,#2E7D55,#1E5C40)' },
    { label: 'Rentals closed', value: bdFormat(Math.floor(totalBookings * 0.3)), pct: '4%', w: '4%', bar: 'linear-gradient(90deg,#2E7D55,#1E5C40)' },
  ];

  const chartDays = [
    { label: 'Mon', listingsH: 40, searchesH: 65 },
    { label: 'Tue', listingsH: 55, searchesH: 80 },
    { label: 'Wed', listingsH: 35, searchesH: 55 },
    { label: 'Thu', listingsH: 70, searchesH: 90 },
    { label: 'Fri', listingsH: 85, searchesH: 75 },
    { label: 'Sat', listingsH: 60, searchesH: 50 },
    { label: 'Sun', listingsH: 45, searchesH: 70 },
  ];

  const activityItems = [
    { bg: '#E7F1EC', fg: '#2E7D55', icon: '✓', text: 'Listing approved: Cozy 1-Bed near the Lake', time: '2 min ago' },
    { bg: '#F8E8E3', fg: '#B4402B', icon: '⚑', text: 'User flagged: reported for suspicious activity', time: '14 min ago' },
    { bg: '#EEF3F8', fg: '#1E3A5C', icon: '👤', text: 'New owner registered: Aftab Homes', time: '1h ago' },
    { bg: '#F7EFDD', fg: '#9A6A1F', icon: '●', text: 'Listing pending review: Luxury penthouse Block A', time: '3h ago' },
    { bg: '#E7F1EC', fg: '#2E7D55', icon: '✓', text: 'Visit confirmed: booking #142', time: '5h ago' },
  ];

  const heatmapBlocks = [
    { name: 'Block A', demand: 142, bg: '#1E3A5C', fg: '#fff' },
    { name: 'Block B', demand: 98, bg: '#2C557F', fg: '#fff' },
    { name: 'Block C', demand: 87, bg: '#3A6A9C', fg: '#fff' },
    { name: 'Block D', demand: 76, bg: '#4D7DB5', fg: '#fff' },
    { name: 'Block E', demand: 54, bg: '#7A9EC0', fg: '#15243B' },
    { name: 'Block F', demand: 43, bg: '#A8C2D9', fg: '#15243B' },
    { name: 'Block G', demand: 31, bg: '#C8D8E9', fg: '#44506A' },
    { name: 'Block H', demand: 18, bg: '#E5ECF5', fg: '#5A6172' },
  ];

  const approvalRate = totalListings > 0 ? Math.round((verifiedListings / totalListings) * 100) : 0;

  return (
    <>
      <Topbar crumb="Overview" title="Dashboard" adminInitials={adminInitials} adminName={session.name} adminEmail={session.email} />
      <main style={{ flex: 1, padding: '28px 34px 56px', minWidth: 0 }}>
        <div style={{ animation: 'bvfade .5s cubic-bezier(.22,1,.36,1) both' }}>

          {/* KPI row — 5 cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 20 }}>
            {kpiCards.map(k => (
              <Link key={k.label} href={k.href} style={{ textDecoration: 'none' }}>
              <div className="bv-lift bv-press" style={{
                background: '#fff', border: '1px solid #ECEEF1', borderRadius: 16,
                padding: '17px 17px 15px', cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(20,40,70,.03)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 11,
                    background: k.iconBg, color: k.iconFg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                  }}>{k.icon}</div>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                    fontSize: 11.5, fontWeight: 800,
                    color: k.deltaFg, background: k.deltaBg,
                    padding: '3px 7px', borderRadius: 999,
                  }}>{k.delta}</span>
                </div>
                <div style={{
                  fontSize: 27, fontWeight: 800, letterSpacing: -0.6,
                  color: '#15243B', marginTop: 13, lineHeight: 1,
                }}>
                  {k.isString ? k.value : (k.value as number).toLocaleString()}
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#8893A4', marginTop: 6 }}>{k.label}</div>
              </div>
              </Link>
            ))}
          </div>

          {/* First main grid — Supply & demand chart + Conversion funnel */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.62fr 1fr', gap: 20, marginBottom: 20 }}>

            {/* Supply & demand bar chart */}
            <div style={{
              background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18,
              padding: '22px 24px 20px', boxShadow: '0 1px 2px rgba(20,40,70,.03)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#15243B', margin: 0 }}>Supply &amp; demand</h3>
                  <p style={{ fontSize: 12.5, color: '#8893A4', margin: '4px 0 0' }}>New listings vs. active searches · last 7 days</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 3 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#44506A' }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: '#1E3A5C', display: 'inline-block' }} />
                    Listings
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#44506A' }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: '#C9A24B', display: 'inline-block' }} />
                    Searches
                  </span>
                </div>
              </div>

              {/* Bar chart */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0, height: 222, position: 'relative' }}>
                {chartDays.map((day) => (
                  <div key={day.label} style={{
                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%',
                  }}>
                    <div style={{
                      flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end',
                      justifyContent: 'center', gap: '6%', paddingBottom: 0,
                    }}>
                      {/* Navy bar — listings */}
                      <div style={{
                        width: '30%', height: `${day.listingsH}%`,
                        background: 'linear-gradient(180deg, #2C557F, #1E3A5C)',
                        borderRadius: '6px 6px 0 0',
                      }} />
                      {/* Amber bar — searches */}
                      <div style={{
                        width: '30%', height: `${day.searchesH}%`,
                        background: 'linear-gradient(180deg, #D9B765, #C9A24B)',
                        borderRadius: '6px 6px 0 0',
                      }} />
                    </div>
                    <div style={{
                      fontSize: 11.5, fontWeight: 700, color: '#9AA6B6',
                      marginTop: 8, textAlign: 'center',
                    }}>{day.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Conversion funnel */}
            <div style={{
              background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18,
              padding: '22px 24px', boxShadow: '0 1px 2px rgba(20,40,70,.03)',
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#15243B', margin: '0 0 2px' }}>
                Conversion funnel
              </h3>
              <p style={{ fontSize: 12.5, color: '#8893A4', margin: '0 0 18px' }}>
                Search → rented, last 30 days
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                {funnel.map(f => (
                  <div key={f.label}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#44506A' }}>{f.label}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: '#15243B' }}>
                        {f.value} <span style={{ color: '#AEB8C6', fontWeight: 700 }}>· {f.pct}</span>
                      </span>
                    </div>
                    <div style={{ height: 9, borderRadius: 999, background: '#F0F3F7', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: f.w, borderRadius: 999, background: f.bar,
                        transformOrigin: 'left',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Second grid — Awaiting moderation + Recent activity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.62fr 1fr', gap: 20 }}>

            {/* Awaiting moderation */}
            <div style={{
              background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18,
              padding: '22px 24px 20px', boxShadow: '0 1px 2px rgba(20,40,70,.03)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#15243B', margin: 0 }}>
                  Awaiting moderation
                </h3>
                <Link href="/moderation" style={{ textDecoration: 'none' }}>
                  <span className="bv-press" style={{
                    fontSize: 13, fontWeight: 700, color: '#1E3A5C', cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}>Review queue →</span>
                </Link>
              </div>
              {recentListings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ fontSize: 28, marginBottom: 8, color: '#2E7D55' }}>✓</div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#8893A4' }}>Queue is all clear</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                  {recentListings.slice(0, 4).map(m => (
                    <Link key={m.id} href={`/moderation/${m.id}`} style={{ textDecoration: 'none' }}>
                      <div className="bv-rowh bv-press" style={{
                        display: 'flex', alignItems: 'center', gap: 13,
                        padding: 9, borderRadius: 13, cursor: 'pointer',
                        border: '1px solid #EEF1F5',
                      }}>
                        <div style={{
                          width: 52, height: 52, borderRadius: 11,
                          backgroundImage: m.cover ? `url('${m.cover}')` : undefined,
                          backgroundSize: 'cover', backgroundPosition: 'center',
                          backgroundColor: '#DDD3C5', flexShrink: 0,
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 13.5, fontWeight: 700, color: '#15243B',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>{m.title}</div>
                          <div style={{ fontSize: 12, color: '#8893A4', marginTop: 2 }}>
                            {m.area} · ৳{bdFormat(m.price)}/mo
                          </div>
                        </div>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#9AA6B6', whiteSpace: 'nowrap' }}>
                          {timeAgo(m.createdAt)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Recent activity — timeline feed */}
            <div style={{
              background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18,
              padding: '22px 24px', boxShadow: '0 1px 2px rgba(20,40,70,.03)',
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#15243B', margin: '0 0 20px' }}>
                Recent activity
              </h3>
              <div style={{ position: 'relative', paddingLeft: 40 }}>
                {/* Vertical line */}
                <div style={{
                  position: 'absolute', left: 13, top: 0, bottom: 0,
                  width: 2, background: '#EEF1F5',
                }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {activityItems.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, position: 'relative' }}>
                      {/* Icon */}
                      <div style={{
                        position: 'absolute', left: -40,
                        width: 28, height: 28, borderRadius: 9,
                        background: item.bg, color: item.fg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700,
                        border: '3px solid #fff',
                        flexShrink: 0, zIndex: 1,
                      }}>{item.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: '#44506A', fontWeight: 600, lineHeight: 1.4 }}>
                          {item.text}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#AEB8C6', marginTop: 3 }}>{item.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Heatmap — full width */}
          <div style={{
            background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18,
            padding: '22px 24px', marginTop: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#15243B', margin: 0 }}>Aftab Nagar demand heatmap</h3>
                <p style={{ fontSize: 12.5, color: '#8893A4', margin: '4px 0 0' }}>Seeker interest by block · darker = higher demand</p>
              </div>
              {/* Color legend */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#9AA6B6' }}>Low</span>
                {['#E5ECF5', '#C8D8E9', '#7A9EC0', '#1E3A5C'].map((c, i) => (
                  <span key={i} style={{
                    width: 18, height: 18, borderRadius: 5, background: c,
                    display: 'inline-block',
                  }} />
                ))}
                <span style={{ fontSize: 12, fontWeight: 700, color: '#9AA6B6' }}>High</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 10 }}>
              {heatmapBlocks.map(block => (
                <div key={block.name} className="bv-lift" style={{
                  background: block.bg, color: block.fg,
                  borderRadius: 13, padding: '15px 13px 13px', cursor: 'default',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 800 }}>{block.name}</div>
                  <div style={{ fontSize: 21, fontWeight: 800, marginTop: 14, lineHeight: 1 }}>{block.demand}</div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, opacity: 0.7, marginTop: 4 }}>searches/day</div>
                </div>
              ))}
            </div>
          </div>

          {/* Platform health + Recent users — 2 col */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>

            {/* Platform health */}
            <div style={{
              background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18,
              padding: '22px 24px', boxShadow: '0 1px 2px rgba(20,40,70,.03)',
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#15243B', margin: '0 0 18px' }}>
                Platform health
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  { label: 'Listing approval rate', value: `${approvalRate}%`, color: '#2E7D55' },
                  { label: 'Active listings', value: verifiedListings.toString(), color: '#1E3A5C' },
                  { label: 'Pending moderation', value: pendingMod.toString(), color: pendingMod > 0 ? '#B4402B' : '#2E7D55' },
                  { label: 'Total visit requests', value: totalBookings.toString(), color: '#9A6A1F' },
                  { label: 'Registered users', value: totalUsers.toString(), color: '#1E3A5C' },
                ].map((stat, i, arr) => (
                  <div key={stat.label} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '13px 0',
                    borderBottom: i < arr.length - 1 ? '1px solid #F2F4F7' : 'none',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#44506A' }}>{stat.label}</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: stat.color }}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent users */}
            <div style={{
              background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18,
              padding: '22px 24px', boxShadow: '0 1px 2px rgba(20,40,70,.03)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#15243B', margin: 0 }}>Recent users</h3>
                <Link href="/users" style={{ textDecoration: 'none' }}>
                  <span className="bv-press" style={{ fontSize: 13, fontWeight: 700, color: '#1E3A5C', cursor: 'pointer' }}>
                    All users →
                  </span>
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recentUsers.map(u => {
                  const ini = initials(u.name);
                  const colors = ['#E8F0F8', '#E7F1EC', '#F7EFDD', '#F8E8E3', '#EEF0F3'];
                  const fgs = ['#1E3A5C', '#2E7D55', '#9A6A1F', '#B4402B', '#5A6172'];
                  const idx = u.id % 5;
                  return (
                    <Link key={u.id} href={`/users/${u.id}`} style={{ textDecoration: 'none' }}>
                      <div className="bv-rowh" style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '8px 6px', borderRadius: 11, cursor: 'pointer',
                      }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: 11,
                          background: colors[idx], color: fgs[idx],
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: 13, flexShrink: 0,
                        }}>{ini}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 13.5, fontWeight: 700, color: '#15243B',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>{u.name}</div>
                          <div style={{ fontSize: 11.5, color: '#9AA6B6', marginTop: 2 }}>{u.email}</div>
                        </div>
                        <span style={{
                          fontSize: 11.5, fontWeight: 800, padding: '3px 10px', borderRadius: 999,
                          background: u.role === 'owner' ? '#EEF3F8' : u.role === 'admin' ? '#F8E8E3' : '#F4F6F9',
                          color: u.role === 'owner' ? '#1E3A5C' : u.role === 'admin' ? '#B4402B' : '#5A6172',
                          textTransform: 'capitalize',
                        }}>{u.role}</span>
                        <span style={{ fontSize: 11.5, color: '#AEB8C6', whiteSpace: 'nowrap' }}>
                          {timeAgo(u.createdAt)}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </main>
    </>
  );
}
