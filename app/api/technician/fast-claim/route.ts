import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase-server';

const fastClaimSchema = z.object({
  phone: z.string().min(1, { message: "Numero di telefono richiesto" }),
  token: z.string().min(1, { message: "Token richiesto" }),
});

/**
 * POST /api/technician/fast-claim
 * 
 * Frictionless technician authentication via phone number.
 * This allows technicians to accept jobs without complex login flows.
 * 
 * Flow:
 * 1. Technician clicks "Accept" on Telegram
 * 2. Lands on /technician/claim?token=XXX
 * 3. Enters their registered phone number
 * 4. This API verifies the phone exists in profiles with role=technician
 * 5. If valid, directly assigns the ticket and returns client details
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = fastClaimSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error.flatten().fieldErrors.phone?.[0] || validation.error.flatten().fieldErrors.token?.[0] || 'Dati non validi' },
        { status: 400 }
      );
    }

    const { phone, token } = validation.data;

    // Normalize phone number (remove spaces, dashes, and ensure consistent format)
    const normalizedPhone = phone
      .replace(/\s|-|\(|\)/g, '')
      .replace(/^00/, '+')
      .trim();

    // Also try without +39 prefix for matching
    const phoneWithoutPrefix = normalizedPhone.replace(/^\+39/, '');
    const phoneWithPrefix = normalizedPhone.startsWith('+39') ? normalizedPhone : `+39${normalizedPhone}`;

    const adminClient = createAdminClient();

    // Find technician by phone number
    const { data: technician, error: techError } = await adminClient
      .from('profiles')
      .select('id, full_name, phone, role, email')
      .in('role', ['technician', 'admin'])
      .or(`phone.eq.${normalizedPhone},phone.eq.${phoneWithoutPrefix},phone.eq.${phoneWithPrefix}`)
      .maybeSingle();

    if (techError) {
      console.error('Error finding technician:', techError);
      return NextResponse.json(
        { success: false, message: 'Errore del server. Riprova.' },
        { status: 500 }
      );
    }

    if (!technician) {
      return NextResponse.json(
        {
          success: false,
          message: 'Numero non riconosciuto. Assicurati di usare il numero registrato nel tuo profilo tecnico. Contatta l\'amministrazione se il problema persiste.'
        },
        { status: 404 }
      );
    }

    // Technician found! Now try to accept the assignment
    const { data: assignmentResult, error: assignError } = await adminClient.rpc(
      'accept_technician_assignment',
      {
        p_token: token,
        p_technician_id: technician.id
      }
    );

    if (assignError) {
      console.error('Error accepting assignment:', assignError);
      return NextResponse.json(
        { success: false, message: 'Errore durante l\'assegnazione. Riprova.' },
        { status: 500 }
      );
    }

    // Cast to a specific type to avoid TypeScript errors with Json type
    const result = assignmentResult as {
      success: boolean;
      error?: string;
      message?: string;
      ticket?: any;
      client?: any;
    } | null;

    // Check the result from the database function
    if (!result || !result.success) {
      const errorMessages: Record<string, string> = {
        'invalid_token': 'Il link non è valido. Potrebbe essere già stato usato o non esistere.',
        'token_expired': 'Il link è scaduto. Gli interventi devono essere accettati entro 24 ore.',
        'already_assigned': '⚠️ Intervento già assegnato! Un altro tecnico è stato più veloce.'
      };

      return NextResponse.json({
        success: false,
        error: result?.error,
        message: errorMessages[result?.error as keyof typeof errorMessages] || result?.message
      }, { status: 409 });
    }

    // Success! Return ticket and client details
    console.log(`✅ Fast claim successful: Technician ${technician.full_name} (${technician.phone}) accepted ticket`);

    return NextResponse.json({
      success: true,
      message: '✅ Intervento assegnato a te!',
      technician: {
        name: technician.full_name,
        phone: technician.phone
      },
      ticket: result.ticket,
      client: result.client
    });

  } catch (error: any) {
    console.error('Fast claim error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dati non validi', details: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, message: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
