-- Migration: Restrict Technician Visibility (010)
-- Restricts technicians to only see tickets assigned to them or unassigned (available) tickets.
-- Addresses the "God Mode" issue where technicians could see tickets assigned to others.

-- Helper comment: Ensure is_admin_or_technician exists (created in 003)

DROP POLICY IF EXISTS "tickets_select_hardening" ON public.tickets;

CREATE POLICY "tickets_select_hardening"
  ON public.tickets
  FOR SELECT
  USING (
    -- 1. Owner can see their own ticket
    user_id = auth.uid()
    -- 2. Assigned Technician can see the ticket
    OR assigned_technician_id = auth.uid()
    -- 3. Admins can see EVERYTHING
    OR public.is_admin()
    -- 4. Technicians (and Admins) can see UNASSIGNED tickets (to claim them)
    -- This prevents technicians from seeing tickets assigned to *other* technicians
    OR (public.is_admin_or_technician() AND assigned_technician_id IS NULL)
  );
