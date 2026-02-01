-- Migration: Fix Profile Visibility (013)
-- Purpose: Restrict technicians from seeing ALL profiles. 
-- They should only see profiles of users assigned to them.

-- Drop the overly permissive policy from 008
DROP POLICY IF EXISTS "profiles_select_hardening" ON public.profiles;

-- Create the new, stricter policy
CREATE POLICY "profiles_select_hardening"
  ON public.profiles
  FOR SELECT
  USING (
    -- 1. User can see their own profile
    auth.uid() = id
    
    -- 2. Admins can see ALL profiles
    OR public.is_admin()
    
    -- 3. Technicians can see ONLY profiles of users they are assigned to
    OR (
        -- Optimization: Check if user is technician first to avoid expensive join for normal users? 
        -- Actually, RLS optimization is tricky. Let's keep it semantic.
        EXISTS (
            SELECT 1 FROM public.tickets
            WHERE tickets.user_id = profiles.id
            AND tickets.assigned_technician_id = auth.uid()
        )
    )
  );

-- Note: We intentionally do NOT allow technicians to see profiles for UNASSIGNED tickets.
-- They will see the Ticket details (description, city) but not the User details (Name, Phone)
-- until they claim (= are assigned) the ticket. This protects user privacy.
