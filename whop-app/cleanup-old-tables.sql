-- Clean up old tables after successful migration
-- Run this in your Supabase SQL editor AFTER confirming the migration worked

-- Step 1: Verify the migration was successful
-- Check that we have data in the new table
SELECT 
  'NEW TABLE (user_heart_stats)' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT user_id) as unique_users,
  SUM(total_hearts_purchased) as total_hearts,
  SUM(total_amount_spent) as total_spent
FROM user_heart_stats

UNION ALL

SELECT 
  'OLD TABLE (heart_purchases)' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT user_id) as unique_users,
  SUM(hearts_purchased) as total_hearts,
  SUM(amount_spent) as total_spent
FROM heart_purchases;

-- Step 2: If the above query shows the same data in both tables, proceed with cleanup

-- Drop the old heart_purchases table
-- WARNING: This will permanently delete the old table and all its data
-- Make sure you've verified the migration was successful before running this!

-- Uncomment the line below to delete the old table:
-- DROP TABLE IF EXISTS heart_purchases;

-- Step 3: Verify the old table is gone (run this after dropping)
-- SELECT COUNT(*) FROM heart_purchases; -- This should give an error if table is deleted

-- Step 4: Show final table structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('user_heart_stats', 'users', 'game_scores')
ORDER BY table_name, ordinal_position;
