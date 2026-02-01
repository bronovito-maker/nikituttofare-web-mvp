-- ============================================
-- Migration: Security Hardening & RLS (008)
-- Applies strict Row Level Security policies to sensitive tables
-- ============================================

-- 1. Enable RLS on user_assets (others already enabled in 003, but good to ensure)
ALTER TABLE public.user_assets ENABLE ROW LEVEL SECURITY;
-- Ensure others are enabled (idempotent)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS (Reuse existing or ensure exist)
-- ============================================
-- Assuming public.is_admin() and public.is_admin_or_technician() defined in 003

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Drop potentially conflicting policies from previous migrations to be safe
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin_policy" ON public.profiles;

-- SELECT: Users see own. Admins and Technicians see ALL (needed for assigning jobs)
CREATE POLICY "profiles_select_hardening"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id
    OR public.is_admin_or_technician() 
  );

-- UPDATE: Users update own. Admins update all.
CREATE POLICY "profiles_update_hardening"
  ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() = id
    OR public.is_admin()
  )
  WITH CHECK (
    auth.uid() = id
    OR public.is_admin()
  );

-- ============================================
-- TICKETS POLICIES
-- ============================================

DROP POLICY IF EXISTS "tickets_select_policy" ON public.tickets;
DROP POLICY IF EXISTS "tickets_insert_policy" ON public.tickets;
DROP POLICY IF EXISTS "tickets_update_own_policy" ON public.tickets;
DROP POLICY IF EXISTS "tickets_update_admin_policy" ON public.tickets;

-- SELECT: 
-- 1. Owner (user_id = auth.uid())
-- 2. Assigned Technician (assigned_technician_id = auth.uid())
-- 3. Admins (via is_admin function)
-- 4. Technicians for UNASSIGNED tickets (to claim them) 
--    (Optional: refine this if we want them to see only "nearby" tickets later)
CREATE POLICY "tickets_select_hardening"
  ON public.tickets
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR assigned_technician_id = auth.uid()
    OR public.is_admin()
    -- Technicians can see unassigned tickets to claim them? 
    -- For now, let's allow technicians to see ALL tickets to simplify "Find Jobs"
    OR (public.is_admin_or_technician()) 
  );

-- INSERT: Authenticated users can create tickets
CREATE POLICY "tickets_insert_hardening"
  ON public.tickets
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

-- UPDATE:
-- 1. Owner (can update own ticket, e.g. cancel)
-- 2. Assigned Technician (can update status/notes)
-- 3. Admins
CREATE POLICY "tickets_update_hardening"
  ON public.tickets
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR assigned_technician_id = auth.uid()
    OR public.is_admin()
  );

-- ============================================
-- MESSAGES POLICIES
-- ============================================

DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;

-- SELECT: Visible if user owns the ticket OR technician is assigned OR admin
-- Uses a semi-join with tickets table.
CREATE POLICY "messages_select_hardening"
  ON public.messages
  FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.id = messages.ticket_id
      AND (
        tickets.user_id = auth.uid()
        OR tickets.assigned_technician_id = auth.uid()
        -- If technicians can see all tickets, they should see messages? 
        -- Generally messages are private until assigned. 
        -- Let's stick to assigned_technician_id for privacy.
        OR (public.is_admin_or_technician() AND tickets.assigned_technician_id IS NULL) -- Allow seeing messages on unassigned tickets?
      )
    )
  );

-- INSERT: Same logic as Select
CREATE POLICY "messages_insert_hardening"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.id = messages.ticket_id
      AND (
        tickets.user_id = auth.uid()
        OR tickets.assigned_technician_id = auth.uid()
      )
    )
  );

-- ============================================
-- USER ASSETS POLICIES
-- ============================================

DROP POLICY IF EXISTS "assets_isolation_policy" ON public.user_assets;

CREATE POLICY "assets_select_own"
  ON public.user_assets
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "assets_insert_own"
  ON public.user_assets
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "assets_update_own"
  ON public.user_assets
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "assets_delete_own"
  ON public.user_assets
  FOR DELETE
  USING (user_id = auth.uid());
