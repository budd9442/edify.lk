-- Create quizzes table and RLS policies (Simplified Version)
-- This script sets up the quizzes table for article quizzes

-- Create quizzes table if it doesn't exist
CREATE TABLE IF NOT EXISTS quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    questions_json JSONB NOT NULL DEFAULT '[]',
    settings JSONB DEFAULT '{}',
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS quizzes_article_id_idx ON quizzes(article_id);
CREATE INDEX IF NOT EXISTS quizzes_status_idx ON quizzes(status);
CREATE INDEX IF NOT EXISTS quiz_attempts_quiz_id_idx ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS quiz_attempts_user_id_idx ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS quiz_attempts_score_idx ON quiz_attempts(score);

-- Enable Row Level Security (RLS)
DO $$
BEGIN
    -- Enable RLS on quizzes table
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'quizzes' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on quizzes table';
    ELSE
        RAISE NOTICE 'RLS already enabled on quizzes table';
    END IF;
    
    -- Enable RLS on quiz_attempts table
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'quiz_attempts' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on quiz_attempts table';
    ELSE
        RAISE NOTICE 'RLS already enabled on quiz_attempts table';
    END IF;
END $$;

-- Create RLS policies for quizzes table
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Anyone can view published quizzes" ON quizzes;
    DROP POLICY IF EXISTS "Authors can manage their article quizzes" ON quizzes;
    DROP POLICY IF EXISTS "Users can manage their own quizzes" ON quizzes;
    DROP POLICY IF EXISTS "Editors can manage all quizzes" ON quizzes;
    
    -- Create new policies
    -- Anyone can view published quizzes
    CREATE POLICY "Anyone can view published quizzes" ON quizzes
        FOR SELECT USING (status = 'published');
    
    -- Allow authenticated users to manage quizzes (simplified)
    CREATE POLICY "Authenticated users can manage quizzes" ON quizzes
        FOR ALL USING (auth.uid() IS NOT NULL);
    
    RAISE NOTICE 'Created RLS policies for quizzes table';
END $$;

-- Create RLS policies for quiz_attempts table
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their own attempts" ON quiz_attempts;
    DROP POLICY IF EXISTS "Users can insert their own attempts" ON quiz_attempts;
    DROP POLICY IF EXISTS "Editors can view all attempts" ON quiz_attempts;
    
    -- Create new policies
    -- Users can view their own attempts
    CREATE POLICY "Users can view their own attempts" ON quiz_attempts
        FOR SELECT USING (auth.uid() = user_id);
    
    -- Users can insert their own attempts
    CREATE POLICY "Users can insert their own attempts" ON quiz_attempts
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    -- Allow authenticated users to view attempts (simplified)
    CREATE POLICY "Authenticated users can view attempts" ON quiz_attempts
        FOR SELECT USING (auth.uid() IS NOT NULL);
    
    RAISE NOTICE 'Created RLS policies for quiz_attempts table';
END $$;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS handle_updated_at ON quizzes;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON quizzes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON quiz_attempts;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON quiz_attempts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Insert a sample quiz for testing (optional)
-- You can remove this if you don't want sample data
INSERT INTO quizzes (id, article_id, title, description, questions_json, status)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    '5a40aee1-6268-485a-b925-a7065ddea382', -- Replace with actual article ID
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

-- Final success message
DO $$
BEGIN
    RAISE NOTICE 'Quizzes table and policies created successfully!';
END $$;

