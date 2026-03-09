// app/actions/technician-actions.ts
'use server';

import { createServerClient } from '@/lib/supabase-server';
import { getCurrentUser } from '@/lib/supabase-helpers';
import { CreateManualJobParams, ExtendedTicket } from '@/lib/types/internal-app';
import { revalidatePath } from 'next/cache';

/**
 * Crea un nuovo lavoro manualmente (es. da chiamata telefonica)
 */
export async function createManualJob(params: CreateManualJobParams) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Non autorizzato');

    const supabase = await createServerClient();

    // 1. Verifichiamo il ruolo dell'utente (deve essere admin o tecnico)
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin' && profile?.role !== 'technician') {
        throw new Error('Permessi insufficienti');
    }

    // 2. Inserimento ticket con campi estesi
    const { data, error } = await supabase
        .from('tickets')
        .insert({
            category: params.category,
            description: params.description,
            customer_name: params.customer_name,
            contact_phone: params.contact_phone,
            city: params.city,
            address: params.address,
            priority: params.priority || 'medium',
            status: 'confirmed',
            source: 'phone_manual',
            scheduled_at: params.scheduled_at || null,
            assigned_technician_id: user.id,
        } as any)
        .select()
        .single();

    if (error) {
        console.error('Errore creazione lavoro manuale:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/technician/jobs');
    return { success: true, data: data as ExtendedTicket };
}

/**
 * Recupera i lavori assegnati al tecnico corrente
 */
export async function getMyJobs() {
    const user = await getCurrentUser();
    if (!user) return [];

    const supabase = await createServerClient();

    const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('assigned_technician_id', user.id)
        .order('scheduled_at', { ascending: true, nullsFirst: false });

    if (error) {
        console.error('Errore recupero lavori:', error);
        return [];
    }

    return (data || []) as ExtendedTicket[];
}

/**
 * Gestisce il login del tecnico tramite numero di telefono e PIN
 */
export async function loginTechnician(phone: string, pin: string) {
    const supabase = await createServerClient();

    try {
        // 1. Cerchiamo il profilo tramite il numero di telefono
        const cleanPhone = phone.replace(/\D/g, '');

        // Cerchiamo tutti i tecnici (solitamente sono pochi, max qualche decina/centinaia)
        // per fare un confronto flessibile lato server ed evitare problemi di formato DB
        const { data: profiles, error: profileError } = await (supabase as any)
            .from('profiles')
            .select('email, role, pin, phone, full_name')
            .eq('role', 'technician');

        if (profileError || !profiles) {
            console.error('Errore query profili:', profileError);
            return { success: false, message: 'Errore durante la ricerca del tecnico.' };
        }

        // Cerchiamo il match: il numero inserito deve essere contenuto nel numero DB (o viceversa)
        const profile = profiles.find((p: any) => {
            const dbPhoneClean = (p.phone || '').replace(/\D/g, '');
            return dbPhoneClean.includes(cleanPhone) || cleanPhone.includes(dbPhoneClean);
        });

        if (!profile) {
            console.error('Nessun match trovato per:', cleanPhone);
            return { success: false, message: 'Tecnico non trovato. Verifica il numero.' };
        }

        if (profile.pin !== pin) {
            return { success: false, message: 'PIN errato.' };
        }

        const { error: authError } = await supabase.auth.signInWithPassword({
            email: profile.email,
            password: pin,
        });

        if (authError) {
            console.error('Errore Auth:', authError);
            return { success: false, message: 'Errore di autenticazione.' };
        }

        // Dopo il login, aggiorniamo i metadati dell'utente per includere il ruolo
        // Questo serve per i controlli client-side immediati (es. SiteHeader)
        await supabase.auth.updateUser({
            data: { role: 'technician' }
        });

        return { success: true };
    } catch (err) {
        console.error('Errore login:', err);
        return { success: false, message: 'Errore interno.' };
    }
}

/**
 * Accetta un incarico tecnico assegnandoselo
 */
export async function acceptJob(ticketId: string) {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: 'Non autorizzato' };

    const supabase = await createServerClient();
    const { error } = await supabase
        .from('tickets')
        .update({
            status: 'assigned',
            assigned_technician_id: user.id
        } as any)
        .eq('id', ticketId);

    if (error) {
        console.error('Errore acceptJob:', error);
        return { success: false, message: error.message };
    }

    revalidatePath('/technician/jobs');
    revalidatePath(`/technician/jobs/${ticketId}`);
    return { success: true };
}

/**
 * Segna un intervento come completato/risolto
 */
export async function completeJob(ticketId: string) {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: 'Non autorizzato' };

    const supabase = await createServerClient();
    const { error } = await supabase
        .from('tickets')
        .update({
            status: 'resolved'
        } as any)
        .eq('id', ticketId);

    if (error) {
        console.error('Errore completeJob:', error);
        return { success: false, message: error.message };
    }

    revalidatePath('/technician/jobs');
    revalidatePath(`/technician/jobs/${ticketId}`);
    return { success: true };
}

/**
 * Aggiorna la data/ora programmata di un intervento
 */
export async function updateTicketSchedule(ticketId: string, scheduledAt: string) {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: 'Non autorizzato' };

    const supabase = await createServerClient();

    // Verifichiamo che l'intervento sia assegnato a questo tecnico (o sia un admin)
    const { data: ticket, error: fetchError } = await supabase
        .from('tickets')
        .select('assigned_technician_id')
        .eq('id', ticketId)
        .single();

    if (fetchError || !ticket) {
        return { success: false, message: 'Intervento non trovato' };
    }

    if (ticket.assigned_technician_id !== user.id) {
        // Controlliamo se è un admin
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile?.role !== 'admin') {
            return { success: false, message: 'Non hai i permessi per modificare questo intervento' };
        }
    }

    const { error } = await supabase
        .from('tickets')
        .update({
            scheduled_at: scheduledAt
        } as any)
        .eq('id', ticketId);

    if (error) {
        console.error('Errore updateTicketSchedule:', error);
        return { success: false, message: error.message };
    }

    revalidatePath('/technician/jobs');
    revalidatePath(`/technician/jobs/${ticketId}`);
    return { success: true };
}
