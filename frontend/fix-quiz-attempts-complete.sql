-- Complete Quiz Attempts Table Fix
-- This script ensures ALL required columns exist in quiz_attempts table

-- First, let's see what columns currently exist
DO $$
DECLARE
    table_exists boolean;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'quiz_attempts'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        -- Create table from scratch with all columns
        CREATE TABLE quiz_attempts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            answers JSONB NOT NULL DEFAULT '[]',
            score INTEGER DEFAULT 0,
            total_questions INTEGER DEFAULT 0,
            time_spent INTEGER DEFAULT 0,
            article_id UUID,
            completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created quiz_attempts table from scratch';
    ELSE
        -- Table exists, add missing columns one by one
        RAISE NOTICE 'Table exists, checking for missing columns...';
        
        -- Add answers column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'quiz_attempts' AND column_name = 'answers'
        ) THEN
            ALTER TABLE quiz_attempts ADD COLUMN answers JSONB DEFAULT '[]';
            RAISE NOTICE 'Added answers column';
        END IF;
        
        -- Add time_spent column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'quiz_attempts' AND column_name = 'time_spent'
        ) THEN
            ALTER TABLE quiz_attempts ADD COLUMN time_spent INTEGER DEFAULT 0;
            RAISE NOTICE 'Added time_spent column';
        END IF;
        
        -- Add article_id column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'quiz_attempts' AND column_name = 'article_id'
        ) THEN
            ALTER TABLE quiz_attempts ADD COLUMN article_id UUID;
            RAISE NOTICE 'Added article_id column';
        END IF;
        
        -- Add completed_at column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'quiz_attempts' AND column_name = 'completed_at'
        ) THEN
            ALTER TABLE quiz_attempts ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Added completed_at column';
        END IF;
        
        -- Add created_at column if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'quiz_attempts' AND column_name = 'created_at'
        ) THEN
            ALTER TABLE quiz_attempts ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Added created_at column';
        END IF;
        
        -- Add score column if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'quiz_attempts' AND column_name = 'score'
        ) THEN
            ALTER TABLE quiz_attempts ADD COLUMN score INTEGER DEFAULT 0;
            RAISE NOTICE 'Added score column';
        END IF;
        
        -- Add total_questions column if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'quiz_attempts' AND column_name = 'total_questions'
        ) THEN
            ALTER TABLE quiz_attempts ADD COLUMN total_questions INTEGER DEFAULT 0;
            RAISE NOTICE 'Added total_questions column';
        END IF;
        
        RAISE NOTICE 'All columns checked and added if needed';
    END IF;
END $$;

-- Clean up any existing duplicate attempts (keep the latest one)
WITH duplicates AS (
    SELECT 
        quiz_id, 
        user_id, 
        MAX(created_at) as latest_attempt
    FROM quiz_attempts 
    GROUP BY quiz_id, user_id 
    HAVING COUNT(*) > 1
)
DELETE FROM quiz_attempts 
WHERE (quiz_id, user_id) IN (
    SELECT quiz_id, user_id FROM duplicates
) 
AND created_at NOT IN (
    SELECT latest_attempt FROM duplicates
);

-- Add unique constraint to prevent future duplicates (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_user_quiz_attempt'
    ) THEN
        ALTER TABLE quiz_attempts 
        ADD CONSTRAINT unique_user_quiz_attempt 
        UNIQUE (quiz_id, user_id);
        RAISE NOTICE 'Added unique constraint to prevent duplicates';
    ELSE
        RAISE NOTICE 'Unique constraint already exists';
    END IF;
END $$;

-- Enable Row Level Security (RLS)
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Update RLS policies
DROP POLICY IF EXISTS "Users can view their own attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can insert their own attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can insert one attempt per quiz" ON quiz_attempts;

-- Create new policies
CREATE POLICY "Users can view their own attempts" ON quiz_attempts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert one attempt per quiz" ON quiz_attempts
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        AND NOT EXISTS (
            SELECT 1 FROM quiz_attempts 
            WHERE quiz_id = quiz_attempts.quiz_id 
            AND user_id = quiz_attempts.user_id
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS quiz_attempts_quiz_id_idx ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS quiz_attempts_user_id_idx ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS quiz_attempts_quiz_user_idx ON quiz_attempts(quiz_id, user_id);

-- Success message
SELECT 'Quiz attempts table structure completely fixed!' as message;
