import { NextRequest, NextResponse } from 'next/server';
import { db, listings } from '@/db';
import { eq } from 'drizzle-orm';
import { getAdminSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const id = parseInt(formData.get('id') as string);
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const title       = formData.get('title') as string;
  const area        = formData.get('area') as string;
  const cat         = formData.get('cat') as string;
  const price       = parseInt(formData.get('price') as string);
  const beds        = parseInt(formData.get('beds') as string);
  const baths       = parseInt(formData.get('baths') as string);
  const size        = parseInt(formData.get('size') as string);
  const floor       = formData.get('floor') as string;
  const furnishing  = formData.get('furnishing') as string;
  const pref        = formData.get('pref') as string;
  const advance     = parseInt(formData.get('advance') as string);
  const service     = parseInt(formData.get('service') as string);
  const description = formData.get('description') as string;
  const landmark    = formData.get('landmark') as string;
  const facing      = formData.get('facing') as string;
  const totalFloors = formData.get('totalFloors') as string;
  const balconies   = parseInt(formData.get('balconies') as string);
  const amenitiesRaw = formData.get('amenities') as string;
  const amenities   = amenitiesRaw ? amenitiesRaw.split(',').map(a => a.trim()).filter(Boolean) : [];
  const status      = formData.get('status') as string;
  const featuredRaw = formData.get('featured') as string;

  const verified  = status === 'active';
  const sale      = status === 'rented';
  const featured  = featuredRaw === '1';

  await db.update(listings).set({
    ...(title       && { title }),
    ...(area        && { area }),
    ...(cat         && { cat: cat as 'rent' | 'buy' | 'sublet' | 'student' | 'room' | 'office' }),
    ...(price > 0   && { price }),
    ...(!isNaN(beds)      && { beds }),
    ...(!isNaN(baths)     && { baths }),
    ...(!isNaN(size)      && { size }),
    ...(floor             && { floor }),
    ...(furnishing        && { furnishing }),
    ...(pref              && { pref }),
    ...(!isNaN(advance)   && { advance }),
    ...(!isNaN(service)   && { service }),
    ...(description !== null && { description }),
    ...(landmark !== null    && { landmark: landmark || null }),
    ...(facing !== null      && { facing: facing || null }),
    ...(totalFloors !== null && { totalFloors: totalFloors || null }),
    ...(!isNaN(balconies)   && { balconies }),
    amenities,
    ...(status && { verified, sale }),
    featured,
  }).where(eq(listings.id, id));

  return NextResponse.redirect(new URL(`/listings/${id}?saved=1`, req.url));
}
