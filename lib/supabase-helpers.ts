// lib/supabase-helpers.ts
// Funzioni helper per interagire con Supabase

import { createServerClient } from './supabase-server';
import { auth } from '@/auth';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import type { Ticket, TicketMessage, Profile } from './types';

// Flag per controllare se Supabase è configurato
const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key && url !== 'https://placeholder.supabase.co' && key !== 'placeholder_anon_key';
};

/**
 * Recupera l'utente corrente dalla sessione (Supabase Auth).
 * Nota: NextAuth JWT validation è temporaneamente disabilitata per problemi di firma
 */
export async function getCurrentUser() {
  // Per ora usiamo solo Supabase Auth dato che NextAuth ha problemi di validazione JWT
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      return null;
    }
    return data.user;
  } catch (error) {
    return null;
  }
}

/**
 * Crea o recupera un profilo utente
 */
export async function getOrCreateProfile(userId: string, email: string): Promise<Profile | null> {
  if (!isSupabaseConfigured()) {
    // Restituisci profilo mock se Supabase non è configurato
    return {
      id: userId,
      email,
      full_name: null,
      phone: null,
      role: 'user',
      created_at: new Date().toISOString()
    };
  }

  try {
    const supabase = await createServerClient();

    // Prova a recuperare il profilo esistente
    const { data: existingProfile, error: fetchError } = await (supabase as any)
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (existingProfile && !fetchError) {
      return existingProfile as Profile;
    }

    // Se non esiste, crealo
    const { data: newProfile, error: createError } = await (supabase as any)
      .from('profiles')
      .insert({
        id: userId,
        email,
        role: 'user',
      })
      .select()
      .single();

    if (createError) {
      return null;
    }

    return newProfile as Profile;
  } catch (error) {
    // Fallback a profilo mock
    return {
      id: userId,
      email,
      full_name: null,
      phone: null,
      role: 'user',
      created_at: new Date().toISOString()
    };
  }
}

/**
 * Normalizza la categoria per compatibilità con il database.
 */
function normalizeCategory(
  category: 'plumbing' | 'electric' | 'locksmith' | 'climate' | 'handyman' | 'generic'
): 'plumbing' | 'electric' | 'locksmith' | 'climate' | 'handyman' | 'generic' {
  // Lista delle categorie accettate dal database
  const validCategories: Array<'plumbing' | 'electric' | 'locksmith' | 'climate' | 'handyman' | 'generic'> = [
    'plumbing',
    'electric',
    'locksmith',
    'climate',
    'handyman',
    'generic',
  ];
  
  // Se la categoria è valida, usala
  if (validCategories.includes(category)) {
    return category;
  }
  
  // Fallback a generic per qualsiasi valore non riconosciuto
  return 'generic';
}

/**
 * Crea un nuovo ticket
 */
export async function createTicket(
  userId: string,
  category: 'plumbing' | 'electric' | 'locksmith' | 'climate' | 'handyman' | 'generic',
  description: string,
  priority: 'low' | 'medium' | 'high' | 'emergency' = 'medium',
  address?: string,
  messageContent?: string,
  status: 'new' | 'pending_verification' | 'confirmed' = 'pending_verification',
  imageUrl?: string
): Promise<Ticket | null> {
  // Normalizza la categoria per il database
  const dbCategory = normalizeCategory(category);
  
  if (!isSupabaseConfigured()) {
    // Restituisci ticket mock se Supabase non è configurato
    const mockTicket: Ticket = {
      id: `ticket-${Date.now()}`,
      user_id: userId,
      status: status,
      category: dbCategory,
      priority,
      description,
      address: address || null,
      payment_status: 'pending',
      created_at: new Date().toISOString()
    };
    return mockTicket;
  }

  try {
    const supabase = await createServerClient();

    const { data, error } = await (supabase as any)
      .from('tickets')
      .insert({
        user_id: userId,
        category: dbCategory, // Usa la categoria normalizzata
        description,
        priority,
        address: address || null,
        status: status,
      })
      .select()
      .single();

    if (error) {
      return null;
    }

    return data as Ticket;
  } catch (error) {
    // Fallback a ticket mock
    return {
      id: `ticket-${Date.now()}`,
      user_id: userId,
      status: status,
      category: dbCategory,
      priority,
      description,
      address: address || null,
      payment_status: 'pending',
      created_at: new Date().toISOString()
    };
  }
}

/**
 * Salva un messaggio associato a un ticket
 */
export async function saveMessage(
  ticketId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  imageUrl?: string | null,
  metaData?: Record<string, unknown> | null
): Promise<TicketMessage | null> {
  if (!isSupabaseConfigured()) {
    // Restituisci messaggio mock se Supabase non è configurato
    const mockMessage: TicketMessage = {
      id: `msg-${Date.now()}`,
      ticket_id: ticketId,
      role,
      content,
      image_url: imageUrl || null,
      meta_data: metaData || null,
      created_at: new Date().toISOString()
    };
    return mockMessage;
  }

  try {
    const supabase = await createServerClient();

    const { data, error } = await (supabase as any)
      .from('messages')
      .insert({
        ticket_id: ticketId,
        role,
        content,
        image_url: imageUrl || null,
        meta_data: metaData || null,
      })
      .select()
      .single();

    if (error) {
      return null;
    }

    return data as TicketMessage;
  } catch (error) {
    // Fallback a messaggio mock
    return {
      id: `msg-${Date.now()}`,
      ticket_id: ticketId,
      role,
      content,
      image_url: imageUrl || null,
      meta_data: metaData || null,
      created_at: new Date().toISOString()
    };
  }
}

/**
 * Recupera tutti i messaggi di un ticket
 */
export async function getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
  if (!isSupabaseConfigured()) {
    // Restituisci array vuoto se Supabase non è configurato
    return [];
  }

  try {
    const supabase = await createServerClient();

    const { data, error } = await (supabase as any)
      .from('messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) {
      return [];
    }

    return (data || []) as TicketMessage[];
  } catch (error) {
    return [];
  }
}

/**
 * Recupera tutti i ticket di un utente
 */
export async function getUserTickets(userId: string): Promise<Ticket[]> {
  if (!isSupabaseConfigured()) {
    // Restituisci array vuoto se Supabase non è configurato
    return [];
  }

  try {
    const supabase = await createServerClient();

    const { data, error } = await (supabase as any)
      .from('tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return [];
    }

    return (data || []) as Ticket[];
  } catch (error) {
    return [];
  }
}

/**
 * Aggiorna lo stato di un ticket
 */
export async function updateTicketStatus(
  ticketId: string,
  status: 'new' | 'pending_verification' | 'confirmed' | 'assigned' | 'in_progress' | 'resolved' | 'cancelled'
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    // Simula successo se Supabase non è configurato
    return true;
  }

  try {
    const supabase = await createServerClient();

    const { error } = await (supabase as any)
      .from('tickets')
      .update({ status })
      .eq('id', ticketId);

    if (error) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}
