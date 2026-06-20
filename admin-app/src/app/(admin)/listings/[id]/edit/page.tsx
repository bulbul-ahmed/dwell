import { db, listings } from '@/db';
import { eq } from 'drizzle-orm';
import { getAdminSession } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import Topbar from '@/components/Topbar';
import { initials } from '@/lib/utils';
import EditListingForm from './EditListingForm';

export default async function ListingEditPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) redirect('/login');

  const { id } = await params;
  const [listing] = await db
    .select()
    .from(listings)
    .where(eq(listings.id, parseInt(id)))
    .limit(1);

  if (!listing) notFound();

  const adminInitials = initials(session.name);

  return (
    <>
      <Topbar crumb="Catalog · Listings" title="Edit property" adminInitials={adminInitials} adminName={session.name} adminEmail={session.email} showBack />
      <main style={{ flex: 1, padding: '28px 34px 56px', minWidth: 0 }}>
        <div style={{ animation: 'bvfade .45s cubic-bezier(.22,1,.36,1) both', maxWidth: 860 }}>
          <div style={{
            background: '#fff', border: '1px solid #ECEEF1',
            borderRadius: 18, padding: 28,
            boxShadow: '0 1px 2px rgba(20,40,70,.03)',
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#15243B', margin: '0 0 22px' }}>
              Edit listing details
            </h2>
            <EditListingForm listing={{
              id: listing.id,
              title: listing.title,
              area: listing.area,
              cat: listing.cat,
              price: listing.price,
              beds: listing.beds,
              baths: listing.baths,
              size: listing.size,
              floor: listing.floor,
              furnishing: listing.furnishing,
              pref: listing.pref,
              advance: listing.advance,
              service: listing.service,
              description: listing.description ?? null,
              amenities: listing.amenities ?? [],
              landmark: listing.landmark ?? null,
              facing: listing.facing ?? null,
              totalFloors: listing.totalFloors ?? null,
              balconies: listing.balconies ?? null,
              verified: listing.verified,
              sale: listing.sale,
              featured: listing.featured,
            }} />
          </div>
        </div>
      </main>
    </>
  );
}
