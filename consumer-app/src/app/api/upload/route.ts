import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { getSession } from '@/lib/session';

// Image uploads only — verified by magic bytes, not the (spoofable) filename.
const MAX_BYTES = 8 * 1024 * 1024; // 8MB per file
const ALLOWED: Record<string, string> = {
  jpg: 'ffd8ff', jpeg: 'ffd8ff', png: '89504e47', webp: '52494646', gif: '47494638',
};

function sniffExt(buf: Buffer): string | null {
  const hex = buf.subarray(0, 4).toString('hex');
  if (hex.startsWith('ffd8ff')) return 'jpg';
  if (hex.startsWith('89504e47')) return 'png';
  if (hex.startsWith('47494638')) return 'gif';
  if (hex.startsWith('52494646')) return 'webp'; // RIFF container (webp)
  return null;
}

export async function POST(request: NextRequest) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const files = formData.getAll('files') as File[];
  if (files.length === 0) return NextResponse.json({ urls: [] });

  const uploadDir = join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadDir, { recursive: true });

  const urls: string[] = [];
  for (const file of files.slice(0, 20)) {
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large (max 8MB)' }, { status: 413 });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const ext = sniffExt(buf);
    if (!ext || !ALLOWED[ext]) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 415 });
    }
    const name = `${randomUUID()}.${ext}`;
    await writeFile(join(uploadDir, name), buf);
    // Relative URL — avoids baking a host (works across localhost/LAN/prod).
    urls.push(`/uploads/${name}`);
  }

  return NextResponse.json({ urls });
}
