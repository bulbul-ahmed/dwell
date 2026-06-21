import { NextRequest, NextResponse } from 'next/server';
import { db, listings, owners, users, notifications } from '@/db';
import { eq } from 'drizzle-orm';
import { getAdminSession } from '@/lib/auth';
import { notifyUser } from '@/lib/notify-user';
import { sendApprovalEmail, sendRejectionEmail } from '@/lib/email';
import { sendApprovalSMS, sendRejectionSMS } from '@/lib/sms';

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const id       = parseInt(formData.get('id') as string);
  const action   = formData.get('action') as string;
  const reason   = (formData.get('reason') as string) || '';
  const note     = (formData.get('note') as string) || '';

  if (!id || !action) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

  // Fetch listing + owner + user in one query
  const [row] = await db
    .select({
      listingId:    listings.id,
      listingTitle: listings.title,
      listingArea:  listings.area,
      ownerUserId:  owners.userId,
      ownerEmail:   users.email,
      ownerPhone:   users.phone,
      ownerName:    users.name,
    })
    .from(listings)
    .leftJoin(owners, eq(listings.ownerId, owners.id))
    .leftJoin(users, eq(owners.userId, users.id))
    .where(eq(listings.id, id))
    .limit(1);

  if (!row) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

  const userId = row.ownerUserId;

  if (action === 'approve') {
    await db.update(listings)
      .set({ verified: true, moderationStatus: 'active', rejectionReason: null })
      .where(eq(listings.id, id));

    // In-app notification
    if (userId) {
      await db.insert(notifications).values({
        userId,
        type:  'listing',
        title: 'Your listing is now live!',
        body:  `"${row.listingTitle}" has been approved and is visible to renters on Dwell.`,
        href:  `/listings/${id}`,
        icon:  'ti-home',
        icoBg: '#DCFCE7',
        icoFg: '#16A34A',
        read:  false,
      });
      await notifyUser(userId, { kind: 'notification' });
    }

    // Email + SMS (fire-and-forget — don't block redirect on failure)
    if (row.ownerEmail) {
      sendApprovalEmail({
        to:           row.ownerEmail,
        ownerName:    row.ownerName ?? 'there',
        listingTitle: row.listingTitle,
        listingArea:  row.listingArea,
        listingId:    id,
      }).catch(e => console.error('[approve:email]', e));
    }

    if (row.ownerPhone) {
      sendApprovalSMS({
        phone:        row.ownerPhone,
        listingTitle: row.listingTitle,
        listingId:    id,
      }).catch(e => console.error('[approve:sms]', e));
    }

    return NextResponse.redirect(new URL(`/listings/${id}`, req.url));
  }

  if (action === 'reject') {
    const rejectionReason = reason || 'Policy violation';

    await db.update(listings)
      .set({ verified: false, moderationStatus: 'rejected', rejectionReason })
      .where(eq(listings.id, id));

    // In-app notification
    if (userId) {
      await db.insert(notifications).values({
        userId,
        type:  'listing',
        title: 'Your listing was not approved',
        body:  `"${row.listingTitle}" was rejected: ${rejectionReason}. Please edit and resubmit.`,
        href:  `/list?edit=${id}`,
        icon:  'ti-home',
        icoBg: '#FDF1EF',
        icoFg: '#B4402B',
        read:  false,
      });
      await notifyUser(userId, { kind: 'notification' });
    }

    // Email + SMS
    if (row.ownerEmail) {
      sendRejectionEmail({
        to:           row.ownerEmail,
        ownerName:    row.ownerName ?? 'there',
        listingTitle: row.listingTitle,
        listingArea:  row.listingArea,
        listingId:    id,
        reason:       rejectionReason,
        note:         note || undefined,
      }).catch(e => console.error('[reject:email]', e));
    }

    if (row.ownerPhone) {
      sendRejectionSMS({
        phone:        row.ownerPhone,
        listingTitle: row.listingTitle,
        listingId:    id,
        reason:       rejectionReason,
      }).catch(e => console.error('[reject:sms]', e));
    }

    return NextResponse.redirect(new URL('/moderation', req.url));
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
