-- Add custom_author column to articles and drafts
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS custom_author text;
ALTER TABLE public.drafts ADD COLUMN IF NOT EXISTS custom_author text;
