'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function getChatHistory(ticketId?: string, sessionId?: string) {
    const supabase = createAdminClient();

    let query = supabase.from('messages').select('*').order('created_at', { ascending: true });

    if (ticketId && sessionId) {
        query = query.or(`ticket_id.eq.${ticketId},chat_session_id.eq.${sessionId}`);
    } else if (ticketId) {
        query = query.eq('ticket_id', ticketId);
    } else if (sessionId) {
        query = query.eq('chat_session_id', sessionId);
    } else {
        return [];
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching chat history:', error);
        return [];
    }

    return data;
}

export async function sendAdminMessage(content: string, ticketId?: string, sessionId?: string) {
    const supabase = createAdminClient();

    const messageData = {
        id: crypto.randomUUID(),
        content,
        role: 'assistant', // Admin acts as the assistant/AI
        ticket_id: ticketId || null,
        chat_session_id: sessionId || null,
        created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('messages').insert(messageData);

    if (error) {
        console.error('Error sending admin message:', error);
        throw new Error('Failed to send message');
    }

    revalidatePath('/admin');
    return { success: true };
}

export async function toggleAutopilot(ticketId: string, paused: boolean) {
    const supabase = createAdminClient();

    // Assuming we added ai_paused to tickets table as per plan
    const { error } = await supabase
        .from('tickets')
        .update({ ai_paused: paused } as any) // Cast to any to avoid type error if types aren't fully synced yet
        .eq('id', ticketId);

    if (error) {
        console.error('Error toggling autopilot:', error);
        throw new Error('Failed to toggle autopilot');
    }

    revalidatePath('/admin');
    return { success: true };
}
