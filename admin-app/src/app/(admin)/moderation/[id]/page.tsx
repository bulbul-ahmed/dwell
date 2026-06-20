import { db, listings, owners } from '@/db';
import { eq } from 'drizzle-orm';
import { getAdminSession } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import Topbar from '@/components/Topbar';
import { bdFormat, initials } from '@/lib/utils';

export default async function ModerationReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) redirect('/login');

  const { id } = await params;
  const listingId = parseInt(id);

  const [listing] = await db
    .select({
      id: listings.id, title: listings.title, area: listings.area,
      price: listings.price, cover: listings.cover, cat: listings.cat,
      beds: listings.beds, baths: listings.baths, size: listings.size,
      furnishing: listings.furnishing, floor: listings.floor,
      description: listings.description, amenities: listings.amenities,
      shots: listings.shots, verified: listings.verified,
      ownerName: owners.name, ownerType: owners.type,
    })
    .from(listings)
    .leftJoin(owners, eq(listings.ownerId, owners.id))
    .where(eq(listings.id, listingId))
    .limit(1);

  if (!listing) notFound();

  const adminInitials = initials(session.name);

  const checks = [
    { label: 'Photos present', note: `${(listing.shots?.length ?? 0) + 1} photos uploaded`, pass: (listing.shots?.length ?? 0) >= 0, bg: '#E7F1EC', fg: '#2E7D55', icon: '✓' },
    { label: 'Price in range', note: `৳${bdFormat(listing.price)}/mo`, pass: listing.price > 0, bg: '#E7F1EC', fg: '#2E7D55', icon: '✓' },
    { label: 'Description', note: listing.description ? 'Description provided' : 'Missing description', pass: !!listing.description, bg: listing.description ? '#E7F1EC' : '#F8E8E3', fg: listing.description ? '#2E7D55' : '#B4402B', icon: listing.description ? '✓' : '!' },
    { label: 'Amenities listed', note: `${listing.amenities?.length ?? 0} amenities`, pass: (listing.amenities?.length ?? 0) > 0, bg: (listing.amenities?.length ?? 0) > 0 ? '#E7F1EC' : '#F7EFDD', fg: (listing.amenities?.length ?? 0) > 0 ? '#2E7D55' : '#9A6A1F', icon: (listing.amenities?.length ?? 0) > 0 ? '✓' : '~' },
  ];

  const facts = [
    { k: 'Category', v: listing.cat },
    { k: 'Beds', v: String(listing.beds) },
    { k: 'Baths', v: String(listing.baths) },
    { k: 'Size', v: `${listing.size} sqft` },
    { k: 'Floor', v: listing.floor },
    { k: 'Furnishing', v: listing.furnishing },
    { k: 'Advance', v: listing.price > 0 ? `৳${bdFormat(listing.price * 2)}` : '—' },
  ];

  return (
    <>
      <Topbar crumb="Trust & Safety · Moderation" title="Review listing" adminInitials={adminInitials} adminName={session.name} adminEmail={session.email} showBack />
      <main style={{ flex: 1, padding: '28px 34px 56px', minWidth: 0 }}>
        <div style={{ animation: 'bvfade .45s cubic-bezier(.22,1,.36,1) both' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 22, alignItems: 'start' }}>

            {/* Left: listing content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{
                background: '#fff', border: '1px solid #ECEEF1',
                borderRadius: 18, overflow: 'hidden',
                boxShadow: '0 1px 2px rgba(20,40,70,.03)',
              }}>
                <div style={{
                  height: 320,
                  backgroundImage: `url('${listing.cover}')`,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  backgroundColor: '#DDD3C5', position: 'relative',
                }}>
                  <span style={{
                    position: 'absolute', top: 14, left: 14,
                    fontSize: 11, fontWeight: 800, color: '#fff',
                    background: 'rgba(154,106,31,0.95)',
                    padding: '5px 12px', borderRadius: 999,
                    textTransform: 'uppercase', letterSpacing: 0.5,
                  }}>In review</span>
                </div>
                {listing.shots && listing.shots.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, padding: 10 }}>
                    {listing.shots.slice(0, 4).map((sh, i) => (
                      <div key={i} style={{
                        aspectRatio: '4/3', borderRadius: 10,
                        backgroundImage: `url('${sh}')`,
                        backgroundSize: 'cover', backgroundPosition: 'center',
                        backgroundColor: '#DDD3C5',
                      }} />
                    ))}
                  </div>
                )}
              </div>

              <div style={{
                background: '#fff', border: '1px solid #ECEEF1',
                borderRadius: 18, padding: 24,
                boxShadow: '0 1px 2px rgba(20,40,70,.03)',
              }}>
                <h2 style={{
                  fontSize: 21, fontWeight: 800, color: '#15243B',
                  margin: '0 0 6px', letterSpacing: -0.4,
                }}>{listing.title}</h2>
                <div style={{ fontSize: 14, color: '#8893A4', marginBottom: 18 }}>
                  {listing.area} · listed by {listing.ownerName}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 22 }}>
                  {facts.slice(0, 4).map(f => (
                    <div key={f.k} style={{
                      background: '#F7F9FC', border: '1px solid #EDF1F6',
                      borderRadius: 12, padding: 13,
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#9AA6B6', textTransform: 'uppercase', letterSpacing: 0.4 }}>{f.k}</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#15243B', marginTop: 5, textTransform: 'capitalize' }}>{f.v}</div>
                    </div>
                  ))}
                </div>
                {listing.description && (
                  <>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: '#9AA6B6', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                      Description
                    </div>
                    <p style={{ fontSize: 14.5, lineHeight: 1.65, color: '#44506A', margin: '0 0 20px' }}>
                      {listing.description}
                    </p>
                  </>
                )}
                {listing.amenities && listing.amenities.length > 0 && (
                  <>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: '#9AA6B6', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                      Amenities
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {listing.amenities.map(a => (
                        <span key={a} style={{
                          fontSize: 12.5, fontWeight: 600, color: '#44506A',
                          background: '#F4F6F9', border: '1px solid #E9EDF2',
                          padding: '6px 12px', borderRadius: 999,
                        }}>{a}</span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right: moderation panel sticky */}
            <div style={{ position: 'sticky', top: 86, display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Automated checks */}
              <div style={{
                background: '#fff', border: '1px solid #ECEEF1',
                borderRadius: 18, padding: 22,
                boxShadow: '0 1px 2px rgba(20,40,70,.03)',
              }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#15243B', margin: '0 0 16px' }}>
                  Automated checks
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {checks.map(c => (
                    <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8,
                        background: c.bg, color: c.fg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, fontWeight: 800, fontSize: 13,
                      }}>{c.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#15243B' }}>{c.label}</div>
                        <div style={{ fontSize: 11.5, color: '#8893A4' }}>{c.note}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decision */}
              <div style={{
                background: '#fff', border: '1px solid #ECEEF1',
                borderRadius: 18, padding: 22,
                boxShadow: '0 1px 2px rgba(20,40,70,.03)',
              }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#15243B', margin: '0 0 6px' }}>Decision</h3>
                <p style={{ fontSize: 12.5, color: '#8893A4', margin: '0 0 16px', lineHeight: 1.5 }}>
                  Approve to publish publicly, or reject with a reason sent to the provider.
                </p>
                <textarea
                  placeholder="Add an internal note or message to the provider…"
                  style={{
                    width: '100%', minHeight: 78, border: '1px solid #E2E7EE',
                    borderRadius: 12, padding: '12px 14px', fontFamily: 'inherit',
                    fontSize: 13.5, color: '#15243B', resize: 'vertical',
                    outline: 'none', marginBottom: 14, boxSizing: 'border-box',
                  }}
                />
                <form action="/api/admin/moderation" method="POST" style={{ marginBottom: 10 }}>
                  <input type="hidden" name="id" value={listing.id} />
                  <input type="hidden" name="action" value="approve" />
                  <button
                    type="submit"
                    className="bv-press"
                    style={{
                      width: '100%', height: 46, borderRadius: 13, border: 'none',
                      cursor: 'pointer', fontFamily: 'inherit', fontSize: 14.5, fontWeight: 700,
                      color: '#fff', background: '#2E7D55',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      boxShadow: '0 12px 24px -10px rgba(46,125,85,.6)',
                    }}
                  >
                    ✓ Approve & publish
                  </button>
                </form>
                <form action="/api/admin/moderation" method="POST">
                  <input type="hidden" name="id" value={listing.id} />
                  <input type="hidden" name="action" value="reject" />
                  <button
                    type="submit"
                    className="bv-press bv-fill"
                    style={{
                      '--fill': '#F8E8E3',
                      width: '100%', height: 44, borderRadius: 12,
                      border: '1px solid #F0D9D2', background: '#fff', cursor: 'pointer',
                      fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700, color: '#B4402B',
                    } as React.CSSProperties}
                  >
                    Reject
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}
