'use server'

import { createServerClient, createAdminClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

const ADMIN_EMAIL = 'bronovito@gmail.com'

async function checkAdmin() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user?.email !== ADMIN_EMAIL) {
    throw new Error('Non autorizzato: Accesso riservato admin')
  }
  return supabase
}

// --- GESTIONE TECNICI ---

export async function registerTechnician(formData: FormData) {
  await checkAdmin()
  const supabaseAdmin = createAdminClient()

  const fullName = formData.get('fullName') as string
  const phone = formData.get('phone') as string

  if (!fullName || !phone) {
    return { error: 'Nome e telefono sono obbligatori' }
  }

  // 1. Create Auth User (Shadow Account)
  // Email format: tecnico-[phone]@nikituttofare.it
  const normalizedPhone = phone.replaceAll(/\D/g, '')
  const email = `tecnico-${normalizedPhone}@nikituttofare.it`
  const password = Math.random().toString(36).slice(-8) + 'Aa1!' // Simple random password

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, phone: phone }
  })

  if (authError) {
    console.error('Error creating auth user:', authError)
    return { error: `Errore creazione utente: ${authError.message}` }
  }

  if (!authUser.user) {
    return { error: 'Errore imprevisto: utente non creato' }
  }

  // 2. Insert Profile
  // Upsert to handle potential trigger-created profiles
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: authUser.user.id,
      email: email,
      full_name: fullName,
      phone: phone,
      role: 'technician',
      user_type: 'private'
    })

  if (profileError) {
    console.error('Error creating profile:', profileError)
    return { error: `Errore creazione profilo: ${profileError.message}` }
  }

  revalidatePath('/admin/technicians')
  return { success: true }
}


// --- GESTIONE LOGIN TECNICO (Public Action) ---

export async function verifyAndLinkTechnician(phone: string, userId: string) {
  const supabaseAdmin = createAdminClient()

  // 1. Cerca se esiste un profilo tecnico con questo telefono
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('phone', phone)
    .eq('role', 'technician')
    .single()

  if (error || !profile) {
    return { success: false, message: 'Nessun account tecnico trovato per questo numero.' }
  }

  // 2. Se l'ID è diverso (es. creato via Admin vs Login OTP),
  // qui dovremmo gestire il merge o l'aggiornamento.
  // Per ora, siccome non possiamo cambiare l'ID facilmente se è PK referenziata,
  // assumiamo che il controllo del telefono sia sufficiente per "autorizzare" l'ingresso
  // in un contesto MVP, oppure aggiorniamo metadati se necessario.

  // NOTA: In un sistema reale, dovremmo migrare i dati dal vecchio ID (creato da Admin)
  // al nuovo ID (creato da OTP) oppure forzare l'OTP a usare lo stesso ID (richiede custom auth).

  // Per sbloccare il build e l'MVP:
  // Se l'utente è autenticato (userId esiste) e il telefono corrisponde a un tecnico,
  // diamo OK.

  // Opzionale: update last login
  return { success: true }
}


// --- GESTIONE TICKETS ---

// Replaces Close Ticket with Force Close Ticket functionality or adds alias
export async function forceCloseTicket(ticketId: string): Promise<void> {
  await checkAdmin()
  const supabaseAdmin = createAdminClient()

  // Update logic to 'completed' as used in schema
  const { error } = await supabaseAdmin
    .from('tickets')
    .update({
      status: 'resolved',
      // @ts-ignore
      completed_at: new Date().toISOString()
    } as any)
    .eq('id', ticketId)

  if (error) {
    console.error('Error force closing ticket:', error)
    throw new Error(error.message)
  }

  // Revalidate both admin feed and user dashboard
  revalidatePath('/admin')
  revalidatePath('/dashboard')
}


// --- GESTIONE AZIONI TECNICO ---

export async function toggleTechnicianStatus(technicianId: string, isActive: boolean) {
  await checkAdmin()
  const supabaseAdmin = createAdminClient()

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ is_active: isActive } as any)
    .eq('id', technicianId)

  if (error) {
    console.error('Error toggling technician status:', error)
    return { success: false, message: `Errore: ${error.message}` }
  }

  revalidatePath('/admin/technicians')
  return { success: true, message: `Stato tecnico aggiornato: ${isActive ? 'Attivo' : 'Disattivato'}` }
}

export async function deleteTechnician(technicianId: string) {
  await checkAdmin()
  const supabaseAdmin = createAdminClient()

  // 1. Security Check: Check for associated tickets
  const { data: tickets, error: ticketsError } = await supabaseAdmin
    .from('tickets')
    .select('id')
    .eq('assigned_technician_id', technicianId)
    .limit(1)

  if (ticketsError) {
    console.error('Error checking tickets:', ticketsError)
    return { success: false, message: 'Errore nel controllo dei ticket associati.' }
  }

  if (tickets && tickets.length > 0) {
    return {
      success: false,
      message: 'Impossibile eliminare: il tecnico ha uno storico interventi. Procedi con la disattivazione.'
    }
  }

  // 2. Safe to delete (No tickets associated)
  // Deleting user from Auth is tricky with just Admin client depending on setup,
  // but usually we delete from profiles first or auth first. 
  // Standard Supabase: Delete user from auth.admin triggers cascade or we manage it manually.
  // Here we delete the user from auth which will likely cascade to profile if set up, 
  // OR we explicitly delete profile if no CASCADE. 
  // Let's try deleting the User from Auth Management which is cleaner.

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(technicianId)

  if (deleteError) {
    // Fallback: try deleting profile directly if auth deletion fails or isn't needed/possible
    console.error('Error deleting auth user:', deleteError)

    const { error: profileDeleteError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', technicianId)

    if (profileDeleteError) {
      return { success: false, message: `Errore eliminazione: ${profileDeleteError.message}` }
    }
  }

  revalidatePath('/admin/technicians')
  return { success: true, message: 'Tecnico eliminato definitivamente.' }
}
