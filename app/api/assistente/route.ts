// app/api/assistente/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { extractSingleRecord, findOneByWhereREST, updateRecord } from '@/lib/noco';
import { z } from 'zod';

const optionalTextField = (schema: z.ZodString) =>
    z.union([schema, z.literal('')]).transform((value) => (value === '' ? undefined : value));

const optionalEmailField = () =>
    z.union([z.string().trim().email('Inserisci un indirizzo email valido.'), z.literal('')]).transform((value) => (value === '' ? undefined : value));

const optionalUrlField = () =>
    z.union([z.string().trim().url('Inserisci un URL valido.'), z.literal('')]).transform((value) => (value === '' ? undefined : value));

const AssistenteUpdateSchema = z.object({
    nome_attivita: optionalTextField(
        z
            .string()
            .trim()
            .min(2, 'Il nome attività deve contenere almeno 2 caratteri.')
            .max(120, 'Il nome attività non può superare i 120 caratteri.')
    ),
    prompt_sistema: optionalTextField(
        z
            .string()
            .trim()
            .min(10, 'Il prompt deve contenere almeno 10 caratteri.')
            .max(4000, 'Il prompt non può superare i 4000 caratteri.')
    ),
    info_extra: optionalTextField(
        z
            .string()
            .trim()
            .max(6000, 'Le informazioni extra non possono superare i 6000 caratteri.')
    ),
    prompt_secondary: optionalTextField(
        z
            .string()
            .trim()
            .max(4000, 'Il prompt secondario non può superare i 4000 caratteri.')
    ),
    prompt_config: z.any().optional(),
    sector: optionalTextField(z.string().trim().max(50)),
    tone: optionalTextField(z.string().trim().max(50)),
    notification_email: optionalEmailField(),
    notification_slack_webhook: optionalUrlField(),
    menu_text: optionalTextField(z.string().trim().max(8000)),
    menu_url: optionalUrlField(),
});

const CACHE_TTL_MS = Number(process.env.ASSISTANT_CACHE_TTL_MS ?? 30_000);
const assistantCache = new Map<string, { data: unknown; expires: number }>();
const getAssistantsTableKey = () =>
    process.env.NOCO_TABLE_ASSISTANTS_ID || process.env.NOCO_TABLE_ASSISTANTS || 'Assistenti';

// GET: Recupera i dati dell'assistente
export async function GET(req: NextRequest) {
    const session = await auth();

    if (!session?.user?.tenantId) {
        return NextResponse.json({ error: 'Utente non autorizzato o assistente non associato.' }, { status: 401 });
    }

    const { tenantId } = session.user;
    const { NOCO_PROJECT_SLUG, NOCO_ASSISTANTS_VIEW_ID } = process.env;
    const tableKey = getAssistantsTableKey();

    if (!NOCO_PROJECT_SLUG) {
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
        const assistenteRaw = await findOneByWhereREST(
            NOCO_PROJECT_SLUG,
            tableKey,
            whereClause,
            { viewId: NOCO_ASSISTANTS_VIEW_ID }
        );

        if (!assistenteRaw) {
            return NextResponse.json({ error: `Assistente con ID '${tenantId}' non trovato.` }, { status: 404 });
        }

        const assistente = {
            ...assistenteRaw,
            prompt_config: assistenteRaw.prompt_config || assistenteRaw.promptConfig,
        };

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
    const { NOCO_PROJECT_SLUG, NOCO_ASSISTANTS_VIEW_ID } = process.env;
    const tableKey = getAssistantsTableKey();

    if (!NOCO_PROJECT_SLUG) {
        return NextResponse.json({ error: "Configurazione del server incompleta." }, { status: 500 });
    }

    try {
        const body = await req.json();
        const validation = AssistenteUpdateSchema.safeParse(body);

        if (!validation.success) {
            console.error('Aggiornamento assistente: validation failed', validation.error.flatten());
            return NextResponse.json({ error: 'Dati non validi', details: validation.error.flatten() }, { status: 400 });
        }

        const whereClause = `(tenant_id,eq,${tenantId})`;
        const assistenteRaw = await findOneByWhereREST(
            NOCO_PROJECT_SLUG,
            tableKey,
            whereClause,
            { viewId: NOCO_ASSISTANTS_VIEW_ID }
        );

        if (!assistenteRaw) {
            return NextResponse.json({ error: `Assistente con ID '${tenantId}' non trovato.` }, { status: 404 });
        }

        const rowId = (assistenteRaw as any).Id ?? (assistenteRaw as any).id;
        if (!rowId) {
            return NextResponse.json({ error: 'Impossibile determinare la riga da aggiornare.' }, { status: 500 });
        }

        const sanitizedData = Object.entries(validation.data).reduce<Record<string, unknown>>((acc, [key, value]) => {
            if (value !== undefined) acc[key] = value;
            return acc;
        }, {});

        if (sanitizedData.prompt_config && typeof sanitizedData.prompt_config === 'string') {
            try {
                sanitizedData.prompt_config = JSON.parse(sanitizedData.prompt_config);
            } catch (error) {
                return NextResponse.json({ error: 'prompt_config deve essere un JSON valido.' }, { status: 400 });
            }
        }

        if (Object.keys(sanitizedData).length === 0) {
            return NextResponse.json({ message: 'Nessuna modifica da applicare.' });
        }

        const updatedRecord = await updateRecord(
            tableKey,
            rowId,
            sanitizedData,
            NOCO_ASSISTANTS_VIEW_ID ? { viewId: NOCO_ASSISTANTS_VIEW_ID } : {}
        );

        const assistente = {
            ...assistenteRaw,
            ...sanitizedData,
        };

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
