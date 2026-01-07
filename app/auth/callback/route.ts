import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase-server';
import { notifyNewTicket } from '@/lib/notifications';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

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
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
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

    if (!error && data?.user) {
      // Dopo l'autenticazione riuscita, cerca e conferma eventuali ticket in pending
      try {
        const adminSupabase = createAdminClient();

        // Cerca l'ultimo ticket "pending_verification" dell'utente creato di recente (ultimi 30 minuti)
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        const { data: pendingTicket } = await adminSupabase
          .from('tickets')
          .select('*')
          .eq('user_id', data.user.id)
          .eq('status', 'pending_verification')
          .gte('created_at', thirtyMinutesAgo)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (pendingTicket) {
          const ticket = pendingTicket as any;
          console.log('🔍 Found pending ticket to confirm:', ticket.id);

          // Aggiorna lo status a "confirmed" (verificato via Magic Link)
          const { error: updateError } = await adminSupabase
            .from('tickets')
            // @ts-ignore - Type system constraints
            .update({ status: 'confirmed' })
            .eq('id', ticket.id);

          if (!updateError) {
            console.log('✅ Ticket confirmed:', ticket.id);

            // Invia notifica Telegram ora che il ticket è confermato
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
            
            // Redirect to confirmation success page instead of chat
            const forwardedHost = request.headers.get('x-forwarded-host');
            const isLocalEnv = process.env.NODE_ENV === 'development';
            const successUrl = `/chat?confirmed=true&ticket=${ticket.id.slice(-8)}`;
            
            if (isLocalEnv) {
              return NextResponse.redirect(`${origin}${successUrl}`);
            } else if (forwardedHost) {
              return NextResponse.redirect(`https://${forwardedHost}${successUrl}`);
            } else {
              return NextResponse.redirect(`${origin}${successUrl}`);
            }
          }
        }
      } catch (confirmError) {
        console.error('❌ Error confirming ticket:', confirmError);
        // Non bloccare il redirect anche se la conferma fallisce
      }

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
    
    console.error('Auth callback error:', error);
  }
  
  // Auth failed - redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
