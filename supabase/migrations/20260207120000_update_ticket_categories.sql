-- Migration to add more categories to tickets table
-- Applied on: 2026-02-07

ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_category_check;

ALTER TABLE public.tickets ADD CONSTRAINT tickets_category_check 
CHECK (category = ANY (ARRAY[
  'plumbing'::text, 
  'electric'::text, 
  'locksmith'::text, 
  'climate'::text, 
  'handyman'::text, 
  'painting'::text,
  'cleaning'::text,
  'carpentry'::text,
  'moving'::text,
  'garden'::text,
  'appliances'::text,
  'renovations'::text,
  'generic'::text
]));
