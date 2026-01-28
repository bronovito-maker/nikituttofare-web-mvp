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
  const normalizedPhone = phone.replace(/\D/g, '')
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

export const closeTicket = forceCloseTicket;

