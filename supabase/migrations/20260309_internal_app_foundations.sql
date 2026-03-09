-- ==========================================
-- SPRINT 0 & 1: MIGRAZIONI APP INTERNA (VERSIONE FINALE CORRETTA)
-- Esegui questo script in Supabase SQL Editor
-- focus: Rimozione totale di "owner_id" a favore di "technician_id"
-- ==========================================

-- 1. Estensione tabella 'tickets'
-- Usiamo assigned_technician_id che già esiste invece di owner_technician_id per coerenza
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS source text DEFAULT 'website' CHECK (source IN ('website', 'phone_manual')),
ADD COLUMN IF NOT EXISTS scheduled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS work_summary text,
ADD COLUMN IF NOT EXISTS actual_duration_minutes integer,
ADD COLUMN IF NOT EXISTS assistant_thread_id text;

-- Se l'utente vuole un owner specifico diverso dall'assegnato, usiamo un nome univoco
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS created_by_technician_id uuid REFERENCES public.profiles(id);

CREATE INDEX IF NOT EXISTS idx_tickets_created_by_tech ON public.tickets(created_by_technician_id);
CREATE INDEX IF NOT EXISTS idx_tickets_source ON public.tickets(source);

-- 2. Tabella Memoria Assistente per Ticket
CREATE TABLE IF NOT EXISTS public.assistant_project_memory (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    summary text,
    open_items jsonb DEFAULT '[]'::jsonb,
    last_tools_used text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 3. Tabella Notifiche Interne Tecnico (Tabella Esistente)
-- La tabella technician_notifications esiste già e usa technician_id
ALTER TABLE public.technician_notifications 
ADD COLUMN IF NOT EXISTS type text, 
ADD COLUMN IF NOT EXISTS body text,
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
ADD COLUMN IF NOT EXISTS scheduled_for timestamp with time zone,
ADD COLUMN IF NOT EXISTS meta_data jsonb DEFAULT '{}'::jsonb;

-- 4. Sicurezza (RLS)
ALTER TABLE public.assistant_project_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technician_notifications ENABLE ROW LEVEL SECURITY;

-- Reset Policy per evitare errori di duplicazione
DROP POLICY IF EXISTS "Technicians can manage memory for their tickets" ON public.assistant_project_memory;
DROP POLICY IF EXISTS "Technicians can manage their own notifications" ON public.technician_notifications;

-- Policy per Memoria: il tecnico assegnato al ticket può gestirla
CREATE POLICY "Technicians can manage memory for their tickets" ON public.assistant_project_memory
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.tickets
            WHERE tickets.id = assistant_project_memory.ticket_id
            AND (tickets.assigned_technician_id = auth.uid() OR tickets.created_by_technician_id = auth.uid())
        )
    );

-- Policy per Notifiche: il tecnico vede solo le sue (usando technician_id esistente)
CREATE POLICY "Technicians can manage their own notifications" ON public.technician_notifications
    FOR ALL USING (technician_id = auth.uid());
