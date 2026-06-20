import { db, listings, owners } from '@/db';
import { eq, sql, count, ilike, and, or } from 'drizzle-orm';
import { getAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Topbar from '@/components/Topbar';
import SearchInput from '@/components/SearchInput';
import { bdFormat, initials, badge } from '@/lib/utils';
import Link from 'next/link';
import { Suspense } from 'react';

async function getListingsData(q?: string, status?: string) {
  const conditions = [];
  if (q) {
    conditions.push(
      or(
        ilike(listings.title, `%${q}%`),
        ilike(listings.area, `%${q}%`),
        ilike(owners.name, `%${q}%`),
      )
    );
  }
  if (status === 'active') conditions.push(eq(listings.verified, true));
  if (status === 'pending') conditions.push(eq(listings.verified, false));

  const rows = await db
    .select({
      id: listings.id, title: listings.title, area: listings.area,
      price: listings.price, cover: listings.cover, cat: listings.cat,
      beds: listings.beds, verified: listings.verified, sale: listings.sale,
      ownerName: owners.name, ownerType: owners.type,
      createdAt: listings.createdAt,
    })
    .from(listings)
    .leftJoin(owners, eq(listings.ownerId, owners.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(sql`${listings.createdAt} desc`);

  const [total] = await db.select({ count: count() }).from(listings);
  const [active] = await db.select({ count: count() }).from(listings).where(eq(listings.verified, true));
  const [pending] = await db.select({ count: count() }).from(listings).where(eq(listings.verified, false));
  const [rented] = await db.select({ count: count() }).from(listings).where(eq(listings.sale, true));

  return { rows, stats: { total: total.count, active: active.count, pending: pending.count, rented: rented.count } };
}

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'pending', label: 'Pending' },
];

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const session = await getAdminSession();
  if (!session) redirect('/login');

  const { q, status } = await searchParams;
  const { rows, stats } = await getListingsData(q, status);
  const adminInitials = initials(session.name);

  const statCards = [
    { label: 'Total', value: stats.total, dot: '#1E3A5C' },
    { label: 'Active', value: stats.active, dot: '#2E7D55' },
    { label: 'Pending', value: stats.pending, dot: '#C9A24B' },
    { label: 'Rented', value: stats.rented, dot: '#8893A4' },
  ];

  const ownerColors = ['#EEF3F8', '#E7F1EC', '#F7EFDD', '#F8E8E3', '#EEF0F3'];
  const ownerFgs = ['#1E3A5C', '#2E7D55', '#9A6A1F', '#B4402B', '#5A6172'];

  return (
    <>
      <Topbar crumb="Catalog" title="Listings" adminInitials={adminInitials} adminName={session.name} adminEmail={session.email} />
      <main style={{ flex: 1, padding: '28px 34px 56px', minWidth: 0 }}>
        <div style={{ animation: 'bvfade .45s cubic-bezier(.22,1,.36,1) both' }}>

          {/* Stat strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
            {statCards.map(st => (
              <div key={st.label} className="bv-lift" style={{
                background: '#fff', border: '1px solid #ECEEF1', borderRadius: 15,
                padding: '16px 18px', boxShadow: '0 1px 2px rgba(20,40,70,.03)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: st.dot, display: 'inline-block' }} />
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#8893A4' }}>{st.label}</span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#15243B', marginTop: 9, letterSpacing: -0.4 }}>
                  {st.value}
                </div>
              </div>
            ))}
          </div>

          {/* Search + filter bar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 14, marginBottom: 16,
          }}>
            {/* Status tabs */}
            <div style={{ display: 'flex', gap: 4, background: '#EEF1F5', borderRadius: 11, padding: 4 }}>
              {STATUS_TABS.map(tab => {
                const active = (status ?? '') === tab.key;
                const href = tab.key
                  ? `/listings?status=${tab.key}${q ? `&q=${q}` : ''}`
                  : `/listings${q ? `?q=${q}` : ''}`;
                return (
                  <Link key={tab.key} href={href} style={{ textDecoration: 'none' }}>
                    <span style={{
                      display: 'block', padding: '6px 16px', borderRadius: 8,
                      fontSize: 13, fontWeight: 700,
                      background: active ? '#fff' : 'transparent',
                      color: active ? '#15243B' : '#8893A4',
                      boxShadow: active ? '0 1px 3px rgba(20,40,70,.08)' : 'none',
                      transition: 'all .18s',
                      cursor: 'pointer',
                    }}>
                      {tab.label}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Search */}
            <Suspense>
              <SearchInput placeholder="Search by title, area, owner…" />
            </Suspense>
          </div>

          {/* Table */}
          <div style={{
            background: '#fff', border: '1px solid #ECEEF1',
            borderRadius: 18, overflow: 'hidden',
            boxShadow: '0 1px 2px rgba(20,40,70,.03)',
          }}>
            {/* Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2.4fr 1.4fr 0.9fr 1fr 40px',
              gap: 14, padding: '13px 22px',
              background: '#FAFBFC', borderBottom: '1px solid #EEF1F5',
              fontSize: 11, fontWeight: 800, color: '#9AA6B6',
              textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              <span>Property</span>
              <span>Owner</span>
              <span>Price</span>
              <span>Status</span>
              <span />
            </div>

            {rows.length === 0 && (
              <div style={{ padding: '48px 22px', textAlign: 'center', color: '#9AA6B6', fontSize: 14, fontWeight: 600 }}>
                No listings match &ldquo;{q}&rdquo;
              </div>
            )}

            {rows.map(r => {
              const idx = r.id % 5;
              const ownerIni = r.ownerName ? r.ownerName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
              const statusLabel = r.verified ? 'Active' : 'Pending';
              const { fg, bg } = badge(statusLabel);
              return (
                <Link key={r.id} href={`/listings/${r.id}`} style={{ textDecoration: 'none' }}>
                  <div className="bv-rowh" style={{
                    display: 'grid',
                    gridTemplateColumns: '2.4fr 1.4fr 0.9fr 1fr 40px',
                    gap: 14, padding: '12px 22px',
                    borderBottom: '1px solid #F2F4F7',
                    alignItems: 'center', cursor: 'pointer',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <div style={{
                        width: 48, height: 40, borderRadius: 9,
                        backgroundImage: `url('${r.cover}')`,
                        backgroundSize: 'cover', backgroundPosition: 'center',
                        backgroundColor: '#DDD3C5', flexShrink: 0,
                      }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontSize: 13.5, fontWeight: 700, color: '#15243B',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>{r.title}</div>
                        <div style={{ fontSize: 11.5, color: '#9AA6B6', marginTop: 2 }}>
                          {r.area} · <span style={{ textTransform: 'capitalize' }}>{r.cat}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: 8,
                        background: ownerColors[idx], color: ownerFgs[idx],
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 800, flexShrink: 0,
                      }}>{ownerIni}</div>
                      <span style={{
                        fontSize: 12.5, fontWeight: 600, color: '#44506A',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>{r.ownerName}</span>
                    </div>

                    <span style={{ fontSize: 13, fontWeight: 700, color: '#15243B' }}>
                      ৳{bdFormat(r.price)}
                    </span>

                    <span>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontSize: 11.5, fontWeight: 800,
                        color: fg, background: bg,
                        padding: '4px 10px', borderRadius: 999,
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: fg, display: 'inline-block' }} />
                        {statusLabel}
                      </span>
                    </span>

                    <span style={{ fontSize: 18, color: '#8893A4', justifySelf: 'end' }}>⋯</span>
                  </div>
                </Link>
              );
            })}
          </div>

        </div>
      </main>
    </>
  );
}
