// app/api/leads/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Customer, Conversation } from '@/lib/types';
// Importa i nostri helper e ID
import {
  listViewRowsById,
  createTableRowById,
  updateTableRowById,
} from '@/lib/noco-helpers';
import {
  NC_TABLE_CUSTOMERS_ID,
  NC_VIEW_CUSTOMERS_ID,
  NC_TABLE_CONVERSATIONS_ID,
} from '@/lib/noco-ids';
// @ts-ignore: nocodb-sdk non espone direttamente il tipo Filterv1
import type { lib as nocoLib } from 'nocodb-sdk';

type LeadMessage = {
  role: string;
  content?: string | null;
};

type LeadRequestBody = {
  messages: LeadMessage[];
  nome?: string;
  telefono?: string;
  email?: string;
  intent?: string;
  party_size?: number;
  booking_date_time?: string;
  notes?: string;
  [key: string]: unknown;
};

/**
 * Funzione "Upsert": Cerca un cliente in base a telefono o email.
 * (Logica invariata, usa già gli helper corretti)
 */
async function findOrCreateCustomer(
  tenantId: number,
  nome: string,
  telefono?: string,
  email?: string
): Promise<Customer> {

  let whereParts: string[] = [`(tenant_id,eq,${tenantId})`];
  let searchClauses: string[] = [];

  if (telefono) {
    searchClauses.push(`(phone_number,eq,${telefono.trim()})`);
  }
  if (email) {
    searchClauses.push(`(email,eq,${email.trim().toLowerCase()})`);
  }

  if (searchClauses.length > 0) {
    whereParts.push(`~and(${searchClauses.join('~or')})`);

    const queryParams = {
      where: whereParts.join('~and'),
      limit: 1,
    };

    const existingCustomers = await listViewRowsById(
      NC_TABLE_CUSTOMERS_ID,
      NC_VIEW_CUSTOMERS_ID,
      queryParams
    );

    const candidateList = (existingCustomers as { list?: unknown[] })?.list ?? [];
    if (candidateList.length > 0) {
      const customer = candidateList[0] as Customer;

      const updatedCustomer = await updateTableRowById(
        NC_TABLE_CUSTOMERS_ID,
        customer.Id,
        {
          full_name: nome || customer.full_name, // Usa il nome parsato se disponibile
          visit_count: (Number(customer.visit_count) || 0) + 1,
          last_visit_date: new Date().toISOString(),
        }
      );
      return updatedCustomer as Customer;
    }
  }

  // Creazione nuovo cliente
  const newCustomer = await createTableRowById(NC_TABLE_CUSTOMERS_ID, {
    tenant_id: tenantId,
    full_name: nome, // Il nome è già stato validato nel POST
    phone_number: telefono ? telefono.trim() : undefined,
    email: email ? email.trim().toLowerCase() : undefined,
    visit_count: 1,
    last_visit_date: new Date().toISOString(),
  });

  return newCustomer as Customer;
}

/**
 * POST: Salva la conversazione e associa/crea il cliente.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }
  const tenantId = Number(session.user.tenantId);

  let rawBody: unknown = null;

  try {
    rawBody = await request.json();
    console.log('[API /api/leads] Raw Body Ricevuto:', JSON.stringify(rawBody, null, 2));

    const {
      messages,
      nome,
      telefono,
      email,
      intent,
      party_size,
      booking_date_time,
      notes,
    } = rawBody as LeadRequestBody;

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messaggi mancanti' }, { status: 400 });
    }

    if (!tenantId || typeof telefono !== 'string' || telefono.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId and telefono are required.' },
        { status: 400 }
      );
    }

    // --- MODIFICA 1: Validazione "Senior" del nome (Patch + Suggerimento) ---
    const lowerCaseName = typeof nome === 'string' ? nome.toLowerCase().trim() : '';
    // Lista robusta di nomi non validi
    const invalidNames = ['assistente', 'virtuale', 'bot', 'demo', 'system', 'ciao'];

    if (!lowerCaseName || invalidNames.some((word) => lowerCaseName.includes(word)) || lowerCaseName.length < 2) {
      console.warn('[API /api/leads] Validazione fallita: Nome non valido o mancante nel body.', { nome });
      return NextResponse.json({ error: 'Nome cliente non valido o mancante rilevato' }, { status: 400 });
    }
    // Validazione robusta del nome
    if (typeof nome !== 'string' || !nome.trim()) {
      return NextResponse.json(
        { success: false, message: 'Il nome è obbligatorio e deve essere una stringa valida.' },
        { status: 400 }
      );
    }
    // Usiamo il nome validato e trimmato
    const validName = nome.trim();

    // 1. Trova o crea il cliente usando il nome pulito
    const customer = await findOrCreateCustomer(tenantId, validName, telefono, email);

    // Sintesi conversazione basata sui dati estratti
    const trimmedIntent = intent?.trim();
    const conversationIntent =
      trimmedIntent && trimmedIntent.length > 0 ? trimmedIntent : 'informazioni';
    const normalizedIntent = conversationIntent.toLowerCase();
    let summary = 'Conversazione informativa';

    if (normalizedIntent === 'prenotazione') {
      const partySizeDisplay =
        typeof party_size === 'number' && Number.isFinite(party_size) && party_size > 0
          ? party_size
          : '?';
      let dateStr = 'Data non specificata';
      if (booking_date_time) {
        const parsed = new Date(booking_date_time);
        if (!Number.isNaN(parsed.getTime())) {
          dateStr = parsed.toLocaleString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          });
        } else {
          dateStr = booking_date_time;
        }
      }
      const noteStr = notes && notes.trim().length > 0 ? notes.trim() : 'Nessuna';
      summary = `Prenotazione per ${validName} (${partySizeDisplay}p) il ${dateStr}. Note: ${noteStr}`;
    } else if (messages.length > 0) {
      const lastUserContent = messages.filter((m) => m.role === 'user').pop()?.content?.trim();
      summary = lastUserContent && lastUserContent.length > 0 ? lastUserContent : 'Nessun messaggio utente';
    }

    const conversationLog: Partial<Conversation> = {
      tenant_id: tenantId,

      // --- MODIFICA 3: Fix per 400 Bad Request (Link NocoDB) ---
      // I campi Link (FK) in NocoDB richiedono un ARRAY di ID
      // @ts-ignore - Il tipo SDK è errato, NocoDB si aspetta un array per i link
      customer_id: [customer.Id],

      channel: 'web_widget',
      // @ts-ignore - Il tipo SDK è troppo restrittivo, 'intent' è una stringa valida
      intent: conversationIntent,
      summary: summary.substring(0, 255),
      raw_log_json: JSON.stringify(messages),
      status: 'chiusa',
    };

    // 2. Salva la conversazione
    const savedConversation = await createTableRowById(
      NC_TABLE_CONVERSATIONS_ID,
      conversationLog
    );

    // 3. Restituisci gli ID
    return NextResponse.json({
      message: 'Conversazione salvata',
      customerId: customer.Id,
      conversationId: (savedConversation as Conversation).Id,
    });
  } catch (error) {
    console.error('[API /api/leads] Errore:', error, 'Body ricevuto:', rawBody);
    // Gestione errori "senior" per log leggibili
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    return NextResponse.json(
      { error: `Errore nel salvataggio della conversazione: ${errorMessage}` },
      { status: 500 }
    );
  }
}
