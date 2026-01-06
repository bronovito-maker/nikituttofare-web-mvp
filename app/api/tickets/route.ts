// app/api/tickets/route.ts
// API route per gestire ticket e messaggi su Supabase

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { 
  getOrCreateProfile, 
  createTicket, 
  saveMessage 
} from '@/lib/supabase-helpers';

/**
 * POST: Crea un nuovo ticket e salva il primo messaggio
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      console.error('Create ticket: sessione non trovata', { session });
      return NextResponse.json(
        { error: 'Non autorizzato. Effettua il login.' },
        { status: 401 }
      );
    }
    
    // Usa id dalla sessione o email come fallback
    const userId = session.user.id || session.user.email;
    
    if (!userId) {
      console.error('Create ticket: userId non disponibile', { session });
      return NextResponse.json(
        { error: 'Errore di autenticazione. Ricarica la pagina.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      category, 
      description, 
      priority = 'medium',
      address,
      messageContent,
      imageUrl 
    } = body;

    if (!category || !description) {
      return NextResponse.json(
        { error: 'Categoria e descrizione sono obbligatorie' },
        { status: 400 }
      );
    }

    // Crea o recupera il profilo
    const profile = await getOrCreateProfile(
      userId,
      session.user.email
    );

    if (!profile) {
      return NextResponse.json(
        { error: 'Errore nella creazione del profilo' },
        { status: 500 }
      );
    }

    // Crea il ticket
    const ticket = await createTicket(
      userId,
      category,
      description,
      priority,
      address
    );

    if (!ticket) {
      return NextResponse.json(
        { error: 'Errore nella creazione del ticket' },
        { status: 500 }
      );
    }

    // Salva il primo messaggio se fornito
    if (messageContent) {
      await saveMessage(
        ticket.id,
        'user',
        messageContent,
        imageUrl || null
      );
    }

    return NextResponse.json({
      ticketId: ticket.id,
      ticket,
    });

  } catch (error) {
    console.error('Errore nella creazione del ticket:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

/**
 * GET: Recupera i ticket dell'utente
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // TODO: Implementare recupero ticket
    // Per ora restituiamo un array vuoto
    return NextResponse.json({ tickets: [] });

  } catch (error) {
    console.error('Errore nel recupero dei ticket:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
