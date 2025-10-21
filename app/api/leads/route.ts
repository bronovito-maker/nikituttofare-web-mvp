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
    } = rawBody as {
      messages: Array<{ role: string; content: string }>;
      nome?: string;
      telefono?: string;
      email?: string;
      intent?: string;
    };

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messaggi mancanti' }, { status: 400 });
    }

    // --- MODIFICA 1: Validazione "Senior" del nome (Patch + Suggerimento) ---
    const lowerCaseName = typeof nome === 'string' ? nome.toLowerCase().trim() : '';
    // Lista robusta di nomi non validi
    const invalidNames = ['assistente', 'virtuale', 'bot', 'demo', 'system', 'ciao'];

    if (!lowerCaseName || invalidNames.some((word) => lowerCaseName.includes(word)) || lowerCaseName.length < 2) {
      console.warn('[API /api/leads] Validazione fallita: Nome non valido o mancante nel body.', { nome });
      return NextResponse.json({ error: 'Nome cliente non valido o mancante rilevato' }, { status: 400 });
    }
    // Usiamo il nome validato e trimmato
    const validName = nome.trim();

    // 1. Trova o crea il cliente usando il nome pulito
    const customer = await findOrCreateCustomer(tenantId, validName, telefono, email);

    // --- MODIFICA 2: Summary basato sull'ultimo messaggio dell'UTENTE ---
    const lastUserMessage =
      messages.filter((m: any) => m.role === 'user').pop()?.content || 'Nessun messaggio utente.';
    const summary =
      lastUserMessage.substring(0, 150) + (lastUserMessage.length > 150 ? '...' : '');

    const conversationLog: Partial<Conversation> = {
      tenant_id: tenantId,

      // --- MODIFICA 3: Fix per 400 Bad Request (Link NocoDB) ---
      // I campi Link (FK) in NocoDB richiedono un ARRAY di ID
      customer_id: [customer.Id],

      channel: 'web_widget',
      intent: intent || 'info',
      summary, // Ora usa il summary corretto
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
