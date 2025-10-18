// app/api/leads/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth'; // Importa la funzione auth
import { noco } from '@/lib/noco';
import { Customer, Conversation } from '@/lib/types'; // Importa i nostri nuovi tipi

// Recupera le variabili d'ambiente per le tabelle Customers e Conversations
const NC_TABLE_CUSTOMERS = process.env.NOCO_TABLE_CUSTOMERS!;
const NC_VIEW_CUSTOMERS = process.env.NOCO_VIEW_CUSTOMERS!;
const NC_TABLE_CONVERSATIONS = process.env.NOCO_TABLE_CONVERSATIONS!;

/**
 * Funzione "Upsert": Cerca un cliente in base a telefono o email.
 * Se esiste, lo aggiorna (es. visit_count).
 * Se non esiste, lo crea.
 * @param tenantId L'ID del tenant a cui associare il cliente
 * @param nome Il nome del cliente (estratto dal parser)
 * @param telefono Il telefono del cliente (estratto dal parser)
 * @param email L'email del cliente (estratta dal parser)
 * @returns L'oggetto Customer (creato o aggiornato)
 */
async function findOrCreateCustomer(
  tenantId: number,
  nome: string,
  telefono?: string,
  email?: string
): Promise<Customer> {
  
  // 1. Costruisci una query di ricerca robusta
  // Cerca un cliente dello stesso tenant che abbia o lo stesso telefono O la stessa email
  let whereParts: string[] = [`(tenant_id,eq,${tenantId})`];
  let searchClauses: string[] = [];

  if (telefono) {
    // Assicura che il telefono sia pulito se necessario (es. rimuovi spazi)
    searchClauses.push(`(phone_number,eq,${telefono.trim()})`);
  }
  if (email) {
    searchClauses.push(`(email,eq,${email.trim().toLowerCase()})`);
  }

  // Se abbiamo almeno un criterio di ricerca (telefono o email), usiamolo
  if (searchClauses.length > 0) {
    whereParts.push(`~and(${searchClauses.join('~or')})`);
    
    const queryParams = {
      where: whereParts.join('~and'),
      limit: 1,
    };

    const existingCustomers = await noco.dbViewRow.list(
      NC_TABLE_CUSTOMERS,
      NC_VIEW_CUSTOMERS,
      queryParams
    );

    const candidateList = (existingCustomers as { list?: unknown[] })?.list ?? [];
    if (candidateList.length > 0) {
      // 2a. Cliente Trovato: Aggiorna i dati
      const customer = candidateList[0] as Customer;
      
      const updatedCustomer = await noco.dbViewRow.update(
        NC_TABLE_CUSTOMERS,
        customer.Id,
        {
          full_name: nome || customer.full_name, // Aggiorna il nome se è cambiato
          visit_count: (Number(customer.visit_count) || 0) + 1,
          last_visit_date: new Date().toISOString()
        }
      );
      return updatedCustomer as Customer;
    }
  }

  // 2b. Cliente Non Trovato (o senza telefono/email): Creane uno nuovo
  const newCustomer = await noco.dbViewRow.create(NC_TABLE_CUSTOMERS, {
    tenant_id: tenantId,
    full_name: nome,
    phone_number: telefono ? telefono.trim() : undefined,
    email: email ? email.trim().toLowerCase() : undefined,
    visit_count: 1,
    last_visit_date: new Date().toISOString(),
  });
  
  return newCustomer as Customer;
}


/**
 * POST: Salva la conversazione e associa/crea il cliente.
 * Questo endpoint sostituisce la vecchia logica dei "Leads".
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }
  const tenantId = Number(session.user.tenantId); // Assicurati sia un numero

  try {
    // Dati inviati dal frontend (da useChat e chat-parser)
    const body = await request.json();
    const { 
      messages, // Array di messaggi
      nome,     // Dati estratti da chat-parser
      telefono, 
      email, 
      intent    // Es: 'prenotazione', 'info'
    } = body;

    // Validazione base
    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messaggi mancanti' }, { status: 400 });
    }
    // Richiediamo almeno un nome per creare/trovare un cliente
    if (!nome) {
         return NextResponse.json({ error: 'Nome cliente mancante' }, { status: 400 });
    }

    // 1. Trova o crea il cliente
    const customer = await findOrCreateCustomer(tenantId, nome, telefono, email);

    // 2. Prepara e salva la conversazione
    // Estrai un riepilogo (es. ultimo messaggio dell'utente o dell'AI)
    const lastMessage = messages[messages.length - 1]?.content || 'Nessun messaggio.';
    const summary = lastMessage.substring(0, 150) + (lastMessage.length > 150 ? '...' : '');

    const conversationLog: Partial<Conversation> = {
      tenant_id: tenantId,
      customer_id: customer.Id, // Collega il cliente!
      channel: 'web_widget', // Fisso per ora
      intent: intent || 'info', // 'info' come default
      summary: summary,
      raw_log_json: JSON.stringify(messages), // Salva l'intera chat
      status: 'chiusa', // La chat si considera chiusa dopo il salvataggio
    };

    const savedConversation = await noco.dbViewRow.create(
      NC_TABLE_CONVERSATIONS,
      conversationLog
    );

    // 3. (Opzionale) Invia notifica al ristoratore
    // La logica in 'lib/notifications.ts' può essere chiamata qui
    // await sendNotification(...)

    // 4. Restituisci gli ID!
    // Questo è FONDAMENTALE per la Fase 5 (Prenotazioni).
    // Il frontend deve ricevere questi ID per poter creare una prenotazione.
    return NextResponse.json({ 
      message: 'Conversazione salvata', 
      customerId: customer.Id, 
      conversationId: (savedConversation as Conversation).Id 
    });

  } catch (error) {
    console.error('Errore POST /api/leads:', error);
    // Specifica l'errore se possibile
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    return NextResponse.json({ error: `Errore nel salvataggio della conversazione: ${errorMessage}` }, { status: 500 });
  }
}
