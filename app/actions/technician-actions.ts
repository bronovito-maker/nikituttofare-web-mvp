// app/actions/technician-actions.ts
'use server';

import { createServerClient, createAdminClient } from '@/lib/supabase-server';
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
            user_id: params.user_id || null,
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
        .order('created_at', { ascending: false });

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

/**
 * Ricerca clienti per nome per il pre-popolamento dei campi
 */
export async function searchCustomers(query: string) {
    if (!query || query.length < 2) return [];

    const user = await getCurrentUser();
    if (!user) throw new Error('Non autorizzato');

    const supabase = createAdminClient();

    // Cerchiamo i dati storici direttamente nella tabella tickets
    console.log('[searchCustomers] Avvio ricerca per:', query);
    let queryBuilder = supabase
        .from('tickets')
        .select(`
            customer_name,
            contact_phone,
            address,
            city
        `);

    // Se la query sembra un numero di telefono, cerchiamo per telefono, altrimenti per nome
    const isPhoneQuery = /^\d+$/.test(query.replace(/\s/g, ''));
    
    if (isPhoneQuery) {
        // Se è un numero, cerchiamo corrispondenza esatta nel telefono o parziale nel nome
        const phoneValue = parseInt(query.replace(/\s/g, ''), 10);
        if (!isNaN(phoneValue)) {
            queryBuilder = queryBuilder.or(`contact_phone.eq.${phoneValue},customer_name.ilike.%${query}%`);
        } else {
            queryBuilder = queryBuilder.ilike('customer_name', `%${query}%`);
        }
    } else {
        queryBuilder = queryBuilder.ilike('customer_name', `%${query}%`);
    }

    const { data, error } = await queryBuilder
        .order('created_at', { ascending: false })
        .limit(30);

    console.log('[searchCustomers] Risultati trovati:', (data || []).length);

    if (error) {
        console.error('Errore ricerca clienti in tickets:', error);
        return [];
    }

    // Filtriamo i duplicati basandoci su nome e telefono
    const uniqueCustomers = new Map();
    (data || []).forEach((t: any) => {
        const key = `${t.customer_name}-${t.contact_phone}`;
        if (!uniqueCustomers.has(key)) {
            uniqueCustomers.set(key, {
                id: null,
                full_name: t.customer_name,
                contact_phone: t.contact_phone,
                address: t.address || '',
                city: t.city || '',
            });
        }
    });

    return Array.from(uniqueCustomers.values()).slice(0, 5);
}

/**
 * Recupera la cronologia dei messaggi per un ticket
 */
export async function getChatHistory(ticketId: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Non autorizzato');

    const supabase = await createServerClient();

    const { data, error } = await supabase
        .from('messages')
        .select('role, content, created_at')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Errore recupero cronologia:', error);
        return [];
    }

    return data;
}

/**
 * Recupera la lista della spesa per un ticket dalla memoria assistente
 */
export async function getShoppingList(ticketId: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Non autorizzato');

    const supabase = await createServerClient();

    const { data, error } = await supabase
        .from('assistant_project_memory' as any)
        .select('open_items')
        .eq('ticket_id', ticketId)
        .single();

    if (error && error.code !== 'PGRST116') { // Ignoriamo "no rows"
        console.error('Errore recupero lista spesa:', error);
        return [];
    }

    return (data as any)?.open_items || [];
}

/**
 * Aggiorna la lista della spesa (salva l'intero array)
 */
export async function updateShoppingList(ticketId: string, items: any[]) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Non autorizzato');

    const supabase = await createServerClient();

    const { error } = await supabase
        .from('assistant_project_memory' as any)
        .upsert({ 
            ticket_id: ticketId, 
            open_items: items,
            updated_at: new Date().toISOString()
        } as any);

    if (error) {
        console.error('Errore aggiornamento lista spesa:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}
