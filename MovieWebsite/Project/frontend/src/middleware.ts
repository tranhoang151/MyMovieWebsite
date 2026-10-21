import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Lấy token từ cookie (server-side) hoặc Authorization header (client-side)
  const accessToken = 
    request.cookies.get('accessToken')?.value ?? 
    request.headers.get('authorization')?.split('Bearer ')[1];

  // Bảo vệ routes user (watchlist, profile)
  if (pathname.startsWith('/watchlist') || pathname.startsWith('/profile')) {
    if (!accessToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Bảo vệ routes admin (chỉ cần kiểm tra authenticated, backend sẽ xử lý authorization)
  if (pathname.startsWith('/admin')) {
    if (!accessToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Loại bỏ kiểm tra role ở frontend vì backend đã có RolesGuard properly configured
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