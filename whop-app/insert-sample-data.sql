-- Script to insert sample data by temporarily disabling RLS
-- Run this in your Supabase SQL editor

-- Temporarily disable RLS for sample data insertion
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE game_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE heart_purchases DISABLE ROW LEVEL SECURITY;

-- Insert sample users
INSERT INTO users (id, username, name, hearts) VALUES
  ('sample-user-1', 'ProGamer', 'Pro Gamer', 15),
  ('sample-user-2', 'TypeMaster', 'Type Master', 8),
  ('sample-user-3', 'SpeedKing', 'Speed King', 12),
  ('sample-user-4', 'SarahM', 'Sarah Miller', 50)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  name = EXCLUDED.name,
  hearts = EXCLUDED.hearts,
  updated_at = NOW();

-- Insert sample game scores
INSERT INTO game_scores (user_id, score, combo) VALUES
  ('sample-user-1', 15420, 25),
  ('sample-user-2', 12850, 20),
  ('sample-user-3', 11200, 18),
  ('sample-user-4', 8750, 15)
ON CONFLICT DO NOTHING;

-- Insert sample heart purchases
INSERT INTO heart_purchases (user_id, hearts_purchased, amount_spent) VALUES
  ('sample-user-4', 50, 16.50),
  ('sample-user-1', 15, 4.95),
  ('sample-user-3', 12, 3.96),
  ('sample-user-2', 8, 2.64)
ON CONFLICT DO NOTHING;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE heart_purchases ENABLE ROW LEVEL SECURITY;

-- Recreate the policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Public can view all users" ON users;
DROP POLICY IF EXISTS "Users can view all scores" ON game_scores;
DROP POLICY IF EXISTS "Users can insert own scores" ON game_scores;
DROP POLICY IF EXISTS "Users can view all heart purchases" ON heart_purchases;
DROP POLICY IF EXISTS "Users can insert own heart purchases" ON heart_purchases;

-- Users can read and update their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = id);

-- Allow public read access for leaderboards and profiles
CREATE POLICY "Public can view all users" ON users
  FOR SELECT USING (true);

-- Game scores policies
CREATE POLICY "Users can view all scores" ON game_scores
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own scores" ON game_scores
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Heart purchases policies
CREATE POLICY "Users can view all heart purchases" ON heart_purchases
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own heart purchases" ON heart_purchases
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);
