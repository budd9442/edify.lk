-- Fix Duplicate Quiz Attempts
-- This script adds constraints and policies to prevent duplicate quiz attempts

-- First, clean up any existing duplicate attempts (keep the latest one)
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

-- Add unique constraint to prevent future duplicates
-- This ensures one attempt per user per quiz
ALTER TABLE quiz_attempts 
ADD CONSTRAINT unique_user_quiz_attempt 
UNIQUE (quiz_id, user_id);

-- Update RLS policies to be more restrictive
DROP POLICY IF EXISTS "Users can insert their own attempts" ON quiz_attempts;

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
SELECT 'Quiz attempts duplicates fixed and prevented!' as message;
