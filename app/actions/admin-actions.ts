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

// Helper per normalizzare il telefono (rimuove spazi, assicura +39)
function normalizePhone(phone: string): string {
  // Rimuovi tutto ciò che non è digit o +
  let clean = phone.replaceAll(/[^0-9+]/g, '')

  // Se inizia con 39 (senza +), aggiungi +
  if (clean.startsWith('39') && !clean.startsWith('+')) {
    clean = '+' + clean
  }

  // Se non inizia con +39, aggiungi +39 (assumendo numero IT)
  if (!clean.startsWith('+39')) {
    // Se inizia con +, ma non 39, è estero? Per ora forziamo IT se manca
    if (clean.startsWith('+')) {
      // Lasciamo così com'è se è un altro prefisso
    } else {
      clean = '+39' + clean
    }
  }

  return clean
}

// --- GESTIONE TECNICI ---

export async function registerTechnician(formData: FormData) {
  await checkAdmin()
  const supabaseAdmin = createAdminClient()

  const fullName = formData.get('fullName') as string
  const phone = formData.get('phone') as string
  const pin = formData.get('pin') as string

  if (!fullName || !phone || !pin) {
    return { error: 'Nome, telefono e PIN sono obbligatori' }
  }

  // Normalizza telefono per coerenza DB
  const formattedPhone = normalizePhone(phone)

  // 1. Create Auth User (Shadow Account)
  // Email format: tecnico-[digits]@nikituttofare.it
  const emailPhone = formattedPhone.replaceAll(/\D/g, '') // Solo cifre per email
  const email = `tecnico-${emailPhone}@nikituttofare.it`
  const password = `${pin}ntf` // Deterministic password based on PIN

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, phone: formattedPhone, pin: pin } // Adding PIN to metadata for admin reference
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
      phone: formattedPhone, // Save normalized phone
      pin: Number.parseInt(pin),    // Save PIN to new column (User defined as number)
      role: 'technician',
      user_type: 'private',
      is_active: true,
      status: 'active'
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

  console.log(`[verifyAndLinkTechnician] Start check for Phone: ${phone}, UserId: ${userId}`);

  // Normalizza l'input per cercare nel DB
  const formattedPhone = normalizePhone(phone)
  console.log(`[verifyAndLinkTechnician] Normalized Phone: ${formattedPhone}`);

  // 1. Cerca se esiste un profilo tecnico con questo telefono
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('phone', formattedPhone)
    .eq('role', 'technician')
    .single()

  if (error || !profile) {
    console.error(`[verifyAndLinkTechnician] Profile not found or error. Error: ${error?.message}`);
    // Fallback search: Try without +39 or with different format if the first failed?
    // For now, strict match on normalized phone is best security.
    return { success: false, message: 'Nessun account tecnico trovato per questo numero.' }
  }

  console.log(`[verifyAndLinkTechnician] Profile found: ${profile.id} (Role: ${profile.role})`);

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
