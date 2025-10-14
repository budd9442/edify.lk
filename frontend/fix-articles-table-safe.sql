-- Safe Articles Table Setup Script
-- This script ensures articles table has proper structure and policies

-- First, ensure articles table has necessary columns
DO $$
BEGIN
    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' AND column_name = 'status'
    ) THEN
        ALTER TABLE articles ADD COLUMN status TEXT DEFAULT 'published';
        RAISE NOTICE 'Added status column to articles table';
    END IF;
    
    -- Add author_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' AND column_name = 'author_id'
    ) THEN
        ALTER TABLE articles ADD COLUMN author_id UUID;
        RAISE NOTICE 'Added author_id column to articles table';
    END IF;
    
    -- Add published_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' AND column_name = 'published_at'
    ) THEN
        ALTER TABLE articles ADD COLUMN published_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added published_at column to articles table';
    END IF;
    
    -- Add other common columns if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' AND column_name = 'title'
    ) THEN
        ALTER TABLE articles ADD COLUMN title TEXT;
        RAISE NOTICE 'Added title column to articles table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' AND column_name = 'content_html'
    ) THEN
        ALTER TABLE articles ADD COLUMN content_html TEXT;
        RAISE NOTICE 'Added content_html column to articles table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' AND column_name = 'excerpt'
    ) THEN
        ALTER TABLE articles ADD COLUMN excerpt TEXT;
        RAISE NOTICE 'Added excerpt column to articles table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' AND column_name = 'cover_image_url'
    ) THEN
        ALTER TABLE articles ADD COLUMN cover_image_url TEXT;
        RAISE NOTICE 'Added cover_image_url column to articles table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' AND column_name = 'tags'
    ) THEN
        ALTER TABLE articles ADD COLUMN tags JSONB DEFAULT '[]';
        RAISE NOTICE 'Added tags column to articles table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' AND column_name = 'featured'
    ) THEN
        ALTER TABLE articles ADD COLUMN featured BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added featured column to articles table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' AND column_name = 'likes'
    ) THEN
        ALTER TABLE articles ADD COLUMN likes INTEGER DEFAULT 0;
        RAISE NOTICE 'Added likes column to articles table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE articles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added created_at column to articles table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE articles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to articles table';
    END IF;
END $$;

-- Enable Row Level Security (RLS) if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'articles' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on articles table';
    ELSE
        RAISE NOTICE 'RLS already enabled on articles table';
    END IF;
END $$;

-- Create policies safely (drop existing ones first)
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Anyone can view published articles" ON articles;
    DROP POLICY IF EXISTS "Authors can insert their own articles" ON articles;
    DROP POLICY IF EXISTS "Authors can update their own articles" ON articles;
    DROP POLICY IF EXISTS "Editors can insert articles" ON articles;
    DROP POLICY IF EXISTS "Editors can update articles" ON articles;
    
    -- Create new policies
    -- Anyone can view published articles
    CREATE POLICY "Anyone can view published articles" ON articles
        FOR SELECT USING (status = 'published');
    
    -- Authors can insert their own articles
    CREATE POLICY "Authors can insert their own articles" ON articles
        FOR INSERT WITH CHECK (auth.uid() = author_id);
    
    -- Authors can update their own articles
    CREATE POLICY "Authors can update their own articles" ON articles
        FOR UPDATE USING (auth.uid() = author_id);
    
    -- Editors can insert articles (for draft approval)
    CREATE POLICY "Editors can insert articles" ON articles
        FOR INSERT WITH CHECK (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND role IN ('editor', 'admin')
            )
        );
    
    -- Editors can update articles (for moderation)
    CREATE POLICY "Editors can update articles" ON articles
        FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND role IN ('editor', 'admin')
            )
        );
    
    RAISE NOTICE 'Created RLS policies for articles table';
END $$;

-- Also ensure drafts table has proper policies for editors
DO $$
BEGIN
    -- Enable RLS on drafts if not already enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'drafts' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on drafts table';
    ELSE
        RAISE NOTICE 'RLS already enabled on drafts table';
    END IF;
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their own drafts" ON drafts;
    DROP POLICY IF EXISTS "Users can insert their own drafts" ON drafts;
    DROP POLICY IF EXISTS "Users can update their own drafts" ON drafts;
    DROP POLICY IF EXISTS "Editors can view all drafts" ON drafts;
    DROP POLICY IF EXISTS "Editors can update all drafts" ON drafts;
    
    -- Create new policies
    -- Users can view their own drafts
    CREATE POLICY "Users can view their own drafts" ON drafts
        FOR SELECT USING (auth.uid() = user_id);
    
    -- Users can insert their own drafts
    CREATE POLICY "Users can insert their own drafts" ON drafts
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    -- Users can update their own drafts
    CREATE POLICY "Users can update their own drafts" ON drafts
        FOR UPDATE USING (auth.uid() = user_id);
    
    -- Editors can view all drafts
    CREATE POLICY "Editors can view all drafts" ON drafts
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND role IN ('editor', 'admin')
            )
        );
    
    -- Editors can update all drafts (for approval/rejection)
    CREATE POLICY "Editors can update all drafts" ON drafts
        FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND role IN ('editor', 'admin')
            )
        );
    
    RAISE NOTICE 'Created RLS policies for drafts table';
END $$;

-- Create indexes for better performance (only if columns exist)
DO $$
BEGIN
    -- Create articles indexes only if columns exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' AND column_name = 'status'
    ) THEN
        CREATE INDEX IF NOT EXISTS articles_status_idx ON articles(status);
        RAISE NOTICE 'Created articles status index';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' AND column_name = 'author_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS articles_author_id_idx ON articles(author_id);
        RAISE NOTICE 'Created articles author_id index';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' AND column_name = 'published_at'
    ) THEN
        CREATE INDEX IF NOT EXISTS articles_published_at_idx ON articles(published_at);
        RAISE NOTICE 'Created articles published_at index';
    END IF;
    
    -- Create drafts indexes only if columns exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'drafts' AND column_name = 'status'
    ) THEN
        CREATE INDEX IF NOT EXISTS drafts_status_idx ON drafts(status);
        RAISE NOTICE 'Created drafts status index';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'drafts' AND column_name = 'user_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS drafts_user_id_idx ON drafts(user_id);
        RAISE NOTICE 'Created drafts user_id index';
    END IF;
END $$;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE 'Articles and drafts table setup completed successfully!';
END $$;
