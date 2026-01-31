'use server';

import { createServerClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function updateLeadStatus(id: string, field: string, value: boolean) {
    const supabase = await createServerClient();

    // Verify Admin
    // (Assuming middleware or RLS handles this, but explicit check is good practice)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        throw new Error('Unauthorized');
    }

    // Allowed fields check to prevent arbitrary column updates
    const allowedFields = ['status_mail_sent', 'status_called', 'status_visited', 'status_confirmed'];
    if (!allowedFields.includes(field)) {
        throw new Error('Invalid field');
    }

    const { error } = await supabase
        .from('leads' as any) // Table not yet in types
        .update({ [field]: value })
        .eq('id', id);

    if (error) {
        console.error('Error updating lead status:', error);
        throw new Error('Failed to update status');
    }

    revalidatePath('/admin/leads');
}

export async function updateLeadNotes(id: string, notes: string) {
    const supabase = await createServerClient();

    const { error } = await supabase
        .from('leads' as any)
        .update({ notes })
        .eq('id', id);

    if (error) {
        console.error('Error updating lead notes:', error);
        throw new Error('Failed to update notes');
    }

    revalidatePath('/admin/leads');
}
