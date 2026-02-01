import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Define Zod schema for strict validation
const registrationSchema = z.object({
    name: z.string().min(2, "Nome troppo corto").max(100),
    phone: z.string().min(8, "Numero di telefono non valido"),
    email: z.string().email("Email non valida"),
    specializations: z.array(z.string()).min(1, "Seleziona almeno una specializzazione"),
    zones: z.array(z.string()).min(1, "Seleziona almeno una zona"),
    noPartitaIva: z.boolean(),
    partitaIva: z.string().optional(),
    experience: z.string().optional(),
    notes: z.string().optional(),
}).refine(data => {
    // Custom validation: P.IVA required if noPartitaIva is false
    if (!data.noPartitaIva) {
        return !!data.partitaIva && data.partitaIva.length >= 11;
    }
    return true;
}, {
    message: "Partita IVA obbligatoria se non si seleziona l'opzione 'Sto aprendo P.IVA'",
    path: ["partitaIva"]
});

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // 1. Zod Validation
        const validationResult = registrationSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: 'Dati non validi',
                    details: validationResult.error.flatten()
                },
                { status: 400 }
            );
        }

        const {
            name,
            phone,
            email,
            specializations,
            zones,
            partitaIva,
            noPartitaIva,
            experience,
            notes
        } = validationResult.data;

        // 2. Insert into Supabase
        const { data, error } = await supabase
            .from('technician_applications')
            .insert({
                name,
                phone,
                email,
                specializations,
                zones,
                // Handle P.IVA logic carefully: save as NULL if user doesn't have it yet
                partita_iva: noPartitaIva ? null : partitaIva,
                experience,
                notes,
                status: 'pending',
                created_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase insert error:', error);
            // Don't leak DB details to client
            return NextResponse.json(
                { error: 'Errore nel salvataggio della candidatura.' },
                { status: 500 }
            );
        }

        // 3. Trigger n8n Webhook (Fire-and-forget but safe)
        if (process.env.N8N_TECHNICIAN_WEBHOOK_URL) {
            // We use fetch without await to not block the response, 
            // BUT Vercel serverless functions might kill the process early.
            // For critical hooks, better to await or use Inngest/Queue.
            // For MVP, awaiting is safer to ensure delivery.
            try {
                await fetch(process.env.N8N_TECHNICIAN_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'technician_application',
                        data: {
                            id: data.id, // Send ID so n8n can query usage/tracking
                            name,
                            email,
                            specializations
                        },
                    }),
                });
            } catch (webhookError) {
                console.error('Webhook trigger error:', webhookError);
                // We don't fail the request if webhook fails, as data is safe in DB
            }
        }

        return NextResponse.json({ success: true, id: data?.id });

    } catch (error) {
        console.error('Registration unhandled error:', error);
        return NextResponse.json(
            { error: 'Errore interno del server' },
            { status: 500 }
        );
    }
}
