// app/api/messages/route.ts
// API route per salvare messaggi su Supabase

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { saveMessage } from '@/lib/supabase-helpers';

/**
 * POST: Salva un messaggio associato a un ticket
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      ticketId, 
      role = 'user',
      content, 
      imageUrl,
      metaData 
    } = body;

    if (!ticketId || !content) {
      return NextResponse.json(
        { error: 'ticketId e content sono obbligatorie' },
        { status: 400 }
      );
    }

    // Salva il messaggio
    const message = await saveMessage(
      ticketId,
      role,
      content,
      imageUrl || null,
      metaData || null
    );

    if (!message) {
      return NextResponse.json(
        { error: 'Errore nel salvataggio del messaggio' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message });

  } catch (error) {
    console.error('Errore nel salvataggio del messaggio:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
