import { redirect } from 'next/navigation';
import { db, users, saves, bookings, reviews } from '@/db';
import { eq, count } from 'drizzle-orm';
import { getSession } from '@/lib/session';
import AccountClient from './AccountClient';

export default async function AccountPage() {
  const userId = await getSession();
  if (!userId) redirect('/auth');

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) redirect('/auth');

  const [[{ savedCount }], [{ visitsCount }], [{ reviewsCount }]] = await Promise.all([
    db.select({ savedCount: count() }).from(saves).where(eq(saves.userId, userId)),
    db.select({ visitsCount: count() }).from(bookings).where(eq(bookings.userId, userId)),
    db.select({ reviewsCount: count() }).from(reviews).where(eq(reviews.userId, userId)),
  ]);

  return (
    <AccountClient
      initialUser={{
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : String(user.createdAt),
        hasPassword: !!user.passwordHash,
        avatarUrl: user.avatarUrl,
      }}
      initialStats={{ savedCount, visitsCount, reviewsCount }}
    />
  );
}
