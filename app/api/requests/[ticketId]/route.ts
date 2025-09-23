// app/api/requests/[ticketId]/route.ts
import { NextRequest, NextResponse } from 'next/server'; // MODIFICA: Importa NextRequest
import { getNocoClient } from '@/lib/noco';

const noco = getNocoClient();

export async function GET(
  request: NextRequest, // MODIFICA: Usa NextRequest invece di Request
  { params }: { params: { ticketId: string } }
) {
  const { ticketId } = params;

  if (!ticketId) {
    return NextResponse.json({ error: 'Ticket ID mancante' }, { status: 400 });
  }

  try {
    // La logica seguente per trovare il record sembra non corretta per NocoDB,
    // potrebbe essere necessario un ID numerico.
    // Per ora, ci concentriamo sulla correzione del tipo.
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