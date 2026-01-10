import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient, createAdminClient } from '@/lib/supabase-server';
import { getCurrentUser } from '@/lib/supabase-helpers';

const acceptSchema = z.object({
  token: z.string().min(1, { message: "Token mancante" }),
});

/**
 * POST /api/technician/accept
 * Accepts a technician assignment using a one-time magic link token
 * 
 * ANTI-COLLISION: Uses database function with row locking to ensure
 * only the first technician to click gets the job
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = acceptSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.flatten().fieldErrors.token?.[0] || 'Dati non validi' }, { status: 400 });
    }
    
    const { token } = validation.data;

    // Get current user (must be authenticated technician)
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non autenticato. Effettua il login.' },
        { status: 401 }
      );
    }

    // Verify user is a technician
    const supabase = await createServerClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['technician', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'Accesso riservato ai tecnici' },
        { status: 403 }
      );
    }

    // Use admin client to call the assignment function
    const adminClient = createAdminClient();
    
    // Call the anti-collision function
    const { data, error } = await adminClient.rpc('accept_technician_assignment', {
      p_token: token,
      p_technician_id: user.id
    });

    if (error) {
      console.error('Error accepting assignment:', error);
      return NextResponse.json(
        { success: false, error: 'Errore del server' },
        { status: 500 }
      );
    }

    // The function returns a JSONB with success/error info
    if (!data.success) {
      // Map error codes to user-friendly messages
      const errorMessages: Record<string, string> = {
        'invalid_token': 'Il link non è valido. Potrebbe essere già stato usato o non esistere.',
        'token_expired': 'Il link è scaduto. Gli interventi devono essere accettati entro 24 ore.',
        'already_assigned': '⚠️ Intervento già assegnato! Un altro tecnico è stato più veloce.'
      };

      return NextResponse.json({
        success: false,
        error: data.error,
        message: errorMessages[data.error] || data.message
      }, { status: 409 }); // 409 Conflict for already assigned
    }

    // Success! Return ticket details (visible only to assigned technician)
    return NextResponse.json({
      success: true,
      message: '✅ Intervento assegnato a te!',
      ticket: data.ticket,
      client: data.client
    });

  } catch (error) {
    console.error('Technician accept error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dati non validi', details: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/technician/accept?token=xxx
 * Renders a page for the technician to accept the assignment
 * (Alternative flow if using a web page instead of API call)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=missing_token', request.url));
  }

  // Redirect to the acceptance page with the token
  return NextResponse.redirect(new URL(`/technician/accept?token=${token}`, request.url));
}
