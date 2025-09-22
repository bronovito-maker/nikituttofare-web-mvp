import { NextResponse } from 'next/server';
import { getNocoClient } from '@/lib/noco';

const noco = getNocoClient();

// Aggiungi 'request: Request' come primo argomento della funzione
export async function GET(
  request: Request, 
  { params }: { params: { ticketId: string } }
) {
  const { ticketId } = params;

  if (!ticketId) {
    return NextResponse.json({ error: 'Ticket ID mancante' }, { status: 400 });
  }

  try {
    const record = await noco.db.dbViewRow.read(
      'vw_requests_details', // Usa la vista che unisce Leads e Users
      ticketId,
      {
        where: `(ticketId,eq,${ticketId})`
      }
    );
    
    if (!record) {
      return NextResponse.json({ error: 'Richiesta non trovata' }, { status: 404 });
    }

    return NextResponse.json(record);

  } catch (error) {
    console.error(`Errore nel recupero della richiesta ${ticketId}:`, error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}