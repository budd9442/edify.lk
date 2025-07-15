-- =================================================================
-- UPDATE SCRIPT FOR ARTICLE OWNERSHIP
-- =================================================================
-- This script updates the ownership of the sample articles to your
-- specific user ID.
--
-- Instructions:
-- 1. Replace the placeholder 'YOUR_USER_ID_HERE' with your actual
--    Supabase User UID.
-- 2. Run this script in your Supabase SQL Editor.
-- =================================================================

DO $$
DECLARE
    target_user_id UUID := '1c579344-011b-4f58-af32-058951fbedce'; -- <-- PASTE YOUR USER UID HERE
    demo_user_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- Update the author_id for all articles currently owned by the demo user
    UPDATE articles
    SET author_id = target_user_id
    WHERE author_id = demo_user_id;

    -- Recalculate and update the articles_count for your user profile
    UPDATE profiles
    SET articles_count = (
        SELECT COUNT(*)
        FROM articles
        WHERE author_id = target_user_id
    )
    WHERE id = target_user_id;

    -- Optional: Recalculate and update the articles_count for the demo user (should be 0)
    UPDATE profiles
    SET articles_count = 0
    WHERE id = demo_user_id;

    RAISE NOTICE 'Successfully reassigned articles to user %', target_user_id;
END $$;
