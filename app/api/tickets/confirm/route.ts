import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase-helpers';
import { notifyNewTicket } from '@/lib/notifications';
import { createAdminClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    // Verifica autenticazione
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const { ticketId } = await request.json();

    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID richiesto' }, { status: 400 });
    }

    // Verifica che il ticket appartenga all'utente e sia in stato pending_verification
    const supabase = createAdminClient();
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .eq('user_id', user.id)
      .eq('status', 'pending_verification')
      .single();

    if (error || !ticket) {
      return NextResponse.json({ error: 'Ticket non trovato o già confermato' }, { status: 404 });
    }

    // Aggiorna lo status del ticket a "confirmed"
    const { error: updateError } = await supabase
      .from('tickets')
      // @ts-ignore - Type system troppo restrittivo per aggiornamenti
      .update({ status: 'confirmed' })
      .eq('id', ticketId)
      .eq('status', 'pending_verification');

    if (updateError) {
      console.error('Errore aggiornamento ticket:', updateError);
      return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
    }

    // Type assertion per risolvere il problema TypeScript
    const ticketData = ticket as any;

    // Invia notifica Telegram ora che il ticket è confermato
    await notifyNewTicket({
      id: ticketData.id,
      category: ticketData.category,
      priority: ticketData.priority,
      description: ticketData.description,
      address: ticketData.address,
      created_at: ticketData.created_at,
      phone: undefined, // Potremmo recuperarlo dal profilo se necessario
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Errore conferma ticket:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}