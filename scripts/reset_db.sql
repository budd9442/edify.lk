-- Database Reset Script for Edify
-- WARNING: This will PERMANENTLY delete ALL data from the listed tables.
-- Run this in the Supabase SQL Editor.

-- 1. Disable triggers to prevent side effects (like auto-creating profiles)
SET session_replication_role = 'replica';

-- 2. Clean up all application data (public schema only)
-- USING CASCADE to ensure dependent records are handled
TRUNCATE TABLE 
    public.article_views,
    public.articles,
    public.comments,
    public.drafts,
    public.follows,
    public.likes,
    public.notifications,
    public.profiles,
    public.quiz_attempts,
    public.quizzes
RESTART IDENTITY CASCADE;

-- 3. Re-enable triggers BEFORE touching auth.*
--    Supabase expects its auth triggers to run when modifying auth.users.
SET session_replication_role = 'origin';

-- 4. Clear auth users using the supported path
--    This will cascade via Supabase's own auth triggers.
DELETE FROM auth.users;

-- 5. Verify cleanup (Optional)
-- SELECT count(*) FROM public.profiles;
-- SELECT count(*) FROM auth.users;
