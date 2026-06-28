import { redirect } from 'next/navigation';
import { db, users, saves, bookings, reviews, owners } from '@/db';
import { eq, count } from 'drizzle-orm';
import { getSession } from '@/lib/session';
import AccountClient from './AccountClient';

export default async function AccountPage() {
  const userId = await getSession();
  if (!userId) redirect('/auth');

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) redirect('/auth');

  const [
    [{ savedCount }],
    [{ visitsCount }],
    [{ reviewsCount }],
    ownerRows,
  ] = await Promise.all([
    db.select({ savedCount: count() }).from(saves).where(eq(saves.userId, userId)),
    db.select({ visitsCount: count() }).from(bookings).where(eq(bookings.userId, userId)),
    db.select({ reviewsCount: count() }).from(reviews).where(eq(reviews.userId, userId)),
    db.select({
      id:             owners.id,
      type:           owners.type,
      status:         owners.status,
      verified:       owners.verified,
      nidDocUrl:      owners.nidDocUrl,
      businessDocUrl: owners.businessDocUrl,
      phone:          owners.phone,
    }).from(owners).where(eq(owners.userId, userId)).limit(1),
  ]);

  return (
    <AccountClient
      initialUser={{
        id:          user.id,
        name:        user.name,
        email:       user.email,
        phone:       user.phone,
        role:        user.role,
        createdAt:   user.createdAt instanceof Date ? user.createdAt.toISOString() : String(user.createdAt),
        hasPassword: !!user.passwordHash,
        avatarUrl:   user.avatarUrl,
      }}
      initialStats={{ savedCount, visitsCount, reviewsCount }}
      initialOwner={ownerRows[0] ? {
        id:             ownerRows[0].id,
        type:           ownerRows[0].type,
        status:         ownerRows[0].status,
        verified:       ownerRows[0].verified,
        nidDocUrl:      ownerRows[0].nidDocUrl ?? null,
        businessDocUrl: ownerRows[0].businessDocUrl ?? null,
        phone:          ownerRows[0].phone ?? null,
      } : null}
    />
  );
}
