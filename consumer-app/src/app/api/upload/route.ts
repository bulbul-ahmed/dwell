import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const files = formData.getAll('files') as File[];

  if (files.length === 0) return NextResponse.json({ urls: [] });

  const uploadDir = join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadDir, { recursive: true });

  const urls: string[] = [];
  for (const file of files.slice(0, 20)) {
    const ext  = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const name = `${randomUUID()}.${ext}`;
    const buf  = Buffer.from(await file.arrayBuffer());
    await writeFile(join(uploadDir, name), buf);
    const base = process.env.NEXT_PUBLIC_APP_URL ?? '';
    urls.push(`${base}/uploads/${name}`);
  }

  return NextResponse.json({ urls });
}
