-- Add pending_verification and confirmed status to tickets table
ALTER TABLE public.tickets 
DROP CONSTRAINT IF EXISTS tickets_status_check;

ALTER TABLE public.tickets 
ADD CONSTRAINT tickets_status_check 
CHECK (status IN ('new', 'pending_verification', 'confirmed', 'assigned', 'in_progress', 'resolved', 'cancelled'));
