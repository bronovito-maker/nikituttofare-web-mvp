'use server'

import { createServerClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { TechnicianLoginSchema, TicketActionSchema, AddNoteSchema } from '@/lib/schemas'
import { ZodError } from 'zod'

// Helper to handle Zod Errors nicely
function handleZodError(error: unknown) {
    if (error instanceof ZodError) {
        return { success: false, message: error.errors[0].message }
    }
    throw error // Re-throw other errors (auth, database) to be handled by caller or Next.js
}

export async function acceptJob(ticketIdIn: string) {
    try {
        const { ticketId } = TicketActionSchema.parse({ ticketId: ticketIdIn });

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

        // 3. Check ticket availability
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
            })
            .eq('id', ticketId)
            .is('assigned_technician_id', null)

        if (updateError) {
            console.error('Error accepting job:', updateError)
            throw new Error('Impossibile accettare il lavoro. Riprova.')
        }

        revalidatePath('/technician')
        revalidatePath(`/technician/job/${ticketId}`)

        return { success: true }
    } catch (error) {
        if (error instanceof ZodError) return { success: false, message: error.errors[0].message }
        throw error
    }
}

export async function completeJob(ticketIdIn: string) {
    try {
        const { ticketId } = TicketActionSchema.parse({ ticketId: ticketIdIn });

        const supabase = await createServerClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) throw new Error('Non autenticato')

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
            })
            .eq('id', ticketId)

        if (error) {
            console.error('Error completing job:', error)
            throw new Error('Errore durante la chiusura del lavoro')
        }

        revalidatePath('/technician')
        return { success: true }
    } catch (error) {
        if (error instanceof ZodError) return { success: false, message: error.errors[0].message }
        throw error
    }
}



export async function addJobNote(ticketIdIn: string, noteContent: string) {
    try {
        const { ticketId, content } = AddNoteSchema.parse({ ticketId: ticketIdIn, content: noteContent });

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

        // Insert internal note
        const { error } = await supabase
            .from('messages')
            .insert({
                ticket_id: ticketId,
                content: content,
                role: 'system',
                meta_data: { type: 'internal_note', author_id: user.id }
            })

        if (error) {
            console.error(error)
            throw new Error('Errore salvataggio nota')
        }

        revalidatePath(`/technician/jobs/${ticketId}`)
        return { success: true }
    } catch (error) {
        if (error instanceof ZodError) return { success: false, message: error.errors[0].message }
        throw error
    }
}


export async function loginTechnician(phoneIn: string, pinIn: string) {
    try {
        const { phone, pin } = TechnicianLoginSchema.parse({ phone: phoneIn, pin: pinIn });

        const supabase = await createServerClient()

        // 1. Normalizzazione "Smart"
        const cleanInput = phone.replace(/\D/g, '')
        const phoneToSearch = cleanInput.startsWith('39') ? cleanInput : `39${cleanInput}`

        console.log(`[loginTechnician] Smart Match attempt clean=${cleanInput} search=${phoneToSearch}`)

        // 2. Lookup su public.profiles
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('email, role')
            .eq('role', 'technician')
            .ilike('phone', `%${phoneToSearch}`)
            .single()

        if (profileError || !profile || !profile.email) {
            console.error(`[loginTechnician] Profile not found for search ${phoneToSearch}:`, profileError)
            return { success: false, message: 'Numero non registrato.' }
        }

        // 3. Esegui Auth su Supabase
        const { error: authError } = await supabase.auth.signInWithPassword({
            email: profile.email,
            password: `${pin}ntf`
        })

        if (authError) {
            console.error(`[loginTechnician] Auth failed for ${profile.email}:`, authError)
            return { success: false, message: 'PIN non valido.' }
        }

        return { success: true }
    } catch (error) {
        if (error instanceof ZodError) return { success: false, message: error.errors[0].message }
        throw error
    }
}
