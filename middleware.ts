import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Public routes - accessible to everyone
  const isPublicRoute = pathname === '/' || pathname.startsWith('/api');

  // Auth callback route - must be accessible for Magic Link flow
  const isAuthCallback = pathname.startsWith('/auth/callback');

  // Guest-allowed routes - accessible without login (chat for initial contact)
  const isGuestRoute = pathname === '/chat';

  // Auth pages
  const isAuthPage = pathname.startsWith('/login');

  // Protected routes - require authentication
  const isAdminRoute = pathname.startsWith('/admin');
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isProtectedRoute = isAdminRoute || isDashboardRoute;

  if (isPublicRoute || isGuestRoute || isAuthCallback) {
    return NextResponse.next();
  }

  const supabase = createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const isAuth = !!userData?.user;

  if (isProtectedRoute && !isAuth) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userData?.user?.id)
      .single();

    if (profile?.role !== 'admin') {
      const homeUrl = new URL('/dashboard', req.url);
      return NextResponse.redirect(homeUrl);
    }
  }

  if (isAuth && isAuthPage) {
    const callbackUrl = req.nextUrl.searchParams.get('callbackUrl');
    const redirectUrl = new URL(callbackUrl || '/dashboard', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};