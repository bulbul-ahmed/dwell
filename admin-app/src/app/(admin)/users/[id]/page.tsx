import { db, users, listings } from '@/db';
import { eq, count } from 'drizzle-orm';
import { getAdminSession } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import Topbar from '@/components/Topbar';
import { initials, badge, timeAgo } from '@/lib/utils';
import Link from 'next/link';

const AV_COLORS = ['#E8F0F8', '#E7F1EC', '#F7EFDD', '#F8E8E3', '#EEF0F3'];
const AV_FGS = ['#1E3A5C', '#2E7D55', '#9A6A1F', '#B4402B', '#5A6172'];

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) redirect('/login');

  const { id } = await params;
  const [user] = await db.select().from(users).where(eq(users.id, parseInt(id))).limit(1);
  if (!user) notFound();

  const [listingCount] = await db
    .select({ count: count() })
    .from(listings)
    .leftJoin(users, eq(listings.ownerId, users.id))
    .where(eq(users.id, parseInt(id)));

  const adminInitials = initials(session.name);
  const userIni = initials(user.name);
  const idx = user.id % 5;

  const roleColors: Record<string, [string, string]> = {
    renter: ['#5A6172', '#F4F6F9'],
    owner:  ['#1E3A5C', '#EEF3F8'],
    admin:  ['#B4402B', '#F8E8E3'],
  };
  const [roleFg, roleBg] = roleColors[user.role] ?? ['#5A6172', '#F4F6F9'];

  return (
    <>
      <Topbar crumb="Catalog · Users" title="User detail" adminInitials={adminInitials} adminName={session.name} adminEmail={session.email} showBack />
      <main style={{ flex: 1, padding: '28px 34px 56px', minWidth: 0 }}>
        <div style={{ animation: 'bvfade .45s cubic-bezier(.22,1,.36,1) both' }}>

          {/* Header card */}
          <div style={{
            background: '#fff', border: '1px solid #ECEEF1',
            borderRadius: 18, overflow: 'hidden', marginBottom: 20,
            boxShadow: '0 1px 2px rgba(20,40,70,.03)',
          }}>
            <div style={{ height: 92, background: 'linear-gradient(120deg, #16273F, #24456B)' }} />
            <div style={{ padding: '0 26px 22px', display: 'flex', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap' }}>
              <div style={{
                width: 92, height: 92, borderRadius: 22,
                background: AV_COLORS[idx], color: AV_FGS[idx],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 34, marginTop: -42,
                border: '4px solid #fff', boxShadow: '0 8px 20px -8px rgba(20,40,70,.4)',
                flexShrink: 0,
              }}>{userIni}</div>

              <div style={{ flex: 1, minWidth: 200, paddingTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: 23, fontWeight: 800, color: '#15243B', margin: 0, letterSpacing: -0.4 }}>
                    {user.name}
                  </h2>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontSize: 12, fontWeight: 800, color: '#2E7D55', background: '#E7F1EC',
                    padding: '4px 11px', borderRadius: 999,
                  }}>✓ Active</span>
                  <span style={{
                    fontSize: 12, fontWeight: 700, color: roleFg, background: roleBg,
                    padding: '4px 11px', borderRadius: 999, textTransform: 'capitalize',
                  }}>{user.role}</span>
                </div>
                <div style={{ display: 'flex', gap: 20, marginTop: 10, fontSize: 13, color: '#8893A4', flexWrap: 'wrap' }}>
                  {user.phone && <span>📞 {user.phone}</span>}
                  <span>✉ {user.email}</span>
                  <span>Joined {new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, paddingTop: 14, flexWrap: 'wrap' }}>
                <button className="bv-press bv-fill" style={{
                  '--fill': '#EEF2F7', height: 42, padding: '0 17px', borderRadius: 12,
                  border: '1px solid #E2E7EE', background: '#fff', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700, color: '#44506A',
                } as React.CSSProperties}>Message</button>
                <button className="bv-press bv-fill" style={{
                  '--fill': '#F4ECD6', height: 42, padding: '0 17px', borderRadius: 12,
                  border: '1px solid #EBDCB0', background: '#fff', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700, color: '#9A6A1F',
                } as React.CSSProperties}>Suspend</button>
                <button className="bv-press bv-fill" style={{
                  '--fill': '#F8E8E3', width: 42, height: 42, borderRadius: 12,
                  border: '1px solid #F0D9D2', background: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B4402B',
                } as React.CSSProperties}>🚫</button>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
            {[
              { label: 'Listings', value: listingCount.count },
              { label: 'Active role', value: user.role },
              { label: 'Email', value: user.email.split('@')[0] },
              { label: 'Member since', value: new Date(user.createdAt).getFullYear().toString() },
            ].map(m => (
              <div key={m.label} style={{
                background: '#fff', border: '1px solid #ECEEF1',
                borderRadius: 15, padding: 16,
                boxShadow: '0 1px 2px rgba(20,40,70,.03)',
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#15243B', letterSpacing: -0.4, textTransform: 'capitalize' }}>
                  {m.value}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#8893A4', marginTop: 4 }}>{m.label}</div>
              </div>
            ))}
          </div>

          {/* Account info */}
          <div style={{
            background: '#fff', border: '1px solid #ECEEF1',
            borderRadius: 18, padding: 24,
            boxShadow: '0 1px 2px rgba(20,40,70,.03)',
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#15243B', margin: '0 0 16px' }}>Account info</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { k: 'Full name', v: user.name },
                { k: 'Email', v: user.email },
                { k: 'Phone', v: user.phone ?? '—' },
                { k: 'Role', v: user.role },
                { k: 'User ID', v: `#${user.id}` },
                { k: 'Created', v: new Date(user.createdAt).toLocaleString() },
              ].map(f => (
                <div key={f.k} style={{ borderBottom: '1px solid #F2F4F7', paddingBottom: 14 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#9AA6B6', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>
                    {f.k}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#15243B', textTransform: 'capitalize' }}>
                    {f.v}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </>
  );
}
