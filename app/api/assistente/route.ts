// app/api/assistente/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { findOneByWhereREST, getTableId } from '@/lib/noco';
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
    const { NOCO_PROJECT_SLUG, NOCO_TABLE_ASSISTANTS } = process.env;

    if (!NOCO_PROJECT_SLUG || !NOCO_TABLE_ASSISTANTS) {
        return NextResponse.json({ error: "Configurazione del server incompleta." }, { status: 500 });
    }

    try {
        // --- CORREZIONE CHIAVE ---
        const whereClause = `(tenant_id,eq,${tenantId})`;
        const assistente = await findOneByWhereREST(
            NOCO_PROJECT_SLUG,
            NOCO_TABLE_ASSISTANTS,
            whereClause
        );

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
    const { NOCO_PROJECT_SLUG, NOCO_TABLE_ASSISTANTS } = process.env;

     if (!NOCO_PROJECT_SLUG || !NOCO_TABLE_ASSISTANTS) {
        return NextResponse.json({ error: "Configurazione del server incompleta." }, { status: 500 });
    }

    try {
        const body = await req.json();
        const validation = AssistenteUpdateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
        }

        // --- CORREZIONE CHIAVE ---
        const whereClause = `(tenant_id,eq,${tenantId})`;
        const assistente = await findOneByWhereREST(
            NOCO_PROJECT_SLUG,
            NOCO_TABLE_ASSISTANTS,
            whereClause
        );

        if (!assistente) {
            return NextResponse.json({ error: `Assistente con ID '${tenantId}' non trovato.` }, { status: 404 });
        }

        // Per aggiornare, usiamo l'API REST v2 direttamente
        const tableId = await getTableId(NOCO_PROJECT_SLUG, NOCO_TABLE_ASSISTANTS);
        const rowId = (assistente as any).Id; // Assumendo che il campo ID si chiami 'Id'

        const BASE_URL = (process.env.NOCO_API_URL || process.env.NEXT_PUBLIC_NOCO_API_URL || '').replace(/\/+$/, '');
        const TOKEN = process.env.NOCO_API_TOKEN || '';
        if (!BASE_URL || !TOKEN) {
            throw new Error('Variabili NOCO_API_URL/NOCO_API_TOKEN mancanti per aggiornare la tabella.');
        }

        const response = await fetch(`${BASE_URL}/api/v2/tables/${tableId}/rows/${rowId}`, {
            method: 'PATCH',
            headers: {
                'xc-token': TOKEN,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(validation.data),
            cache: 'no-store',
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Errore NocoDB ${response.status}: ${errorBody}`);
        }
        
        const updatedRecord = await response.json();

        return NextResponse.json({ message: 'Assistente aggiornato con successo!', data: updatedRecord });
    } catch (error: any) {
        console.error("Errore nell'aggiornamento dell'assistente:", error);
        return NextResponse.json({ error: "Errore interno del server." }, { status: 500 });
    }
}
