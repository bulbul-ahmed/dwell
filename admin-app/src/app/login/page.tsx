import { db, listings, users } from '@/db';
import { count, eq, ne } from 'drizzle-orm';
import { Home } from 'lucide-react';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getPlatformStats() {
  try {
    const [activeListings] = await db
      .select({ count: count() })
      .from(listings)
      .where(eq(listings.verified, true));

    const [pendingModeration] = await db
      .select({ count: count() })
      .from(listings)
      .where(eq(listings.verified, false));

    const [verifiedUsers] = await db
      .select({ count: count() })
      .from(users)
      .where(ne(users.role, 'admin' as const));

    const [adminCount] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, 'admin' as const));

    const adminUsers = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.role, 'admin' as const))
      .limit(3);

    return {
      activeListings: activeListings.count,
      pendingModeration: pendingModeration.count,
      verifiedUsers: verifiedUsers.count,
      adminCount: adminCount.count,
      adminUsers,
    };
  } catch {
    return {
      activeListings: 0,
      pendingModeration: 0,
      verifiedUsers: 0,
      adminCount: 0,
      adminUsers: [],
    };
  }
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

function fmtNum(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return n.toString();
}

export default async function LoginPage() {
  const stats = await getPlatformStats();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#070E1B',
      padding: '24px 16px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow orbs */}
      <div style={{
        position: 'fixed', top: -160, left: -100, width: 600, height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(30,90,160,0.22) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: -120, right: -80, width: 500, height: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(180,130,30,0.14) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', top: '40%', right: '15%', width: 300, height: 300,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(50,60,120,0.12) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* Main card — two panel */}
      <div style={{
        display: 'flex',
        width: '100%',
        maxWidth: 1040,
        minHeight: 620,
        borderRadius: 28,
        overflow: 'hidden',
        boxShadow: '0 60px 120px -40px rgba(0,0,0,.8), 0 0 0 1px rgba(255,255,255,.06)',
        animation: 'bvpop .5s cubic-bezier(.22,1,.36,1) both',
      }}>

        {/* LEFT PANEL — white form */}
        <div style={{
          flex: '0 0 460px',
          background: '#fff',
          padding: '48px 48px 40px',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'linear-gradient(140deg, #2C557F, #1E3A5C)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 20px -6px rgba(44,85,127,0.5)',
              flexShrink: 0,
            }}>
              <Home size={21} color="#fff" strokeWidth={2.1} />
            </div>
            <div>
              <div style={{ fontSize: 21, fontWeight: 800, color: '#15243B', lineHeight: 1 }}>Dwell</div>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1.6, color: '#AEB8C6', marginTop: 3.5, textTransform: 'uppercase' }}>
                Admin Console
              </div>
            </div>
          </div>

          {/* Heading */}
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#15243B', margin: '0 0 8px', letterSpacing: -0.5 }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 14, color: '#6B7A8F', margin: '0 0 34px', lineHeight: 1.55 }}>
            Sign in to manage listings, users, and platform health across Dwell.
          </p>

          {/* Form */}
          <LoginForm />
        </div>

        {/* RIGHT PANEL — dark navy, live stats */}
        <div style={{
          flex: 1,
          background: 'linear-gradient(155deg, #0D1B2A 0%, #071628 55%, #090F1D 100%)',
          padding: '48px 44px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Inner glow orb — top right */}
          <div style={{
            position: 'absolute', top: -80, right: -80, width: 360, height: 360,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(40,80,160,0.30) 0%, transparent 65%)',
            pointerEvents: 'none',
          }} />
          {/* Inner glow orb — bottom left */}
          <div style={{
            position: 'absolute', bottom: -60, left: -60, width: 280, height: 280,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(180,130,40,0.12) 0%, transparent 65%)',
            pointerEvents: 'none',
          }} />

          {/* "All systems operational" pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(34,197,94,0.12)',
            border: '1px solid rgba(34,197,94,0.28)',
            borderRadius: 100, padding: '6px 14px', width: 'fit-content',
            marginBottom: 36,
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#22C55E',
              boxShadow: '0 0 8px 2px rgba(34,197,94,0.5)',
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#22C55E', letterSpacing: 0.2 }}>
              All systems operational
            </span>
          </div>

          {/* Headline */}
          <h2 style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#E8EDF5',
            lineHeight: 1.35,
            letterSpacing: -0.4,
            margin: '0 0 40px',
          }}>
            Command the{' '}
            <em style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontStyle: 'italic',
              color: '#C9A24B',
              fontWeight: 400,
              fontSize: 30,
            }}>
              entire
            </em>{' '}
            Dwell marketplace from one console.
          </h2>

          {/* Live stat cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>

            {/* Active listings */}
            <div style={{
              background: 'rgba(255,255,255,0.045)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 16,
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              backdropFilter: 'blur(8px)',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: 'rgba(44,85,127,0.30)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="#7AA8D4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 22V12h6v10" stroke="#7AA8D4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#E8EDF5', lineHeight: 1 }}>
                  {fmtNum(stats.activeListings)}
                </div>
                <div style={{ fontSize: 12.5, color: '#7A8CA3', fontWeight: 500, marginTop: 4 }}>
                  Active listings
                </div>
              </div>
              <div style={{
                fontSize: 12, fontWeight: 700, color: '#22C55E',
                background: 'rgba(34,197,94,0.12)',
                border: '1px solid rgba(34,197,94,0.22)',
                borderRadius: 100, padding: '3px 10px', flexShrink: 0,
              }}>
                live
              </div>
            </div>

            {/* Verified users */}
            <div style={{
              background: 'rgba(255,255,255,0.045)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 16,
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              backdropFilter: 'blur(8px)',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: 'rgba(100,60,150,0.30)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#B89AD4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="9" cy="7" r="4" stroke="#B89AD4" strokeWidth="1.8" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="#B89AD4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#E8EDF5', lineHeight: 1 }}>
                  {fmtNum(stats.verifiedUsers)}
                </div>
                <div style={{ fontSize: 12.5, color: '#7A8CA3', fontWeight: 500, marginTop: 4 }}>
                  Verified users
                </div>
              </div>
              <div style={{
                fontSize: 12, fontWeight: 700, color: '#22C55E',
                background: 'rgba(34,197,94,0.12)',
                border: '1px solid rgba(34,197,94,0.22)',
                borderRadius: 100, padding: '3px 10px', flexShrink: 0,
              }}>
                live
              </div>
            </div>

            {/* Pending moderation */}
            <div style={{
              background: 'rgba(255,255,255,0.045)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 16,
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              backdropFilter: 'blur(8px)',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: 'rgba(180,130,30,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#D4A84B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="12" y1="9" x2="12" y2="13" stroke="#D4A84B" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="12" y1="17" x2="12.01" y2="17" stroke="#D4A84B" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#E8EDF5', lineHeight: 1 }}>
                  {stats.pendingModeration}
                </div>
                <div style={{ fontSize: 12.5, color: '#7A8CA3', fontWeight: 500, marginTop: 4 }}>
                  Reports pending
                </div>
              </div>
              <div style={{
                fontSize: 12, fontWeight: 700, color: '#D4A84B',
                background: 'rgba(212,168,75,0.12)',
                border: '1px solid rgba(212,168,75,0.25)',
                borderRadius: 100, padding: '3px 10px', flexShrink: 0,
              }}>
                Review
              </div>
            </div>
          </div>

          {/* Admin avatar stack */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {stats.adminUsers.map((u, i) => (
                <div key={u.id} style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: i === 0 ? '#2C557F' : i === 1 ? '#5C3D8C' : '#1E6B45',
                  border: '2.5px solid #0D1B2A',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, color: '#fff',
                  marginLeft: i > 0 ? -10 : 0,
                  zIndex: 10 - i,
                  position: 'relative',
                }}>
                  {initials(u.name || 'Admin')}
                </div>
              ))}
              {stats.adminCount > 3 && (
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.10)',
                  border: '2.5px solid #0D1B2A',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800, color: '#7A8CA3',
                  marginLeft: -10, zIndex: 6, position: 'relative',
                }}>
                  +{stats.adminCount - 3}
                </div>
              )}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#C8D6E5' }}>
                {stats.adminCount} admin{stats.adminCount !== 1 ? 's' : ''} on team
              </div>
              <div style={{ fontSize: 11.5, color: '#4E6070', fontWeight: 500, marginTop: 1 }}>
                Console access · role verified
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
