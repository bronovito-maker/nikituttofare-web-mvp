// lib/supabase-helpers.ts
// Funzioni helper per interagire con Supabase

import { createServerClient } from './supabase-server';
import type { Ticket, TicketMessage, Profile } from './types';

// Flag per controllare se Supabase è configurato
const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key && url !== 'https://placeholder.supabase.co' && key !== 'placeholder_anon_key';
};

/**
 * Recupera l'utente corrente dalla sessione Supabase (cookie-based).
 */
export async function getCurrentUser() {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) return null;
    return data.user;
  } catch (error) {
    console.error('Errore nel recupero utente corrente:', error);
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
    const supabase = createServerClient();

    // Prova a recuperare il profilo esistente
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId as string)
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
      console.error('Errore nella creazione del profilo:', createError);
      return null;
    }

    return newProfile as Profile;
  } catch (error) {
    console.error('Errore Supabase:', error);
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
 * Crea un nuovo ticket
 */
export async function createTicket(
  userId: string,
  category: 'plumbing' | 'electric' | 'locksmith' | 'climate' | 'generic',
  description: string,
  priority: 'low' | 'medium' | 'high' | 'emergency' = 'medium',
  address?: string,
  messageContent?: string,
  imageUrl?: string
): Promise<Ticket | null> {
  if (!isSupabaseConfigured()) {
    // Restituisci ticket mock se Supabase non è configurato
    const mockTicket: Ticket = {
      id: `ticket-${Date.now()}`,
      user_id: userId,
      status: 'new',
      category,
      priority,
      description,
      address: address || null,
      payment_status: 'pending',
      created_at: new Date().toISOString()
    };
    console.log('Ticket mock creato:', mockTicket);
    return mockTicket;
  }

  try {
    const supabase = createServerClient();

    const { data, error } = await (supabase as any)
      .from('tickets')
      .insert({
        user_id: userId,
        category,
        description,
        priority,
        address: address || null,
        status: 'new',
      })
      .select()
      .single();

    if (error) {
      console.error('Errore nella creazione del ticket:', error);
      return null;
    }

    return data as Ticket;
  } catch (error) {
    console.error('Errore Supabase:', error);
    // Fallback a ticket mock
    return {
      id: `ticket-${Date.now()}`,
      user_id: userId,
      status: 'new',
      category,
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
    console.log('Messaggio mock salvato:', mockMessage);
    return mockMessage;
  }

  try {
    const supabase = createServerClient();

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
      console.error('Errore nel salvataggio del messaggio:', error);
      return null;
    }

    return data as TicketMessage;
  } catch (error) {
    console.error('Errore Supabase:', error);
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
    console.log('Recupero messaggi mock per ticket:', ticketId);
    return [];
  }

  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('ticket_id', ticketId as string)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Errore nel recupero dei messaggi:', error);
      return [];
    }

    return (data || []) as TicketMessage[];
  } catch (error) {
    console.error('Errore Supabase:', error);
    return [];
  }
}

/**
 * Recupera tutti i ticket di un utente
 */
export async function getUserTickets(userId: string): Promise<Ticket[]> {
  if (!isSupabaseConfigured()) {
    // Restituisci array vuoto se Supabase non è configurato
    console.log('Recupero ticket mock per user:', userId);
    return [];
  }

  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('user_id', userId as string)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Errore nel recupero dei ticket:', error);
      return [];
    }

    return (data || []) as Ticket[];
  } catch (error) {
    console.error('Errore Supabase:', error);
    return [];
  }
}

/**
 * Aggiorna lo stato di un ticket
 */
export async function updateTicketStatus(
  ticketId: string,
  status: 'new' | 'assigned' | 'in_progress' | 'resolved' | 'cancelled'
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    // Simula successo se Supabase non è configurato
    console.log('Aggiornamento ticket mock:', ticketId, 'status:', status);
    return true;
  }

  try {
    const supabase = createServerClient();

    const { error } = await (supabase as any)
      .from('tickets')
      .update({ status })
      .eq('id', ticketId);

    if (error) {
      console.error('Errore nell\'aggiornamento del ticket:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Errore Supabase:', error);
    return false;
  }
}
