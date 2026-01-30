'use server'

// app/actions/payment-actions.ts
// Manual payment management - No Stripe integration

import { createServerClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'

export type PaymentMethod = 'cash' | 'transfer' | 'card';

interface MarkAsPaidResult {
    success: boolean;
    message?: string;
    error?: string;
}

/**
 * Mark a ticket as paid - callable by Admin or the assigned Technician
 * 
 * @param ticketId - The ID of the ticket to mark as paid
 * @param method - Payment method: 'cash', 'transfer', or 'card'
 * @returns Result object with success status
 */
export async function markTicketAsPaid(
    ticketId: string,
    method: PaymentMethod = 'cash'
): Promise<MarkAsPaidResult> {
    const supabase = await createServerClient()

    try {
        // 1. Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { success: false, error: 'Non autenticato' }
        }

        // 2. Get user's role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const isAdmin = profile?.role === 'admin'
        const isTechnician = profile?.role === 'technician'

        // 3. Get ticket details
        const { data: ticket, error: ticketError } = await supabase
            .from('tickets')
            .select('id, status, payment_status, assigned_technician_id, customer_name')
            .eq('id', ticketId)
            .single()

        if (ticketError || !ticket) {
            logger.error('Ticket not found for payment', { ticketId, action: 'markTicketAsPaid' })
            return { success: false, error: 'Ticket non trovato' }
        }

        // 4. Authorization check: Admin or assigned Technician only
        const isAssignedTechnician = isTechnician && ticket.assigned_technician_id === user.id

        if (!isAdmin && !isAssignedTechnician) {
            logger.warn('Unauthorized payment attempt', {
                userId: user.id,
                ticketId,
                isAdmin,
                assignedTo: ticket.assigned_technician_id
            })
            return { success: false, error: 'Non autorizzato. Solo Admin o il Tecnico assegnato possono registrare pagamenti.' }
        }

        // 5. Check if already paid
        if (ticket.payment_status === 'paid') {
            return { success: true, message: 'Questo ticket è già stato segnato come pagato.' }
        }

        // 6. Update ticket payment status
        const methodLabels: Record<PaymentMethod, string> = {
            cash: 'Contanti',
            transfer: 'Bonifico',
            card: 'Carta',
        }

        const { error: updateError } = await supabase
            .from('tickets')
            .update({
                payment_status: 'paid',
                status: ticket.status === 'in_progress' ? 'resolved' : ticket.status,
                // Store payment metadata (if column exists, otherwise ignored)
                // payment_method: method,
                // payment_recorded_at: new Date().toISOString(),
                // payment_recorded_by: user.id,
            } as Record<string, unknown>)
            .eq('id', ticketId)

        if (updateError) {
            logger.error('Failed to update payment status', { ticketId, error: updateError }, updateError)
            return { success: false, error: 'Errore durante l\'aggiornamento del pagamento.' }
        }

        // 7. Add internal note
        await supabase
            .from('messages')
            .insert({
                ticket_id: ticketId,
                content: `💰 Pagamento registrato: ${methodLabels[method]}. Registrato da ${isAdmin ? 'Admin' : 'Tecnico'}.`,
                role: 'system',
                meta_data: {
                    type: 'internal_note',
                    author_id: user.id,
                    payment_method: method,
                }
            })

        logger.info('Payment marked as paid', {
            ticketId,
            method,
            markedBy: isAdmin ? 'admin' : 'technician',
            userId: user.id
        })

        // 8. Revalidate paths
        revalidatePath('/admin')
        revalidatePath('/admin/tickets')
        revalidatePath('/technician/jobs')
        revalidatePath(`/technician/jobs/${ticketId}`)
        revalidatePath('/dashboard')

        return {
            success: true,
            message: `Pagamento (${methodLabels[method]}) registrato con successo!`
        }

    } catch (error) {
        logger.captureError(error, { ticketId, action: 'markTicketAsPaid' })
        return { success: false, error: 'Si è verificato un errore. Riprova.' }
    }
}

/**
 * Get payment status for a ticket
 */
export async function getPaymentStatus(ticketId: string): Promise<'pending' | 'paid' | 'refunded' | null> {
    const supabase = await createServerClient()

    const { data } = await supabase
        .from('tickets')
        .select('payment_status')
        .eq('id', ticketId)
        .single()

    return (data?.payment_status as 'pending' | 'paid' | 'refunded') ?? null
}
