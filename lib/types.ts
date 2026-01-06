// lib/types.ts

// Rappresenta un ristorante/cliente della piattaforma (tenant) e la sua configurazione AI
export interface Tenant {
  Id: number;
  name: string; // Nome dell'attività
  phone_number?: string;
  address?: string;
  opening_hours_json?: string; // Es: {"lun": "10-14, 18-22", ...}
  system_prompt: string; // Istruzioni base per l'AI
  extra_info?: string; // Informazioni aggiuntive (policy, menu testuale semplice, ecc.)
  notification_email?: string; // Email per ricevere notifiche
  menu_pdf_url?: string;
  menu_text?: string;
  ai_tone?: string;
  widget_color?: string;
  // Aggiungi altri campi della tabella 'tenants' se necessario
}

export type AssistantConfig = Tenant & {
  menu_url?: string | null;
};

// Rappresenta un utente che accede alla dashboard (es. ristoratore, staff)
export interface User {
  Id: number;
  tenant_id: number;
  email: string;
  password?: string; // L'hash della password
  name?: string;
  role?: string; // Es: 'admin', 'staff'
  createdAt: string;
  updatedAt: string;
  tenant?: Tenant; 
}

// Rappresenta un cliente finale del ristorante
export interface Customer {
  Id: number;
  tenant_id: number;
  full_name?: string;
  phone_number?: string;
  email?: string;
  visit_count?: number;
  last_visit_date?: string;
  createdAt: string;
  updatedAt: string;
  tenant?: Tenant;
}

// Rappresenta una singola conversazione tra AI e cliente finale
export interface Conversation {
  Id: number;
  tenant_id: number;
  customer_id?: number; // Può essere null se il cliente non è identificato
  channel: string; // Es: 'web_widget', 'whatsapp'
  intent?: 'prenotazione' | 'info' | 'ordine' | 'altro';
  summary?: string; // Breve riassunto della conversazione
  raw_log_json?: string; // JSON contenente l'array di messaggi
  status?: 'aperta' | 'chiusa' | 'in_attesa' | 'errore';
  createdAt: string;
  updatedAt: string;
  tenant?: Tenant;
  customer?: Customer;
}

// Rappresenta una prenotazione confermata o richiesta
export interface Booking {
  Id: number;
  tenant_id: number;
  customer_id: number;
  conversation_id?: number; // Collegamento alla conversazione che ha generato la prenotazione
  booking_datetime: string; // Data e ora della prenotazione (formato ISO 8601)
  party_size: number; // Numero di persone
  status: 'richiesta' | 'confermata' | 'cancellata' | 'completata';
  notes?: string; // Note aggiuntive (es. allergie, richiesta tavolo specifico)
  createdAt: string;
  updatedAt: string;
  tenant?: Tenant;
  customer?: Customer;
  conversation?: Conversation;
}

// Rappresenta un menu (es. Pranzo, Cena, Vini)
export interface Menu {
  Id: number;
  tenant_id: number;
  title: string; // Nome del menu
  description?: string;
  is_active?: boolean; // Se il menu è attualmente disponibile
  createdAt: string;
  updatedAt: string;
  tenant?: Tenant;
}

// Rappresenta una singola voce all'interno di un menu
export interface MenuItem {
  Id: number;
  menu_id: number;
  name: string; // Nome del piatto/prodotto
  description?: string;
  price?: number;
  category?: string; // Es: 'Antipasti', 'Primi', 'Dessert'
  allergens_json?: string; // Es: ["glutine", "lattosio"]
  createdAt: string;
  updatedAt: string;
  menu?: Menu;
}


// Tipo per i messaggi della chat UI (già presente in useChat.tsx, ma utile averlo globale)
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: Date; // Opzionale, per UI
}

// Rappresenta una richiesta/ticket gestita dalla dashboard
export interface Request {
  ticketId: string;
  category: string;
  status: string;
  message: string;
  createdAt: string;
  [key: string]: unknown;
}

// ============================================
// SUPABASE DATABASE TYPES
// Tipi per le tabelle del database Supabase
// ============================================

// Profile (extends auth.users)
export interface Profile {
  id: string; // uuid
  email: string;
  full_name: string | null;
  phone: string | null;
  role: 'user' | 'admin' | 'technician';
  created_at: string; // timestamptz
}

// Ticket (service request)
export interface Ticket {
  id: string; // uuid
  user_id: string; // uuid (FK -> profiles.id)
  status: 'new' | 'assigned' | 'in_progress' | 'resolved' | 'cancelled';
  category: 'plumbing' | 'electric' | 'locksmith' | 'climate' | 'generic';
  priority: 'low' | 'medium' | 'high' | 'emergency';
  description: string;
  address: string | null;
  payment_status: 'pending' | 'paid' | 'waived';
  created_at: string; // timestamptz
}

// Message (chat message associated with ticket)
export interface TicketMessage {
  id: string; // uuid
  ticket_id: string; // uuid (FK -> tickets.id)
  role: 'user' | 'assistant' | 'system';
  content: string;
  image_url: string | null;
  meta_data: Record<string, unknown> | null; // JSONB
  created_at: string; // timestamptz
}
