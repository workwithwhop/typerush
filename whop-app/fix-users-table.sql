-- Fix users table to match the optimized structure
-- Run this in your Supabase SQL editor

-- First, let's see what columns exist in the users table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS best_score INTEGER DEFAULT 0;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS best_combo INTEGER DEFAULT 0;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS total_spent DECIMAL(8,2) DEFAULT 0.00;

-- Update existing users to have default values for new columns
UPDATE users 
SET 
  best_score = COALESCE(best_score, 0),
  best_combo = COALESCE(best_combo, 0),
  total_spent = COALESCE(total_spent, 0.00)
WHERE best_score IS NULL OR best_combo IS NULL OR total_spent IS NULL;

-- Check the final structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
