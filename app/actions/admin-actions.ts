'use server';

import { createServerClient, createAdminClient } from '@/lib/supabase-server';
import { Database } from '@/lib/database.types';
import { revalidatePath } from 'next/cache';
import { Database } from '@/lib/database.types';

const ADMIN_EMAIL = 'bronovito@gmail.com';


async function checkAdmin() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    throw new Error('Non autorizzato: Accesso riservato admin');
  }
  return supabase;
}

// --- GESTIONE TECNICI ---

export async function addTechnician(data: { name: string; phone: string; skills: string }) {
  await checkAdmin();
  const supabaseAdmin = createAdminClient();
  
  // Normalizza telefono (rimuovi spazi)
    const phone = data.phone.replaceAll(/\s/g, '');
  const skillsArray = data.skills.split(',').map(s => s.trim()).filter(Boolean);

  const newTechnician: Database['public']['Tables']['technicians']['Insert'] = {
    name: data.name,
    phone: phone,
    skills: skillsArray,
    is_active: true
  };

  const { error } = await supabaseAdmin.from('technicians').insert([newTechnician]);

  if (error) throw new Error(error.message);
  revalidatePath('/admin');
}

export async function toggleTechnicianStatus(id: string, currentStatus: boolean) {
  await checkAdmin();
  const supabaseAdmin = createAdminClient();
  await supabaseAdmin.from('technicians').update({ is_active: !currentStatus } as Database['public']['Tables']['technicians']['Update']).eq('id', id);
  revalidatePath('/admin');
}

export async function deleteTechnician(id: string) {
  await checkAdmin();
  const supabaseAdmin = createAdminClient();
  await supabaseAdmin.from('technicians').delete().eq('id', id);
  revalidatePath('/admin');
}

// --- GESTIONE LOGIN TECNICO (Public Action) ---

export async function verifyAndLinkTechnician(phone: string, userId: string) {
  // Questa funzione viene chiamata dopo che l'OTP è verificato con successo
  const supabase = await createServerClient(); // Qui usiamo il client standard, ma verifichiamo la whitelist
  
  // Cerca se il telefono è nella whitelist dei tecnici
  const { data: tech, error } = await supabase
    .from('technicians')
    .select('id, user_id, is_active')
    .eq('phone', phone)
    .single<Database['public']['Tables']['technicians']['Row']>();

  if (error || !tech) {
    return { success: false, message: 'Numero non abilitato. Contatta l\'amministrazione.' };
  }

  if (tech && !tech.is_active) {
    return { success: false, message: 'Account tecnico sospeso.' };
  }

    // Se è la prima volta, colleghiamo l'auth.uid alla tabella technicians
  if (tech && !tech.user_id) {
    // Nota: Serve service_role o admin per aggiornare user_id se l'RLS è stretto.
    // Per ora assumiamo che l'utente loggato possa "reclamare" il suo record se phone matcha
    // Oppure usiamo una RPC o function admin. Per semplicità usiamo update diretto se policy lo permette
    // In questo caso specifico, meglio usare il service client se l'RLS blocca
    const supabaseAdmin = createAdminClient(); // Assicurati che createClient possa agire o usa service role se configurato
  await supabaseAdmin.from('technicians').update({ user_id: userId } as Database['public']['Tables']['technicians']['Update']).eq('id', tech.id);
  }

  return { success: true };
}
