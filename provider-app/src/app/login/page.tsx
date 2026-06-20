import { db, listings, owners } from '@/db';
import { count, eq } from 'drizzle-orm';
import { Home, Building2, Star } from 'lucide-react';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getPlatformStats() {
  try {
    const [totalListings] = await db.select({ count: count() }).from(listings);
    const [activeListings] = await db.select({ count: count() }).from(listings).where(eq(listings.verified, true));
    const [ownerCount] = await db.select({ count: count() }).from(owners);

    return {
      totalListings: totalListings.count,
      activeListings: activeListings.count,
      ownerCount: ownerCount.count,
    };
  } catch {
    return { totalListings: 0, activeListings: 0, ownerCount: 0 };
  }
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
      <div style={{
        position: 'fixed', top: -160, left: -100, width: 600, height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(30,100,60,0.22) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: -120, right: -80, width: 500, height: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(180,130,30,0.14) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

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

        {/* LEFT — form */}
        <div style={{
          flex: '0 0 460px',
          background: '#fff',
          padding: '48px 48px 40px',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'linear-gradient(140deg, #3D9966, #2E7D55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 20px -6px rgba(46,125,85,0.5)',
              flexShrink: 0,
            }}>
              <Home size={21} color="#fff" strokeWidth={2.1} />
            </div>
            <div>
              <div style={{ fontSize: 21, fontWeight: 800, color: '#15243B', lineHeight: 1 }}>Dwell</div>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1.6, color: '#AEB8C6', marginTop: 3.5, textTransform: 'uppercase' }}>
                Owner Portal
              </div>
            </div>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#15243B', margin: '0 0 8px', letterSpacing: -0.5 }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 14, color: '#6B7A8F', margin: '0 0 34px', lineHeight: 1.55 }}>
            Manage your listings, leads, and visits from your owner dashboard.
          </p>

          <LoginForm />
        </div>

        {/* RIGHT — dark panel */}
        <div style={{
          flex: 1,
          background: 'linear-gradient(155deg, #081A10 0%, #071628 55%, #090F1D 100%)',
          padding: '48px 44px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -80, right: -80, width: 360, height: 360,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(40,140,80,0.25) 0%, transparent 65%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: -60, left: -60, width: 280, height: 280,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(180,130,40,0.12) 0%, transparent 65%)',
            pointerEvents: 'none',
          }} />

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
              Platform live
            </span>
          </div>

          <h2 style={{
            fontSize: 28, fontWeight: 700, color: '#E8EDF5',
            lineHeight: 1.35, letterSpacing: -0.4, margin: '0 0 40px',
          }}>
            Your listings,{' '}
            <em style={{
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic', color: '#C9A24B',
              fontWeight: 400, fontSize: 30,
            }}>
              perfectly
            </em>{' '}
            managed.
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
            {[
              { icon: <Home size={18} color="#7AA8D4" />, bg: 'rgba(44,85,127,0.30)', value: fmtNum(stats.activeListings), label: 'Active listings', pill: { text: 'live', color: '#22C55E', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.22)' } },
              { icon: <Building2 size={18} color="#B89AD4" />, bg: 'rgba(100,60,150,0.30)', value: fmtNum(stats.ownerCount), label: 'Registered owners', pill: { text: 'growing', color: '#7AA8D4', bg: 'rgba(122,168,212,0.12)', border: 'rgba(122,168,212,0.22)' } },
              { icon: <Star size={18} color="#D4A84B" />, bg: 'rgba(180,130,30,0.22)', value: fmtNum(stats.totalListings), label: 'Total listings', pill: { text: 'all time', color: '#D4A84B', bg: 'rgba(212,168,75,0.12)', border: 'rgba(212,168,75,0.25)' } },
            ].map(({ icon, bg, value, label, pill }) => (
              <div key={label} style={{
                background: 'rgba(255,255,255,0.045)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 16, padding: '18px 20px',
                display: 'flex', alignItems: 'center', gap: 16,
                backdropFilter: 'blur(8px)',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#E8EDF5', lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 12.5, color: '#7A8CA3', fontWeight: 500, marginTop: 4 }}>{label}</div>
                </div>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: pill.color,
                  background: pill.bg, border: `1px solid ${pill.border}`,
                  borderRadius: 100, padding: '3px 10px', flexShrink: 0,
                }}>
                  {pill.text}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 28 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#C8D6E5' }}>
              Dwell Owner Portal
            </div>
            <div style={{ fontSize: 11.5, color: '#4E6070', fontWeight: 500, marginTop: 1 }}>
              Manage listings · track leads · schedule visits
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
