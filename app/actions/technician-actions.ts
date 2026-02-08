'use server'

import { createServerClient, createAdminClient } from '@/lib/supabase-server'
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
        console.log(`[acceptJob] Attempting update for ticket ${ticketId} with technician ${user.id}`);
        const { error: updateError, data: updateData } = await supabase
            .from('tickets')
            .update({
                assigned_technician_id: user.id,
                status: 'assigned',
                assigned_at: new Date().toISOString()
            })
            .eq('id', ticketId)
            .is('assigned_technician_id', null)
            .select();

        if (updateError) {
            console.error('[acceptJob] Update error:', updateError);
            throw new Error(`Impossibile accettare il lavoro: ${updateError.message}`);
        }

        if (!updateData || updateData.length === 0) {
            console.warn('[acceptJob] Update successful but 0 rows affected. Was the ticket already taken?');
            throw new Error('Questo lavoro è appena stato preso da un altro tecnico (concurrency).');
        }

        console.log('[acceptJob] Successfully assigned ticket:', updateData[0].id);

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

        // Use Admin client for initial lookup (bypass RLS to find associated email)
        const admin = createAdminClient()

        // 1. Smart Normalization: keep only digits
        const cleanInput = phone.replace(/\D/g, '')
        // We look for the last 10 digits to be flexible with country codes (+39, 0039, etc.)
        const lastDigits = cleanInput.slice(-10)

        console.log(`[loginTechnician] Smart Match attempt clean=${cleanInput} search digits=${lastDigits}`)

        // 2. Lookup on public.profiles using admin client
        const { data: profile, error: profileError } = await admin
            .from('profiles')
            .select('email, role')
            .eq('role', 'technician')
            .ilike('phone', `%${lastDigits}`)
            .single()

        if (profileError || !profile || !profile.email) {
            console.error(`[loginTechnician] Profile not found for search %${lastDigits}:`, profileError)
            return { success: false, message: 'Numero non registrato o non autorizzato come tecnico.' }
        }

        // 3. Perform Auth with server client to set session cookies
        const supabase = await createServerClient()
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
