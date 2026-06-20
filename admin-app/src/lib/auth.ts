import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME, type SessionPayload } from './jwt';

export async function getAdminSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifyToken(token);
  if (!session || session.role !== 'admin') return null;
  return session;
}
