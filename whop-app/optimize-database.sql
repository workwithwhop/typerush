-- OPTIMIZE DATABASE: Reduce from 5 tables to 2 tables
-- This will save massive database space and simplify everything
-- Run this SQL in your Supabase SQL editor

-- ============================================
-- STEP 1: CREATE NEW SIMPLIFIED TABLES
-- ============================================

-- Table 1: users (keep only essential data)
CREATE TABLE IF NOT EXISTS users_optimized (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  lives INTEGER DEFAULT 3,
  best_score INTEGER DEFAULT 0,
  best_combo INTEGER DEFAULT 0,
  total_spent DECIMAL(8,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2: payments (only store actual payments, not individual heart purchases)
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users_optimized(id) ON DELETE CASCADE,
  amount DECIMAL(8,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 2: MIGRATE EXISTING DATA
-- ============================================

-- Migrate users data (combine users + game_scores + user_spending_stats)
INSERT INTO users_optimized (id, username, name, lives, best_score, best_combo, total_spent)
SELECT 
  u.id,
  u.username,
  u.name,
  COALESCE(u.lives, 3) as lives,
  COALESCE(gs.score, 0) as best_score,
  COALESCE(gs.combo, 0) as best_combo,
  COALESCE(uss.total_amount_spent, 0.00) as total_spent
FROM users u
LEFT JOIN game_scores gs ON u.id = gs.user_id
LEFT JOIN user_spending_stats uss ON u.id = uss.user_id
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  name = EXCLUDED.name,
  lives = EXCLUDED.lives,
  best_score = EXCLUDED.best_score,
  best_combo = EXCLUDED.best_combo,
  total_spent = EXCLUDED.total_spent;

-- Migrate payments data (convert heart purchases to simple payments)
INSERT INTO payments (user_id, amount)
SELECT 
  user_id,
  amount_spent
FROM user_purchases
ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 3: SET UP RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE users_optimized ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Public can view all users" ON users_optimized
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users_optimized
  FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Users can insert own profile" ON users_optimized
  FOR INSERT WITH CHECK (auth.uid()::text = id);

-- Payments policies
CREATE POLICY "Public can view all payments" ON payments
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own payments" ON payments
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- ============================================
-- STEP 4: CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_best_score ON users_optimized(best_score DESC);
CREATE INDEX IF NOT EXISTS idx_users_total_spent ON users_optimized(total_spent DESC);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_amount ON payments(amount DESC);

-- ============================================
-- STEP 5: CREATE HELPER FUNCTIONS
-- ============================================

-- Function to get leaderboard (top 10 players by score)
DROP FUNCTION IF EXISTS get_leaderboard();
CREATE FUNCTION get_leaderboard()
RETURNS TABLE(
  rank BIGINT,
  name TEXT,
  score INTEGER,
  combo INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY u.best_score DESC) as rank,
    u.name,
    u.best_score as score,
    u.best_combo as combo
  FROM users_optimized u
  WHERE u.best_score > 0
  ORDER BY u.best_score DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Function to get top spender (drop existing first)
DROP FUNCTION IF EXISTS get_top_spender();
CREATE FUNCTION get_top_spender()
RETURNS TABLE(name TEXT, total_spent DECIMAL) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.name,
    u.total_spent
  FROM users_optimized u
  WHERE u.total_spent > 0
  ORDER BY u.total_spent DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to save/update user score
DROP FUNCTION IF EXISTS save_user_score(TEXT, INTEGER, INTEGER);
CREATE FUNCTION save_user_score(
  p_user_id TEXT,
  p_score INTEGER,
  p_combo INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE users_optimized 
  SET 
    best_score = GREATEST(best_score, p_score),
    best_combo = GREATEST(best_combo, p_combo)
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to record payment
DROP FUNCTION IF EXISTS record_payment(TEXT, DECIMAL);
CREATE FUNCTION record_payment(
  p_user_id TEXT,
  p_amount DECIMAL
)
RETURNS VOID AS $$
BEGIN
  -- Add payment record
  INSERT INTO payments (user_id, amount) VALUES (p_user_id, p_amount);
  
  -- Update user's total spent and add lives
  UPDATE users_optimized 
  SET 
    total_spent = total_spent + p_amount,
    lives = lives + 3  -- $2 payment gives 3 lives
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 6: GRANT PERMISSIONS
-- ============================================

GRANT SELECT ON users_optimized TO anon, authenticated;
GRANT SELECT ON payments TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_leaderboard() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_top_spender() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION save_user_score(TEXT, INTEGER, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION record_payment(TEXT, DECIMAL) TO anon, authenticated;

-- ============================================
-- STEP 7: INSERT SAMPLE DATA
-- ============================================

INSERT INTO users_optimized (id, username, name, lives, best_score, best_combo, total_spent) VALUES
  ('sample-user-1', 'ProGamer', 'Pro Gamer', 3, 15420, 25, 4.00),
  ('sample-user-2', 'TypeMaster', 'Type Master', 3, 12850, 20, 2.00),
  ('sample-user-3', 'SpeedKing', 'Speed King', 3, 11200, 18, 2.00),
  ('sample-user-4', 'SarahM', 'Sarah Miller', 3, 8750, 15, 6.00)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  name = EXCLUDED.name,
  lives = EXCLUDED.lives,
  best_score = EXCLUDED.best_score,
  best_combo = EXCLUDED.best_combo,
  total_spent = EXCLUDED.total_spent;

INSERT INTO payments (user_id, amount) VALUES
  ('sample-user-4', 2.00),
  ('sample-user-4', 2.00),
  ('sample-user-4', 2.00),
  ('sample-user-1', 2.00),
  ('sample-user-1', 2.00),
  ('sample-user-3', 2.00),
  ('sample-user-2', 2.00)
ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 8: DROP OLD TABLES (OPTIONAL - UNCOMMENT WHEN READY)
-- ============================================

-- Uncomment these lines when you're ready to delete the old tables
-- DROP TABLE IF EXISTS user_purchases CASCADE;
-- DROP TABLE IF EXISTS user_spending_stats CASCADE;
-- DROP TABLE IF EXISTS game_scores CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP VIEW IF EXISTS top_spenders CASCADE;

-- ============================================
-- STEP 9: RENAME NEW TABLES TO ORIGINAL NAMES (OPTIONAL)
-- ============================================

-- Uncomment these lines to rename the optimized tables to original names
-- ALTER TABLE users_optimized RENAME TO users;
-- ALTER TABLE payments RENAME TO user_purchases;

-- ============================================
-- SUMMARY OF OPTIMIZATION
-- ============================================

-- BEFORE: 5 tables with lots of redundant data
-- - users (5 columns)
-- - game_scores (5 columns) 
-- - user_purchases (4 columns)
-- - user_spending_stats (9 columns)
-- - top_spenders (view)

-- AFTER: 2 tables with essential data only
-- - users_optimized (8 columns) - combines users + game_scores + user_spending_stats
-- - payments (4 columns) - only actual payments, no redundant data

-- SPACE SAVINGS:
-- - Eliminated 3 tables completely
-- - Removed redundant columns (created_at, updated_at, purchase_count, etc.)
-- - Combined related data into single rows
-- - Estimated 60-70% database size reduction
