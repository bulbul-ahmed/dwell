import { db, users } from '@/db';
import { eq } from 'drizzle-orm';
import { getAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Topbar from '@/components/Topbar';
import { initials } from '@/lib/utils';

const TOGGLES = [
  { label: 'Auto-approve verified owners', sub: 'Listings from verified owners skip the review queue', on: true },
  { label: 'Require minimum 3 photos',     sub: 'Submissions with fewer photos are held for review',  on: true },
  { label: 'Email admin on new submission', sub: 'Send an email alert whenever a listing is submitted', on: false },
  { label: 'Notify on community flag',      sub: 'Alert admins when a listing receives a community flag', on: true },
];

function TogglePill({ on }: { on: boolean }) {
  return (
    <div style={{
      width: 46, height: 27, borderRadius: 999, flexShrink: 0,
      background: on ? '#1E3A5C' : '#E2E7EE',
      position: 'relative',
      transition: 'background .18s',
    }}>
      <div style={{
        position: 'absolute',
        top: 3,
        left: on ? 22 : 3,
        width: 21, height: 21,
        borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,.18)',
        transition: 'left .18s',
      }} />
    </div>
  );
}

export default async function SettingsPage() {
  const session = await getAdminSession();
  if (!session) redirect('/login');

  const adminUsers = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.role, 'admin'));

  const adminInitials = initials(session.name);

  return (
    <>
      <Topbar
        crumb="System"
        title="Settings"
        adminInitials={adminInitials}
        adminName={session.name}
        adminEmail={session.email}
      />
      <main style={{ flex: 1, padding: '28px 34px 56px', minWidth: 0 }}>
        <div style={{ animation: 'bvfade .45s cubic-bezier(.22,1,.36,1) both', maxWidth: 980 }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* LEFT — Team & roles */}
            <div style={{
              background: '#fff', border: '1px solid #ECEEF1',
              borderRadius: 18, padding: '22px 22px 20px',
              boxShadow: '0 1px 2px rgba(20,40,70,.03)',
            }}>
              <h3 style={{ margin: '0 0 18px', fontSize: 15.5, fontWeight: 800, color: '#15243B' }}>
                Team &amp; roles
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {adminUsers.length === 0 ? (
                  /* Fallback if no admin users in DB yet */
                  <div style={{ color: '#8893A4', fontSize: 13.5, fontWeight: 600, textAlign: 'center', padding: '20px 0' }}>
                    No admin users found
                  </div>
                ) : (
                  adminUsers.map(u => {
                    const ini = initials(u.name);
                    return (
                      <div key={u.id} style={{
                        display: 'flex', alignItems: 'center', gap: 13,
                        padding: '10px 12px', borderRadius: 13,
                        border: '1px solid #F2F4F7',
                      }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                          background: 'linear-gradient(140deg, #1E3A5C, #2C557F)',
                          color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 800,
                        }}>
                          {ini}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 14, fontWeight: 700, color: '#15243B',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {u.name}
                          </div>
                          <div style={{
                            fontSize: 12, color: '#8893A4', marginTop: 2,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {u.email}
                          </div>
                        </div>
                        <span style={{
                          padding: '3px 10px', borderRadius: 999, flexShrink: 0,
                          background: '#EEF3F8', color: '#1E3A5C',
                          fontSize: 11.5, fontWeight: 800,
                        }}>
                          Super Admin
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Invite button */}
              <button style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                width: '100%', marginTop: 14, padding: '11px 0',
                borderRadius: 12, border: '1.5px dashed #C8CDD6',
                background: 'none', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 13.5, fontWeight: 700, color: '#8893A4',
              }}>
                + Invite team member
              </button>
            </div>

            {/* RIGHT column — 2 stacked cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Moderation preferences */}
              <div style={{
                background: '#fff', border: '1px solid #ECEEF1',
                borderRadius: 18, padding: '22px 22px 18px',
                boxShadow: '0 1px 2px rgba(20,40,70,.03)',
              }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 15.5, fontWeight: 800, color: '#15243B' }}>
                  Moderation preferences
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {TOGGLES.map(({ label, sub, on }, i) => (
                    <div key={label} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
                      padding: '13px 0',
                      borderBottom: i < TOGGLES.length - 1 ? '1px solid #F4F6F9' : 'none',
                    }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#15243B' }}>{label}</div>
                        <div style={{ fontSize: 12, color: '#8893A4', marginTop: 2 }}>{sub}</div>
                      </div>
                      <TogglePill on={on} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Homepage CMS */}
              <div style={{
                background: '#fff', border: '1px solid #ECEEF1',
                borderRadius: 18, padding: '22px 22px 20px',
                boxShadow: '0 1px 2px rgba(20,40,70,.03)',
              }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 15.5, fontWeight: 800, color: '#15243B' }}>
                  Homepage CMS
                </h3>
                <p style={{ margin: '0 0 14px', fontSize: 12.5, color: '#8893A4', fontWeight: 500 }}>
                  Featured banner shown to all seekers on the home page.
                </p>

                {/* Banner preview */}
                <div style={{
                  height: 96, borderRadius: 13,
                  background: 'linear-gradient(120deg, #16273F, #2C557F)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 12,
                }}>
                  <span style={{
                    fontSize: 14.5, fontWeight: 700, color: '#fff',
                    textAlign: 'center', padding: '0 20px',
                    lineHeight: 1.4,
                  }}>
                    Verified homes in Aftab Nagar — visit with confidence
                  </span>
                </div>

                <button style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  height: 36, padding: '0 16px', borderRadius: 9,
                  border: '1.5px solid #C8CDD6', background: '#fff',
                  cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 13, fontWeight: 700, color: '#44506A',
                }}>
                  Edit banner
                </button>
              </div>

            </div>
          </div>

        </div>
      </main>
    </>
  );
}
