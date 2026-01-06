-- Migration: Technician Assignment System
-- Creates tables for technician assignments with one-time magic links
-- Ensures anti-collision: only first technician to accept gets the job

-- ============================================
-- ALTER TICKETS TABLE: Add new fields
-- ============================================

-- Add city field for better geolocation
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS city TEXT;

-- Add price range fields
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS price_range_min INTEGER;

ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS price_range_max INTEGER;

-- Add photo URL field
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add assigned technician field
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS assigned_technician_id UUID REFERENCES public.profiles(id);

-- Add assignment timestamp
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

-- Index for city queries
CREATE INDEX IF NOT EXISTS idx_tickets_city ON public.tickets(city);

-- ============================================
-- TABLE: technician_assignment_tokens
-- One-time magic links for technicians to accept jobs
-- ============================================
CREATE TABLE IF NOT EXISTS public.technician_assignment_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_assignment_tokens_ticket_id ON public.technician_assignment_tokens(ticket_id);
CREATE INDEX IF NOT EXISTS idx_assignment_tokens_token ON public.technician_assignment_tokens(token);
CREATE INDEX IF NOT EXISTS idx_assignment_tokens_expires_at ON public.technician_assignment_tokens(expires_at);

-- ============================================
-- TABLE: technician_notifications
-- Track which notifications were sent to which technicians
-- ============================================
CREATE TABLE IF NOT EXISTS public.technician_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  token_id UUID REFERENCES public.technician_assignment_tokens(id),
  notification_type TEXT NOT NULL CHECK (notification_type IN ('telegram', 'sms', 'email', 'push')),
  telegram_message_id TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed'))
);

-- Index for ticket notifications
CREATE INDEX IF NOT EXISTS idx_tech_notifications_ticket_id ON public.technician_notifications(ticket_id);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE public.technician_assignment_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technician_notifications ENABLE ROW LEVEL SECURITY;

-- Technicians can view tokens they've used
CREATE POLICY "tech_tokens_select_own"
  ON public.technician_assignment_tokens
  FOR SELECT
  TO authenticated
  USING (used_by = auth.uid());

-- Admins can view all tokens
CREATE POLICY "tech_tokens_admin_select_all"
  ON public.technician_assignment_tokens
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Admins can manage all tokens
CREATE POLICY "tech_tokens_admin_all"
  ON public.technician_assignment_tokens
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Notifications policies
CREATE POLICY "tech_notifications_admin_all"
  ON public.technician_notifications
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- FUNCTION: Accept Assignment (Anti-Collision)
-- ============================================
CREATE OR REPLACE FUNCTION public.accept_technician_assignment(
  p_token TEXT,
  p_technician_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_token_record RECORD;
  v_ticket_record RECORD;
  v_result JSONB;
BEGIN
  -- Get token with row lock to prevent race conditions
  SELECT * INTO v_token_record
  FROM public.technician_assignment_tokens
  WHERE token = p_token
  FOR UPDATE;
  
  -- Check if token exists
  IF v_token_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_token',
      'message', 'Token non valido o scaduto'
    );
  END IF;
  
  -- Check if token expired
  IF v_token_record.expires_at < NOW() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'token_expired',
      'message', 'Il link è scaduto. Contatta l''amministrazione.'
    );
  END IF;
  
  -- Check if token already used (ANTI-COLLISION)
  IF v_token_record.used_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'already_assigned',
      'message', 'Intervento già assegnato a un altro tecnico.'
    );
  END IF;
  
  -- Get the ticket
  SELECT * INTO v_ticket_record
  FROM public.tickets
  WHERE id = v_token_record.ticket_id;
  
  -- Double check ticket isn't already assigned
  IF v_ticket_record.assigned_technician_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'already_assigned',
      'message', 'Intervento già assegnato a un altro tecnico.'
    );
  END IF;
  
  -- Mark token as used
  UPDATE public.technician_assignment_tokens
  SET used_at = NOW(),
      used_by = p_technician_id
  WHERE id = v_token_record.id;
  
  -- Assign ticket to technician
  UPDATE public.tickets
  SET assigned_technician_id = p_technician_id,
      assigned_at = NOW(),
      status = 'assigned'
  WHERE id = v_token_record.ticket_id;
  
  -- Return success with full ticket details (only for assigned technician)
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Intervento assegnato con successo!',
    'ticket', jsonb_build_object(
      'id', v_ticket_record.id,
      'category', v_ticket_record.category,
      'priority', v_ticket_record.priority,
      'description', v_ticket_record.description,
      'address', v_ticket_record.address,
      'city', v_ticket_record.city,
      'photo_url', v_ticket_record.photo_url,
      'price_range_min', v_ticket_record.price_range_min,
      'price_range_max', v_ticket_record.price_range_max
    ),
    'client', (
      SELECT jsonb_build_object(
        'full_name', p.full_name,
        'phone', p.phone,
        'email', p.email
      )
      FROM public.profiles p
      WHERE p.id = v_ticket_record.user_id
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Generate Assignment Token
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_assignment_token(
  p_ticket_id UUID,
  p_expires_hours INTEGER DEFAULT 24
)
RETURNS TEXT AS $$
DECLARE
  v_token TEXT;
BEGIN
  -- Generate secure random token
  v_token := encode(gen_random_bytes(32), 'hex');
  
  -- Insert token
  INSERT INTO public.technician_assignment_tokens (ticket_id, token, expires_at)
  VALUES (p_ticket_id, v_token, NOW() + (p_expires_hours || ' hours')::INTERVAL);
  
  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- INDEX: Optimize ticket queries by assigned status
-- ============================================
CREATE INDEX IF NOT EXISTS idx_tickets_unassigned 
  ON public.tickets(created_at DESC) 
  WHERE assigned_technician_id IS NULL AND status = 'new';
