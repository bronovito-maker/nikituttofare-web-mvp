import { NextRequest, NextResponse } from 'next/server';
import { saveMessage, getTicketMessages, getCurrentUser } from '@/lib/supabase-helpers';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const body = await request.json();
    const { ticketId, role, content, imageUrl, metaData } = body;

    // Validazione input
    if (!ticketId || !role || !content) {
      return NextResponse.json(
        { error: 'Ticket ID, role e content sono obbligatori' },
        { status: 400 }
      );
    }

    // Valida il role
    if (!['user', 'assistant', 'system'].includes(role)) {
      return NextResponse.json(
        { error: 'Role deve essere user, assistant o system' },
        { status: 400 }
      );
    }

    // Salva il messaggio
    const message = await saveMessage(
      ticketId,
      role as 'user' | 'assistant' | 'system',
      content,
      imageUrl,
      metaData
    );

    if (!message) {
      return NextResponse.json(
        { error: 'Impossibile salvare il messaggio' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message
    });

  } catch (error) {
    console.error('Errore nel salvataggio del messaggio:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get('ticketId');

    if (!ticketId) {
      return NextResponse.json(
        { error: 'Ticket ID è obbligatorio' },
        { status: 400 }
      );
    }

    const messages = await getTicketMessages(ticketId);

    return NextResponse.json({
      success: true,
      messages
    });

  } catch (error) {
    console.error('Errore nel recupero dei messaggi:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}