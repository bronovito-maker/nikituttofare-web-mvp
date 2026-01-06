import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: DO NOT remove this line - it refreshes the session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public routes - accessible to everyone
  const isPublicRoute = pathname === '/' || pathname.startsWith('/api');
  
  // Auth callback route - must be accessible for Magic Link flow
  const isAuthCallback = pathname.startsWith('/auth/callback');
  
  // Guest-allowed routes - accessible without login (chat for initial contact)
  const isGuestRoute = pathname === '/chat' || pathname === '/privacy';
  
  // Auth pages
  const isAuthPage = pathname.startsWith('/login');
  
  // Protected routes - require authentication
  const isAdminRoute = pathname.startsWith('/admin');
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isProtectedRoute = isAdminRoute || isDashboardRoute;

  // Allow public routes, guest routes, and auth callback
  if (isPublicRoute || isGuestRoute || isAuthCallback) {
    return supabaseResponse;
  }

  // Redirect to login if trying to access protected route without auth
  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin route protection - check role
  if (isAdminRoute && user) {
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      const homeUrl = new URL('/dashboard', request.url);
      return NextResponse.redirect(homeUrl);
    }
  }

  // Redirect authenticated users away from login page
  if (user && isAuthPage) {
    const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');
    const redirectUrl = new URL(callbackUrl || '/dashboard', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
