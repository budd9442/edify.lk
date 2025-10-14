-- Safe SQL script to fix profiles table without conflicts
-- This script handles existing policies and columns gracefully

-- First, check if the profiles table exists, if not create it
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  bio TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns safely
DO $$ 
BEGIN
    -- Add social_links column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'social_links') THEN
        ALTER TABLE profiles ADD COLUMN social_links JSONB;
        RAISE NOTICE 'Added social_links column';
    ELSE
        RAISE NOTICE 'social_links column already exists';
    END IF;
    
    -- Add avatar_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
        RAISE NOTICE 'Added avatar_url column';
    ELSE
        RAISE NOTICE 'avatar_url column already exists';
    END IF;
    
    -- Add bio column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'bio') THEN
        ALTER TABLE profiles ADD COLUMN bio TEXT;
        RAISE NOTICE 'Added bio column';
    ELSE
        RAISE NOTICE 'bio column already exists';
    END IF;
    
    -- Add name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'name') THEN
        ALTER TABLE profiles ADD COLUMN name TEXT;
        RAISE NOTICE 'Added name column';
    ELSE
        RAISE NOTICE 'name column already exists';
    END IF;
    
    -- Add role column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user';
        RAISE NOTICE 'Added role column';
    ELSE
        RAISE NOTICE 'role column already exists';
    END IF;
END $$;

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS profiles_id_idx ON profiles(id);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);

-- Enable Row Level Security (RLS) if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'profiles' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on profiles table';
    ELSE
        RAISE NOTICE 'RLS already enabled on profiles table';
    END IF;
END $$;

-- Create policies safely (drop existing ones first)
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
    
    -- Create new policies
    CREATE POLICY "Users can view all profiles" ON profiles
        FOR SELECT USING (true);
    
    CREATE POLICY "Users can update own profile" ON profiles
        FOR UPDATE USING (auth.uid() = id);
    
    CREATE POLICY "Users can insert own profile" ON profiles
        FOR INSERT WITH CHECK (auth.uid() = id);
    
    RAISE NOTICE 'Created RLS policies for profiles table';
END $$;

-- Create or replace the function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'User'), 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create or replace the function to update updated_at automatically
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace trigger for updated_at
DROP TRIGGER IF EXISTS handle_updated_at ON profiles;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
