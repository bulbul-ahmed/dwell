import { NextRequest, NextResponse } from 'next/server';
import { db, listings } from '@/db';
import { eq } from 'drizzle-orm';
import { getAdminSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { id: number; action: string; photoUrl?: string };
  const { id, action, photoUrl } = body;

  if (!id || !action) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

  const [listing] = await db
    .select({ cover: listings.cover, shots: listings.shots, shotCats: listings.shotCats })
    .from(listings)
    .where(eq(listings.id, id))
    .limit(1);

  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const shots = listing.shots ?? [];
  const shotCats = listing.shotCats ?? [];

  if (action === 'delete' && photoUrl) {
    if (listing.cover === photoUrl) {
      const newCover = shots[0] ?? '';
      const newShots = shots.slice(1);
      const newShotCats = shotCats.slice(1);
      await db.update(listings).set({ cover: newCover, shots: newShots, shotCats: newShotCats }).where(eq(listings.id, id));
    } else {
      const idx = shots.indexOf(photoUrl);
      if (idx !== -1) {
        const newShots = [...shots.slice(0, idx), ...shots.slice(idx + 1)];
        const newShotCats = [...shotCats.slice(0, idx), ...shotCats.slice(idx + 1)];
        await db.update(listings).set({ shots: newShots, shotCats: newShotCats }).where(eq(listings.id, id));
      }
    }
  }

  if (action === 'set-cover' && photoUrl) {
    if (listing.cover !== photoUrl) {
      const idx = shots.indexOf(photoUrl);
      if (idx !== -1) {
        const newShots = [listing.cover, ...shots.slice(0, idx), ...shots.slice(idx + 1)].filter(Boolean) as string[];
        const oldCoverCat = 'Cover';
        const removedCat = shotCats[idx] ?? '';
        const newShotCats = [oldCoverCat, ...shotCats.slice(0, idx), ...shotCats.slice(idx + 1)];
        void removedCat;
        await db.update(listings).set({ cover: photoUrl, shots: newShots, shotCats: newShotCats }).where(eq(listings.id, id));
      }
    }
  }

  return NextResponse.json({ ok: true });
}
