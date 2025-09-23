// app/api/requests/[ticketId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getNocoClient } from '@/lib/noco';

const noco = getNocoClient();

export async function GET(
  request: NextRequest,
  // MODIFICA CORRETTA: Tipizziamo 'params' come una Promise
  context: { params: Promise<{ ticketId: string }> }
) {
  // Usiamo 'await' per risolvere la Promise e ottenere i parametri
  const { ticketId } = await context.params;

  if (!ticketId) {
    return NextResponse.json({ error: 'Ticket ID mancante' }, { status: 400 });
  }

  try {
    const records = await noco.db.dbViewRow.list(
      'vw_requests_details',
      'Leads',
      {
        where: `(ticketId,eq,${ticketId})`,
      }
    );
    
    const record = records.list?.[0];

    if (!record) {
      return NextResponse.json({ error: 'Richiesta non trovata' }, { status: 404 });
    }

    return NextResponse.json(record);

  } catch (error) {
    console.error(`Errore nel recupero della richiesta ${ticketId}:`, error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}