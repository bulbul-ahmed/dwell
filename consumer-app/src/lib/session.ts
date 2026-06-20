import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/jwt';

const DEMO_USER_ID = 1;

export async function getSession(): Promise<number | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  const id = parseInt(payload.sub, 10);
  return isNaN(id) ? null : id;
}

export async function getSessionOrDemo(): Promise<number> {
  return (await getSession()) ?? DEMO_USER_ID;
}
