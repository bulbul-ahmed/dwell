import { NextRequest, NextResponse } from 'next/server';
import { db, categories } from '@/db';
import { asc } from 'drizzle-orm';
import { requireAdmin, logConfig, badRequest } from '@/lib/config-api';

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function GET() {
  const auth = await requireAdmin();
  if ('res' in auth) return auth.res;
  const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.id));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ('res' in auth) return auth.res;

  const body = await req.json().catch(() => null);
  const label = typeof body?.label === 'string' ? body.label.trim() : '';
  if (!label) return badRequest('label required');
  const slug = typeof body?.slug === 'string' && body.slug.trim() ? slugify(body.slug) : slugify(label);
  const bg = typeof body?.bg === 'string' ? body.bg : '#EEF3F8';
  const fg = typeof body?.fg === 'string' ? body.fg : '#1E3A5C';

  const [row] = await db.insert(categories).values({ label, slug, bg, fg }).returning();
  await logConfig(auth.session, 'category', row.id, 'create', `Added category “${label}”`);
  return NextResponse.json(row, { status: 201 });
}
