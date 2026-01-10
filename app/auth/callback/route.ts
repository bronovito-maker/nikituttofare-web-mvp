import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase-server';
import { notifyNewTicket } from '@/lib/notifications';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

function getRedirectUrl(request: NextRequest, path: string): string {
    const { origin } = new URL(request.url);
    const forwardedHost = request.headers.get('x-forwarded-host');
    const isLocalEnv = process.env.NODE_ENV === 'development';

    if (isLocalEnv) {
        return `${origin}${path}`;
    }
    if (forwardedHost) {
        return `https://${forwardedHost}${path}`;
    }
    return `${origin}${path}`;
}

async function confirmPendingTicket(ticket: any, request: NextRequest): Promise<NextResponse | null> {
    const adminSupabase = createAdminClient();
    console.log('🔍 Found pending ticket to confirm:', ticket.id);

    const { error: updateError } = await adminSupabase
        .from('tickets')
        .update({ status: 'confirmed' })
        .eq('id', ticket.id);

    if (updateError) {
        console.error('Error updating ticket status:', updateError);
        return null;
    }

    console.log('✅ Ticket confirmed:', ticket.id);

    await notifyNewTicket({
        id: ticket.id,
        category: ticket.category,
        priority: ticket.priority,
        city: ticket.city,
        price_range_min: ticket.price_range_min,
        price_range_max: ticket.price_range_max,
        description: ticket.description,
        address: ticket.address,
        created_at: ticket.created_at,
    });
    console.log('📤 Telegram notification sent for confirmed ticket');

    const successUrl = `/chat?confirmed=true&ticket=${ticket.id.slice(-8)}`;
    return NextResponse.redirect(getRedirectUrl(request, successUrl));
}

async function handleSuccessfulAuth(user: any, request: NextRequest, next: string): Promise<NextResponse> {
    try {
        const adminSupabase = createAdminClient();
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

        const { data: pendingTicket } = await adminSupabase
            .from('tickets')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'pending_verification')
            .gte('created_at', thirtyMinutesAgo)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (pendingTicket) {
            const redirectResponse = await confirmPendingTicket(pendingTicket, request);
            if (redirectResponse) return redirectResponse;
        }
    } catch (confirmError) {
        console.error('❌ Error confirming ticket:', confirmError);
        // Non bloccare il redirect anche se la conferma fallisce
    }

    return NextResponse.redirect(getRedirectUrl(request, next));
}

/**
 * Auth Callback Route
 * Handles the Magic Link redirect from Supabase Auth.
 * Exchanges the auth code for a session and sets cookies.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/chat';

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      }
    );
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (data?.user && !error) {
        return handleSuccessfulAuth(data.user, request, next);
    }
    
    if (error) console.error('Auth callback error:', error.message);
  }
  
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}