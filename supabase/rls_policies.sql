-- =================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =================================================================
-- These policies define who can access and modify the data in your tables.
-- RLS is enabled by default, so without these, no one can access the data.
--
-- Instructions:
-- 1. Run this script in your Supabase SQL Editor.
-- =================================================================

-- ----------------------------------------------------------------
-- Table: profiles
-- ----------------------------------------------------------------
-- 1. Enable RLS for the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Allow public read access to all profiles
-- This allows anyone to view user profiles.
CREATE POLICY "Allow public read access to profiles"
ON public.profiles
FOR SELECT
USING (true);

-- 3. Policy: Allow users to update their own profile
-- This ensures a user can only change their own full_name, bio, etc.
CREATE POLICY "Allow users to update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);


-- ----------------------------------------------------------------
-- Table: articles
-- ----------------------------------------------------------------
-- 1. Enable RLS for the articles table
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Allow public read access to published articles
-- This allows anyone to view articles that have the 'published' status.
CREATE POLICY "Allow public read access to published articles"
ON public.articles
FOR SELECT
USING (status = 'published'::article_status);

-- 3. Policy: Allow users to create articles
-- This allows any authenticated user to insert a new article.
CREATE POLICY "Allow authenticated users to create articles"
ON public.articles
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Policy: Allow authors to update their own articles
-- This ensures users can only edit their own articles.
CREATE POLICY "Allow authors to update their own articles"
ON public.articles
FOR UPDATE
USING (auth.uid() = author_id);

-- 5. Policy: Allow authors to delete their own articles
-- This ensures users can only delete their own articles.
CREATE POLICY "Allow authors to delete their own articles"
ON public.articles
FOR DELETE
USING (auth.uid() = author_id);
