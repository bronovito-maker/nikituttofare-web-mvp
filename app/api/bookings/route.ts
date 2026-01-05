// app/api/bookings/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth'; // Importa la funzione auth
// import {
//   createTableRowById,
//   updateTableRowById,
// } from '@/lib/noco-helpers';
import { Booking } from '@/lib/types'; // Importa il tipo Booking
// import {
//   NC_TABLE_BOOKINGS_ID,
//   NC_TABLE_CONVERSATIONS_ID,
// } from '@/lib/noco-ids';

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

    // TODO: Replace with Supabase logic
    const mockBooking: Booking = {
        Id: Math.floor(Math.random() * 1000),
        tenant_id: tenantId,
        customer_id: Number(customerId),
        conversation_id: conversationId ? Number(conversationId) : undefined,
        booking_datetime: new Date(bookingDateTime).toISOString(),
        party_size: Number(partySize),
        status: 'richiesta',
        notes: notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    
    return NextResponse.json(mockBooking);

  } catch (error) {
    console.error('Errore POST /api/bookings:', error);
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    return NextResponse.json({ error: `Errore nella creazione della prenotazione: ${errorMessage}` }, { status: 500 });
  }
}
