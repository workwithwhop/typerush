-- Add unique constraint to prevent duplicate game scores per user
-- Run this in your Supabase SQL editor AFTER running the cleanup script

-- First, let's see if there are any remaining duplicates
SELECT user_id, COUNT(*) as score_count 
FROM game_scores 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- If the above query returns no rows, we can safely add the unique constraint
-- Add unique constraint on user_id for game_scores table
ALTER TABLE game_scores 
ADD CONSTRAINT unique_user_score UNIQUE (user_id);

-- Verify the constraint was added
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'game_scores'::regclass 
AND conname = 'unique_user_score';
