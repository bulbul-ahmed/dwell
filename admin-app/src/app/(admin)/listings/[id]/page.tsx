import { db, listings, owners, users } from '@/db';
import { eq, and, count } from 'drizzle-orm';
import { getAdminSession } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import Topbar from '@/components/Topbar';
import { bdFormat, initials, badge } from '@/lib/utils';
import ListingGallery from './ListingGallery';
import AdminActions from './AdminActions';
import AdminNotes from './AdminNotes';

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) redirect('/login');

  const { id } = await params;
  const [listing] = await db
    .select({
      id: listings.id, title: listings.title, area: listings.area,
      price: listings.price, cover: listings.cover, cat: listings.cat,
      beds: listings.beds, baths: listings.baths, size: listings.size,
      floor: listings.floor, furnishing: listings.furnishing, pref: listings.pref,
      advance: listings.advance, service: listings.service,
      description: listings.description, amenities: listings.amenities,
      shots: listings.shots, shotCats: listings.shotCats,
      verified: listings.verified, sale: listings.sale,
      mapX: listings.mapX, mapY: listings.mapY,
      landmark: listings.landmark, facing: listings.facing,
      totalFloors: listings.totalFloors, balconies: listings.balconies,
      videos: listings.videos, meta: listings.meta,
      adminNotes: listings.adminNotes,
      createdAt: listings.createdAt,
      ownerId: listings.ownerId,
      ownerName: owners.name, ownerType: owners.type,
      ownerUserId: owners.userId,
      ownerEmail: users.email, ownerPhone: users.phone,
    })
    .from(listings)
    .leftJoin(owners, eq(listings.ownerId, owners.id))
    .leftJoin(users, eq(owners.userId, users.id))
    .where(eq(listings.id, parseInt(id)))
    .limit(1);

  if (!listing) notFound();

  const [{ activeCount }] = await db
    .select({ activeCount: count() })
    .from(listings)
    .where(and(eq(listings.ownerId, listing.ownerId), eq(listings.verified, true)));

  const adminInitials = initials(session.name);
  const statusLabel = listing.verified ? 'Active' : 'Pending';
  const { fg, bg } = badge(statusLabel);

  const CAT_LABEL: Record<string, string> = {
    rent: 'Rent', buy: 'Buy/Sale', office: 'Office', sublet: 'Sublet', room: 'Room', student: 'Student Housing',
  };

  const meta = listing.meta as Record<string, unknown> | null;
  const isHostel = listing.cat === 'student' || listing.cat === 'room';
  const isOffice = listing.cat === 'office';

  const submittedDate = listing.createdAt
    ? new Date(listing.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <>
      <Topbar crumb="Catalog · Listings" title="Property detail" adminInitials={adminInitials} adminName={session.name} adminEmail={session.email} showBack />
      <main style={{ flex: 1, padding: '28px 34px 56px', minWidth: 0 }}>
        <div style={{ animation: 'bvfade .45s cubic-bezier(.22,1,.36,1) both' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 22, alignItems: 'start' }}>

            {/* Left */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Photos — client component for thumbnail switching */}
              <ListingGallery
                listingId={listing.id}
                cover={listing.cover}
                shots={listing.shots ?? []}
                shotCats={listing.shotCats ?? null}
                statusLabel={statusLabel}
                fg={fg}
                bg={bg}
                verified={listing.verified}
              />

              {/* Title + core facts */}
              <div style={{
                background: '#fff', border: '1px solid #ECEEF1',
                borderRadius: 18, padding: 24,
                boxShadow: '0 1px 2px rgba(20,40,70,.03)',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, marginBottom: 16 }}>
                  <div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: '#15243B', margin: '0 0 5px', letterSpacing: -0.4 }}>
                      {listing.title}
                    </h2>
                    <div style={{ fontSize: 14, color: '#8893A4' }}>{listing.area}</div>
                    {listing.landmark && (
                      <div style={{ fontSize: 13, color: '#8893A4', marginTop: 2 }}>📍 {listing.landmark}</div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#1E3A5C', whiteSpace: 'nowrap' }}>
                      ৳{bdFormat(listing.price)}{!listing.sale ? '/mo' : ''}
                    </div>
                    {listing.advance > 0 && (
                      <div style={{ fontSize: 12, color: '#8893A4', marginTop: 2 }}>{listing.advance} months advance</div>
                    )}
                    {listing.service > 0 && (
                      <div style={{ fontSize: 12, color: '#8893A4' }}>+ ৳{bdFormat(listing.service)} service</div>
                    )}
                  </div>
                </div>

                {/* Facts grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
                  {[
                    { k: 'Type', v: CAT_LABEL[listing.cat] ?? listing.cat },
                    ...(!isOffice ? [{ k: 'Beds', v: String(listing.beds) }] : []),
                    { k: 'Baths', v: String(listing.baths) },
                    ...(listing.size > 0 ? [{ k: 'Size', v: `${listing.size} sqft` }] : []),
                    { k: 'Floor', v: listing.floor || '—' },
                    ...(listing.totalFloors ? [{ k: 'Total floors', v: listing.totalFloors }] : []),
                    ...(listing.facing ? [{ k: 'Facing', v: listing.facing }] : []),
                    ...(listing.balconies ? [{ k: 'Balconies', v: String(listing.balconies) }] : []),
                    { k: 'Furnishing', v: listing.furnishing || '—' },
                    ...(listing.pref && listing.pref !== 'Any' ? [{ k: 'Preferred', v: listing.pref }] : []),
                  ].map(f => (
                    <div key={f.k} style={{
                      background: '#F7F9FC', border: '1px solid #EDF1F6',
                      borderRadius: 12, padding: 13,
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#9AA6B6', textTransform: 'uppercase', letterSpacing: 0.4 }}>{f.k}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#15243B', marginTop: 5, textTransform: 'capitalize' }}>{f.v}</div>
                    </div>
                  ))}
                </div>

                {listing.description && (
                  <p style={{ fontSize: 14.5, lineHeight: 1.65, color: '#44506A', margin: 0 }}>
                    {listing.description}
                  </p>
                )}
              </div>

              {/* Amenities */}
              {listing.amenities && listing.amenities.length > 0 && (
                <div style={{
                  background: '#fff', border: '1px solid #ECEEF1',
                  borderRadius: 18, padding: 24,
                  boxShadow: '0 1px 2px rgba(20,40,70,.03)',
                }}>
                  <h3 style={{ fontSize: 13, fontWeight: 800, color: '#9AA6B6', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 14px' }}>
                    Amenities
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {listing.amenities.map((a, i) => (
                      <span key={i} style={{
                        background: '#EEF3F8', color: '#1E3A5C', fontSize: 13, fontWeight: 600,
                        padding: '6px 12px', borderRadius: 999,
                      }}>{a}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Type-specific meta */}
              {meta && (
                <div style={{
                  background: '#fff', border: '1px solid #ECEEF1',
                  borderRadius: 18, padding: 24,
                  boxShadow: '0 1px 2px rgba(20,40,70,.03)',
                }}>
                  <h3 style={{ fontSize: 13, fontWeight: 800, color: '#9AA6B6', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 14px' }}>
                    {isHostel ? 'Hostel details' : isOffice ? 'Office details' : 'Additional details'}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {Object.entries(meta).map(([k, v]) => {
                      if (v === null || v === undefined || v === '') return null;
                      const label: Record<string, string> = {
                        gender: 'Gender', seatType: 'Seat type', totalSeats: 'Total seats',
                        curfew: 'Curfew', meals: 'Meals', desks: 'Workstations',
                        confRooms: 'Conf rooms', washrooms: 'Washrooms',
                      };
                      const displayVal = Array.isArray(v) ? (v as string[]).join(', ') || 'None' : String(v);
                      return (
                        <div key={k} style={{
                          background: '#F7F9FC', border: '1px solid #EDF1F6',
                          borderRadius: 12, padding: 13,
                        }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#9AA6B6', textTransform: 'uppercase', letterSpacing: 0.4 }}>{label[k] ?? k}</div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#15243B', marginTop: 5, textTransform: 'capitalize' }}>{displayVal}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Videos */}
              {listing.videos && listing.videos.length > 0 && (
                <div style={{
                  background: '#fff', border: '1px solid #ECEEF1',
                  borderRadius: 18, padding: 24,
                  boxShadow: '0 1px 2px rgba(20,40,70,.03)',
                }}>
                  <h3 style={{ fontSize: 13, fontWeight: 800, color: '#9AA6B6', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 14px' }}>
                    Videos ({listing.videos.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {listing.videos.map((v, i) => (
                      <div key={i} style={{ background: '#F7F9FC', border: '1px solid #EDF1F6', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#44506A', wordBreak: 'break-all' }}>
                        🎬 Cloudflare Stream: {v}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Right sticky */}
            <div style={{ position: 'sticky', top: 86, display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Admin actions — client component (reject modal, marketplace link) */}
              <AdminActions
                listingId={listing.id}
                verified={listing.verified}
                marketplaceUrl={process.env.NEXT_PUBLIC_MARKETPLACE_URL ?? 'http://localhost:3000'}
              />

              {/* Listed by */}
              <div style={{
                background: '#fff', border: '1px solid #ECEEF1',
                borderRadius: 18, padding: 22,
                boxShadow: '0 1px 2px rgba(20,40,70,.03)',
              }}>
                <h3 style={{ fontSize: 13, fontWeight: 800, color: '#9AA6B6', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 14px' }}>
                  Listed by
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 13, flexShrink: 0,
                    background: '#EEF3F8', color: '#1E3A5C',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 16,
                  }}>
                    {listing.ownerName ? listing.ownerName[0].toUpperCase() : '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: '#15243B' }}>{listing.ownerName}</div>
                    <div style={{ fontSize: 12.5, color: '#8893A4', marginTop: 1 }}>{listing.ownerType}</div>
                  </div>
                  <a href={`/users/${listing.ownerUserId}`} style={{ fontSize: 12, color: '#5C7FA3', textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}>View profile →</a>
                </div>

                {(listing.ownerEmail || listing.ownerPhone) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 12, borderBottom: '1px solid #EEF1F5' }}>
                    {listing.ownerEmail && (
                      <a href={`mailto:${listing.ownerEmail}`} style={{ fontSize: 12.5, color: '#44506A', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#9AA6B6' }}>✉</span> {listing.ownerEmail}
                      </a>
                    )}
                    {listing.ownerPhone && (
                      <a href={`tel:${listing.ownerPhone}`} style={{ fontSize: 12.5, color: '#44506A', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#9AA6B6' }}>✆</span> {listing.ownerPhone}
                      </a>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: listing.ownerEmail || listing.ownerPhone ? 10 : 0 }}>
                  <span style={{ fontSize: 12.5, color: '#9AA6B6' }}>Active listings</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1E3A5C' }}>{activeCount}</span>
                </div>

                {submittedDate && (
                  <div style={{ marginTop: 8, fontSize: 12.5, color: '#9AA6B6' }}>
                    Submitted {submittedDate}
                  </div>
                )}
              </div>

              {/* Pricing summary */}
              <div style={{
                background: '#fff', border: '1px solid #ECEEF1',
                borderRadius: 18, padding: 22,
                boxShadow: '0 1px 2px rgba(20,40,70,.03)',
              }}>
                <h3 style={{ fontSize: 13, fontWeight: 800, color: '#9AA6B6', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 14px' }}>
                  Pricing
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { k: listing.sale ? 'Sale price' : 'Monthly rent', v: `৳${bdFormat(listing.price)}` },
                    ...(listing.advance > 0 ? [{ k: 'Advance', v: `${listing.advance} months` }] : []),
                    ...(listing.service > 0 ? [{ k: 'Service charge', v: `৳${bdFormat(listing.service)}/mo` }] : []),
                  ].map(r => (
                    <div key={r.k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: '#8893A4' }}>{r.k}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#15243B' }}>{r.v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map coords if present */}
              {(listing.mapX || listing.mapY) && (
                <div style={{
                  background: '#fff', border: '1px solid #ECEEF1',
                  borderRadius: 18, padding: 22,
                  boxShadow: '0 1px 2px rgba(20,40,70,.03)',
                }}>
                  <h3 style={{ fontSize: 13, fontWeight: 800, color: '#9AA6B6', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 10px' }}>
                    Map pin
                  </h3>
                  <div style={{ fontSize: 13, color: '#44506A' }}>
                    {listing.mapX}, {listing.mapY}
                  </div>
                </div>
              )}

              {/* Internal admin notes */}
              <AdminNotes listingId={listing.id} initialNotes={listing.adminNotes ?? ''} />

            </div>
          </div>
        </div>
      </main>
    </>
  );
}
