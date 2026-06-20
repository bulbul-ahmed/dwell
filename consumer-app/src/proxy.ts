import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, COOKIE_NAME } from '@/lib/jwt';

const PROTECTED = ['/account', '/messages', '/visits', '/saved', '/notifications', '/list', '/insights'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED.some(p => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (token) {
    const payload = await verifyToken(token);
    if (payload) return NextResponse.next();
  }

  const url = new URL('/auth', request.url);
  url.searchParams.set('next', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    '/account/:path*',
    '/messages/:path*',
    '/visits/:path*',
    '/saved/:path*',
    '/notifications/:path*',
    '/list/:path*',
    '/insights/:path*',
  ],
};
