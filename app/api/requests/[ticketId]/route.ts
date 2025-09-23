// app/api/requests/[ticketId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getNocoClient } from '@/lib/noco';

const noco = getNocoClient();

// NUOVA MODIFICA: Cambiamo la firma della funzione per essere più espliciti
export async function GET(
  request: NextRequest,
  context: { params: { ticketId: string } }
) {
  // Estraiamo ticketId dal contesto qui dentro
  const { ticketId } = context.params;

  if (!ticketId) {
    return NextResponse.json({ error: 'Ticket ID mancante' }, { status: 400 });
  }

  try {
    const records = await noco.db.dbViewRow.list(
      'vw_requests_details',
      'Leads',
      {
        where: `(ticketId,eq,${ticketId})`
      }
    );
    
    const record = records.list[0];

    if (!record) {
      return NextResponse.json({ error: 'Richiesta non trovata' }, { status: 404 });
    }

    return NextResponse.json(record);

  } catch (error) {
    console.error(`Errore nel recupero della richiesta ${ticketId}:`, error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}