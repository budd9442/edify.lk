-- Add reading_time column to articles table
ALTER TABLE articles ADD COLUMN IF NOT EXISTS reading_time INTEGER DEFAULT 5;

-- Update existing records with a default value (optional, but good for consistency)
UPDATE articles SET reading_time = 5 WHERE reading_time IS NULL;
