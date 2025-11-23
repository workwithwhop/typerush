-- Migrate heart purchases to have one row per user with aggregated data
-- Run this in your Supabase SQL editor

-- Step 1: Create a new table structure for user heart statistics
CREATE TABLE IF NOT EXISTS user_heart_stats (
  user_id TEXT PRIMARY KEY,
  total_hearts_purchased INTEGER DEFAULT 0,
  total_amount_spent NUMERIC DEFAULT 0,
  current_hearts INTEGER DEFAULT 3,
  first_purchase_date TIMESTAMP WITH TIME ZONE,
  last_purchase_date TIMESTAMP WITH TIME ZONE,
  purchase_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT user_heart_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Step 2: Migrate existing data to the new structure
INSERT INTO user_heart_stats (
  user_id,
  total_hearts_purchased,
  total_amount_spent,
  current_hearts,
  first_purchase_date,
  last_purchase_date,
  purchase_count
)
SELECT 
  hp.user_id,
  SUM(hp.hearts_purchased) as total_hearts_purchased,
  SUM(hp.amount_spent) as total_amount_spent,
  COALESCE(u.hearts, 3) as current_hearts,
  MIN(hp.created_at) as first_purchase_date,
  MAX(hp.created_at) as last_purchase_date,
  COUNT(*) as purchase_count
FROM heart_purchases hp
LEFT JOIN users u ON hp.user_id = u.id
GROUP BY hp.user_id, u.hearts
ON CONFLICT (user_id) DO UPDATE SET
  total_hearts_purchased = EXCLUDED.total_hearts_purchased,
  total_amount_spent = EXCLUDED.total_amount_spent,
  current_hearts = EXCLUDED.current_hearts,
  first_purchase_date = EXCLUDED.first_purchase_date,
  last_purchase_date = EXCLUDED.last_purchase_date,
  purchase_count = EXCLUDED.purchase_count,
  updated_at = NOW();

-- Step 3: Add RLS policies for the new table
ALTER TABLE user_heart_stats ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (since we're using Whop auth, not Supabase auth)
CREATE POLICY "Allow all operations on user_heart_stats" ON user_heart_stats
  FOR ALL USING (true) WITH CHECK (true);

-- Step 4: Verify the migration
SELECT 
  user_id,
  total_hearts_purchased,
  total_amount_spent,
  current_hearts,
  purchase_count,
  first_purchase_date,
  last_purchase_date
FROM user_heart_stats
ORDER BY total_hearts_purchased DESC;

-- Step 5: Show comparison with old data
SELECT 
  'OLD TABLE' as source,
  COUNT(*) as total_records,
  COUNT(DISTINCT user_id) as unique_users
FROM heart_purchases
UNION ALL
SELECT 
  'NEW TABLE' as source,
  COUNT(*) as total_records,
  COUNT(DISTINCT user_id) as unique_users
FROM user_heart_stats;
