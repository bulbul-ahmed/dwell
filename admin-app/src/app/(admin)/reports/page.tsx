import { getAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Topbar from '@/components/Topbar';
import SearchInput from '@/components/SearchInput';
import { initials } from '@/lib/utils';
import Link from 'next/link';
import { Suspense } from 'react';

// ─── Mock data ────────────────────────────────────────────────────────────────

type ReportType = 'listing' | 'user' | 'spam';
type Severity = 'High' | 'Medium' | 'Low';
type ReportStatus = 'open' | 'resolved';

interface MockReport {
  id: number;
  type: ReportType;
  severity: Severity;
  status: ReportStatus;
  reason: string;
  targetName: string;
  targetId: number;
  flaggedBy: string;
  reportedAgo: string;
  resolvedAs?: 'dismissed' | 'removed';
}

const MOCK_REPORTS: MockReport[] = [
  {
    id: 1,
    type: 'listing',
    severity: 'High',
    status: 'open',
    reason: 'Fraudulent listing — price does not match what was quoted over the phone. Landlord is asking for advance without any documentation.',
    targetName: '3 Bed Apartment in Gulshan 2',
    targetId: 42,
    flaggedBy: 'Rashed Karim',
    reportedAgo: '12m ago',
  },
  {
    id: 2,
    type: 'listing',
    severity: 'Medium',
    status: 'open',
    reason: 'Photos appear to be stolen from another property listing on a different platform. Cover image is a stock photo.',
    targetName: 'Furnished Studio in Banani',
    targetId: 17,
    flaggedBy: 'Nadia Islam',
    reportedAgo: '1h ago',
  },
  {
    id: 3,
    type: 'listing',
    severity: 'Low',
    status: 'open',
    reason: 'Area listed as "Dhanmondi" but location pin shows Jigatola. Misleading location information.',
    targetName: 'Family Flat in Dhanmondi',
    targetId: 88,
    flaggedBy: 'Tanvir Ahmed',
    reportedAgo: '3h ago',
  },
  {
    id: 4,
    type: 'user',
    severity: 'High',
    status: 'open',
    reason: 'This owner has collected advance payments from at least 3 renters for the same apartment and gone unresponsive. Potential scammer.',
    targetName: 'Kamal Hossain (owner)',
    targetId: 204,
    flaggedBy: 'Mehnaz Begum',
    reportedAgo: '2h ago',
  },
  {
    id: 5,
    type: 'user',
    severity: 'Medium',
    status: 'open',
    reason: 'User is sending unsolicited messages to multiple listing owners asking for money transfers outside the platform.',
    targetName: 'Jakir Khan (renter)',
    targetId: 317,
    flaggedBy: 'Sharmin Akter',
    reportedAgo: '5h ago',
  },
  {
    id: 6,
    type: 'spam',
    severity: 'Medium',
    status: 'open',
    reason: 'Listing is a duplicate — same flat posted 4 times with different prices to appear at the top of search results.',
    targetName: 'Luxury Flat Bashundhara R/A',
    targetId: 56,
    flaggedBy: 'Imran Hossain',
    reportedAgo: '6h ago',
  },
  {
    id: 7,
    type: 'listing',
    severity: 'High',
    status: 'resolved',
    resolvedAs: 'removed',
    reason: 'Listing contained explicit and offensive content in the description. Multiple users flagged this.',
    targetName: 'Room Available Mirpur 10',
    targetId: 91,
    flaggedBy: 'Fahmida Chowdhury',
    reportedAgo: '2d ago',
  },
  {
    id: 8,
    type: 'user',
    severity: 'Low',
    status: 'resolved',
    resolvedAs: 'dismissed',
    reason: 'Reviewer claimed listing was fake but after investigation the listing was found to be legitimate.',
    targetName: 'Saiful Islam (renter)',
    targetId: 498,
    flaggedBy: 'Anonymous',
    reportedAgo: '3d ago',
  },
];

// ─── Stat card data ───────────────────────────────────────────────────────────

const STAT_CARDS = [
  {
    label: 'Open reports',
    value: '6',
    icon: '⚑',
    iconBg: '#FAE8E5',
    iconFg: '#B4402B',
    dotColor: '#B4402B',
    delta: '+2 today',
    deltaFg: '#B4402B',
    deltaBg: '#FAE8E5',
  },
  {
    label: 'Resolved today',
    value: '4',
    icon: '✓',
    iconBg: '#E7F1EC',
    iconFg: '#2E7D55',
    dotColor: '#2E7D55',
    delta: 'On track',
    deltaFg: '#2E7D55',
    deltaBg: '#E7F1EC',
  },
  {
    label: 'Avg resolution',
    value: '3.2h',
    icon: '⏱',
    iconBg: '#F7EFDD',
    iconFg: '#9A6A1F',
    dotColor: '#C9A24B',
    delta: '↓ 18 min',
    deltaFg: '#2E7D55',
    deltaBg: '#E7F1EC',
  },
  {
    label: 'Total this month',
    value: '38',
    icon: '📋',
    iconBg: '#EEF3F8',
    iconFg: '#1E3A5C',
    dotColor: '#1E3A5C',
    delta: '↑ 12%',
    deltaFg: '#2E7D55',
    deltaBg: '#E7F1EC',
  },
];

// ─── Filter tabs ──────────────────────────────────────────────────────────────

const TYPE_TABS = [
  { key: '', label: 'All' },
  { key: 'listing', label: 'Listing flags' },
  { key: 'user', label: 'User flags' },
  { key: 'spam', label: 'Spam' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function typeIconBg(type: ReportType) {
  if (type === 'listing') return { bg: '#EEF3F8', fg: '#1E3A5C', icon: '🏠' };
  if (type === 'user') return { bg: '#FAE8E5', fg: '#B4402B', icon: '👤' };
  return { bg: '#F7EFDD', fg: '#9A6A1F', icon: '⚠' };
}

function typeLabel(type: ReportType) {
  if (type === 'listing') return 'Listing flag';
  if (type === 'user') return 'User flag';
  return 'Spam';
}

function severityStyle(sev: Severity): { fg: string; bg: string } {
  if (sev === 'High') return { fg: '#B4402B', bg: '#FAE8E5' };
  if (sev === 'Medium') return { fg: '#9A6A1F', bg: '#F7EFDD' };
  return { fg: '#2A5C8A', bg: '#E6EFF7' };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const session = await getAdminSession();
  if (!session) redirect('/login');

  const { type } = await searchParams;
  const activeType = type ?? '';
  const adminInitials = initials(session.name);

  const filtered = MOCK_REPORTS.filter(r => {
    if (!activeType) return true;
    return r.type === activeType;
  });

  const open = filtered.filter(r => r.status === 'open');
  const resolved = filtered.filter(r => r.status === 'resolved');
  const ordered = [...open, ...resolved];

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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
            {STAT_CARDS.map(card => (
              <div
                key={card.label}
                className="bv-lift"
                style={{
                  background: '#fff',
                  border: '1px solid #ECEEF1',
                  borderRadius: 15,
                  padding: '16px 18px',
                  boxShadow: '0 1px 2px rgba(20,40,70,.03)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 11,
                    background: card.iconBg, color: card.iconFg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, flexShrink: 0,
                  }}>
                    {card.icon}
                  </div>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center',
                    fontSize: 11.5, fontWeight: 800,
                    color: card.deltaFg, background: card.deltaBg,
                    padding: '3px 7px', borderRadius: 999,
                  }}>
                    {card.delta}
                  </span>
                </div>
                <div style={{
                  fontSize: 27, fontWeight: 800, letterSpacing: -0.6,
                  color: '#15243B', marginTop: 12, lineHeight: 1,
                }}>
                  {card.value}
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#8893A4', marginTop: 5 }}>
                  {card.label}
                </div>
              </div>
            ))}
          </div>

          {/* ── Filter tabs + search ── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 14, marginBottom: 16,
          }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, background: '#EEF1F5', borderRadius: 11, padding: 4 }}>
              {TYPE_TABS.map(tab => {
                const isActive = activeType === tab.key;
                const href = tab.key ? `/reports?type=${tab.key}` : '/reports';
                return (
                  <Link key={tab.key} href={href} style={{ textDecoration: 'none' }}>
                    <span style={{
                      display: 'block', padding: '6px 16px', borderRadius: 8,
                      fontSize: 13, fontWeight: 700,
                      background: isActive ? '#fff' : 'transparent',
                      color: isActive ? '#15243B' : '#8893A4',
                      boxShadow: isActive ? '0 1px 3px rgba(20,40,70,.08)' : 'none',
                      transition: 'all .18s',
                      cursor: 'pointer',
                    }}>
                      {tab.label}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Search — visual only on mock data */}
            <Suspense>
              <SearchInput placeholder="Search reports…" />
            </Suspense>
          </div>

          {/* ── Report list ── */}
          {ordered.length === 0 ? (
            /* Empty state */
            <div style={{
              background: '#fff', border: '1px solid #ECEEF1',
              borderRadius: 18, padding: '64px 40px', textAlign: 'center',
              boxShadow: '0 1px 2px rgba(20,40,70,.03)',
            }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: '#E7F1EC', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 26, margin: '0 auto 18px',
              }}>
                ✓
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700, color: '#15243B' }}>
                No open reports
              </h3>
              <p style={{ margin: 0, fontSize: 13.5, color: '#8893A4' }}>
                All community flags have been resolved. Great work!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {ordered.map(report => {
                const { bg: iconBg, fg: iconFg, icon } = typeIconBg(report.type);
                const { fg: sevFg, bg: sevBg } = severityStyle(report.severity);
                const isResolved = report.status === 'resolved';

                return (
                  <div
                    key={report.id}
                    className="bv-lift"
                    style={{
                      background: '#fff',
                      border: `1px solid ${isResolved ? '#EEF1F5' : '#ECEEF1'}`,
                      borderRadius: 16,
                      padding: '18px 20px',
                      display: 'flex', alignItems: 'flex-start', gap: 16,
                      boxShadow: '0 1px 2px rgba(20,40,70,.03)',
                      opacity: isResolved ? 0.72 : 1,
                    }}
                  >
                    {/* Icon square */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: iconBg, color: iconFg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20, flexShrink: 0, marginTop: 1,
                    }}>
                      {icon}
                    </div>

                    {/* Body */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Badges row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 800, letterSpacing: '.04em',
                          textTransform: 'uppercase',
                          color: iconFg, background: iconBg,
                          padding: '3px 8px', borderRadius: 999,
                        }}>
                          {typeLabel(report.type)}
                        </span>
                        <span style={{
                          fontSize: 11, fontWeight: 800, letterSpacing: '.04em',
                          textTransform: 'uppercase',
                          color: sevFg, background: sevBg,
                          padding: '3px 8px', borderRadius: 999,
                        }}>
                          {report.severity}
                        </span>
                        <span style={{ fontSize: 12, color: '#9AA6B6', fontWeight: 600 }}>
                          · reported {report.reportedAgo}
                        </span>
                      </div>

                      {/* Reason text */}
                      <p style={{
                        margin: '0 0 7px', fontSize: 13.5, fontWeight: 600,
                        color: '#15243B', lineHeight: 1.55,
                      }}>
                        {report.reason}
                      </p>

                      {/* Target + flagger */}
                      <p style={{ margin: 0, fontSize: 12.5, color: '#8893A4' }}>
                        on{' '}
                        <strong style={{ color: '#44506A', fontWeight: 700 }}>
                          {report.targetName}
                        </strong>
                        {' · '}flagged by{' '}
                        <span style={{ color: '#44506A', fontWeight: 600 }}>
                          {report.flaggedBy}
                        </span>
                      </p>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                      {isResolved ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          fontSize: 12.5, fontWeight: 700,
                          color: report.resolvedAs === 'removed' ? '#B4402B' : '#2E7D55',
                          background: report.resolvedAs === 'removed' ? '#FAE8E5' : '#E7F1EC',
                          padding: '6px 14px', borderRadius: 999,
                        }}>
                          <span>✓</span>
                          {report.resolvedAs === 'removed' ? 'Listing removed' : 'Dismissed'}
                        </span>
                      ) : (
                        <>
                          <button style={{
                            padding: '7px 14px', borderRadius: 9,
                            border: '1.5px solid #1E3A5C', background: 'transparent',
                            color: '#1E3A5C', fontSize: 12.5, fontWeight: 700,
                            cursor: 'pointer', fontFamily: 'inherit',
                            whiteSpace: 'nowrap',
                          }}>
                            Open target
                          </button>
                          <button style={{
                            padding: '7px 14px', borderRadius: 9,
                            border: '1.5px solid #ECEEF1', background: '#F4F6F9',
                            color: '#8893A4', fontSize: 12.5, fontWeight: 700,
                            cursor: 'pointer', fontFamily: 'inherit',
                          }}>
                            Dismiss
                          </button>
                          <button style={{
                            padding: '7px 14px', borderRadius: 9,
                            border: 'none', background: '#B4402B',
                            color: '#fff', fontSize: 12.5, fontWeight: 700,
                            cursor: 'pointer', fontFamily: 'inherit',
                            whiteSpace: 'nowrap',
                          }}>
                            Take action
                          </button>
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
