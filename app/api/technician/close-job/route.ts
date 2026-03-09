import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
        }

        const { ticketId, summary, actualPaymentAmount, paymentMethod } = await req.json();

        // ... existing validation ...

        // 1. Aggiorna lo stato del ticket
        const { error: updateError } = await supabase
            .from('tickets')
            .update({
                status: 'resolved',
                completed_at: new Date().toISOString(),
                actual_payment_amount: actualPaymentAmount,
                payment_method: paymentMethod,
                payment_status: actualPaymentAmount > 0 ? 'paid' : 'pending'
            } as any)
            .eq('id', ticketId);

        if (updateError) throw updateError;

        // 2. Archivia memoria finale del progetto (per riferimento futuro dell'AI)
        await supabase.from('assistant_project_memory' as any).upsert({
            ticket_id: ticketId,
            summary: summary || 'Intervento concluso senza note specifiche.',
            updated_at: new Date().toISOString()
        } as any);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Job closure error:', error);
        return NextResponse.json({ error: 'Errore durante la chiusura', details: error.message }, { status: 500 });
    }
}
