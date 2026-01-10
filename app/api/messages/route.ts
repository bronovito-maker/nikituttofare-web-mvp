import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { saveMessage, getTicketMessages, getCurrentUser } from '@/lib/supabase-helpers';

// Zod schema for POST request body
const postMessageSchema = z.object({
  ticketId: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1),
  imageUrl: z.string().url().optional().nullable(),
  metaData: z.record(z.unknown()).optional().nullable(),
});

// Zod schema for GET request query
const getMessagesSchema = z.object({
  ticketId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const body = await request.json();
    const validation = postMessageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dati non validi', details: validation.error.flatten() }, { status: 400 });
    }

    const { ticketId, role, content, imageUrl, metaData } = validation.data;

    const message = await saveMessage(
      ticketId,
      role,
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
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dati non validi', details: error.flatten() }, { status: 400 });
    }
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
    const validation = getMessagesSchema.safeParse({
      ticketId: searchParams.get('ticketId'),
    });

    if (!validation.success) {
      return NextResponse.json({ error: 'Dati non validi', details: validation.error.flatten() }, { status: 400 });
    }

    const { ticketId } = validation.data;

    const messages = await getTicketMessages(ticketId);

    return NextResponse.json({
      success: true,
      messages
    });

  } catch (error) {
    console.error('Errore nel recupero dei messaggi:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dati non validi', details: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}