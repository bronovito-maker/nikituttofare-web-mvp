-- ============================================
-- Migration: IDEMPOTENT Policy Fix
-- This migration safely drops and recreates all RLS policies
-- Can be run multiple times without errors
-- ============================================

-- ============================================
-- STEP 1: Drop ALL existing policies to start fresh
-- ============================================

-- Drop profiles policies (OLD names)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins and technicians can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins and technicians can update all profiles" ON public.profiles;

-- Drop profiles policies (NEW names - for re-run idempotency)
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin_policy" ON public.profiles;

-- Drop tickets policies (OLD names)
DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can create own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can update own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can update all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins and technicians can view all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins and technicians can update all tickets" ON public.tickets;

-- Drop tickets policies (NEW names)
DROP POLICY IF EXISTS "tickets_select_policy" ON public.tickets;
DROP POLICY IF EXISTS "tickets_insert_policy" ON public.tickets;
DROP POLICY IF EXISTS "tickets_update_own_policy" ON public.tickets;
DROP POLICY IF EXISTS "tickets_update_admin_policy" ON public.tickets;

-- Drop messages policies (OLD names)
DROP POLICY IF EXISTS "Users can view messages of own tickets" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages for own tickets" ON public.messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can create messages" ON public.messages;
DROP POLICY IF EXISTS "Admins and technicians can view all messages" ON public.messages;
DROP POLICY IF EXISTS "Admins and technicians can create messages" ON public.messages;

-- Drop messages policies (NEW names)
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;

-- Drop storage policies (if storage.objects table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
    -- OLD names
    DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can view images" ON storage.objects;
    DROP POLICY IF EXISTS "Admins can view all images" ON storage.objects;
    DROP POLICY IF EXISTS "Deny anonymous access to images" ON storage.objects;
    DROP POLICY IF EXISTS "Users can upload own images" ON storage.objects;
    DROP POLICY IF EXISTS "Users can view own images" ON storage.objects;
    -- NEW names
    DROP POLICY IF EXISTS "storage_insert_policy" ON storage.objects;
    DROP POLICY IF EXISTS "storage_select_policy" ON storage.objects;
    DROP POLICY IF EXISTS "storage_update_policy" ON storage.objects;
    DROP POLICY IF EXISTS "storage_delete_policy" ON storage.objects;
  END IF;
END$$;

-- ============================================
-- STEP 2: Ensure RLS is enabled
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: Create helper functions (SECURITY DEFINER to avoid recursion)
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

CREATE OR REPLACE FUNCTION public.is_admin_or_technician()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'technician')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_ticket_photos_bucket_id()
RETURNS TEXT AS $$
BEGIN
    RETURN 'ticket-photos';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- STEP 4: Create PROFILES policies
-- ============================================

-- SELECT: Users can view own profile OR admins can view all
CREATE POLICY "profiles_select_policy"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR public.is_admin()
  );

-- UPDATE: Users can update own profile
CREATE POLICY "profiles_update_own_policy"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- UPDATE: Admins can update any profile
CREATE POLICY "profiles_update_admin_policy"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- INSERT: Service role handles profile creation via trigger
-- No direct INSERT policy needed for authenticated users

-- ============================================
-- STEP 5: Create TICKETS policies
-- ============================================

-- SELECT: Users see own tickets OR admins/technicians see all
CREATE POLICY "tickets_select_policy"
  ON public.tickets
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_admin_or_technician()
  );

-- INSERT: Users can create tickets for themselves
CREATE POLICY "tickets_insert_policy"
  ON public.tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update own tickets
CREATE POLICY "tickets_update_own_policy"
  ON public.tickets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Admins/technicians can update any ticket
CREATE POLICY "tickets_update_admin_policy"
  ON public.tickets
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_technician())
  WITH CHECK (public.is_admin_or_technician());

-- ============================================
-- STEP 6: Create MESSAGES policies
-- ============================================

-- SELECT: Users see messages of own tickets OR admins/technicians see all
CREATE POLICY "messages_select_policy"
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

-- INSERT: Users can create messages for own tickets OR admins/technicians for any
CREATE POLICY "messages_insert_policy"
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
-- STEP 7: Create STORAGE bucket and policies
-- ============================================

-- Create bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  public.get_ticket_photos_bucket_id(),
  public.get_ticket_photos_bucket_id(),
  true,  -- Public URLs (but access controlled by policies)
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage INSERT: Authenticated users can upload to ticket-photos bucket
-- Note: We allow uploads to any path in the bucket for simplicity
CREATE POLICY "storage_insert_policy"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = public.get_ticket_photos_bucket_id());

-- Storage SELECT: Authenticated users can view images in ticket-photos
CREATE POLICY "storage_select_policy"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = public.get_ticket_photos_bucket_id());

-- Storage UPDATE: Authenticated users can update their uploads
CREATE POLICY "storage_update_policy"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = public.get_ticket_photos_bucket_id())
  WITH CHECK (bucket_id = public.get_ticket_photos_bucket_id());

-- Storage DELETE: Users can delete images in ticket-photos
CREATE POLICY "storage_delete_policy"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = public.get_ticket_photos_bucket_id());

-- ============================================
-- STEP 8: Create useful indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON public.tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON public.tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_ticket_id ON public.messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- ============================================
-- VERIFICATION QUERY (run separately to verify)
-- ============================================
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;