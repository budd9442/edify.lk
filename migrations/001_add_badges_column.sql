-- Add badges column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS badges jsonb DEFAULT '[]'::jsonb;

-- Comment on column
COMMENT ON COLUMN public.profiles.badges IS 'Array of badge IDs earned by the user';
