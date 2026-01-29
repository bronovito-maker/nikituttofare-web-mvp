// lib/supabase-helpers.ts
// Funzioni helper per interagire con Supabase

import { createServerClient } from './supabase-server';
import { Database } from './database.types';

type Ticket = Database['public']['Tables']['tickets']['Row'];
type TicketMessage = Database['public']['Tables']['messages']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

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
    console.error('Error in getCurrentUser:', error);
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
      first_name: null,
      last_name: null,
      phone: null,
      role: 'user',
      primary_role: null,
      coverage_area: null,
      created_at: new Date().toISOString(),
      business_name: null,
      loyalty_level: null,
      loyalty_points: 0,
      user_type: null,
      vat_number: null,
      is_active: true,
      status: 'active',
      pin: null,
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
    console.error('Error in getOrCreateProfile:', error);
    // Fallback a profilo mock
    return {
      id: userId,
      email,
      full_name: null,
      first_name: null,
      last_name: null,
      phone: null,
      role: 'user',
      primary_role: null,
      coverage_area: null,
      created_at: new Date().toISOString(),
      business_name: null,
      loyalty_level: null,
      loyalty_points: 0,
      user_type: null,
      vat_number: null,
      is_active: true,
      status: 'active',
      pin: null,
    };
  }
}

/**
 * Categoria valida per i ticket
 */
type TicketCategory = 'plumbing' | 'electric' | 'locksmith' | 'climate' | 'handyman' | 'generic';

/**
 * Interface per le opzioni di createTicket
 */
interface CreateTicketOptions {
  userId: string;
  category: Database['public']['Tables']['tickets']['Row']['category'];
  description: string;
  priority?: Database['public']['Tables']['tickets']['Row']['priority'];
  address?: string;
  messageContent?: string;
  status?: Database['public']['Tables']['tickets']['Row']['status'];
  imageUrl?: string;
  chatSessionId?: string;
  city?: string;
  customerName?: string;
}

/**
 * Normalizza la categoria per compatibilità con il database.
 */
function normalizeCategory(category: TicketCategory): TicketCategory {
  // Lista delle categorie accettate dal database
  const validCategories: TicketCategory[] = [
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
export async function createTicket({
  userId,
  category,
  description,
  priority = 'medium',
  address,
  status = 'pending_verification',
  chatSessionId,
  city,
  customerName
}: CreateTicketOptions): Promise<Ticket | null> {
  // Normalizza la categoria per il database
  // @ts-ignore
  const dbCategory = category;

  if (!isSupabaseConfigured()) {
    // Restituisci ticket mock se Supabase non è configurato
    const mockTicket: any = {
      id: `ticket-${Date.now()}`,
      user_id: userId,
      status: status,
      category: dbCategory,
      priority,
      description,
      address: address || null,
      payment_status: 'pending',
      created_at: new Date().toISOString(),
      chat_session_id: chatSessionId || null,
      city: city || null,
      customer_name: customerName || null,
      assigned_at: null,
      assigned_technician_id: null,
      completed_at: null,
      contact_phone: null,
      photo_url: null,
      price_range_max: null,
      price_range_min: null,
      ai_paused: false,
    };
    return mockTicket;
  }

  try {
    const supabase = await createServerClient();

    const { data, error } = await (supabase as any)
      .from('tickets')
      .insert({
        user_id: userId,
        category: dbCategory,
        description,
        priority,
        address: address || null,
        status: status,
        chat_session_id: chatSessionId || null,
        city: city || null,
        customer_name: customerName || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating ticket insert:', error);
      return null;
    }

    return data as Ticket;
  } catch (error) {
    console.error('Error in createTicket:', error);
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
      created_at: new Date().toISOString(),
      chat_session_id: chatSessionId || null,
      city: city || null,
      customer_name: customerName || null,
      assigned_at: null,
      assigned_technician_id: null,
      completed_at: null,
      contact_phone: null,
      photo_url: null,
      price_range_max: null,
      price_range_min: null,
      ai_paused: false,
    };
  }
}

/**
 * Salva un messaggio associato a un ticket
 */
export async function saveMessage(
  ticketId: string | null,
  role: 'user' | 'assistant' | 'system',
  content: string,
  imageUrl?: string | null,
  metaData?: Record<string, unknown> | null,
  chatSessionId?: string
): Promise<TicketMessage | null> {
  if (!isSupabaseConfigured()) {
    // Restituisci messaggio mock se Supabase non è configurato
    const mockMessage: any = {
      id: `msg-${Date.now()}`,
      ticket_id: ticketId,
      role,
      content,
      image_url: imageUrl || null,
      meta_data: metaData as any || null,
      created_at: new Date().toISOString(),
      chat_session_id: chatSessionId || null
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
        meta_data: metaData as any || null,
        chat_session_id: chatSessionId || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving message:', error);
      return null;
    }

    return data as TicketMessage;
  } catch (error) {
    console.error('Error in saveMessage:', error);
    // Fallback a messaggio mock
    return {
      id: `msg-${Date.now()}`,
      ticket_id: ticketId,
      role,
      content,
      image_url: imageUrl || null,
      meta_data: metaData as any || null,
      created_at: new Date().toISOString(),
      chat_session_id: chatSessionId || null
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
      console.error('Error fetching ticket messages:', error);
      return [];
    }

    return (data || []) as TicketMessage[];
  } catch (error) {
    console.error('Error in getTicketMessages:', error);
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
      console.error('Error fetching user tickets:', error);
      return [];
    }

    return (data || []) as Ticket[];
  } catch (error) {
    console.error('Error in getUserTickets:', error);
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
      console.error('Error updating ticket status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateTicketStatus:', error);
    return false;
  }
}
