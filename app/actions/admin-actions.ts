'use server'

import { Database } from '@/lib/database.types'
import { createServerClient, createAdminClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

const ADMIN_EMAIL = 'bronovito@gmail.com'

async function checkAdmin() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) {
    throw new Error('Non autorizzato: Accesso riservato admin')
  }
  return supabase
}

// --- GESTIONE TECNICI ---

export async function addTechnician(data: {
  name: string
  phone: string
  skills: string
}) {
  await checkAdmin()
  const supabaseAdmin = createAdminClient()

  // Normalizza telefono (rimuovi spazi)
  const phone = data.phone.replaceAll(/\s/g, '')
  const skillsArray = data.skills.split(',').map(s => s.trim()).filter(Boolean)

  const newTechnician: Database['public']['Tables']['technicians']['Insert'] = {
    name: data.name,
    phone: phone,
    skills: skillsArray,
    is_active: true,
  }

  const { error } = await supabaseAdmin.from('technicians').insert([newTechnician])

  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

export async function toggleTechnicianStatus(id: string, currentStatus: boolean) {
  await checkAdmin()
  const supabaseAdmin = createAdminClient()
  await supabaseAdmin
    .from('technicians')
    .update({ is_active: !currentStatus } as Database['public']['Tables']['technicians']['Update'])
    .eq('id', id)
  revalidatePath('/admin')
}

export async function deleteTechnician(id: string) {
  await checkAdmin()
  const supabaseAdmin = createAdminClient()
  await supabaseAdmin.from('technicians').delete().eq('id', id)
  revalidatePath('/admin')
}

// --- GESTIONE LOGIN TECNICO (Public Action) ---

async function findTechnicianByPhone(phone: string) {
  const supabase = await createServerClient()
  const { data: tech, error } = await supabase
    .from('technicians')
    .select('id, user_id, is_active')
    .eq('phone', phone)
    .single<Database['public']['Tables']['technicians']['Row']>()

  if (error || !tech) {
    return null
  }
  return tech
}

async function linkTechnicianToUser(technicianId: string, userId: string) {
  const supabaseAdmin = createAdminClient()
  await supabaseAdmin
    .from('technicians')
    .update({ user_id: userId })
    .eq('id', technicianId)
}

export async function verifyAndLinkTechnician(phone: string, userId: string) {
  const tech = await findTechnicianByPhone(phone)

  if (!tech) {
    return {
      success: false,
      message: "Numero non abilitato. Contatta l'amministrazione.",
    }
  }

  if (!tech.is_active) {
    return { success: false, message: 'Account tecnico sospeso.' }
  }

  if (!tech.user_id) {
    await linkTechnicianToUser(tech.id, userId)
  }

  return { success: true }
}
