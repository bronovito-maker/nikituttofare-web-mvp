// File: app/api/requests/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getNocoClient } from '@/lib/noco';
import { z } from 'zod';
import { generateTicketId } from '@/lib/ticket';
import { auth } from '@/auth'; // Per ottenere l'ID utente dalla sessione

// MODIFICA: Rimuoviamo l'inizializzazione del client da qui
// const noco = getNocoClient();

const requestSchema = z.object({
  category: z.string().min(1, 'La categoria è obbligatoria.'),
  message: z.string().min(10, 'Il messaggio deve contenere almeno 10 caratteri.'),
});

export async function POST(request: NextRequest) {
  // MODIFICA: Inizializziamo il client qui, al momento della richiesta
  const noco = getNocoClient();
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { category, message } = validation.data;
    const ticketId = generateTicketId();
    const userId = session.user.id;

    const newRecord = await noco.db.dbViewRow.create('vw_requests_details', 'Leads', {
      ticketId: ticketId,
      category: category,
      message: message,
      status: 'new', // Stato iniziale
      'fk:user_id:user_id': userId, // Collega la richiesta all'utente loggato
    });

    return NextResponse.json({ message: 'Richiesta creata con successo', ticketId: ticketId, record: newRecord }, { status: 201 });

  } catch (error) {
    console.error('Errore nella creazione della richiesta:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
    // MODIFICA: Inizializziamo il client anche qui
    const noco = getNocoClient();
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    try {
        const userId = session.user.id;
        // Filtra le richieste per l'utente loggato
        const records = await noco.db.dbViewRow.list('vw_requests_details', 'Leads', {
            where: `(fk:user_id:user_id,eq,${userId})`,
            sort: '-CreatedAt' // Ordina per data di creazione, dalla più recente
        });

        return NextResponse.json(records.list);

    } catch (error) {
        console.error('Errore nel recupero delle richieste:', error);
        return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
    }
}