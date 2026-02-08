-- Migration: Fix Technician Claim Policy
-- Date: 2026-02-08

-- 1. Drop old policy if exists (it might be named differently or missing)
DROP POLICY IF EXISTS "tickets_update_hardening" ON public.tickets;
DROP POLICY IF EXISTS "technicians_can_update_unassigned_tickets" ON public.tickets;

-- 2. Create the new "Claim" policy
-- This allows:
-- - Admins to do everything
-- - Users to update OWN tickets (e.g. status='cancelled')
-- - Technicians to claim UNASSIGNED tickets
-- - Technicians to update tickets ALREADY assigned to them
CREATE POLICY "technicians_and_admins_update_policy"
ON public.tickets
FOR UPDATE
USING (
  public.is_admin()
  OR (public.is_admin_or_technician() AND (assigned_technician_id IS NULL OR assigned_technician_id = auth.uid()))
  OR (user_id = auth.uid())
);

-- 3. Ensure SELECT policy also allows technicians to see new tickets
DROP POLICY IF EXISTS "tickets_select_hardening" ON public.tickets;
CREATE POLICY "tickets_select_policy_v2"
ON public.tickets
FOR SELECT
USING (
  public.is_admin()
  OR public.is_admin_or_technician() -- Technicians see all for the list
  OR user_id = auth.uid()
);
