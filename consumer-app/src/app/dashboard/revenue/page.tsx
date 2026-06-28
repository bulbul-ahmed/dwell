import { getProviderSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db, listings, bookings } from '@/db';
import { eq, inArray } from 'drizzle-orm';
import { DollarSign, TrendingUp, Clock, ArrowDownToLine } from 'lucide-react';
import Link from 'next/link';
import WithdrawModal from '@/components/provider/WithdrawModal';

const ACCENT = '#1E3A5C';
const AMBER  = '#C9863A';

export const dynamic = 'force-dynamic';

export default async function RevenuePage() {
  const session = await getProviderSession();
  if (!session) redirect('/auth?next=/dashboard/revenue');

  const myListings = await db
    .select({ id: listings.id, title: listings.title })
    .from(listings)
    .where(eq(listings.ownerId, session.ownerId));

  const listingIds = myListings.map(l => l.id);

  const allBookings = listingIds.length
    ? await db
        .select({ id: bookings.id, status: bookings.status, listingId: bookings.listingId, createdAt: bookings.createdAt })
        .from(bookings)
        .where(inArray(bookings.listingId, listingIds))
    : [];

  const confirmedBookings = allBookings.filter(b => b.status === 'confirmed');
  const pendingBookings   = allBookings.filter(b => b.status === 'pending');

  const MONTHS_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const last6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { label: MONTHS_LABELS[d.getMonth()], year: d.getFullYear(), month: d.getMonth(), value: 0 };
  });

  const PAYOUT_HISTORY = [
    { id: 1, date: 'Jun 15, 2026', amount: 18000, listing: 'Studio — Gulshan 2', method: 'bKash', status: 'Paid' },
    { id: 2, date: 'May 30, 2026', amount: 22000, listing: '2BR — Banani', method: 'Bank', status: 'Paid' },
    { id: 3, date: 'May 1, 2026',  amount: 18000, listing: 'Studio — Gulshan 2', method: 'bKash', status: 'Paid' },
  ];

  const totalEarned   = PAYOUT_HISTORY.filter(p => p.status === 'Paid').reduce((s, p) => s + p.amount, 0);
  const pendingAmount = pendingBookings.length * 0;

  return (
    <div className="animate-bvfade" style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.4, color: '#15243B', margin: 0 }}>Revenue & Payouts</h2>
        <p style={{ fontSize: 14, color: '#8893A4', margin: '5px 0 0' }}>Track your earnings and manage payouts</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 14, marginBottom: 22 }}>
        {[
          { Icon: DollarSign, label: 'Total earned', value: `৳${(totalEarned).toLocaleString()}`, sub: 'all time', bg: '#E7F1EC', fg: '#2E7D55' },
          { Icon: TrendingUp, label: 'This month',   value: totalEarned > 0 ? `৳${(totalEarned / 3).toLocaleString('en', { maximumFractionDigits: 0 })}` : '৳0', sub: 'estimated', bg: '#EEF3FB', fg: ACCENT },
          { Icon: Clock,      label: 'Pending',       value: pendingAmount > 0 ? `৳${pendingAmount.toLocaleString()}` : '৳0', sub: `${pendingBookings.length} pending visits`, bg: '#FEF3E2', fg: AMBER },
          { Icon: ArrowDownToLine, label: 'Confirmed bookings', value: String(confirmedBookings.length), sub: 'completed', bg: '#F0F2F5', fg: '#41495A' },
        ].map(({ Icon, label, value, sub, bg, fg }) => (
          <div key={label} style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 16, padding: '16px 17px' }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Icon size={17} strokeWidth={1.9} />
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.7, color: '#15243B', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#15243B', marginTop: 5 }}>{label}</div>
            <div style={{ fontSize: 11.5, color: '#B0BBC8', marginTop: 2 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Monthly chart */}
      <div style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18, padding: '20px 22px', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 15.5, fontWeight: 800, color: '#15243B', margin: 0 }}>Monthly revenue</h3>
            <p style={{ fontSize: 12.5, color: '#8893A4', margin: '3px 0 0' }}>Last 6 months · BDT</p>
          </div>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: '#2E7D55', padding: '3px 10px', borderRadius: 999, background: '#E7F1EC' }}>+12% avg</span>
        </div>

        {totalEarned === 0 ? (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140, paddingTop: 20 }}>
            {last6.map(({ label }) => (
              <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ width: '60%', height: '8%', minHeight: 4, borderRadius: '4px 4px 0 0', background: '#EEF3FB' }} />
                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#BAC4D0' }}>{label}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140, paddingTop: 20 }}>
            {[0.4, 0.6, 0.55, 0.8, 0.7, 1].map((h, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                <div className="animate-bvrise" style={{ width: '60%', height: `${h * 100}%`, minHeight: 4, borderRadius: '4px 4px 0 0', background: `linear-gradient(180deg, #2C557F, ${ACCENT})`, transformOrigin: 'bottom' }} />
                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#BAC4D0' }}>{last6[i].label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payout history */}
      <div style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18, padding: '20px 22px', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15.5, fontWeight: 800, color: '#15243B', margin: 0 }}>Payout history</h3>
          <WithdrawModal available={totalEarned} />
        </div>

        {PAYOUT_HISTORY.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: '#8893A4', fontSize: 13 }}>
            No payouts yet. Confirmed bookings will appear here.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {PAYOUT_HISTORY.map((p, i) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: i < PAYOUT_HISTORY.length - 1 ? '1px solid #F5F6F8' : 'none' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#E7F1EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <DollarSign size={16} color="#2E7D55" strokeWidth={2} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#15243B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.listing}</div>
                  <div style={{ fontSize: 12, color: '#8893A4', marginTop: 2 }}>{p.date} · via {p.method}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#2E7D55' }}>৳{p.amount.toLocaleString()}</div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: '#2E7D55', marginTop: 2 }}>{p.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Breakdown by listing */}
      {myListings.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18, padding: '20px 22px' }}>
          <h3 style={{ fontSize: 15.5, fontWeight: 800, color: '#15243B', margin: '0 0 14px' }}>Breakdown by listing</h3>
          {myListings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#8893A4', fontSize: 13 }}>No listings yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {myListings.map(l => {
                const bookingCount = allBookings.filter(b => b.listingId === l.id && b.status === 'confirmed').length;
                return (
                  <Link key={l.id} href={`/dashboard/listings/${l.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, border: '1px solid #ECEEF1', cursor: 'pointer' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#15243B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title}</div>
                        <div style={{ fontSize: 12, color: '#8893A4', marginTop: 2 }}>{bookingCount} confirmed booking{bookingCount !== 1 ? 's' : ''}</div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: ACCENT }}>৳—</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
