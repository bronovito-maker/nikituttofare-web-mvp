// lib/types/internal-app.ts
import { Database } from '../database.types';

/**
 * Tipi base estratti da Database['public']
 */
export type TicketRow = Database['public']['Tables']['tickets']['Row'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];

/**
 * Estensione del Ticket per l'App Interna.
 * Include i campi che verranno aggiunti tramite migration manuale.
 */
export interface ExtendedTicket extends TicketRow {
  source: 'website' | 'phone_manual';
  scheduled_at: string | null;
  work_summary: string | null;
  actual_duration_minutes: number | null;
  assigned_technician_id: string | null;
  assistant_thread_id: string | null;
  tenant_id: string;
  created_by_technician_id: string | null;
}

/**
 * Memoria del progetto per l'assistente AI (riflesso della nuova tabella)
 */
export interface AssistantProjectMemory {
  id: string;
  ticket_id: string;
  summary: string | null;
  open_items: any[]; // JSONB
  last_tools_used: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Notifiche Interne Tecnico (riflesso della nuova tabella)
 */
export interface TechnicianNotification {
  id: string;
  technician_id: string;
  ticket_id: string | null;
  type: 'job_reminder' | 'inventory_alert' | 'ai_reminder';
  title: string;
  body: string;
  priority: 'low' | 'medium' | 'high';
  status: 'unread' | 'read' | 'archived';
  scheduled_for: string | null;
  sent_at: string | null;
  meta_data: Record<string, any>;
  created_at: string;
}

/**
 * Tipi per la creazione di un Manual Job
 */
export interface CreateManualJobParams {
  category: string;
  description: string;
  customer_name: string;
  contact_phone: string | number;
  city: string;
  address: string;
  scheduled_at?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  user_id?: string | null;
}
