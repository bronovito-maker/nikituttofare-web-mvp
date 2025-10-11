// app/api/assistente/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { extractSingleRecord, findOneByWhereREST, updateRecord } from '@/lib/noco';
import { z } from 'zod';

const sanitizeOptional = (schema: z.ZodString) =>
    z
        .string()
        .transform((value) => value.trim())
        .pipe(schema)
        .optional()
        .transform((value) => (value === '' ? undefined : value));

const AssistenteUpdateSchema = z.object({
    prompt_sistema: sanitizeOptional(
        z
            .string()
            .min(10, 'Il prompt deve contenere almeno 10 caratteri.')
            .max(4000, 'Il prompt non può superare i 4000 caratteri.')
    ),
    info_extra: sanitizeOptional(
        z
            .string()
            .max(6000, 'Le informazioni extra non possono superare i 6000 caratteri.')
    ),
    nome_attivita: sanitizeOptional(
        z
            .string()
            .min(2, 'Il nome attività deve contenere almeno 2 caratteri.')
            .max(120, 'Il nome attività non può superare i 120 caratteri.')
    ),
});

const CACHE_TTL_MS = Number(process.env.ASSISTANT_CACHE_TTL_MS ?? 30_000);
const assistantCache = new Map<string, { data: unknown; expires: number }>();

// GET: Recupera i dati dell'assistente
export async function GET(req: NextRequest) {
    const session = await auth();

    if (!session?.user?.tenantId) {
        return NextResponse.json({ error: 'Utente non autorizzato o assistente non associato.' }, { status: 401 });
    }

    const { tenantId } = session.user;
    const { NOCO_PROJECT_SLUG, NOCO_TABLE_ASSISTANTS, NOCO_ASSISTANTS_VIEW_ID } = process.env;

    if (!NOCO_PROJECT_SLUG || !NOCO_TABLE_ASSISTANTS) {
        return NextResponse.json({ error: "Configurazione del server incompleta." }, { status: 500 });
    }

    try {
        const cacheKey = tenantId;
        const cached = assistantCache.get(cacheKey);
        if (cached && cached.expires > Date.now()) {
            return NextResponse.json(cached.data);
        }

        // --- CORREZIONE CHIAVE ---
        const whereClause = `(tenant_id,eq,${tenantId})`;
        const assistente = await findOneByWhereREST(
            NOCO_PROJECT_SLUG,
            NOCO_TABLE_ASSISTANTS,
            whereClause,
            { viewId: NOCO_ASSISTANTS_VIEW_ID }
        );

        if (!assistente) {
            return NextResponse.json({ error: `Assistente con ID '${tenantId}' non trovato.` }, { status: 404 });
        }

        assistantCache.set(cacheKey, {
            data: assistente,
            expires: Date.now() + CACHE_TTL_MS,
        });

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
    const { NOCO_PROJECT_SLUG, NOCO_TABLE_ASSISTANTS, NOCO_ASSISTANTS_VIEW_ID } = process.env;

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
            whereClause,
            { viewId: NOCO_ASSISTANTS_VIEW_ID }
        );

        if (!assistente) {
            return NextResponse.json({ error: `Assistente con ID '${tenantId}' non trovato.` }, { status: 404 });
        }

        const rowId = (assistente as any).Id ?? (assistente as any).id;
        if (!rowId) {
            return NextResponse.json({ error: 'Impossibile determinare la riga da aggiornare.' }, { status: 500 });
        }

        const sanitizedData = Object.entries(validation.data).reduce<Record<string, unknown>>((acc, [key, value]) => {
            if (value !== undefined) acc[key] = value;
            return acc;
        }, {});

        if (Object.keys(sanitizedData).length === 0) {
            return NextResponse.json({ message: 'Nessuna modifica da applicare.' });
        }

        const updatedRecord = await updateRecord(
            NOCO_TABLE_ASSISTANTS,
            rowId,
            sanitizedData,
            NOCO_ASSISTANTS_VIEW_ID ? { viewId: NOCO_ASSISTANTS_VIEW_ID } : {}
        );

        const responsePayload = {
            message: 'Assistente aggiornato con successo!',
            data: extractSingleRecord(updatedRecord) ?? assistente,
        };

        assistantCache.set(tenantId, {
            data: responsePayload.data,
            expires: Date.now() + CACHE_TTL_MS,
        });

        return NextResponse.json(responsePayload);
    } catch (error: any) {
        console.error("Errore nell'aggiornamento dell'assistente:", error);
        return NextResponse.json(
            {
                error: "Errore interno del server.",
                detail: error?.message ?? 'Impossibile completare la richiesta.',
            },
            { status: 500 }
        );
    }
}
