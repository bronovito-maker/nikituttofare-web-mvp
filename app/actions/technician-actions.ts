'use server'

import { createServerClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function acceptJob(ticketId: string) {
    const supabase = await createServerClient()

    // 1. Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        throw new Error('Non autenticato')
    }

    // 2. Refresh session/role check
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profileError || profile?.role !== 'technician') {
        throw new Error('Accesso negato: Solo i tecnici possono accettare lavori')
    }

    // 3. Check ticket availability (Concurrency Safe-ish via RLS/Constraints ideally, but logic here helps)
    const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select('id, status, assigned_technician_id')
        .eq('id', ticketId)
        .single()

    if (ticketError || !ticket) {
        throw new Error('Ticket non trovato')
    }

    if (ticket.assigned_technician_id) {
        if (ticket.assigned_technician_id === user.id) {
            return { success: true, message: "Hai già accettato questo lavoro" }
        }
        throw new Error('Questo lavoro è già stato preso da un altro tecnico')
    }

    // 4. Assign Job
    const { error: updateError } = await supabase
        .from('tickets')
        .update({
            assigned_technician_id: user.id,
            status: 'assigned',
            assigned_at: new Date().toISOString()
        } as any)
        .eq('id', ticketId)
        // Ensure we don't overwrite if race condition happens
        .is('assigned_technician_id', null)

    if (updateError) {
        console.error('Error accepting job:', updateError)
        throw new Error('Impossibile accettare il lavoro. Riprova.')
    }

    revalidatePath('/technician')
    revalidatePath(`/technician/job/${ticketId}`)

    return { success: true }
}

export async function completeJob(ticketId: string) {
    const supabase = await createServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Non autenticato')

    // Check ownership
    const { data: ticket } = await supabase
        .from('tickets')
        .select('assigned_technician_id, status')
        .eq('id', ticketId)
        .single()

    if (!ticket || ticket.assigned_technician_id !== user.id) {
        throw new Error('Non autorizzato. Questo incarico non è tuo.')
    }

    const { error } = await supabase
        .from('tickets')
        .update({
            status: 'resolved',
            completed_at: new Date().toISOString()
        } as any)
        .eq('id', ticketId)

    if (error) {
        console.error('Error completing job:', error)
        throw new Error('Errore durante la chiusura del lavoro')
    }

    revalidatePath('/technician')
    return { success: true }
}


export async function addJobNote(ticketId: string, noteContent: string) {
    const supabase = await createServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non autenticato')

    // Check ownership (security)
    const { data: ticket } = await supabase
        .from('tickets')
        .select('assigned_technician_id')
        .eq('id', ticketId)
        .single()

    if (!ticket || ticket.assigned_technician_id !== user.id) {
        throw new Error('Non autorizzato')
    }

    // Insert internal note as a special message type or role
    const { error } = await supabase
        .from('messages')
        .insert({
            ticket_id: ticketId,
            content: noteContent,
            role: 'system', // Using 'system' as proxy for internal note or add 'note' to enum if psosible. Using 'system' + metadata for now.
            meta_data: { type: 'internal_note', author_id: user.id }
        })

    if (error) {
        console.error(error)
        throw new Error('Errore salvataggio nota')
    }

    revalidatePath(`/technician/jobs/${ticketId}`)
    return { success: true }
}


export async function loginTechnician(phone: string, pin: string) {
    const supabase = await createServerClient()

    // 1. Normalizzazione rigorosa
    // Rimuovi tutto ciò che non è numero o +
    let cleanPhone = phone.replaceAll(/[^0-9+]/g, '')
    // Se inizia per 39 o 3.. (senza +), forziamo +39 se sembra un cellulare IT
    if (!cleanPhone.startsWith('+')) {
        if (cleanPhone.startsWith('39')) {
            cleanPhone = '+' + cleanPhone
        } else {
            // Assumo che se l'utente digita 333123... intenda +39333...
            cleanPhone = '+39' + cleanPhone
        }
    }

    console.log(`[loginTechnician] Attempting login for phone: ${cleanPhone}`)

    // 2. Lookup su public.profiles per trovare l'email
    // (L'email è l'identificativo reale per Supabase Auth)
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, role')
        .eq('phone', cleanPhone)
        .eq('role', 'technician')
        .single()

    if (profileError || !profile || !profile.email) {
        console.error(`[loginTechnician] Profile not found for phone ${cleanPhone}:`, profileError)
        return { success: false, message: 'Numero non riconosciuto o non abilitato come tecnico.' }
    }

    console.log(`[loginTechnician] Found profile: ${profile.email}`)

    // 3. Esegui Auth su Supabase (Server-Side)
    // Questo imposta il cookie di sessione per il middleware/SSR
    const { error: authError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: `${pin}ntf` // La password è PIN + "ntf"
    })

    if (authError) {
        console.error(`[loginTechnician] Auth failed for ${profile.email}:`, authError)
        return { success: false, message: 'PIN non valido.' }
    }

    return { success: true }
}
