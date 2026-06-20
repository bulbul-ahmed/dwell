import { NextResponse } from 'next/server';
import { db, configAudit } from '@/db';
import { getAdminSession } from '@/lib/auth';
import type { SessionPayload } from '@/lib/jwt';

// Guard: returns the admin session, or a 401 response to return early.
export async function requireAdmin(): Promise<
  { session: SessionPayload } | { res: NextResponse }
> {
  const session = await getAdminSession();
  if (!session) return { res: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  return { session };
}

export type ConfigEntity = 'block' | 'amenity' | 'category' | 'pricing';
export type ConfigAction = 'create' | 'update' | 'delete' | 'toggle';

// Append-only audit entry for a config mutation.
export async function logConfig(
  session: SessionPayload,
  entity: ConfigEntity,
  entityId: number | null,
  action: ConfigAction,
  summary: string,
) {
  await db.insert(configAudit).values({
    adminName:  session.name,
    adminEmail: session.email,
    entity,
    entityId,
    action,
    summary,
  });
}

export function badRequest(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}

export function notFound() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

// Parse + validate a numeric route id.
export function parseId(id: string): number | null {
  const n = parseInt(id, 10);
  return Number.isInteger(n) && n > 0 ? n : null;
}
