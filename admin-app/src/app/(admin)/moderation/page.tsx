import { db, listings, owners } from '@/db';
import { eq, sql, ilike, and, or } from 'drizzle-orm';
import { getAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Topbar from '@/components/Topbar';
import SearchInput from '@/components/SearchInput';
import { bdFormat, initials, timeAgo } from '@/lib/utils';
import Link from 'next/link';
import { Suspense } from 'react';
import RejectButton from './RejectButton';

// ── Types ─────────────────────────────────────────────────────────────────────
type QueueRow = {
  id: number;
  title: string;
  area: string;
  price: number;
  cover: string;
  cat: string;
  createdAt: Date;
  verified: boolean;
  ownerName: string | null;
  ownerType: 'Agency' | 'Owner' | null;
};

// ── Data fetcher ──────────────────────────────────────────────────────────────
async function getQueue(q?: string, status?: string): Promise<QueueRow[]> {
  const conditions = [eq(listings.verified, false)];

  if (status === 'listing') conditions.push(eq(owners.type, 'Owner'));
  if (status === 'agency')  conditions.push(eq(owners.type, 'Agency'));

  if (q) {
    conditions.push(
      or(
        ilike(listings.title, `%${q}%`),
        ilike(owners.name,    `%${q}%`),
      )!
    );
  }

  return db
    .select({
      id:        listings.id,
      title:     listings.title,
      area:      listings.area,
      price:     listings.price,
      cover:     listings.cover,
      cat:       listings.cat,
      createdAt: listings.createdAt,
      verified:  listings.verified,
      ownerName: owners.name,
      ownerType: owners.type,
    })
    .from(listings)
    .leftJoin(owners, eq(listings.ownerId, owners.id))
    .where(and(...conditions))
    .orderBy(sql`${listings.createdAt} asc`) as Promise<QueueRow[]>;
}

// ── Tabs config ───────────────────────────────────────────────────────────────
const TABS = [
  { label: 'All',     status: null },
  { label: 'Listing', status: 'listing' },
  { label: 'Agency',  status: 'agency' },
] as const;

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function ModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const session = await getAdminSession();
  if (!session) redirect('/login');

  const { q, status } = await searchParams;
  const adminInitials = initials(session.name);

  // Counts for tab badges (always unfiltered by q so counts are stable)
  const allQueue      = await getQueue(undefined, undefined);
  const listingCount  = allQueue.filter(r => r.ownerType === 'Owner').length;
  const agencyCount   = allQueue.filter(r => r.ownerType === 'Agency').length;
  const tabCounts: Record<string, number> = {
    listing: listingCount,
    agency:  agencyCount,
  };

  // Actual visible rows (filtered)
  const queue = await getQueue(q, status);

  return (
    <>
      <Topbar
        crumb="Trust & Safety"
        title="Moderation queue"
        adminInitials={adminInitials}
        adminName={session.name}
        adminEmail={session.email}
      />
      <main style={{ flex: 1, padding: '28px 34px 56px', minWidth: 0 }}>
        <div style={{ animation: 'bvfade .45s cubic-bezier(.22,1,.36,1) both' }}>

          {/* Toolbar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 18, gap: 12, flexWrap: 'wrap',
          }}>
            {/* Left: tab strip + pending badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Tab strip */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: '#fff', border: '1px solid #E6E9EE',
                borderRadius: 12, padding: 5,
              }}>
                {TABS.map(tab => {
                  const isActive = (tab.status === null && !status) || tab.status === status;
                  const href = tab.status ? `/moderation?status=${tab.status}` : '/moderation';
                  const cnt = tab.status ? tabCounts[tab.status] : allQueue.length;
                  return (
                    <Link key={tab.label} href={href} style={{ textDecoration: 'none' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '7px 14px', borderRadius: 9,
                        fontSize: 12.5, fontWeight: 700,
                        background: isActive ? '#1E3A5C' : 'transparent',
                        color: isActive ? '#fff' : '#8893A4',
                        transition: 'background .15s, color .15s',
                        cursor: 'pointer',
                      }}>
                        {tab.label}
                        {cnt > 0 && (
                          <span style={{
                            fontSize: 10.5, fontWeight: 800,
                            background: isActive ? 'rgba(255,255,255,.18)' : '#EEF1F6',
                            color: isActive ? '#fff' : '#6B7A92',
                            padding: '1px 7px', borderRadius: 999,
                            lineHeight: '17px',
                          }}>
                            {cnt}
                          </span>
                        )}
                      </span>
                    </Link>
                  );
                })}
              </div>

              {/* Pending badge */}
              <span style={{
                fontSize: 12.5, fontWeight: 800, padding: '5px 13px', borderRadius: 999,
                background: allQueue.length > 0 ? '#F8E8E3' : '#E7F1EC',
                color:      allQueue.length > 0 ? '#B4402B' : '#2E7D55',
              }}>
                {allQueue.length} pending
              </span>
            </div>

            {/* Center: search */}
            <Suspense>
              <SearchInput placeholder="Search listings or owner…" />
            </Suspense>

            {/* Right: action buttons */}
            <div style={{ display: 'flex', gap: 9 }}>
              <button className="bv-press bv-fill" style={{
                '--fill': '#EEF2F7',
                height: 40, padding: '0 16px', borderRadius: 11,
                border: '1px solid #E2E7EE', background: '#fff',
                cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 13, fontWeight: 700, color: '#44506A',
                display: 'inline-flex', alignItems: 'center', gap: 7,
              } as React.CSSProperties}>
                ↕ Oldest first
              </button>
              <button className="bv-press" style={{
                height: 40, padding: '0 16px', borderRadius: 11,
                border: 'none', background: '#2E7D55',
                cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 13, fontWeight: 700, color: '#fff',
                display: 'inline-flex', alignItems: 'center', gap: 7,
                boxShadow: '0 6px 14px -6px rgba(46,125,85,.5)',
              }}>
                ✓ Approve selected (0)
              </button>
            </div>
          </div>

          {/* Queue */}
          {queue.length === 0 ? (
            <div style={{
              background: '#fff', border: '1px solid #ECEEF1', borderRadius: 20,
              padding: '70px 40px', textAlign: 'center',
              animation: 'bvpop .4s ease both',
            }}>
              <div style={{
                width: 78, height: 78, borderRadius: 22, background: '#E7F1EC',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="#2E7D55" strokeWidth="2.4"
                    strokeLinecap="round" strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#15243B', margin: '0 0 8px' }}>
                Queue is all clear
              </h3>
              <p style={{
                fontSize: 14, color: '#8893A4',
                margin: '0 auto', maxWidth: 360, lineHeight: 1.55,
              }}>
                Every submitted listing has been reviewed. New submissions will appear here for
                approval before they go public.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {queue.map(m => (
                <div key={m.id} className="bv-lift" style={{
                  background: '#fff', border: '1px solid #ECEEF1', borderRadius: 16,
                  padding: 14, display: 'flex', alignItems: 'center', gap: 14,
                  boxShadow: '0 1px 2px rgba(20,40,70,.03)',
                }}>
                  {/* Checkbox */}
                  <div style={{
                    width: 22, height: 22, borderRadius: 7, flexShrink: 0,
                    border: '2px solid #D0D8E4', background: '#fff',
                  }} />

                  {/* Thumbnail */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                      width: 92, height: 70, borderRadius: 12,
                      backgroundImage: `url('${m.cover}')`,
                      backgroundSize: 'cover', backgroundPosition: 'center',
                      backgroundColor: '#DDD3C5',
                    }} />
                    {/* Photo count badge */}
                    <span style={{
                      position: 'absolute', bottom: 5, right: 5,
                      fontSize: 10.5, fontWeight: 700,
                      background: 'rgba(15,25,50,.62)', color: '#fff',
                      padding: '2px 6px', borderRadius: 6,
                      backdropFilter: 'blur(4px)',
                    }}>
                      4 📷
                    </span>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 800, color: '#1E3A5C', background: '#EEF3F8',
                        padding: '3px 9px', borderRadius: 999,
                        textTransform: 'uppercase', letterSpacing: 0.4,
                      }}>
                        {m.cat}
                      </span>
                      {m.ownerType && (
                        <span style={{
                          fontSize: 11, fontWeight: 700, color: '#6B7A92', background: '#F0F3F7',
                          padding: '3px 9px', borderRadius: 999, letterSpacing: 0.3,
                        }}>
                          {m.ownerType}
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: 15, fontWeight: 700, color: '#15243B',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {m.title}
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      marginTop: 5, fontSize: 12.5, color: '#8893A4', flexWrap: 'wrap',
                    }}>
                      <span style={{ fontWeight: 600, color: '#5A6A7E' }}>{m.ownerName}</span>
                      <span style={{ color: '#C0C8D5' }}>·</span>
                      <span>৳{bdFormat(m.price)}/mo</span>
                      <span style={{ color: '#C0C8D5' }}>·</span>
                      <span>{m.area}</span>
                      <span style={{ color: '#AEB8C6' }}>· submitted {timeAgo(m.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                    <Link href={`/moderation/${m.id}`} style={{ textDecoration: 'none' }}>
                      <button className="bv-press bv-fill" style={{
                        '--fill': '#EEF2F7',
                        height: 38, padding: '0 15px', borderRadius: 10,
                        border: '1px solid #E2E7EE', background: '#fff', cursor: 'pointer',
                        fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: '#1E3A5C',
                      } as React.CSSProperties}>
                        Review
                      </button>
                    </Link>

                    <RejectButton listingId={m.id} />

                    <ApproveButton listingId={m.id} />
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </>
  );
}

// ── Approve button (server-rendered form) ─────────────────────────────────────
function ApproveButton({ listingId }: { listingId: number }) {
  return (
    <form action="/api/admin/moderation" method="POST">
      <input type="hidden" name="id"     value={listingId} />
      <input type="hidden" name="action" value="approve" />
      <button
        type="submit"
        className="bv-press"
        style={{
          height: 38, padding: '0 16px', borderRadius: 10, border: 'none',
          cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
          color: '#fff', background: '#2E7D55',
          display: 'inline-flex', alignItems: 'center', gap: 6,
          boxShadow: '0 8px 16px -8px rgba(46,125,85,.55)',
        }}
      >
        ✓ Approve
      </button>
    </form>
  );
}
