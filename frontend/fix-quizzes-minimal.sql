-- Minimal Quizzes Table Setup Script
-- This script creates the quizzes table with minimal dependencies

-- Create quizzes table if it doesn't exist
CREATE TABLE IF NOT EXISTS quizzes (
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
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view quizzes" ON quizzes;
DROP POLICY IF EXISTS "Authenticated users can manage quizzes" ON quizzes;
DROP POLICY IF EXISTS "Users can view their own attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can insert their own attempts" ON quiz_attempts;

-- Create new policies
-- Anyone can view quizzes
CREATE POLICY "Anyone can view quizzes" ON quizzes
    FOR SELECT USING (true);

-- Authenticated users can manage quizzes
CREATE POLICY "Authenticated users can manage quizzes" ON quizzes
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Users can view their own attempts
CREATE POLICY "Users can view their own attempts" ON quiz_attempts
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own attempts
CREATE POLICY "Users can insert their own attempts" ON quiz_attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert a sample quiz for testing
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
SELECT 'Quizzes table created successfully!' as message;
