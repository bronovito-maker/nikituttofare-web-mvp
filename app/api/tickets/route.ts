import { NextRequest, NextResponse } from 'next/server';
import { createTicket, getUserTickets, getOrCreateProfile, getCurrentUser } from '@/lib/supabase-helpers';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, rateLimitExceededResponse } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - previene spam di ticket
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(`tickets:${clientId}`, RATE_LIMITS.tickets);

    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const body = await request.json();
    const { category, description, priority, address, messageContent, imageUrl, chatSessionId, city, customerName } = body;

    // Validazione input
    if (!category || !description) {
      return NextResponse.json(
        { error: 'Categoria e descrizione sono obbligatorie' },
        { status: 400 }
      );
    }

    // Crea o recupera il profilo utente
    const profile = await getOrCreateProfile(user.id, user.email ?? '');
    if (!profile) {
      return NextResponse.json(
        { error: 'Impossibile creare il profilo utente' },
        { status: 500 }
      );
    }

    // Crea il ticket
    const ticket = await createTicket(
      profile.id,
      category,
      description,
      priority || 'medium',
      address,
      messageContent,
      'pending_verification', // status
      imageUrl,
      chatSessionId,
      city,
      customerName
    );

    if (!ticket) {
      return NextResponse.json(
        { error: 'Impossibile creare il ticket' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ticketId: ticket.id,
      ticket
    });

  } catch (error) {
    console.error('Errore nella creazione del ticket:', error);
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

    const tickets = await getUserTickets(user.id);

    return NextResponse.json({
      success: true,
      tickets
    });

  } catch (error) {
    console.error('Errore nel recupero dei ticket:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}