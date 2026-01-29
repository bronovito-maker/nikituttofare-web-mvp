import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Helper to determine redirect logic based on user role
function getRoleBasedRedirect(
  request: NextRequest,
  userRole: string,
  pathname: string
): URL | null {
  const isAuthPage = pathname.startsWith('/login');
  const isAdminRoute = pathname.startsWith('/admin');
  const isTechnicianRoute = pathname.startsWith('/technician') && !pathname.startsWith('/technician/login');

  // 1. Redirect authenticated users away from login pages
  if (isAuthPage) {
    let defaultRedirect = '/dashboard';
    if (userRole === 'admin') defaultRedirect = '/admin';
    if (userRole === 'technician') defaultRedirect = '/technician/dashboard';

    const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');
    // Use callback if valid and not a login page, otherwise role-based default
    const dest = callbackUrl && !callbackUrl.includes('login') ? callbackUrl : defaultRedirect;

    return new URL(dest, request.url);
  }

  // 2. Admin Route Protection
  if (isAdminRoute && userRole !== 'admin') {
    return new URL('/dashboard', request.url);
  }

  // 3. Technician Route Protection
  if (isTechnicianRoute && userRole !== 'technician') {
    return new URL('/dashboard', request.url);
  }

  return null;
}

function isRoutePublic(pathname: string) {
  return pathname === '/' ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/auth/callback') ||
    pathname === '/chat' ||
    pathname === '/privacy';
}

function isRouteProtected(pathname: string) {
  return pathname.startsWith('/admin') || pathname.startsWith('/dashboard');
}

async function getUserRole(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  return profile?.role || 'user';
}

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

  if (isRoutePublic(pathname)) {
    return supabaseResponse;
  }

  // Auth protection
  if (isRouteProtected(pathname) && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // RBAC & Redirect Logic
  if (user) {
    const userRole = await getUserRole(supabase, user.id);
    const redirectUrl = getRoleBasedRedirect(request, userRole, pathname);

    if (redirectUrl) {
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)', // NOSONAR
  ],
};
