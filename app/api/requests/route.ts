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
const REQUESTS_TENANT_FIELD = process.env.NOCO_REQUESTS_TENANT_FIELD || 'tenant_id';
const REQUESTS_USER_FIELD = process.env.NOCO_REQUESTS_USER_FIELD;

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const tenantId = session.user.tenantId;
  if (!tenantId && !REQUESTS_USER_FIELD) {
    return NextResponse.json(
      { error: 'Tenant non definito per l’utente e nessun campo utente configurato.' },
      { status: 400 }
    );
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
    if (tenantId) {
      payload[REQUESTS_TENANT_FIELD] = tenantId;
    }
    if (REQUESTS_USER_FIELD) {
      payload[REQUESTS_USER_FIELD] = userId;
    }

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
        const tenantId = session.user.tenantId;
        if (!tenantId && !REQUESTS_USER_FIELD) {
            return NextResponse.json({ error: 'Tenant non definito per l’utente.' }, { status: 400 });
        }

        const whereClause = tenantId
            ? `(${REQUESTS_TENANT_FIELD},eq,${tenantId})`
            : `(${REQUESTS_USER_FIELD},eq,${session.user.id})`;

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
