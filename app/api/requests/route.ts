// File: app/api/requests/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createRecord, listRecords, extractSingleRecord } from '@/lib/noco';
import { z } from 'zod';
import { generateTicketId } from '@/lib/ticket';
import { auth } from '@/auth'; // Per ottenere l'ID utente dalla sessione

const requestSchema = z.object({
  category: z.string().min(1, 'La categoria è obbligatoria.'),
  message: z.string().min(10, 'Il messaggio deve contenere almeno 10 caratteri.'),
});

const REQUESTS_TABLE_KEY =
  process.env.NOCO_TABLE_REQUESTS_ID ||
  process.env.NOCO_TABLE_REQUESTS ||
  'Leads';
const REQUESTS_VIEW_ID = process.env.NOCO_VIEW_REQUESTS_ID;
const REQUESTS_USER_FIELD = process.env.NOCO_REQUESTS_USER_FIELD || 'fk:user_id:user_id';

export async function POST(request: NextRequest) {
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

    const payload: Record<string, any> = {
      ticketId,
      category,
      message,
      status: 'new',
    };
    payload[REQUESTS_USER_FIELD] = userId;

    const newRecord = await createRecord(
      REQUESTS_TABLE_KEY,
      payload,
      REQUESTS_VIEW_ID ? { viewId: REQUESTS_VIEW_ID } : {}
    );

    return NextResponse.json(
      { message: 'Richiesta creata con successo', ticketId, record: extractSingleRecord(newRecord) },
      { status: 201 }
    );

  } catch (error) {
    console.error('Errore nella creazione della richiesta:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    try {
        const userId = session.user.id;
        const whereClause = `(${REQUESTS_USER_FIELD},eq,${userId})`;
        const records = await listRecords(REQUESTS_TABLE_KEY, {
            where: whereClause,
            sort: '-CreatedAt',
            viewId: REQUESTS_VIEW_ID,
        });

        return NextResponse.json(records);

    } catch (error) {
        console.error('Errore nel recupero delle richieste:', error);
        return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
    }
}
