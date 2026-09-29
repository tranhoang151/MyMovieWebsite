import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Lấy token từ cookie hoặc localStorage (chỉ check cookie ở server side)
  const accessToken = request.cookies.get('accessToken')?.value;
  const userRole = request.cookies.get('userRole')?.value;

  // Bảo vệ routes user (watchlist, profile)
  if (pathname.startsWith('/watchlist') || pathname.startsWith('/profile')) {
    if (!accessToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Bảo vệ routes admin
  if (pathname.startsWith('/admin')) {
    if (!accessToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/watchlist/:path*',
    '/profile/:path*',
    '/admin/:path*',
  ],
};