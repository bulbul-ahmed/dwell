import { cookies } from 'next/headers';
import { db, owners, users } from '@/db';
import { eq } from 'drizzle-orm';
import { verifyToken, COOKIE_NAME, type SessionPayload } from './jwt';

export interface ProviderSession extends SessionPayload {
  ownerId: number;
  ownerName: string;
  ownerType: string;
}

export async function getProviderSession(): Promise<ProviderSession | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await verifyToken(token);
  if (!session || session.role !== 'owner') return null;

  const [owner] = await db
    .select({ id: owners.id, name: owners.name, type: owners.type })
    .from(owners)
    .innerJoin(users, eq(owners.userId, users.id))
    .where(eq(users.id, Number(session.sub)))
    .limit(1);

  if (!owner) return null;

  return {
    ...session,
    ownerId: owner.id,
    ownerName: owner.name,
    ownerType: owner.type,
  };
}
