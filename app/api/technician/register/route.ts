import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const { name, phone, email, specializations, zones, partitaIva, noPartitaIva, experience, notes } = body;

        // Validate required fields
        if (!name || !phone || !email || !specializations?.length || !zones?.length) {
            return NextResponse.json(
                { error: 'Dati mancanti' },
                { status: 400 }
            );
        }

        // P.IVA required unless noPartitaIva is true
        if (!noPartitaIva && (!partitaIva || partitaIva.length < 11)) {
            return NextResponse.json(
                { error: 'Partita IVA non valida' },
                { status: 400 }
            );
        }

        // Insert application
        const { data, error } = await supabase
            .from('technician_applications')
            .insert({
                name,
                phone,
                email,
                specializations,
                zones,
                partita_iva: noPartitaIva ? null : partitaIva,
                experience,
                notes,
                status: 'pending',
                created_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            // If table doesn't exist, just log and return success
            console.error('Supabase error:', error);
            // Could trigger n8n webhook here instead
        }

        // Optional: Trigger n8n webhook for notification
        if (process.env.N8N_TECHNICIAN_WEBHOOK_URL) {
            try {
                await fetch(process.env.N8N_TECHNICIAN_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'technician_application',
                        data: { name, phone, email, specializations, zones, partitaIva, experience, notes },
                    }),
                });
            } catch (webhookError) {
                console.error('Webhook error:', webhookError);
            }
        }

        return NextResponse.json({ success: true, id: data?.id });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Errore durante la registrazione' },
            { status: 500 }
        );
    }
}
