import { db, listings, users } from '@/db';
import { count, eq, sql } from 'drizzle-orm';
import { getAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Topbar from '@/components/Topbar';
import { initials, bdFormat } from '@/lib/utils';

// ─── Mock growth chart data (6 months) ───────────────────────────────────────

const GROWTH_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const GROWTH_LISTINGS = [18, 26, 34, 29, 45, 58]; // new listings per month
const GROWTH_CLOSED   = [4,  9,  12, 8,  18, 22]; // closed/rented per month

// ─── Revenue donut segments ───────────────────────────────────────────────────

const DONUT_SEGMENTS = [
  { label: 'Featured listings', pct: 45, color: '#1E3A5C', amount: '৳82,800' },
  { label: 'Premium placements', pct: 35, color: '#2E7D55', amount: '৳64,400' },
  { label: 'Pro accounts', pct: 20, color: '#C9A24B', amount: '৳36,800' },
];

// ─── Data fetch ───────────────────────────────────────────────────────────────

async function getAnalyticsData() {
  const [totalRow] = await db.select({ count: count() }).from(listings);
  const [verifiedRow] = await db.select({ count: count() }).from(listings).where(eq(listings.verified, true));
  const [userRow] = await db.select({ count: count() }).from(users);

  const avgResult = await db
    .select({ avg: sql<string>`ROUND(AVG(${listings.price}))` })
    .from(listings);
  const avgPrice = parseInt(avgResult[0]?.avg ?? '0', 10) || 0;

  // Top areas by listing count
  const areaRows = await db.execute<{ area: string; cnt: string }>(
    sql`SELECT area, COUNT(*) as cnt FROM listings GROUP BY area ORDER BY cnt DESC LIMIT 6`
  );

  const totalListings = totalRow.count;
  const verifiedListings = verifiedRow.count;
  const totalUsers = userRow.count;

  const approvalRate = totalListings > 0
    ? Math.round((verifiedListings / totalListings) * 100)
    : 0;

  const areas = (areaRows as { area: string; cnt: string }[]).map(r => ({
    area: r.area,
    count: parseInt(r.cnt, 10),
  }));

  return { totalListings, verifiedListings, totalUsers, avgPrice, approvalRate, areas };
}

// ─── Chart helpers ────────────────────────────────────────────────────────────

const CHART_W = 600;
const CHART_H = 220;
const CHART_PAD_L = 44;
const CHART_PAD_B = 30;
const CHART_PAD_T = 16;
const CHART_PAD_R = 20;

const innerW = CHART_W - CHART_PAD_L - CHART_PAD_R;
const innerH = CHART_H - CHART_PAD_T - CHART_PAD_B;

const MAX_VAL = Math.max(...GROWTH_LISTINGS, ...GROWTH_CLOSED);
const Y_MAX = Math.ceil(MAX_VAL / 10) * 10 + 10;

function toPoints(data: number[]): string {
  return data
    .map((v, i) => {
      const x = CHART_PAD_L + (i / (data.length - 1)) * innerW;
      const y = CHART_PAD_T + innerH - (v / Y_MAX) * innerH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

const GRID_Y = [Math.round(Y_MAX * 0.25), Math.round(Y_MAX * 0.5), Math.round(Y_MAX * 0.75)];

function gridY(val: number): number {
  return CHART_PAD_T + innerH - (val / Y_MAX) * innerH;
}

// ─── Donut math ───────────────────────────────────────────────────────────────

function buildConicGradient(segments: typeof DONUT_SEGMENTS): string {
  let deg = 0;
  const parts: string[] = [];
  for (const seg of segments) {
    const end = deg + (seg.pct / 100) * 360;
    parts.push(`${seg.color} ${deg.toFixed(1)}deg ${end.toFixed(1)}deg`);
    deg = end;
  }
  return `conic-gradient(${parts.join(', ')})`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AnalyticsPage() {
  const session = await getAdminSession();
  if (!session) redirect('/login');

  const { totalListings, verifiedListings, totalUsers, avgPrice, approvalRate, areas } =
    await getAnalyticsData();

  const adminInitials = initials(session.name);

  const maxAreaCount = areas.length > 0 ? Math.max(...areas.map(a => a.count)) : 1;

  const kpiCards = [
    {
      label: 'Approval rate',
      value: `${approvalRate}%`,
      iconBg: approvalRate >= 70 ? '#E7F1EC' : '#FAE8E5',
      iconFg: approvalRate >= 70 ? '#2E7D55' : '#B4402B',
      icon: '✓',
      delta: approvalRate >= 70 ? '+3% vs last mo' : '↓ needs attention',
      deltaFg: approvalRate >= 70 ? '#2E7D55' : '#B4402B',
      deltaBg: approvalRate >= 70 ? '#E7F1EC' : '#FAE8E5',
    },
    {
      label: 'Active listings',
      value: verifiedListings.toString(),
      iconBg: '#EEF3F8',
      iconFg: '#1E3A5C',
      icon: '🏠',
      delta: '+12% vs last mo',
      deltaFg: '#2E7D55',
      deltaBg: '#E7F1EC',
    },
    {
      label: 'Avg price (৳)',
      value: bdFormat(avgPrice),
      iconBg: '#F7EFDD',
      iconFg: '#9A6A1F',
      icon: '৳',
      delta: '↑ 4% vs last mo',
      deltaFg: '#2E7D55',
      deltaBg: '#E7F1EC',
    },
    {
      label: 'Registered users',
      value: totalUsers.toString(),
      iconBg: '#E7F1EC',
      iconFg: '#2E7D55',
      icon: '👥',
      delta: '+24% vs last mo',
      deltaFg: '#2E7D55',
      deltaBg: '#E7F1EC',
    },
  ];

  const listingsPoints = toPoints(GROWTH_LISTINGS);
  const closedPoints   = toPoints(GROWTH_CLOSED);

  const conicGrad = buildConicGradient(DONUT_SEGMENTS);

  return (
    <>
      <Topbar
        crumb="Insights"
        title="Platform analytics"
        adminInitials={adminInitials}
        adminName={session.name}
        adminEmail={session.email}
      />
      <main style={{ flex: 1, padding: '28px 34px 56px', minWidth: 0 }}>
        <div style={{ animation: 'bvfade .45s cubic-bezier(.22,1,.36,1) both' }}>

          {/* ── KPI Cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
            {kpiCards.map(k => (
              <div
                key={k.label}
                className="bv-lift"
                style={{
                  background: '#fff', border: '1px solid #ECEEF1', borderRadius: 16,
                  padding: '17px 17px 15px', cursor: 'default',
                  boxShadow: '0 1px 2px rgba(20,40,70,.03)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 11,
                    background: k.iconBg, color: k.iconFg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                  }}>
                    {k.icon}
                  </div>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                    fontSize: 11.5, fontWeight: 800,
                    color: k.deltaFg, background: k.deltaBg,
                    padding: '3px 7px', borderRadius: 999,
                  }}>
                    {k.delta}
                  </span>
                </div>
                <div style={{
                  fontSize: 27, fontWeight: 800, letterSpacing: -0.6,
                  color: '#15243B', marginTop: 13, lineHeight: 1,
                }}>
                  {k.value}
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#8893A4', marginTop: 6 }}>
                  {k.label}
                </div>
              </div>
            ))}
          </div>

          {/* ── Main grid: Growth chart + Top areas ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20, marginBottom: 20 }}>

            {/* Growth chart */}
            <div style={{
              background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18,
              padding: '22px 24px', boxShadow: '0 1px 2px rgba(20,40,70,.03)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
                <div>
                  <h3 style={{ margin: '0 0 3px', fontSize: 15, fontWeight: 800, color: '#15243B' }}>
                    Marketplace growth
                  </h3>
                  <p style={{ margin: 0, fontSize: 12.5, color: '#8893A4' }}>
                    New listings vs closed deals · last 6 months
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 22, height: 3, borderRadius: 2, background: '#1E3A5C', display: 'inline-block' }} />
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: '#44506A' }}>Listings</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 22, height: 3, borderRadius: 2, background: '#2E7D55', display: 'inline-block' }} />
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: '#44506A' }}>Closed</span>
                  </div>
                </div>
              </div>

              <svg
                viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                style={{ width: '100%', display: 'block' }}
                aria-label="Marketplace growth line chart"
              >
                {/* Grid lines */}
                {GRID_Y.map(val => (
                  <g key={val}>
                    <line
                      x1={CHART_PAD_L} y1={gridY(val)}
                      x2={CHART_W - CHART_PAD_R} y2={gridY(val)}
                      stroke="#F0F3F7" strokeWidth="1"
                    />
                    <text
                      x={CHART_PAD_L - 6} y={gridY(val) + 4}
                      textAnchor="end" fontSize="10" fill="#AEB8C6" fontFamily="inherit"
                    >
                      {val}
                    </text>
                  </g>
                ))}

                {/* X-axis month labels */}
                {GROWTH_MONTHS.map((m, i) => {
                  const x = CHART_PAD_L + (i / (GROWTH_MONTHS.length - 1)) * innerW;
                  return (
                    <text
                      key={m}
                      x={x} y={CHART_H - 6}
                      textAnchor="middle" fontSize="10.5" fill="#AEB8C6" fontFamily="inherit"
                    >
                      {m}
                    </text>
                  );
                })}

                {/* Area fill — listings */}
                <polygon
                  points={`${CHART_PAD_L},${CHART_PAD_T + innerH} ${listingsPoints} ${CHART_W - CHART_PAD_R},${CHART_PAD_T + innerH}`}
                  fill="url(#gradListings)"
                  opacity="0.18"
                />
                <defs>
                  <linearGradient id="gradListings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1E3A5C" />
                    <stop offset="100%" stopColor="#1E3A5C" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="gradClosed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2E7D55" />
                    <stop offset="100%" stopColor="#2E7D55" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Area fill — closed */}
                <polygon
                  points={`${CHART_PAD_L},${CHART_PAD_T + innerH} ${closedPoints} ${CHART_W - CHART_PAD_R},${CHART_PAD_T + innerH}`}
                  fill="url(#gradClosed)"
                  opacity="0.14"
                />

                {/* Listings line */}
                <polyline
                  points={listingsPoints}
                  fill="none"
                  stroke="#1E3A5C"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />

                {/* Closed line */}
                <polyline
                  points={closedPoints}
                  fill="none"
                  stroke="#2E7D55"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />

                {/* Dots — listings */}
                {GROWTH_LISTINGS.map((v, i) => {
                  const x = CHART_PAD_L + (i / (GROWTH_LISTINGS.length - 1)) * innerW;
                  const y = CHART_PAD_T + innerH - (v / Y_MAX) * innerH;
                  return (
                    <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="4"
                      fill="#fff" stroke="#1E3A5C" strokeWidth="2.5" />
                  );
                })}

                {/* Dots — closed */}
                {GROWTH_CLOSED.map((v, i) => {
                  const x = CHART_PAD_L + (i / (GROWTH_CLOSED.length - 1)) * innerW;
                  const y = CHART_PAD_T + innerH - (v / Y_MAX) * innerH;
                  return (
                    <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="4"
                      fill="#fff" stroke="#2E7D55" strokeWidth="2.5" />
                  );
                })}
              </svg>
            </div>

            {/* Top areas */}
            <div style={{
              background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18,
              padding: '22px 24px', boxShadow: '0 1px 2px rgba(20,40,70,.03)',
            }}>
              <h3 style={{ margin: '0 0 3px', fontSize: 15, fontWeight: 800, color: '#15243B' }}>
                Top areas by demand
              </h3>
              <p style={{ margin: '0 0 18px', fontSize: 12.5, color: '#8893A4' }}>
                Listings count per area
              </p>

              {areas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#9AA6B6', fontSize: 13.5, fontWeight: 600 }}>
                  No listing data yet
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {areas.map((a, i) => {
                    const barPct = maxAreaCount > 0 ? (a.count / maxAreaCount) * 100 : 0;
                    const opacity = 1 - i * 0.1;
                    return (
                      <div key={a.area}>
                        <div style={{
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'space-between', marginBottom: 6,
                        }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#44506A' }}>
                            {a.area}
                          </span>
                          <span style={{ fontSize: 12.5, fontWeight: 800, color: '#15243B' }}>
                            {a.count}
                          </span>
                        </div>
                        <div style={{ height: 9, borderRadius: 999, background: '#F0F3F7', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${barPct.toFixed(1)}%`,
                            borderRadius: 999,
                            background: `linear-gradient(90deg, rgba(30,58,92,${opacity}), rgba(44,85,127,${opacity}))`,
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Revenue by source (donut) ── */}
          <div style={{
            background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18,
            padding: '22px 28px', boxShadow: '0 1px 2px rgba(20,40,70,.03)',
            display: 'grid', gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center', gap: 40,
          }}>
            {/* Left: label + legend */}
            <div>
              <h3 style={{ margin: '0 0 3px', fontSize: 15, fontWeight: 800, color: '#15243B' }}>
                Revenue by source
              </h3>
              <p style={{ margin: '0 0 22px', fontSize: 12.5, color: '#8893A4' }}>
                Breakdown for this month
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {DONUT_SEGMENTS.map(seg => (
                  <div key={seg.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <span style={{
                        width: 12, height: 12, borderRadius: 3,
                        background: seg.color, display: 'inline-block', flexShrink: 0,
                      }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#44506A' }}>
                        {seg.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#15243B' }}>
                        {seg.amount}
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: '#8893A4',
                        background: '#F4F6F9', padding: '2px 7px', borderRadius: 999,
                      }}>
                        {seg.pct}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Center: donut */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 180, height: 180, borderRadius: '50%',
                background: conicGrad,
              }} />
              {/* Hole */}
              <div style={{
                position: 'absolute',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 106, height: 106, borderRadius: '50%',
                background: '#fff',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#15243B', lineHeight: 1 }}>
                  ৳1.84L
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#8893A4', marginTop: 3 }}>
                  this month
                </div>
              </div>
            </div>

            {/* Right: quick stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Total revenue', value: '৳1,84,000', color: '#15243B' },
                { label: 'vs last month', value: '+18.4%', color: '#2E7D55' },
                { label: 'Avg per listing', value: '৳3,172', color: '#1E3A5C' },
                { label: 'Top segment', value: 'Featured', color: '#9A6A1F' },
              ].map(stat => (
                <div
                  key={stat.label}
                  style={{
                    paddingBottom: 14, borderBottom: '1px solid #F2F4F7',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#8893A4' }}>
                    {stat.label}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: stat.color }}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </>
  );
}
