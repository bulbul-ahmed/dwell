import { db, users } from '@/db';
import { sql, count, eq, ilike, and, or } from 'drizzle-orm';
import { getAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Topbar from '@/components/Topbar';
import SearchInput from '@/components/SearchInput';
import { initials } from '@/lib/utils';
import Link from 'next/link';
import { Suspense } from 'react';

const AV_COLORS = ['#E8F0F8', '#E7F1EC', '#F7EFDD', '#F8E8E3', '#EEF0F3'];
const AV_FGS    = ['#1E3A5C', '#2E7D55', '#9A6A1F', '#B4402B', '#5A6172'];

const ROLE_COLORS: Record<string, [string, string]> = {
  renter: ['#5A6172', '#F4F6F9'],
  owner:  ['#1E3A5C', '#EEF3F8'],
  admin:  ['#B4402B', '#F8E8E3'],
};

const TABS = [
  { label: 'All',    role: null },
  { label: 'Renters', role: 'renter' },
  { label: 'Owners',  role: 'owner' },
  { label: 'Admins',  role: 'admin' },
] as const;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  const session = await getAdminSession();
  if (!session) redirect('/login');

  const { q, role } = await searchParams;
  const adminInitials = initials(session.name);

  // ── Stat counts ────────────────────────────────────────────────────────────
  const [total]  = await db.select({ count: count() }).from(users);
  const [renters] = await db.select({ count: count() }).from(users).where(eq(users.role, 'renter'));
  const [ownersC] = await db.select({ count: count() }).from(users).where(eq(users.role, 'owner'));
  const [admins]  = await db.select({ count: count() }).from(users).where(eq(users.role, 'admin'));

  const stats = {
    total:   total.count,
    renters: renters.count,
    owners:  ownersC.count,
    admins:  admins.count,
  };

  // ── Row query ───────────────────────────────────────────────────────────────
  const conditions = [];
  if (role) conditions.push(eq(users.role, role as 'renter' | 'owner' | 'admin'));
  if (q) {
    conditions.push(
      or(
        ilike(users.name,  `%${q}%`),
        ilike(users.email, `%${q}%`),
      )!
    );
  }

  const rows = await db
    .select()
    .from(users)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(sql`${users.createdAt} desc`);

  // ── Stat cards ──────────────────────────────────────────────────────────────
  const statCards = [
    { label: 'Total users', value: stats.total,   bg: '#E8EDF4', fg: '#1E3A5C', icon: '👤' },
    { label: 'Renters',     value: stats.renters,  bg: '#E7F1EC', fg: '#2E7D55', icon: '🔍' },
    { label: 'Owners',      value: stats.owners,   bg: '#F7EFDD', fg: '#9A6A1F', icon: '🏠' },
    { label: 'Admins',      value: stats.admins,   bg: '#F8E8E3', fg: '#B4402B', icon: '🛡' },
  ];

  return (
    <>
      <Topbar
        crumb="Catalog"
        title="Users"
        adminInitials={adminInitials}
        adminName={session.name}
        adminEmail={session.email}
      />
      <main style={{ flex: 1, padding: '28px 34px 56px', minWidth: 0 }}>
        <div style={{ animation: 'bvfade .45s cubic-bezier(.22,1,.36,1) both' }}>

          {/* Stat strip */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16, marginBottom: 20,
          }}>
            {statCards.map(st => (
              <div key={st.label} className="bv-lift" style={{
                background: '#fff', border: '1px solid #ECEEF1', borderRadius: 15,
                padding: '16px 18px', boxShadow: '0 1px 2px rgba(20,40,70,.03)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 9,
                    background: st.bg, color: st.fg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16,
                  }}>{st.icon}</div>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#8893A4' }}>
                    {st.label}
                  </span>
                </div>
                <div style={{
                  fontSize: 24, fontWeight: 800, color: '#15243B',
                  marginTop: 10, letterSpacing: -0.4,
                }}>
                  {st.value}
                </div>
              </div>
            ))}
          </div>

          {/* Filter toolbar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 16, gap: 12,
          }}>
            {/* Role tab strip */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: '#fff', border: '1px solid #E6E9EE',
              borderRadius: 12, padding: 5,
            }}>
              {TABS.map(tab => {
                const isActive = (tab.role === null && !role) || tab.role === role;
                const href = tab.role ? `/users?role=${tab.role}` : '/users';
                return (
                  <Link key={tab.label} href={href} style={{ textDecoration: 'none' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '7px 14px', borderRadius: 9,
                      fontSize: 12.5, fontWeight: 700,
                      background: isActive ? '#1E3A5C' : 'transparent',
                      color: isActive ? '#fff' : '#8893A4',
                      transition: 'background .15s, color .15s',
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
              <SearchInput placeholder="Search by name or email…" />
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
              gridTemplateColumns: '2.2fr 1fr 1fr 1.1fr 0.8fr 40px',
              gap: 14, padding: '13px 22px',
              background: '#FAFBFC', borderBottom: '1px solid #EEF1F5',
              fontSize: 11, fontWeight: 800, color: '#9AA6B6',
              textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              <span>User</span>
              <span>Role</span>
              <span>Status</span>
              <span>Verification</span>
              <span style={{ textAlign: 'right' }}>Listings</span>
              <span />
            </div>

            {rows.length === 0 ? (
              <div style={{
                padding: '48px 22px', textAlign: 'center',
                fontSize: 14, color: '#8893A4',
              }}>
                No users match your filter.
              </div>
            ) : rows.map(u => {
              const idx     = u.id % 5;
              const ini     = initials(u.name);
              const [roleFg, roleBg] = ROLE_COLORS[u.role] ?? ['#5A6172', '#F4F6F9'];
              const isOwner = u.role === 'owner';

              return (
                <Link key={u.id} href={`/users/${u.id}`} style={{ textDecoration: 'none' }}>
                  <div className="bv-rowh" style={{
                    display: 'grid',
                    gridTemplateColumns: '2.2fr 1fr 1fr 1.1fr 0.8fr 40px',
                    gap: 14, padding: '12px 22px',
                    borderBottom: '1px solid #F2F4F7',
                    alignItems: 'center', cursor: 'pointer',
                  }}>
                    {/* User */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                        background: AV_COLORS[idx], color: AV_FGS[idx],
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: 15,
                      }}>
                        {ini}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontSize: 13.5, fontWeight: 700, color: '#15243B',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {u.name}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#9AA6B6', marginTop: 2 }}>
                          {u.phone ?? u.email}
                        </div>
                      </div>
                    </div>

                    {/* Role */}
                    <span>
                      <span style={{
                        fontSize: 12, fontWeight: 700,
                        color: roleFg, background: roleBg,
                        padding: '4px 10px', borderRadius: 999,
                        textTransform: 'capitalize',
                      }}>
                        {u.role}
                      </span>
                    </span>

                    {/* Status */}
                    <span>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontSize: 11.5, fontWeight: 800,
                        color: '#2E7D55', background: '#E7F1EC',
                        padding: '4px 10px', borderRadius: 999,
                      }}>
                        <span style={{
                          width: 5, height: 5, borderRadius: '50%',
                          background: '#2E7D55', display: 'inline-block',
                        }} />
                        Active
                      </span>
                    </span>

                    {/* Verification */}
                    <span>
                      {isOwner ? (
                        <span style={{
                          fontSize: 12, fontWeight: 700,
                          padding: '4px 10px', borderRadius: 999,
                          /* owners.verified isn't linked directly to users; show Pending by default */
                          color: '#9A6A1F', background: '#F7EFDD',
                        }}>
                          Pending
                        </span>
                      ) : (
                        <span style={{ fontSize: 13, color: '#C0C8D5' }}>—</span>
                      )}
                    </span>

                    {/* Listings */}
                    <span style={{
                      fontSize: 13, fontWeight: 600, color: '#8893A4',
                      textAlign: 'right',
                    }}>
                      0
                    </span>

                    {/* Menu */}
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
