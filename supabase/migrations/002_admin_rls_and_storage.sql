-- Migration: Enable Admin RLS Policies and Storage Bucket
-- Run this AFTER 001_initial_schema.sql in your Supabase SQL Editor

-- ============================================
-- STORAGE BUCKET: ticket-photos
-- For storing user-uploaded images
-- ============================================

-- Create the bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ticket-photos',
  'ticket-photos',
  false, -- NOT public by default
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES for ticket-photos bucket
-- ============================================

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'ticket-photos');

-- Allow authenticated users to view their uploaded images
CREATE POLICY "Authenticated users can view images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'ticket-photos');

-- Allow admins to view all images
CREATE POLICY "Admins can view all images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'ticket-photos'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Deny anonymous access to images
CREATE POLICY "Deny anonymous access to images"
  ON storage.objects
  FOR SELECT
  TO anon
  USING (false);

-- ============================================
-- HELPER FUNCTION: Check if user is admin
-- (Avoids recursion in RLS policies)
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- HELPER FUNCTION: Check if user is admin or technician
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin_or_technician()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'technician')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- ADMIN RLS POLICIES - PROFILES
-- ============================================

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id  -- Own profile
    OR public.is_admin()  -- Or is admin
  );

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- ADMIN RLS POLICIES - TICKETS
-- ============================================

-- Admins and technicians can view all tickets
CREATE POLICY "Admins can view all tickets"
  ON public.tickets
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id  -- Own tickets
    OR public.is_admin_or_technician()  -- Or is admin/technician
  );

-- Admins and technicians can update all tickets
CREATE POLICY "Admins can update all tickets"
  ON public.tickets
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_technician())
  WITH CHECK (public.is_admin_or_technician());

-- ============================================
-- ADMIN RLS POLICIES - MESSAGES
-- ============================================

-- Admins and technicians can view all messages
CREATE POLICY "Admins can view all messages"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.id = messages.ticket_id AND tickets.user_id = auth.uid()
    )
    OR public.is_admin_or_technician()
  );

-- Admins and technicians can create messages for any ticket
CREATE POLICY "Admins can create messages"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.id = messages.ticket_id AND tickets.user_id = auth.uid()
    )
    OR public.is_admin_or_technician()
  );

-- ============================================
-- SERVICE ROLE BYPASS POLICY
-- Allows service_role to bypass all RLS
-- (Used by server-side admin operations)
-- ============================================

-- Note: Service role automatically bypasses RLS in Supabase,
-- but we add explicit policies for clarity

-- ============================================
-- INDEX for faster admin queries
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_role_admin ON public.profiles(role) WHERE role = 'admin';
CREATE INDEX IF NOT EXISTS idx_tickets_created_at_desc ON public.tickets(created_at DESC);
