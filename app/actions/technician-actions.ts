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

    // 1. Normalizzazione "Smart" (Richiesta Utente)
    // Tieni solo i numeri
    const cleanInput = phone.replace(/\D/g, '')

    // Se manca il 39 iniziale, aggiungilo (assumiamo numeri italiani per ora)
    // Logica: se input è 346... -> 39346...
    // Se input è 39346... -> resta 39346...
    const phoneToSearch = cleanInput.startsWith('39') ? cleanInput : `39${cleanInput}`

    console.log(`[loginTechnician] Smart Match attempt: Input=${phone} -> Clean=${cleanInput} -> Search=${phoneToSearch}`)

    // 2. Lookup su public.profiles (Smart Match)
    // Cerca qualsiasi numero che FINISCE con la sequenza (per gestire il + o 00 davanti nel DB)
    // O meglio, usiamo ilike con % davanti.
    // DB: +39346...
    // Search: 39346...
    // Logic: ilike '%39346...' matches '+39346...'
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, role')
        .eq('role', 'technician')
        .ilike('phone', `%${phoneToSearch}`) // Cerca il numero indipendentemente dal formato esatto prefisso
        .single()

    if (profileError || !profile || !profile.email) {
        console.error(`[loginTechnician] Profile not found for search ${phoneToSearch}:`, profileError)
        return { success: false, message: 'Numero non registrato.' }
    }

    console.log(`[loginTechnician] Match found: ${profile.email}`)

    // 3. Esegui Auth su Supabase (Server-Side)
    const { error: authError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: `${pin}ntf` // Manteniamo la logica del suffisso se è così che sono stati creati
    })

    if (authError) {
        console.error(`[loginTechnician] Auth failed for ${profile.email}:`, authError)
        return { success: false, message: 'PIN non valido.' }
    }

    return { success: true }
}
