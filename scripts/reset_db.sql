-- Database Reset Script for Edify
-- WARNING: This will PERMANENTLY delete ALL data from the listed tables.
-- Run this in the Supabase SQL Editor.

-- 1. Disable triggers to prevent side effects (like auto-creating profiles)
SET session_replication_role = 'replica';

-- 2. Clean up all application data
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

-- 3. Clear auth users
-- This will delete all users from the authentication system.
-- Foreign keys to public.profiles (if any) will be handled by the truncate above or cascading.
DELETE FROM auth.users;

-- 4. Re-enable triggers
SET session_replication_role = 'origin';

-- 5. Verify cleanup (Optional)
-- SELECT count(*) FROM public.profiles;
-- SELECT count(*) FROM auth.users;
