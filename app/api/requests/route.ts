import { NextRequest, NextResponse } from 'next/server';
import { getNocoClient } from '@/lib/noco';
import { auth } from '@/auth';

const noco = getNocoClient();

// La funzione GET deve accettare 'request: NextRequest'
export async function GET(request: NextRequest) {
  const session = await auth();
  
  // Estraiamo i parametri dall'URL della request
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!session || session.user?.id !== userId) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  try {
    const records = await noco.db.dbViewRow.list('vw_requests_details', 'Leads', {
      where: `(userId,eq,${userId})`,
      sort: '-CreatedAt' // Ordina per data di creazione, dal più recente
    });

    return NextResponse.json(records.list);

  } catch (error) {
    console.error(`Errore nel recupero delle richieste per l'utente ${userId}:`, error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}