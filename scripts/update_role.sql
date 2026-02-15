-- Run this in the Supabase SQL Editor
UPDATE profiles
SET role = 'editor'
WHERE id IN (
  -- Get the user ID from auth.users based on the email
  SELECT id FROM auth.users WHERE email = '[EMAIL_ADDRESS]'
);
