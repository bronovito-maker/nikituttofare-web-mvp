// app/api/bookings/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth'; // Importa la funzione auth
import {
  createTableRowById,
  updateTableRowById,
} from '@/lib/noco-helpers';
import { Booking } from '@/lib/types'; // Importa il tipo Booking
import {
  NC_TABLE_BOOKINGS_ID,
  NC_TABLE_CONVERSATIONS_ID,
} from '@/lib/noco-ids';

/**
 * POST: Crea un nuovo record di prenotazione.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }
  const tenantId = Number(session.user.tenantId);

  try {
    const body = await request.json();
    console.log('[API /api/bookings] Payload Ricevuto:', body);
    
    // Dati necessari per creare una prenotazione
    const { 
      customerId,       // Dall'hook 'savedConversationInfo'
      conversationId,   // Dall'hook 'savedConversationInfo'
      bookingDateTime,  // Dal parser (es. '2025-10-20T20:00:00')
      partySize,        // Dal parser (es. 4)
      notes             // Note aggiuntive (opzionali)
    } = body;

    // Validazione robusta dei dati
    if (!tenantId || !customerId || !bookingDateTime || !partySize) {
      console.error('Errore API Bookings: Dati incompleti', body);
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, customerId, bookingDateTime e partySize sono obbligatori.' },
        { status: 400 }
      );
    }

    // 1. Prepara il payload per NocoDB
    // Assicurati che i tipi siano corretti (es. numero per partySize)
    const newBookingPayload: Partial<Booking> = {
      tenant_id: tenantId,
      customer_id: Number(customerId),
      conversation_id: conversationId ? Number(conversationId) : undefined,
      booking_datetime: new Date(bookingDateTime).toISOString(), // Normalizza in ISO 8601
      party_size: Number(partySize),
      status: 'richiesta', // Default: la prenotazione è "richiesta" (il ristoratore deve confermarla)
      notes: notes || '', // Note aggiuntive
    };

    // 2. Crea il record di prenotazione
    const savedBooking = await createTableRowById(
      NC_TABLE_BOOKINGS_ID,
      newBookingPayload
    );

    // 3. (Opzionale ma consigliato) Aggiorna la conversazione
    // Imposta l'intento su 'prenotazione' e lo stato su 'chiusa'
    // Questo aiuta a non processare la stessa chat due volte
    if (conversationId) {
      try {
        await updateTableRowById(NC_TABLE_CONVERSATIONS_ID, Number(conversationId), {
          status: 'chiusa',
          intent: 'prenotazione',
        });
      } catch (convError) {
        // Non bloccare il flusso se questo fallisce, ma loggalo
        console.warn(`API Bookings: Impossibile aggiornare lo stato della conversazione ${conversationId}`, convError);
      }
    }
    
    // 4. (Opzionale) Invia notifica al ristoratore
    // Qui puoi riattivare 'lib/notifications.ts'
    // await sendNotification(...)

    return NextResponse.json(savedBooking as Booking);

  } catch (error) {
    console.error('Errore POST /api/bookings:', error);
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    return NextResponse.json({ error: `Errore nella creazione della prenotazione: ${errorMessage}` }, { status: 500 });
  }
}
