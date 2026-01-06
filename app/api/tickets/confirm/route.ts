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

    // Verifica che il ticket appartenga all'utente
    const supabase = createAdminClient();
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .eq('user_id', user.id)
      .single();

    if (error || !ticket) {
      return NextResponse.json({ error: 'Ticket non trovato' }, { status: 404 });
    }

    // Type assertion per risolvere il problema TypeScript
    const ticketData = ticket as any;

    // Invia notifica Telegram ora che l'utente è autenticato
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