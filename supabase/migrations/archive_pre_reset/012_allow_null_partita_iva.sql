-- Migration: Allow NULL for partita_iva (for technicians without VAT yet)
ALTER TABLE public.technician_applications 
ALTER COLUMN partita_iva DROP NOT NULL;
