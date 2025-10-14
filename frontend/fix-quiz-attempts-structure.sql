-- Fix Quiz Attempts Table Structure
-- This script adds missing columns and fixes the table structure

-- Add missing columns to quiz_attempts table
DO $$
BEGIN
    -- Add answers column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quiz_attempts' AND column_name = 'answers'
    ) THEN
        ALTER TABLE quiz_attempts ADD COLUMN answers JSONB DEFAULT '[]';
        RAISE NOTICE 'Added answers column to quiz_attempts table';
    END IF;
    
    -- Add other missing columns that might be needed
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quiz_attempts' AND column_name = 'time_spent'
    ) THEN
        ALTER TABLE quiz_attempts ADD COLUMN time_spent INTEGER DEFAULT 0;
        RAISE NOTICE 'Added time_spent column to quiz_attempts table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quiz_attempts' AND column_name = 'article_id'
    ) THEN
        ALTER TABLE quiz_attempts ADD COLUMN article_id UUID;
        RAISE NOTICE 'Added article_id column to quiz_attempts table';
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

-- Update RLS policies to be more restrictive
DROP POLICY IF EXISTS "Users can insert their own attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can insert one attempt per quiz" ON quiz_attempts;

-- New policy that prevents duplicate inserts
CREATE POLICY "Users can insert one attempt per quiz" ON quiz_attempts
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        AND NOT EXISTS (
            SELECT 1 FROM quiz_attempts 
            WHERE quiz_id = quiz_attempts.quiz_id 
            AND user_id = quiz_attempts.user_id
        )
    );

-- Add index for better performance on the unique constraint
CREATE INDEX IF NOT EXISTS quiz_attempts_quiz_user_idx ON quiz_attempts(quiz_id, user_id);

-- Success message
SELECT 'Quiz attempts table structure fixed!' as message;
