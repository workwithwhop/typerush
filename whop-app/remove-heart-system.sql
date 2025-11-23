-- Remove Heart System and Update to Spending-Based System
-- Run this SQL in your Supabase SQL editor
-- Based on current schema: users, user_heart_stats, game_scores

-- 1. Update the users table to rename hearts to lives
ALTER TABLE users RENAME COLUMN hearts TO lives;

-- 2. Update the user_heart_stats table to focus on spending
-- Rename table to user_spending_stats
ALTER TABLE user_heart_stats RENAME TO user_spending_stats;

-- 3. Update column names in user_spending_stats to be more generic
-- Rename total_hearts_purchased to total_purchases
ALTER TABLE user_spending_stats RENAME COLUMN total_hearts_purchased TO total_purchases;

-- Rename current_hearts to current_lives
ALTER TABLE user_spending_stats RENAME COLUMN current_hearts TO current_lives;

-- Rename purchased_hearts_during_game to purchased_lives_during_game
ALTER TABLE user_spending_stats RENAME COLUMN purchased_hearts_during_game TO purchased_lives_during_game;

-- 4. Create heart_purchases table (since it doesn't exist in current schema)
-- This will store individual payment records
CREATE TABLE IF NOT EXISTS heart_purchases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hearts_purchased integer NOT NULL,
  amount_spent decimal(10,2) NOT NULL,
  created_at timestamp with time zone DEFAULT NOW()
);

-- 5. Rename heart_purchases to user_purchases for better clarity
ALTER TABLE heart_purchases RENAME TO user_purchases;

-- 6. Update RLS policies for the new tables
-- Enable RLS on user_purchases
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;

-- Create policies for user_purchases
CREATE POLICY "Users can view all purchases" ON user_purchases
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own purchases" ON user_purchases
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Update users table policy (if it doesn't exist)
DROP POLICY IF EXISTS "Public can view all users" ON users;
CREATE POLICY "Public can view all users" ON users
  FOR SELECT USING (true);

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_purchases_user_id ON user_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_user_purchases_amount ON user_purchases(amount_spent DESC);

-- 8. Create a view for top spenders (for easier querying)
CREATE OR REPLACE VIEW top_spenders AS
SELECT 
  u.name,
  u.username,
  COALESCE(uss.total_amount_spent, 0) as total_amount_spent,
  COALESCE(uss.total_purchases, 0) as total_purchases,
  COALESCE(uss.purchase_count, 0) as purchase_count
FROM users u
LEFT JOIN user_spending_stats uss ON u.id = uss.user_id
WHERE COALESCE(uss.total_amount_spent, 0) > 0
ORDER BY total_amount_spent DESC;

-- 9. Add comments for documentation
COMMENT ON TABLE user_purchases IS 'Records of user payments to continue games';
COMMENT ON TABLE user_spending_stats IS 'Aggregated spending statistics per user';
COMMENT ON COLUMN users.lives IS 'Current number of lives (replaces hearts)';
COMMENT ON COLUMN user_purchases.hearts_purchased IS 'Number of lives purchased (usually 3 for $2)';
COMMENT ON COLUMN user_purchases.amount_spent IS 'Amount paid in dollars';

-- 10. Create a function to get top spender
CREATE OR REPLACE FUNCTION get_top_spender()
RETURNS TABLE(name text, total_amount_spent numeric) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.name,
    COALESCE(uss.total_amount_spent, 0) as total_amount_spent
  FROM users u
  LEFT JOIN user_spending_stats uss ON u.id = uss.user_id
  WHERE COALESCE(uss.total_amount_spent, 0) > 0
  ORDER BY total_amount_spent DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 11. Grant necessary permissions
GRANT SELECT ON top_spenders TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_top_spender() TO anon, authenticated;

-- 12. Update any existing data to use the new system
-- Convert existing heart purchases to $2 payments (3 lives for $2)
-- This will update any existing data in user_spending_stats
UPDATE user_spending_stats 
SET 
  total_purchases = CASE 
    WHEN total_purchases > 0 THEN total_purchases * 3 -- Convert to lives
    ELSE 0 
  END,
  total_amount_spent = CASE 
    WHEN total_amount_spent > 0 THEN total_amount_spent * 2.00 -- Convert to $2 payments
    ELSE 0 
  END
WHERE total_amount_spent > 0;

-- 13. Insert sample data for testing (optional - remove in production)
INSERT INTO users (id, username, name, lives) VALUES
  ('sample-user-1', 'ProGamer', 'Pro Gamer', 3),
  ('sample-user-2', 'TypeMaster', 'Type Master', 3),
  ('sample-user-3', 'SpeedKing', 'Speed King', 3),
  ('sample-user-4', 'SarahM', 'Sarah Miller', 3)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  name = EXCLUDED.name,
  lives = EXCLUDED.lives,
  updated_at = NOW();

INSERT INTO user_spending_stats (user_id, total_purchases, total_amount_spent, current_lives, purchase_count) VALUES
  ('sample-user-4', 9, 6.00, 3, 3),
  ('sample-user-1', 6, 4.00, 3, 2),
  ('sample-user-3', 3, 2.00, 3, 1),
  ('sample-user-2', 3, 2.00, 3, 1)
ON CONFLICT (user_id) DO UPDATE SET
  total_purchases = EXCLUDED.total_purchases,
  total_amount_spent = EXCLUDED.total_amount_spent,
  current_lives = EXCLUDED.current_lives,
  purchase_count = EXCLUDED.purchase_count,
  updated_at = NOW();

INSERT INTO user_purchases (user_id, hearts_purchased, amount_spent) VALUES
  ('sample-user-4', 3, 2.00),
  ('sample-user-4', 3, 2.00),
  ('sample-user-4', 3, 2.00),
  ('sample-user-1', 3, 2.00),
  ('sample-user-1', 3, 2.00),
  ('sample-user-3', 3, 2.00),
  ('sample-user-2', 3, 2.00)
ON CONFLICT DO NOTHING;
