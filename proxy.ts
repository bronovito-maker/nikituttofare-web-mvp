import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
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
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value);
                    });
                    response = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    // Refresh session if expired - required for Server Components
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // =========================================================================
    // Security Headers & CSP
    // =========================================================================
    const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://www.clarity.ms https://*.clarity.ms;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://mqgkominidcysyakcbio.supabase.co https://*.openstreetmap.org;
    font-src 'self' data:;
    connect-src 'self' https://mqgkominidcysyakcbio.supabase.co wss://mqgkominidcysyakcbio.supabase.co https://*.sentry.io https://va.vercel-scripts.com https://www.clarity.ms https://*.clarity.ms https://c.bing.com;
    worker-src 'self' blob:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, " ").trim();

    response.headers.set("Content-Security-Policy", cspHeader);
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");

    // =========================================================================
    // Route Protection & Role Logic
    // =========================================================================
    const nextUrl = request.nextUrl;
    const pathname = nextUrl.pathname;

    const isDashboard = pathname.startsWith('/dashboard');
    const isAdmin = pathname.startsWith('/admin');
    const isTechnician = pathname.startsWith('/technician');
    const isAuthRoute = pathname === '/login' || pathname === '/register';
    const isTechnicianAuthRoute = pathname === '/technician/login' || pathname === '/technician/register';

    // Helper: Check roles
    const isTechnicianUser = user?.user_metadata?.role === 'technician';
    const isAdminUser = user?.user_metadata?.role === 'admin' || user?.email === 'bronovito@gmail.com';

    // 1. Technician Area Protection
    if (isTechnician) {
        const isPublicTechnicianRoute =
            isTechnicianAuthRoute ||
            pathname.startsWith('/technician/job/'); // Public magic link access

        if (!isPublicTechnicianRoute) {
            // Must be logged in
            if (!user) {
                const loginUrl = new URL("/technician/login", request.url);
                loginUrl.searchParams.set("next", pathname);
                return NextResponse.redirect(loginUrl);
            }

            // Must be a technician
            if (!isTechnicianUser) {
                // Logged in but not a technician: redirect to client dashboard
                return NextResponse.redirect(new URL("/dashboard", request.url));
            }
        }

        // If on Tech Login page but already logged in as Technician
        if (isTechnicianAuthRoute && user && isTechnicianUser) {
            const nextParam = nextUrl.searchParams.get('next');
            if (nextParam) {
                return NextResponse.redirect(new URL(nextParam, request.url));
            }
            return NextResponse.redirect(new URL("/technician/dashboard", request.url));
        }
    }

    // 2. Client Dashboard Protection
    if (isDashboard) {
        if (!user) {
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("next", pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    // 3. Admin Protection
    if (isAdmin) {
        if (!user) {
            return NextResponse.redirect(new URL("/login", request.url));
        }

        // Strict Admin Check
        if (!isAdminUser) {
            // Unauthorized: Redirect to home (or 404)
            return NextResponse.redirect(new URL("/", request.url));
        }
    }

    // 4. Redirect logged-in users away from standard login
    if (isAuthRoute && user) {
        const nextParam = nextUrl.searchParams.get('next');
        if (nextParam) {
            return NextResponse.redirect(new URL(nextParam, request.url));
        }

        // Redirect based on role
        if (isTechnicianUser) {
            return NextResponse.redirect(new URL("/technician/dashboard", request.url));
        }
        if (isAdminUser) {
            return NextResponse.redirect(new URL("/admin", request.url));
        }
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - web-manifest.json
         * - auth/callback (important to exclude callback from redirects!)
         */
        "/((?!api|_next/static|_next/image|favicon.ico|web-manifest.json|auth/callback).*)",
    ],
};
