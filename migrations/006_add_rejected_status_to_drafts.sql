-- Add 'rejected' status to drafts and rejection_reason column
-- Fixes 400 error when editors reject submissions

-- Drop existing status check constraint
ALTER TABLE public.drafts DROP CONSTRAINT IF EXISTS drafts_status_check;

-- Add new constraint including 'rejected'
ALTER TABLE public.drafts ADD CONSTRAINT drafts_status_check
  CHECK (status = ANY (ARRAY['draft'::text, 'submitted'::text, 'published'::text, 'rejected'::text]));

-- Add rejection_reason column for editor feedback
ALTER TABLE public.drafts ADD COLUMN IF NOT EXISTS rejection_reason text;
