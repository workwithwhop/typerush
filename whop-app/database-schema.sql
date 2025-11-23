-- BubbleType Game Database Schema
-- Run this SQL in your Supabase SQL editor

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  hearts INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game scores table
CREATE TABLE IF NOT EXISTS game_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  combo INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Heart purchases table
CREATE TABLE IF NOT EXISTS heart_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hearts_purchased INTEGER NOT NULL,
  amount_spent DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_game_scores_user_id ON game_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_score ON game_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_heart_purchases_user_id ON heart_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_heart_purchases_hearts ON heart_purchases(hearts_purchased DESC);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE heart_purchases ENABLE ROW LEVEL SECURITY;

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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data (optional - remove in production)
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

INSERT INTO game_scores (user_id, score, combo) VALUES
  ('sample-user-1', 15420, 25),
  ('sample-user-2', 12850, 20),
  ('sample-user-3', 11200, 18),
  ('sample-user-4', 8750, 15)
ON CONFLICT DO NOTHING;

INSERT INTO heart_purchases (user_id, hearts_purchased, amount_spent) VALUES
  ('sample-user-4', 50, 16.50),
  ('sample-user-1', 15, 4.95),
  ('sample-user-3', 12, 3.96),
  ('sample-user-2', 8, 2.64)
ON CONFLICT DO NOTHING;
