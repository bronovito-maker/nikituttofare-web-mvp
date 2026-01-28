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
// (Disabilitata temporaneamente per cambio schema DB. Tecnici ora sono Profili con ruolo 'technician')

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

