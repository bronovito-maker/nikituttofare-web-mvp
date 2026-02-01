'use server';

import { createServerClient } from '../supabase-server';
import { revalidatePath } from 'next/cache';

export async function claimTicket(ticketId: string) {
    const supabase = await createServerClient();

    // 1. Get current user
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: 'Unauthorized. Please login.' };
    }

    // 2. Verify user is a technician
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || profile.role !== 'technician') {
        return { error: 'Access denied. Only technicians can claim jobs.' };
    }

    // 3. Check ticket status (must be open/pending) to avoid double claiming
    const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select('status, assigned_technician_id')
        .eq('id', ticketId)
        .single();

    if (ticketError || !ticket) {
        return { error: 'Ticket not found.' };
    }

    if (ticket.assigned_technician_id) {
        return { error: 'This job has already been claimed by another technician.' };
    }

    // Also block if status implies it's done or in progress
    // 'assigned' is likely the status when a technician is set.
    const nonClaimableStatuses = ['in_progress', 'completed', 'cancelled', 'resolved', 'assigned'];
    if (nonClaimableStatuses.includes(ticket.status)) {
        return { error: 'This job is no longer available.' };
    }

    // 4. Update ticket: Assign to user and set status to 'in_progress' (or 'assigned')
    const { error: updateError } = await supabase
        .from('tickets')
        .update({
            assigned_technician_id: user.id,
            status: 'in_progress', // Or 'assigned' based on your workflow preference
            assigned_at: new Date().toISOString(),
        })
        .eq('id', ticketId);

    if (updateError) {
        return { error: 'Failed to claim ticket. Please try again.' };
    }

    // 5. Revalidate paths
    revalidatePath('/technician/dashboard');
    revalidatePath(`/technician/claim/${ticketId}`);

    return { success: true };
}
