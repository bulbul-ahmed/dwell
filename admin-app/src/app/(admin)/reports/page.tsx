import { getAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Topbar from '@/components/Topbar';
import { initials } from '@/lib/utils';
import Link from 'next/link';
import { db, reports, listings, users } from '@/db';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'resolved', label: 'Resolved' },
];

function relativeTime(d: Date): string {
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await getAdminSession();
  if (!session) redirect('/login');

  const { status } = await searchParams;
  const activeStatus = status ?? '';
  const adminInitials = initials(session.name);

  // Real reports joined with their target listing + reporter.
  const rows = await db
    .select({
      id: reports.id,
      reason: reports.reason,
      details: reports.details,
      status: reports.status,
      resolvedAs: reports.resolvedAs,
      createdAt: reports.createdAt,
      listingId: reports.listingId,
      listingTitle: listings.title,
      listingArea: listings.area,
      reporterName: users.name,
    })
    .from(reports)
    .leftJoin(listings, eq(reports.listingId, listings.id))
    .leftJoin(users, eq(reports.reporterUserId, users.id))
    .orderBy(desc(reports.createdAt));

  const openCount = rows.filter(r => r.status === 'open').length;
  const resolvedCount = rows.filter(r => r.status === 'resolved').length;

  const filtered = activeStatus ? rows.filter(r => r.status === activeStatus) : rows;
  // Open first, newest within each group (rows already newest-first).
  const ordered = [...filtered.filter(r => r.status === 'open'), ...filtered.filter(r => r.status !== 'open')];

  const statCards = [
    { label: 'Open reports', value: String(openCount), icon: '⚑', iconBg: '#FAE8E5', iconFg: '#B4402B' },
    { label: 'Resolved', value: String(resolvedCount), icon: '✓', iconBg: '#E7F1EC', iconFg: '#2E7D55' },
    { label: 'Total reports', value: String(rows.length), icon: '📋', iconBg: '#EEF3F8', iconFg: '#1E3A5C' },
  ];

  return (
    <>
      <Topbar
        crumb="Trust & Safety"
        title="Reports & flags"
        adminInitials={adminInitials}
        adminName={session.name}
        adminEmail={session.email}
      />
      <main style={{ flex: 1, padding: '28px 34px 56px', minWidth: 0 }}>
        <div style={{ animation: 'bvfade .45s cubic-bezier(.22,1,.36,1) both' }}>

          {/* ── Stat cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
            {statCards.map(card => (
              <div key={card.label} className="bv-lift" style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 15, padding: '16px 18px', boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: card.iconBg, color: card.iconFg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{card.icon}</div>
                <div style={{ fontSize: 27, fontWeight: 800, letterSpacing: -0.6, color: '#15243B', marginTop: 12, lineHeight: 1 }}>{card.value}</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#8893A4', marginTop: 5 }}>{card.label}</div>
              </div>
            ))}
          </div>

          {/* ── Status tabs ── */}
          <div style={{ display: 'flex', gap: 4, background: '#EEF1F5', borderRadius: 11, padding: 4, marginBottom: 16, width: 'fit-content' }}>
            {STATUS_TABS.map(tab => {
              const isActive = activeStatus === tab.key;
              const href = tab.key ? `/reports?status=${tab.key}` : '/reports';
              return (
                <Link key={tab.key} href={href} style={{ textDecoration: 'none' }}>
                  <span style={{ display: 'block', padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: isActive ? '#fff' : 'transparent', color: isActive ? '#15243B' : '#8893A4', boxShadow: isActive ? '0 1px 3px rgba(20,40,70,.08)' : 'none', transition: 'all .18s', cursor: 'pointer' }}>{tab.label}</span>
                </Link>
              );
            })}
          </div>

          {/* ── Report list ── */}
          {ordered.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18, padding: '64px 40px', textAlign: 'center', boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#E7F1EC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 18px' }}>✓</div>
              <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700, color: '#15243B' }}>No reports here</h3>
              <p style={{ margin: 0, fontSize: 13.5, color: '#8893A4' }}>Community flags will appear here for review.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {ordered.map(report => {
                const isResolved = report.status === 'resolved';
                return (
                  <div key={report.id} style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 2px rgba(20,40,70,.03)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                        <span style={{ width: 30, height: 30, borderRadius: 9, background: '#EEF3F8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>🏠</span>
                        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: '#1E3A5C', background: '#EEF3F8', padding: '3px 8px', borderRadius: 999 }}>{report.reason}</span>
                        <span style={{ fontSize: 12, color: '#9AA6B6', fontWeight: 600 }}>· reported {relativeTime(new Date(report.createdAt))}</span>
                      </div>
                      {report.details && (
                        <p style={{ margin: '0 0 7px', fontSize: 13.5, fontWeight: 600, color: '#15243B', lineHeight: 1.55 }}>{report.details}</p>
                      )}
                      <p style={{ margin: 0, fontSize: 12.5, color: '#8893A4' }}>
                        on{' '}
                        <strong style={{ color: '#44506A', fontWeight: 700 }}>{report.listingTitle ?? `Listing #${report.listingId}`}</strong>
                        {report.listingArea ? ` · ${report.listingArea}` : ''}
                        {' · '}flagged by{' '}
                        <span style={{ color: '#44506A', fontWeight: 600 }}>{report.reporterName ?? 'Anonymous'}</span>
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                      {isResolved ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: report.resolvedAs === 'removed' ? '#B4402B' : '#2E7D55', background: report.resolvedAs === 'removed' ? '#FAE8E5' : '#E7F1EC', padding: '6px 14px', borderRadius: 999 }}>
                          <span>✓</span>{report.resolvedAs === 'removed' ? 'Listing removed' : 'Dismissed'}
                        </span>
                      ) : (
                        <>
                          <Link href={`/listings/${report.listingId}`} style={{ textDecoration: 'none' }}>
                            <span style={{ display: 'block', padding: '7px 14px', borderRadius: 9, border: '1.5px solid #1E3A5C', background: 'transparent', color: '#1E3A5C', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>Open target</span>
                          </Link>
                          <form action="/api/admin/reports" method="post">
                            <input type="hidden" name="id" value={report.id} />
                            <input type="hidden" name="action" value="dismiss" />
                            <button type="submit" style={{ padding: '7px 14px', borderRadius: 9, border: '1.5px solid #ECEEF1', background: '#F4F6F9', color: '#8893A4', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}>Dismiss</button>
                          </form>
                          <form action="/api/admin/reports" method="post">
                            <input type="hidden" name="id" value={report.id} />
                            <input type="hidden" name="action" value="remove" />
                            <button type="submit" style={{ padding: '7px 14px', borderRadius: 9, border: 'none', background: '#B4402B', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', width: '100%' }}>Remove listing</button>
                          </form>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </main>
    </>
  );
}
