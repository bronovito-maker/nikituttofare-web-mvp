-- Migration: Add 'handyman' to tickets category constraint
-- This fixes the constraint violation error when category is 'handyman'

-- Step 1: Drop the existing constraint
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_category_check;

-- Step 2: Add the new constraint with 'handyman' included
ALTER TABLE public.tickets ADD CONSTRAINT tickets_category_check 
  CHECK (category IN ('plumbing', 'electric', 'locksmith', 'climate', 'handyman', 'generic'));

-- Verify the constraint was created
-- Verify the constraint was created
-- (Run manually if needed)
