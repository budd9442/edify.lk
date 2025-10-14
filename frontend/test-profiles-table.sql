-- Test script to verify profiles table can be updated
-- Run this in Supabase SQL Editor to test

-- First, let's check the current structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Check if there are any existing profiles
SELECT id, name, avatar_url, bio FROM profiles LIMIT 5;

-- Test updating a profile (replace with your actual user ID)
-- UPDATE profiles 
-- SET avatar_url = 'https://test-url.com/test.jpg'
-- WHERE id = '324fa87f-4fd5-4f83-a4b1-bf619c1f1fe5';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';
