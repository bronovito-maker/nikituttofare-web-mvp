-- Migration: Create technician_applications table
-- Purpose: Store technician registration applications

CREATE TABLE IF NOT EXISTS public.technician_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  specializations TEXT[] NOT NULL,
  zones TEXT[] NOT NULL,
  partita_iva TEXT NOT NULL,
  experience TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'contacted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ
);

-- Add comments
COMMENT ON TABLE public.technician_applications IS 'Applications from technicians who want to join the NikiTuttoFare network';
COMMENT ON COLUMN public.technician_applications.status IS 'pending = new, contacted = in review, approved = accepted, rejected = declined';

-- Enable RLS
ALTER TABLE public.technician_applications ENABLE ROW LEVEL SECURITY;

-- Only admins can read applications
CREATE POLICY "Admins can read technician applications"
  ON public.technician_applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Service role can insert (for API endpoint)
CREATE POLICY "Service role can insert technician applications"
  ON public.technician_applications
  FOR INSERT
  WITH CHECK (true);

-- Only admins can update status
CREATE POLICY "Admins can update technician applications"
  ON public.technician_applications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Create index for faster queries
CREATE INDEX idx_technician_applications_status ON public.technician_applications(status);
CREATE INDEX idx_technician_applications_created_at ON public.technician_applications(created_at DESC);
