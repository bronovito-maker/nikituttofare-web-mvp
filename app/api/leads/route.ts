// app/api/leads/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Customer, Conversation } from '@/lib/types';
// Importa i nostri helper e ID
// import {
//   listViewRowsById,
//   createTableRowById,
//   updateTableRowById,
// } from '@/lib/noco-helpers';
// import {
//   NC_TABLE_CUSTOMERS_ID,
//   NC_VIEW_CUSTOMERS_ID,
//   NC_TABLE_CONVERSATIONS_ID,
// } from '@/lib/noco-ids';
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
    // TODO: Replace this with Supabase logic
    const mockCustomer: Customer = {
        Id: 1,
        tenant_id: tenantId,
        full_name: nome,
        phone_number: telefono,
        email: email,
        visit_count: 1,
        last_visit_date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    return mockCustomer;
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

    // 2. Salva la conversazione
    // TODO: Replace with Supabase logic
    const savedConversation = { Id: Math.floor(Math.random() * 1000) };

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
