// app/api/assistente/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getNocoClient } from '@/lib/noco';
import { auth } from '@/auth';
import { z } from 'zod';

const AssistenteUpdateSchema = z.object({
  prompt_sistema: z.string().optional(),
  info_extra: z.string().optional(),
  nome_attivita: z.string().optional(),
});

// GET: Recupera i dati dell'assistente
export async function GET(req: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Utente non autorizzato o assistente non associato.' }, { status: 401 });
  }

  const { tenantId } = session.user;

  try {
    const noco = getNocoClient();
    const assistente = await noco.db.dbViewRow.findOne('Assistenti', {
      where: (f: any) => f.eq('tenant_id', tenantId)
    });
    
    if (!assistente) {
      return NextResponse.json({ error: `Assistente con ID '${tenantId}' non trovato.` }, { status: 404 });
    }

    return NextResponse.json(assistente);
  } catch (error: any) {
    console.error("Errore nel recupero dell'assistente:", error);
    return NextResponse.json({ error: "Errore interno del server." }, { status: 500 });
  }
}

// PUT: Aggiorna i dati dell'assistente
export async function PUT(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Utente non autorizzato o assistente non associato.' }, { status: 401 });
  }

  const { tenantId } = session.user;

  try {
    const body = await req.json();
    const validation = AssistenteUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const noco = getNocoClient();
    const assistente = await noco.db.dbViewRow.findOne('Assistenti', {
      where: (f: any) => f.eq('tenant_id', tenantId)
    });

    if (!assistente) {
      return NextResponse.json({ error: `Assistente con ID '${tenantId}' non trovato.` }, { status: 404 });
    }

    const updatedRecord = await noco.db.dbViewRow.update('Assistenti', assistente.Id, validation.data);

    return NextResponse.json({ message: 'Assistente aggiornato con successo!', data: updatedRecord });
  } catch (error: any) {
    console.error("Errore nell'aggiornamento dell'assistente:", error);
    return NextResponse.json({ error: "Errore interno del server." }, { status: 500 });
  }
}