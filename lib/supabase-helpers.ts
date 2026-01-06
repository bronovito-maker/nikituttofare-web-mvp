// lib/supabase-helpers.ts
// Funzioni helper per interagire con Supabase

import { createServerClient } from './supabase';
import type { Ticket, TicketMessage, Profile } from './types';

/**
 * Crea o recupera un profilo utente
 */
export async function getOrCreateProfile(userId: string, email: string): Promise<Profile | null> {
  const supabase = createServerClient();

  // Prova a recuperare il profilo esistente
  const { data: existingProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (existingProfile && !fetchError) {
    return existingProfile as Profile;
  }

  // Se non esiste, crealo
  const { data: newProfile, error: createError } = await supabase
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
}

/**
 * Crea un nuovo ticket
 */
export async function createTicket(
  userId: string,
  category: 'plumbing' | 'electric' | 'locksmith' | 'climate' | 'generic',
  description: string,
  priority: 'low' | 'medium' | 'high' | 'emergency' = 'medium',
  address?: string
): Promise<Ticket | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
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
  const supabase = createServerClient();

  const { data, error } = await supabase
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
}

/**
 * Recupera tutti i messaggi di un ticket
 */
export async function getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Errore nel recupero dei messaggi:', error);
    return [];
  }

  return (data || []) as TicketMessage[];
}

/**
 * Recupera tutti i ticket di un utente
 */
export async function getUserTickets(userId: string): Promise<Ticket[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Errore nel recupero dei ticket:', error);
    return [];
  }

  return (data || []) as Ticket;
}

/**
 * Aggiorna lo stato di un ticket
 */
export async function updateTicketStatus(
  ticketId: string,
  status: 'new' | 'assigned' | 'in_progress' | 'resolved' | 'cancelled'
): Promise<boolean> {
  const supabase = createServerClient();

  const { error } = await supabase
    .from('tickets')
    .update({ status })
    .eq('id', ticketId);

  if (error) {
    console.error('Errore nell\'aggiornamento del ticket:', error);
    return false;
  }

  return true;
}
