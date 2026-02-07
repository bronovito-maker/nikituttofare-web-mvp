-- Migration: Add rating system to tickets table
-- Description: Allows customers to rate completed services with 1-5 stars and leave optional review text

-- Add rating columns to tickets table
ALTER TABLE public.tickets
ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN review_text TEXT,
ADD COLUMN review_created_at TIMESTAMPTZ;

-- Add index for filtering tickets with/without reviews
CREATE INDEX idx_tickets_rating ON public.tickets(rating) WHERE rating IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.tickets.rating IS 'Customer rating from 1 to 5 stars';
COMMENT ON COLUMN public.tickets.review_text IS 'Optional customer review text (max 500 chars enforced in app)';
COMMENT ON COLUMN public.tickets.review_created_at IS 'Timestamp when review was submitted';

-- RLS Policy: Users can only update ratings on their own resolved/closed tickets
-- Note: Main RLS policies are already defined in baseline, this ensures rating updates are allowed
CREATE POLICY "Users can rate their own completed tickets"
ON public.tickets
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND status IN ('resolved', 'closed')
  AND rating IS NULL -- Can only rate once
)
WITH CHECK (
  auth.uid() = user_id
  AND status IN ('resolved', 'closed')
);
