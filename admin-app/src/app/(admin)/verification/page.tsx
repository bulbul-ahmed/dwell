import { db, owners, users } from '@/db';
import { eq, and, or, isNull, isNotNull, desc } from 'drizzle-orm';
import { getAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Topbar from '@/components/Topbar';
import { initials } from '@/lib/utils';
import VerifyActions from './VerifyActions';

export const dynamic = 'force-dynamic';

// Owner verification queue — submissions awaiting manual review:
//   individuals  → NID submitted, not yet verified
//   agencies     → status 'agency_pending'

export default async function VerificationPage() {
  const session = await getAdminSession();
  if (!session) redirect('/login');
  const adminInitials = initials(session.name);

  const rows = await db
    .select({
      id:             owners.id,
      name:           owners.name,
      type:           owners.type,
      status:         owners.status,
      phone:          owners.phone,
      address:        owners.address,
      nidNumber:      owners.nidNumber,
      nidDocUrl:      owners.nidDocUrl,
      businessName:   owners.businessName,
      tradeLicense:   owners.tradeLicense,
      businessDocUrl: owners.businessDocUrl,
      createdAt:      owners.createdAt,
      email:          users.email,
    })
    .from(owners)
    .leftJoin(users, eq(owners.userId, users.id))
    .where(and(
      isNull(owners.verifiedAt),
      or(eq(owners.status, 'agency_pending'), isNotNull(owners.nidNumber)),
    ))
    .orderBy(desc(owners.createdAt));

  return (
    <>
      <Topbar crumb="Trust & Safety" title="Owner verification" adminInitials={adminInitials} adminName={session.name} />
      <main style={{ padding: '26px 34px 60px', maxWidth: 1000 }}>
        <div style={{ fontSize: 13.5, color: '#8893A4', marginBottom: 18 }}>
          {rows.length} submission{rows.length === 1 ? '' : 's'} awaiting review.
        </div>

        {rows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '72px 0', color: '#8893A4', fontSize: 14, background: '#fff', border: '1px solid #ECEEF1', borderRadius: 16 }}>
            Nothing to review right now.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {rows.map(o => {
              const isAgency = o.type === 'Agency';
              const docUrl = isAgency ? o.businessDocUrl : o.nidDocUrl;
              return (
                <div key={o.id} style={{ background: '#fff', border: '1px solid #ECEEF1', borderRadius: 16, padding: 20, boxShadow: '0 1px 2px rgba(20,40,70,.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: '#15243B' }}>{o.name}</span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: isAgency ? '#7B3F9E' : '#1E3A5C', background: isAgency ? '#F3ECF8' : '#EEF3F8', padding: '3px 9px', borderRadius: 999 }}>
                          {isAgency ? 'Agency' : 'Individual'}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#9A6A1F', background: '#F7EFDD', padding: '3px 9px', borderRadius: 999 }}>{o.status}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '6px 18px', fontSize: 13, color: '#44506A' }}>
                        {o.email && <div><span style={{ color: '#9AA6B6' }}>Email: </span>{o.email}</div>}
                        {o.phone && <div><span style={{ color: '#9AA6B6' }}>Phone: </span>{o.phone}</div>}
                        {o.address && <div><span style={{ color: '#9AA6B6' }}>Address: </span>{o.address}</div>}
                        {isAgency ? (
                          <>
                            {o.businessName && <div><span style={{ color: '#9AA6B6' }}>Business: </span>{o.businessName}</div>}
                            {o.tradeLicense && <div><span style={{ color: '#9AA6B6' }}>Trade license: </span>{o.tradeLicense}</div>}
                          </>
                        ) : (
                          o.nidNumber && <div><span style={{ color: '#9AA6B6' }}>NID: </span>{o.nidNumber}</div>
                        )}
                      </div>
                      {docUrl && (
                        <a href={docUrl} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-block', marginTop: 12, fontSize: 13, fontWeight: 700, color: '#1E3A5C', textDecoration: 'none', border: '1px solid #DCE2EA', borderRadius: 9, padding: '7px 13px' }}>
                          📄 View document ↗
                        </a>
                      )}
                    </div>
                    <VerifyActions ownerId={o.id} isAgency={isAgency} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
