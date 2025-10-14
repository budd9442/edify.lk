-- Safe Quizzes Table Setup - Handles Existing Tables
-- This script safely creates or updates the quizzes table

-- First, check if quizzes table exists and what columns it has
DO $$
DECLARE
    table_exists boolean;
    has_description boolean;
    has_questions_json boolean;
    has_status boolean;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'quizzes'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        -- Create table from scratch
        CREATE TABLE quizzes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            article_id UUID NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            questions_json JSONB NOT NULL DEFAULT '[]',
            settings JSONB DEFAULT '{}',
            status TEXT DEFAULT 'published',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created quizzes table from scratch';
    ELSE
        -- Table exists, check what columns we have
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'quizzes' AND column_name = 'description'
        ) INTO has_description;
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'quizzes' AND column_name = 'questions_json'
        ) INTO has_questions_json;
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'quizzes' AND column_name = 'status'
        ) INTO has_status;
        
        -- Add missing columns
        IF NOT has_description THEN
            ALTER TABLE quizzes ADD COLUMN description TEXT;
            RAISE NOTICE 'Added description column';
        END IF;
        
        IF NOT has_questions_json THEN
            ALTER TABLE quizzes ADD COLUMN questions_json JSONB DEFAULT '[]';
            RAISE NOTICE 'Added questions_json column';
        END IF;
        
        IF NOT has_status THEN
            ALTER TABLE quizzes ADD COLUMN status TEXT DEFAULT 'published';
            RAISE NOTICE 'Added status column';
        END IF;
        
        -- Add other columns that might be missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'quizzes' AND column_name = 'settings'
        ) THEN
            ALTER TABLE quizzes ADD COLUMN settings JSONB DEFAULT '{}';
            RAISE NOTICE 'Added settings column';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'quizzes' AND column_name = 'created_at'
        ) THEN
            ALTER TABLE quizzes ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Added created_at column';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'quizzes' AND column_name = 'updated_at'
        ) THEN
            ALTER TABLE quizzes ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Added updated_at column';
        END IF;
        
        RAISE NOTICE 'Updated existing quizzes table';
    END IF;
END $$;

-- Create quiz_attempts table if it doesn't exist
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    answers JSONB NOT NULL DEFAULT '[]',
    score INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create basic indexes
CREATE INDEX IF NOT EXISTS quizzes_article_id_idx ON quizzes(article_id);
CREATE INDEX IF NOT EXISTS quiz_attempts_quiz_id_idx ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS quiz_attempts_user_id_idx ON quiz_attempts(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies
DROP POLICY IF EXISTS "Anyone can view quizzes" ON quizzes;
DROP POLICY IF EXISTS "Authenticated users can manage quizzes" ON quizzes;
DROP POLICY IF EXISTS "Users can view their own attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can insert their own attempts" ON quiz_attempts;

CREATE POLICY "Anyone can view quizzes" ON quizzes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage quizzes" ON quizzes
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their own attempts" ON quiz_attempts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attempts" ON quiz_attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert sample quiz only if it doesn't already exist
INSERT INTO quizzes (id, article_id, title, description, questions_json, status)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    '5a40aee1-6268-485a-b925-a7065ddea382',
    'Test Quiz: The Future of Web Development',
    'Test your knowledge about web development trends',
    '[
        {
            "question": "What is one of the key trends in modern web development?",
            "options": ["Server-side rendering", "Static site generation", "Client-side rendering", "All of the above"],
            "correctAnswer": 3,
            "explanation": "Modern web development incorporates all these approaches depending on the use case.",
            "points": 1
        },
        {
            "question": "Which technology is gaining popularity for building web applications?",
            "options": ["React", "Vue", "Svelte", "All of the above"],
            "correctAnswer": 3,
            "explanation": "All these frameworks are popular choices for modern web development.",
            "points": 1
        }
    ]'::jsonb,
    'published'
) ON CONFLICT (id) DO NOTHING;

-- Success message
SELECT 'Quizzes table setup completed successfully!' as message;
